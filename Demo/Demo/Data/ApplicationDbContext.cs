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

        public DbSet<Student> Students { get; set; }
        public DbSet<Class> Classes { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure User model
            builder.Entity<User>(entity =>
            {
                entity.ToTable("AspNetUsers");
                entity.Property(e => e.FullName).HasMaxLength(100);
                entity.Property(e => e.Role).HasMaxLength(50);
                entity.Property(e => e.CurrentSessionId).HasMaxLength(100);
                entity.Property(e => e.LastLoginIP).HasMaxLength(50);
            });

            // XÓA cấu hình liên quan đến Product, Category, Order, OrderDetail, ProductImage
            // ...
        }
    }
} 