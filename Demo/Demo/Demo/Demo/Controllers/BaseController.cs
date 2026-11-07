using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Demo.Models;
using Microsoft.AspNetCore.Identity;

namespace Demo.Controllers
{
    [Authorize]
    public abstract class BaseController : Controller
    {
        protected readonly UserManager<User> _userManager;
        protected readonly SignInManager<User> _signInManager;

        protected BaseController(
            UserManager<User> userManager,
            SignInManager<User> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
        }

        protected async Task<User> GetCurrentUserAsync()
        {
            return await _userManager.GetUserAsync(User);
        }

        protected async Task<bool> IsInRoleAsync(User user, string role)
        {
            return await _userManager.IsInRoleAsync(user, role);
        }

        protected async Task<bool> IsAdminAsync()
        {
            var user = await GetCurrentUserAsync();
            return user != null && await IsInRoleAsync(user, "Admin");
        }

        protected async Task<bool> IsTeacherAsync()
        {
            var user = await GetCurrentUserAsync();
            return user != null && await IsInRoleAsync(user, "Teacher");
        }

        protected async Task<bool> IsStudentAsync()
        {
            var user = await GetCurrentUserAsync();
            return user != null && await IsInRoleAsync(user, "Student");
        }
    }
} 