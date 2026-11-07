using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Controllers
{
    [Authorize(Roles = "Admin")]
    public class ClassController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
} 