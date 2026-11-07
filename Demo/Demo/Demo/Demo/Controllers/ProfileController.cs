using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Demo.Models;
using Microsoft.AspNetCore.Hosting;

namespace Demo.Controllers
{
    [Authorize]
    public class ProfileController : Controller
    {
        private readonly UserManager<User> _userManager;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public ProfileController(UserManager<User> userManager, IWebHostEnvironment webHostEnvironment)
        {
            _userManager = userManager;
            _webHostEnvironment = webHostEnvironment;
        }

        [HttpGet]
        public async Task<IActionResult> UpdateProfile()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound();
            }

            var model = new UpdateProfileViewModel
            {
                Id = user.Id,
                FullName = user.FullName,
                Address = user.Address,
                Age = user.Age?.ToString(),
                CurrentAvatar = user.Avatar
            };

            return View(model);
        }        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateProfile(UpdateProfileViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound("Không tìm thấy thông tin người dùng");
            }

            try
            {
                // Update basic info
                user.FullName = model.FullName;
                user.Address = model.Address;
                user.Age = string.IsNullOrWhiteSpace(model.Age) ? null : int.Parse(model.Age);

                // Handle avatar upload
                if (model.AvatarFile != null && model.AvatarFile.Length > 0)
                {
                    // Validate file type
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                    var fileExtension = Path.GetExtension(model.AvatarFile.FileName).ToLowerInvariant();
                    
                    if (!allowedExtensions.Contains(fileExtension))
                    {
                        ModelState.AddModelError("AvatarFile", "Chỉ chấp nhận file ảnh (.jpg, .jpeg, .png, .gif, .webp)");
                        model.CurrentAvatar = user.Avatar;
                        return View(model);
                    }

                    // Validate file size (max 5MB)
                    if (model.AvatarFile.Length > 5 * 1024 * 1024)
                    {
                        ModelState.AddModelError("AvatarFile", "Kích thước file không được vượt quá 5MB");
                        model.CurrentAvatar = user.Avatar;
                        return View(model);
                    }

                    // Create avatars directory if it doesn't exist
                    var avatarsPath = Path.Combine(_webHostEnvironment.WebRootPath, "images", "avatars");
                    if (!Directory.Exists(avatarsPath))
                    {
                        Directory.CreateDirectory(avatarsPath);
                    }

                    // Delete old avatar if it's not the default one
                    if (!string.IsNullOrEmpty(user.Avatar) && !user.Avatar.Contains("default-avatar"))
                    {
                        var oldAvatarPath = Path.Combine(_webHostEnvironment.WebRootPath, user.Avatar.TrimStart('/'));
                        if (System.IO.File.Exists(oldAvatarPath))
                        {
                            try
                            {
                                System.IO.File.Delete(oldAvatarPath);
                            }
                            catch (Exception ex)
                            {
                                // Log the error but continue with upload
                                Console.WriteLine($"Could not delete old avatar: {ex.Message}");
                            }
                        }
                    }

                    // Generate unique filename
                    var fileName = $"{user.Id}_{DateTime.Now:yyyyMMddHHmmss}{fileExtension}";
                    var filePath = Path.Combine(avatarsPath, fileName);

                    // Save file
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await model.AvatarFile.CopyToAsync(stream);
                    }

                    // Update user avatar path
                    user.Avatar = $"/images/avatars/{fileName}";
                }

                var result = await _userManager.UpdateAsync(user);
                if (result.Succeeded)
                {
                    TempData["SuccessMessage"] = "Cập nhật hồ sơ thành công!";
                    return RedirectToAction("UpdateProfile");
                }

                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError("", error.Description);
                }
            }
            catch (Exception ex)
            {
                ModelState.AddModelError("", $"Có lỗi xảy ra: {ex.Message}");
            }

            model.CurrentAvatar = user.Avatar;
            return View(model);
        }
    }
}
