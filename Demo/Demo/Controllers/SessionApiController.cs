using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Demo.Services;
using System.Security.Claims;

namespace Demo.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SessionApiController : ControllerBase
    {
        private readonly ISingleSessionService _singleSessionService;
        private readonly ILogger<SessionApiController> _logger;

        public SessionApiController(ISingleSessionService singleSessionService, ILogger<SessionApiController> logger)
        {
            _singleSessionService = singleSessionService;
            _logger = logger;
        }

        [HttpGet("validate")]
        [Authorize]
        public async Task<IActionResult> ValidateSession()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var sessionId = HttpContext.Session.Id;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not found" });
                }

                var isValid = await _singleSessionService.ValidateSessionAsync(userId, sessionId);
                
                if (!isValid)
                {
                    return Unauthorized(new { message = "Session expired" });
                }

                return Ok(new { message = "Session valid" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating session");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("invalidate")]
        [Authorize]
        public async Task<IActionResult> InvalidateSession()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not found" });
                }

                await _singleSessionService.InvalidateUserSessionAsync(userId);
                return Ok(new { message = "Session invalidated" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating session");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}
