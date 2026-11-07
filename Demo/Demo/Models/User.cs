using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace Demo.Models
{
    public class User : IdentityUser
    {
        [Required]
        [StringLength(100)]
        public string FullName { get; set; }

        [Required]
        [StringLength(20)]
        public string Role { get; set; } // Admin, Teacher, Student

        // Session management properties
        [StringLength(100)]
        public string? CurrentSessionId { get; set; }
        public DateTime? LastLoginTime { get; set; }
        [StringLength(50)]
        public string? LastLoginIP { get; set; }

        public int? Age { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }

        [StringLength(200)]
        public string? Avatar { get; set; }
    }
} 