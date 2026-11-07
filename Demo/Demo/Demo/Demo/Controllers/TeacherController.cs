using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Controllers
{
    [Authorize(Roles = "Admin")]
    public class TeacherController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
} 