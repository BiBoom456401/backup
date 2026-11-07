using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Demo.Models;

namespace Demo.Services
{
    public class SingleSessionService : ISingleSessionService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SingleSessionService> _logger;

        public SingleSessionService(
            IServiceProvider serviceProvider,
            ILogger<SingleSessionService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task<bool> ValidateSessionAsync(string userId, string sessionId)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

                var user = await userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                // Nếu user chưa có session (đăng nhập lần đầu), cho phép
                if (string.IsNullOrEmpty(user.CurrentSessionId))
                {
                    return true;
                }

                // Kiểm tra session hiện tại có khớp không
                return user.CurrentSessionId == sessionId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating session for user {UserId}", userId);
                return false;
            }
        }

        public async Task SetUserSessionAsync(string userId, string sessionId)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

                var user = await userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    user.CurrentSessionId = sessionId;
                    user.LastLoginTime = DateTime.UtcNow;
                    await userManager.UpdateAsync(user);
                    
                    _logger.LogInformation("Session set for user {UserId} with session {SessionId}", userId, sessionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting session for user {UserId}", userId);
            }
        }

        public async Task InvalidateUserSessionAsync(string userId)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

                var user = await userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    user.CurrentSessionId = null;
                    await userManager.UpdateAsync(user);
                    
                    _logger.LogInformation("Session invalidated for user {UserId}", userId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating session for user {UserId}", userId);
            }
        }

        public async Task<bool> IsUserLoggedInElsewhereAsync(string userId, string currentSessionId)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

                var user = await userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                // Nếu user có session khác với session hiện tại
                return !string.IsNullOrEmpty(user.CurrentSessionId) && user.CurrentSessionId != currentSessionId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user is logged in elsewhere {UserId}", userId);
                return false;
            }
        }
    }
}
