using System.ComponentModel.DataAnnotations;

namespace Demo.Models
{
    public class UserViewModel
    {
        public required string Id { get; set; }
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? Age { get; set; }
        public string? Avatar { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public bool IsLocked { get; set; }
        public int AccessFailedCount { get; set; }
        public DateTimeOffset? LockoutEndDate { get; set; }
    }

    public class ManageUserRolesViewModel
    {
        public required string UserId { get; set; }
        public required string UserName { get; set; }
        public List<UserRoleViewModel> UserRoles { get; set; } = new List<UserRoleViewModel>();
    }

    public class UserRoleViewModel
    {
        public required string RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public bool IsSelected { get; set; }
    }

    public class CreateRoleViewModel
    {
        [Required(ErrorMessage = "Tên role là bắt buộc")]
        [Display(Name = "Tên Role")]
        public string RoleName { get; set; } = string.Empty;
    }

    public class UpdateProfileViewModel
    {
        public required string Id { get; set; }
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        [Display(Name = "Họ tên")]
        public string FullName { get; set; } = string.Empty;
        
        [Display(Name = "Địa chỉ")]
        public string? Address { get; set; }
        
        [Display(Name = "Tuổi")]
        public string? Age { get; set; }
        
        [Display(Name = "Avatar")]
        public IFormFile? AvatarFile { get; set; }
        
        public string? CurrentAvatar { get; set; }
    }
}