namespace Demo.Services
{
    public interface ISessionLogService
    {
        Task LogSessionConflictAsync(string userId, string userName, string oldSessionId, string newSessionId, string ipAddress);
        Task LogUserLogoutAsync(string userId, string userName, string reason);
        Task<List<SessionLogEntry>> GetRecentSessionLogsAsync(int count = 50);
        Task ClearOldLogsAsync(DateTime cutoffDate);
        Task<SessionStatistics> GetSessionStatisticsAsync();
    }

    public class SessionLogEntry
    {
        public DateTime Timestamp { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
    }

    public class SessionStatistics
    {
        public int TotalLogs { get; set; }
        public int TodayLogs { get; set; }
        public int UniqueUsers { get; set; }
        public int SessionConflicts { get; set; }
        public int RecentActivity { get; set; }
        public List<ActionStatistic> LogsByAction { get; set; } = new();
        public List<HourlyActivity> HourlyActivity { get; set; } = new();
        public DateTime LastUpdate { get; set; }
    }

    public class ActionStatistic
    {
        public string Action { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class HourlyActivity
    {
        public int Hour { get; set; }
        public int Count { get; set; }
    }
}
