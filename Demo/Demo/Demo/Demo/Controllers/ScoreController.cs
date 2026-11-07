using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Controllers
{
    [Authorize(Roles = "Admin")]
    public class ScoreController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
} 