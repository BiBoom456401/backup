using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Demo.Models;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;

namespace Demo.Middleware
{
    public class RoleBasedAccessMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IServiceProvider _serviceProvider;

        public RoleBasedAccessMiddleware(RequestDelegate next, IServiceProvider serviceProvider)
        {
            _next = next;
            _serviceProvider = serviceProvider;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower();
            if (path != null && (
                path.StartsWith("/auth/login") ||
                path.StartsWith("/auth/register") ||
                path.StartsWith("/auth/logout") ||
                path == "/" ||
                path.StartsWith("/home")
            ))
            {
                await _next(context);
                return;
            }

            if (context.User.Identity.IsAuthenticated)
            {
                using var scope = _serviceProvider.CreateScope();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
                var user = await userManager.GetUserAsync(context.User);
                if (user != null)
                {
                    context.Items["UserRole"] = user.Role;

                    // Admin: full quyền, không bị chặn
                    if (user.Role == "Admin")
                    {
                        await _next(context);
                        return;
                    }

                    // Teacher: chỉ được truy cập điểm, lớp học, danh sách sinh viên
                    if (user.Role == "Teacher")
                    {
                        if (!(
                            path.StartsWith("/score") ||
                            path.StartsWith("/class") ||
                            path.StartsWith("/student") ||
                            path.StartsWith("/home")
                        ))
                        {
                            context.Response.StatusCode = 403;
                            await context.Response.WriteAsync("Access denied. Teachers can only access score, class, and student pages.");
                            return;
                        }
                    }

                    // Student: chỉ được truy cập trang cá nhân và điểm cá nhân
                    if (user.Role == "Student")
                    {
                        if (!(
                            path.StartsWith("/profile") ||
                            path.StartsWith("/score") ||
                            path.StartsWith("/home")
                        ))
                        {
                            context.Response.StatusCode = 403;
                            await context.Response.WriteAsync("Access denied. Students can only access their profile and score pages.");
                            return;
                        }
                    }
                }
            }

            await _next(context);
        }
    }
} 