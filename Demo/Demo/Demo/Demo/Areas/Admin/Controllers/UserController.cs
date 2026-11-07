using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Demo.Models;
using Demo.Data;
using Demo.Utility;

namespace Demo.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Roles = SD.Role_Admin)]
    public class UserController : Controller
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _context;

        public UserController(UserManager<User> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var users = await _userManager.Users.ToListAsync();
            var userViewModels = new List<UserViewModel>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);                userViewModels.Add(new UserViewModel
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    Address = user.Address,
                    Age = user.Age?.ToString(),
                    Avatar = user.Avatar,
                    Roles = roles.ToList(),
                    IsLocked = await _userManager.IsLockedOutAsync(user)
                });
            }

            return View(userViewModels);
        }

        public async Task<IActionResult> Details(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return NotFound();
            }

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }            var roles = await _userManager.GetRolesAsync(user);
            var userViewModel = new UserViewModel
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                Age = user.Age?.ToString(),
                Avatar = user.Avatar,
                Roles = roles.ToList(),
                IsLocked = await _userManager.IsLockedOutAsync(user)
            };

            return View(userViewModel);
        }

        public async Task<IActionResult> ManageRoles(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return NotFound();
            }

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            var allRoles = await _roleManager.Roles.ToListAsync();
            var userRoles = await _userManager.GetRolesAsync(user);

            var model = new ManageUserRolesViewModel
            {
                UserId = user.Id,
                UserName = user.FullName,
                UserRoles = allRoles.Select(role => new UserRoleViewModel
                {
                    RoleId = role.Id,
                    RoleName = role.Name,
                    IsSelected = userRoles.Contains(role.Name)
                }).ToList()
            };

            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ManageRoles(ManageUserRolesViewModel model)
        {
            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null)
            {
                return NotFound();
            }

            var userRoles = await _userManager.GetRolesAsync(user);
            
            // Remove all current roles
            var removeResult = await _userManager.RemoveFromRolesAsync(user, userRoles);
            if (!removeResult.Succeeded)
            {
                ModelState.AddModelError("", "Không thể xóa roles hiện tại của user");
                return View(model);
            }

            // Add selected roles
            var selectedRoles = model.UserRoles.Where(x => x.IsSelected).Select(x => x.RoleName);
            var addResult = await _userManager.AddToRolesAsync(user, selectedRoles);
            if (!addResult.Succeeded)
            {
                ModelState.AddModelError("", "Không thể thêm roles mới cho user");
                return View(model);
            }

            TempData["success"] = "Cập nhật quyền thành công";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> LockUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return Json(new { success = false, message = "Không tìm thấy user" });
            }

            var result = await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
            if (result.Succeeded)
            {
                return Json(new { success = true, message = "Khóa tài khoản thành công" });
            }

            return Json(new { success = false, message = "Không thể khóa tài khoản" });
        }

        [HttpPost]
        public async Task<IActionResult> UnlockUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return Json(new { success = false, message = "Không tìm thấy user" });
            }

            var result = await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow);
            if (result.Succeeded)
            {
                // Reset số lần đăng nhập thất bại
                await _userManager.ResetAccessFailedCountAsync(user);
                return Json(new { success = true, message = "Mở khóa tài khoản thành công" });
            }

            return Json(new { success = false, message = "Không thể mở khóa tài khoản" });
        }

        [HttpPost]
        public async Task<IActionResult> ResetFailedAttempts(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return Json(new { success = false, message = "Không tìm thấy user" });
            }

            var result = await _userManager.ResetAccessFailedCountAsync(user);
            if (result.Succeeded)
            {
                return Json(new { success = true, message = "Reset số lần đăng nhập thất bại thành công" });
            }

            return Json(new { success = false, message = "Không thể reset số lần đăng nhập thất bại" });
        }        public IActionResult CreateRole()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateRole(CreateRoleViewModel model)
        {
            if (ModelState.IsValid)
            {
                var roleExists = await _roleManager.RoleExistsAsync(model.RoleName);
                if (roleExists)
                {
                    ModelState.AddModelError("", "Role này đã tồn tại");
                    return View(model);
                }

                var result = await _roleManager.CreateAsync(new IdentityRole(model.RoleName));
                if (result.Succeeded)
                {
                    TempData["success"] = "Tạo role thành công";
                    return RedirectToAction("ManageRoles");
                }

                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError("", error.Description);
                }
            }

            return View(model);
        }

        public async Task<IActionResult> RolesList()
        {
            var roles = await _roleManager.Roles.ToListAsync();
            return View(roles);
        }

        [HttpPost]
        public async Task<IActionResult> DeleteRole(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null)
            {
                return Json(new { success = false, message = "Không tìm thấy role" });
            }

            var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
            if (usersInRole.Any())
            {
                return Json(new { success = false, message = "Không thể xóa role này vì còn user đang sử dụng" });
            }

            var result = await _roleManager.DeleteAsync(role);
            if (result.Succeeded)
            {
                return Json(new { success = true, message = "Xóa role thành công" });
            }

            return Json(new { success = false, message = "Không thể xóa role" });
        }

        [HttpPost]
        public async Task<IActionResult> ResetAvatar(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return Json(new { success = false, message = "ID người dùng không hợp lệ" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return Json(new { success = false, message = "Không tìm thấy người dùng" });
            }

            // Delete current avatar file if it's not the default one
            if (!string.IsNullOrEmpty(user.Avatar) && !user.Avatar.Contains("default-avatar"))
            {
                var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var avatarPath = Path.Combine(webRootPath, user.Avatar.TrimStart('/'));
                if (System.IO.File.Exists(avatarPath))
                {
                    System.IO.File.Delete(avatarPath);
                }
            }

            // Reset to default avatar
            user.Avatar = "/images/avatars/default-avatar.svg";
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                return Json(new { success = true, message = "Đã reset avatar về mặc định" });
            }

            return Json(new { success = false, message = "Không thể reset avatar" });
        }

        [HttpPost]
        public async Task<IActionResult> UploadAvatar(string userId, IFormFile avatarFile)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return Json(new { success = false, message = "User ID không hợp lệ" });
            }

            if (avatarFile == null || avatarFile.Length == 0)
            {
                return Json(new { success = false, message = "Vui lòng chọn file ảnh" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return Json(new { success = false, message = "Không tìm thấy user" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var fileExtension = Path.GetExtension(avatarFile.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(fileExtension))
            {
                return Json(new { success = false, message = "Chỉ chấp nhận file ảnh (.jpg, .jpeg, .png, .gif)" });
            }

            // Validate file size (max 5MB)
            if (avatarFile.Length > 5 * 1024 * 1024)
            {
                return Json(new { success = false, message = "Kích thước file không được vượt quá 5MB" });
            }

            try
            {
                // Create avatars directory if it doesn't exist
                var avatarsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "avatars");
                if (!Directory.Exists(avatarsPath))
                {
                    Directory.CreateDirectory(avatarsPath);
                }

                // Delete old avatar if it's not the default one
                if (!string.IsNullOrEmpty(user.Avatar) && !user.Avatar.Contains("default-avatar"))
                {
                    var oldAvatarPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.Avatar.TrimStart('/'));
                    if (System.IO.File.Exists(oldAvatarPath))
                    {
                        System.IO.File.Delete(oldAvatarPath);
                    }
                }

                // Generate unique filename
                var fileName = $"{user.Id}_{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(avatarsPath, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await avatarFile.CopyToAsync(stream);
                }

                // Update user avatar path
                var newAvatarPath = $"/images/avatars/{fileName}";
                user.Avatar = newAvatarPath;
                
                var result = await _userManager.UpdateAsync(user);
                if (result.Succeeded)
                {
                    return Json(new { success = true, message = "Upload avatar thành công", avatarPath = newAvatarPath });
                }
                else
                {
                    // Delete uploaded file if database update failed
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                    return Json(new { success = false, message = "Không thể cập nhật avatar trong database" });
                }            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Lỗi khi upload avatar: {ex.Message}" });
            }
        }
    }
}

