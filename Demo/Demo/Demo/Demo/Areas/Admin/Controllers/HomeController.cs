using Microsoft.AspNetCore.Mvc;

namespace Demo.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View("Dashboard");
        }

        public IActionResult Dashboard()
        {
            return View();
        }
    }
}
