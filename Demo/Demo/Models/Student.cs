using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace Demo.Models
{
    public class Student
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập mã sinh viên")]
        [Display(Name = "Mã SV")]
        public string StudentCode { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập họ tên")]
        [Display(Name = "Họ tên")]
        public string FullName { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn giới tính")]
        [Display(Name = "Giới tính")]
        public string Gender { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập ngày sinh")]
        [DataType(DataType.Date)]
        [Display(Name = "Ngày sinh")]
        public DateTime? BirthDate { get; set; }

        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn lớp")]
        [Display(Name = "Lớp")]
        public int ClassId { get; set; }

        [ValidateNever] // ✅ Ngăn không cho ASP.NET thực hiện validation lên navigation property
        public Class Class { get; set; }
    }
}
