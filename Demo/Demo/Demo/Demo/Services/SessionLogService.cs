using Microsoft.Extensions.Caching.Memory;

namespace Demo.Services
{
    public class SessionLogService : ISessionLogService
    {
        private readonly ILogger<SessionLogService> _logger;
        private readonly IMemoryCache _cache;
        private const string LOG_CACHE_KEY = "session_logs";

        public SessionLogService(ILogger<SessionLogService> logger, IMemoryCache cache)
        {
            _logger = logger;
            _cache = cache;
        }

        public async Task LogSessionConflictAsync(string userId, string userName, string oldSessionId, string newSessionId, string ipAddress)
        {
            var logEntry = new SessionLogEntry
            {
                Timestamp = DateTime.UtcNow,
                UserId = userId,
                UserName = userName,
                Action = "SESSION_CONFLICT",
                Details = $"Old session: {oldSessionId}, New session: {newSessionId}",
                IpAddress = ipAddress
            };

            await AddLogEntryAsync(logEntry);
            
            _logger.LogWarning("Session conflict for user {UserName} ({UserId}). Old: {OldSession}, New: {NewSession}, IP: {IpAddress}", 
                userName, userId, oldSessionId, newSessionId, ipAddress);
        }

        public async Task LogUserLogoutAsync(string userId, string userName, string reason)
        {
            var logEntry = new SessionLogEntry
            {
                Timestamp = DateTime.UtcNow,
                UserId = userId,
                UserName = userName,
                Action = "FORCED_LOGOUT",
                Details = reason,
                IpAddress = ""
            };

            await AddLogEntryAsync(logEntry);
            
            _logger.LogInformation("User {UserName} ({UserId}) logged out: {Reason}", userName, userId, reason);
        }

        public async Task<List<SessionLogEntry>> GetRecentSessionLogsAsync(int count = 50)
        {
            var logs = _cache.Get<List<SessionLogEntry>>(LOG_CACHE_KEY) ?? new List<SessionLogEntry>();
            return await Task.FromResult(logs.OrderByDescending(x => x.Timestamp).Take(count).ToList());
        }

        private async Task AddLogEntryAsync(SessionLogEntry entry)
        {
            var logs = _cache.Get<List<SessionLogEntry>>(LOG_CACHE_KEY) ?? new List<SessionLogEntry>();
            logs.Add(entry);
            
            // Giữ tối đa 1000 entries
            if (logs.Count > 1000)
            {
                logs = logs.OrderByDescending(x => x.Timestamp).Take(1000).ToList();
            }
            
            _cache.Set(LOG_CACHE_KEY, logs, TimeSpan.FromHours(24));
            await Task.CompletedTask;
        }

        public Task ClearOldLogsAsync(DateTime cutoffDate)
        {
            throw new NotImplementedException();
        }

        public Task<SessionStatistics> GetSessionStatisticsAsync()
        {
            throw new NotImplementedException();
        }
    }
}
