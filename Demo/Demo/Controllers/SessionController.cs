using Microsoft.AspNetCore.Mvc;

namespace Demo.Controllers
{
    public class SessionController : Controller
    {
        public IActionResult Expired()
        {
            return View("~/Views/Shared/SessionExpired.cshtml");
        }
    }
}
