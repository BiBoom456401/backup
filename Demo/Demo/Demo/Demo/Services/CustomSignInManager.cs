using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Demo.Models;
using Demo.Services;
using Microsoft.Extensions.Logging;

namespace Demo.Services
{
    public class CustomSignInManager : SignInManager<User>
    {
        private readonly ISingleSessionService _singleSessionService;
        private readonly ISessionLogService _sessionLogService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CustomSignInManager(
            UserManager<User> userManager,
            IHttpContextAccessor contextAccessor,
            IUserClaimsPrincipalFactory<User> claimsFactory,
            IOptions<IdentityOptions> optionsAccessor,
            ILogger<SignInManager<User>> logger,
            IAuthenticationSchemeProvider schemes,
            IUserConfirmation<User> confirmation,
            ISingleSessionService singleSessionService,
            ISessionLogService sessionLogService)
            : base(userManager, contextAccessor, claimsFactory, optionsAccessor, logger, schemes, confirmation)
        {
            _singleSessionService = singleSessionService;
            _sessionLogService = sessionLogService;
            _httpContextAccessor = contextAccessor;
        }

        public override async Task<SignInResult> PasswordSignInAsync(string userName, string password, bool isPersistent, bool lockoutOnFailure)
        {
            var user = await UserManager.FindByNameAsync(userName);
            if (user == null)
            {
                return SignInResult.Failed;
            }

            // Kiểm tra xem user có đang đăng nhập ở nơi khác không
            var sessionId = _httpContextAccessor.HttpContext?.Session.Id;
            if (!string.IsNullOrEmpty(sessionId))
            {
                var isLoggedInElsewhere = await _singleSessionService.IsUserLoggedInElsewhereAsync(user.Id, sessionId);
                if (isLoggedInElsewhere)
                {
                    // Hủy session cũ và cho phép đăng nhập mới
                    await _singleSessionService.InvalidateUserSessionAsync(user.Id);
                }
            }

            // Thực hiện đăng nhập bình thường
            var result = await base.PasswordSignInAsync(userName, password, isPersistent, lockoutOnFailure);
            
            if (result.Succeeded && !string.IsNullOrEmpty(sessionId))
            {
                // Lưu session mới
                await _singleSessionService.SetUserSessionAsync(user.Id, sessionId);
            }

            return result;
        }

        public override async Task SignOutAsync()
        {
            // Lấy user ID trước khi đăng xuất
            var userId = _httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            await base.SignOutAsync();
            
            // Xóa session
            if (!string.IsNullOrEmpty(userId))
            {
                await _singleSessionService.InvalidateUserSessionAsync(userId);
            }
        }

        public override async Task SignInAsync(User user, bool isPersistent, string? authenticationMethod = null)
        {            // Kiểm tra và xử lý session trước khi đăng nhập
            var sessionId = _httpContextAccessor.HttpContext?.Session.Id;
            var ipAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "Unknown";
            
            if (!string.IsNullOrEmpty(sessionId))
            {
                var isLoggedInElsewhere = await _singleSessionService.IsUserLoggedInElsewhereAsync(user.Id, sessionId);
                if (isLoggedInElsewhere)
                {
                    // Log session conflict
                    await _sessionLogService.LogSessionConflictAsync(user.Id, user.UserName ?? "Unknown", 
                        user.CurrentSessionId ?? "Unknown", sessionId, ipAddress);
                    
                    // Hủy session cũ
                    await _singleSessionService.InvalidateUserSessionAsync(user.Id);
                }
            }            // Thực hiện đăng nhập
            await base.SignInAsync(user, isPersistent, authenticationMethod);
            
            // Lưu session mới sau khi đăng nhập thành công
            if (!string.IsNullOrEmpty(sessionId))
            {
                await _singleSessionService.SetUserSessionAsync(user.Id, sessionId);
            }
        }
    }
}
