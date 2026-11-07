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
            var path = context.Request.Path.Value?.ToLower() ?? "";
            var skipPaths = new[]
            {
                "/session/expired",
                "/auth/login",
                "/auth/logout",
                "/auth/register",
                "/auth/lockout",
                "/api/session"
            };

            // Bỏ qua kiểm tra cho các đường dẫn không cần middleware
            if (skipPaths.Any(p => path.StartsWith(p)))
            {
                await _next(context);
                return;
            }

            // Kiểm tra nếu người dùng đã đăng nhập
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                // Đảm bảo có userId và Session sẵn sàng
                if (!string.IsNullOrEmpty(userId) && context.Session.IsAvailable)
                {
                    var sessionId = context.Session.Id;

                    // Nếu chưa đánh dấu "session đã validate"
                    var isFirstRequest = string.IsNullOrEmpty(context.Session.GetString("session_validated"));


                    if (isFirstRequest)
                    {
                        context.Session.SetString("session_validated", "true");
                        _logger.LogInformation("First request after login for user {UserId}, skipping validation", userId);
                    }
                    else
                    {
                        using var scope = _serviceProvider.CreateScope();
                        var singleSessionService = scope.ServiceProvider.GetRequiredService<ISingleSessionService>();
                        var signInManager = scope.ServiceProvider.GetRequiredService<SignInManager<User>>();

                        var isValidSession = await singleSessionService.ValidateSessionAsync(userId, sessionId);

                        if (!isValidSession)
                        {
                            await signInManager.SignOutAsync();
                            _logger.LogWarning("User {UserId} logged out due to invalid session", userId);
                            context.Response.Redirect("/Session/Expired");
                            return;
                        }
                    }
                }
            }

            // Tiếp tục xử lý middleware tiếp theo
            await _next(context);
        }
    }

    // Extension để thêm middleware dễ dàng trong Program.cs
    public static class SingleSessionMiddlewareExtensions
    {
        public static IApplicationBuilder UseSingleSession(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SingleSessionMiddleware>();
        }
    }
}
