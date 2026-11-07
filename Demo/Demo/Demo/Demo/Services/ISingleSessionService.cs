namespace Demo.Services
{
    public interface ISingleSessionService
    {
        Task<bool> ValidateSessionAsync(string userId, string sessionId);
        Task SetUserSessionAsync(string userId, string sessionId);
        Task InvalidateUserSessionAsync(string userId);
        Task<bool> IsUserLoggedInElsewhereAsync(string userId, string currentSessionId);
    }
}
