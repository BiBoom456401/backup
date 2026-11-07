using Microsoft.AspNetCore.Identity;
using Demo.Models;
using Demo.Services;
using System.Security.Claims;

namespace Demo.Middleware
{
    public class SingleSessionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SingleSessionMiddleware> _logger;
        private readonly IServiceProvider _serviceProvider;

        public SingleSessionMiddleware(
            RequestDelegate next,
            ILogger<SingleSessionMiddleware> logger,
            IServiceProvider serviceProvider)
        {
            _next = next;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Bỏ qua kiểm tra cho một số đường dẫn
            var path = context.Request.Path.Value?.ToLower() ?? "";
            var skipPaths = new[] { 
                "/session/expired", 
                "/auth/login", 
                "/auth/logout", 
                "/auth/register",
                "/auth/lockout",
                "/api/session"
            };
            
            if (skipPaths.Any(p => path.StartsWith(p)))
            {
                await _next(context);
                return;
            }

            // Chỉ kiểm tra nếu user đã đăng nhập và không phải là request ngay sau khi đăng nhập
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var sessionId = context.Session.Id;

                if (!string.IsNullOrEmpty(userId))
                {
                    // Kiểm tra xem có phải là request đầu tiên sau đăng nhập không
                    var isFirstRequest = !context.Session.Keys.Contains("session_validated");
                    
                    if (isFirstRequest)
                    {
                        // Đánh dấu session đã được validate lần đầu
                        context.Session.SetString("session_validated", "true");
                        _logger.LogInformation("First request after login for user {UserId}, skipping validation", userId);
                    }
                    else
                    {
                        // Create a scope for scoped services
                        using var scope = _serviceProvider.CreateScope();
                        var singleSessionService = scope.ServiceProvider.GetRequiredService<ISingleSessionService>();
                        var signInManager = scope.ServiceProvider.GetRequiredService<SignInManager<User>>();

                        // Kiểm tra xem session có hợp lệ không
                        var isValidSession = await singleSessionService.ValidateSessionAsync(userId, sessionId);
                        
                        if (!isValidSession)
                        {
                            // Nếu session không hợp lệ, đăng xuất user
                            await signInManager.SignOutAsync();
                            _logger.LogWarning("User {UserId} logged out due to invalid session", userId);
                            
                            // Chuyển hướng đến trang thông báo session expired
                            context.Response.Redirect("/Session/Expired");
                            return;
                        }
                    }
                }
            }

            await _next(context);
        }
    }

    // Extension method để dễ dàng thêm middleware
    public static class SingleSessionMiddlewareExtensions
    {
        public static IApplicationBuilder UseSingleSession(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SingleSessionMiddleware>();
        }
    }
}
