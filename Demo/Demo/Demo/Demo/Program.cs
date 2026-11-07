using Demo.Data;
using Demo.Middleware;
using Demo.Models;
using Demo.Services;
using Demo.Utility;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình services
builder.Services.AddControllersWithViews();

// Session
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Database Context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity Configuration
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Authentication Cookies
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Auth/Login";
    options.LogoutPath = "/Auth/Logout";
    options.AccessDeniedPath = "/Auth/AccessDenied";
    options.SlidingExpiration = true;
});

// Các services cần thiết
builder.Services.AddScoped<ISessionLogService, SessionLogService>();
builder.Services.AddScoped<ISingleSessionService, SingleSessionService>();
builder.Services.AddScoped<SignInManager<User>, CustomSignInManager>();

var app = builder.Build();

// 2. Cấu hình HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

// Middleware tùy chỉnh
app.UseMiddleware<RoleBasedAccessMiddleware>();
app.UseSingleSession();

// 3. Cấu hình routing
app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// 4. Khởi tạo database và seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<User>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        // Áp dụng migrations
        await context.Database.MigrateAsync();

        // Seed roles
        await SeedRolesAsync(roleManager);

        // Seed admin user
        await SeedAdminUserAsync(userManager);

        // Seed dữ liệu mẫu
        await SeedSampleDataAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Lỗi khi khởi tạo database");
    }
}

app.Run();

// Các hàm hỗ trợ seed data
async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
{
    if (!await roleManager.RoleExistsAsync(SD.Role_Admin))
    {
        await roleManager.CreateAsync(new IdentityRole(SD.Role_Admin));
    }
    if (!await roleManager.RoleExistsAsync(SD.Role_Teacher))
    {
        await roleManager.CreateAsync(new IdentityRole(SD.Role_Teacher));
    }
    if (!await roleManager.RoleExistsAsync(SD.Role_Student))
    {
        await roleManager.CreateAsync(new IdentityRole(SD.Role_Student));
    }
}

async Task SeedAdminUserAsync(UserManager<User> userManager)
{
    var adminEmail = "admin@example.com";
    if (await userManager.FindByEmailAsync(adminEmail) == null)
    {
        var adminUser = new User
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true,
            FullName = "Quản trị viên",
            Role = SD.Role_Admin
        };

        var result = await userManager.CreateAsync(adminUser, "Admin@123");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, SD.Role_Admin);
        }
    }
}

async Task SeedSampleDataAsync(ApplicationDbContext context)
{
    if (!context.Classes.Any())
    {
        context.Classes.AddRange(
            new Class { Name = "Công nghệ thông tin" },
            new Class { Name = "Kế toán" },
            new Class { Name = "Quản trị kinh doanh" }
        );
        await context.SaveChangesAsync();
    }

    if (!context.Students.Any() && context.Classes.Any())
    {
        var firstClassId = context.Classes.First().Id;

        context.Students.AddRange(
            new Student
            {
                StudentCode = "SV001",
                FullName = "Nguyễn Văn A",
                DateOfBirth = new DateTime(2000, 1, 1),
                Gender = "Nam",
                Email = "sv001@example.com",
                ClassId = firstClassId
            },
            new Student
            {
                StudentCode = "SV002",
                FullName = "Trần Thị B",
                DateOfBirth = new DateTime(2001, 5, 15),
                Gender = "Nữ",
                Email = "sv002@example.com",
                ClassId = firstClassId
            }
        );
        await context.SaveChangesAsync();
    }
}