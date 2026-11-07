using System.ComponentModel.DataAnnotations;

namespace Demo.Models
{
    public class Student
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Mã SV bắt buộc nhập")]
        [Display(Name = "Mã sinh viên")]
        public string StudentCode { get; set; }

        [Required(ErrorMessage = "Họ tên bắt buộc nhập")]
        [Display(Name = "Họ và tên")]
        public string FullName { get; set; }

        [DataType(DataType.Date)]
        [Display(Name = "Ngày sinh")]
        public DateTime DateOfBirth { get; set; } = DateTime.Now.AddYears(-18);

        [Display(Name = "Giới tính")]
        public string Gender { get; set; } = "Nam";

        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        [Display(Name = "Email")]
        public string Email { get; set; }

        [Display(Name = "Lớp")]
        public int ClassId { get; set; }

        public Class Class { get; set; }
    }
}