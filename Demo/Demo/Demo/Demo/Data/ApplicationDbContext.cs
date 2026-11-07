using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Demo.Models;

namespace Demo.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSet cho quản lý sinh viên
        public DbSet<Student> Students { get; set; }
        public DbSet<Class> Classes { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Cấu hình User model
            builder.Entity<User>(entity =>
            {
                entity.ToTable("Users"); // Đổi tên bảng nếu cần
                entity.Property(e => e.FullName).HasMaxLength(100);
                entity.Property(e => e.Role).HasMaxLength(50);
                entity.Property(e => e.CurrentSessionId).HasMaxLength(100);
                entity.Property(e => e.LastLoginIP).HasMaxLength(50);
            });

            // Cấu hình Student
            builder.Entity<Student>(entity =>
            {
                entity.HasKey(s => s.Id);
                entity.Property(s => s.StudentCode)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(s => s.FullName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(s => s.Email)
                    .HasMaxLength(100);

                // Quan hệ với Class
                entity.HasOne(s => s.Class)
                    .WithMany(c => c.Students)
                    .HasForeignKey(s => s.ClassId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Cấu hình Class
            builder.Entity<Class>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.Property(c => c.Name)
                    .IsRequired()
                    .HasMaxLength(50);
            });

            // Seed dữ liệu mẫu cho Class
            builder.Entity<Class>().HasData(
                new Class { Id = 1, Name = "Công nghệ thông tin" },
                new Class { Id = 2, Name = "Kế toán" },
                new Class { Id = 3, Name = "Quản trị kinh doanh" }
            );
        }
    }
}