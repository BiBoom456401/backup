using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;  // Thêm namespace này

namespace Demo.Models
{
    public class Class
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Mã lớp")]
        public string ClassCode { get; set; }

        [Required]
        [Display(Name = "Tên lớp")]
        public string Name { get; set; }

        [ValidateNever]  // Bỏ qua validate trường này khi submit form
        public ICollection<Student> Students { get; set; }
    }
}
