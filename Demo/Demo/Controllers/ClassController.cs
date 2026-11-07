using Demo.Data;
using Demo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace Demo.Controllers
{
    [Authorize(Roles = "Admin")]
    public class ClassController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ClassController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Class
        public async Task<IActionResult> Index()
        {
            var classes = await _context.Classes.Include(c => c.Students).ToListAsync();
            return View(classes);
        }

        // GET: Class/Create
        public IActionResult Create()
        {
            return View();
        }
        public async Task<IActionResult> TestAdd()
        {
            var newClass = new Class
            {
                ClassCode = "TEST123",
                Name = "Lớp test"
            };
            _context.Classes.Add(newClass);
            int rows = await _context.SaveChangesAsync();
            return Content($"Đã thêm {rows} dòng");
        }
        // POST: Class/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Class @class)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Content("Validation lỗi: " + string.Join("; ", errors));
            }

            _context.Add(@class);
            int rows = await _context.SaveChangesAsync();
            return Content($"Đã thêm {rows} dòng");
        }

        // GET: Class/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();
            var @class = await _context.Classes.FindAsync(id);
            if (@class == null) return NotFound();
            return View(@class);
        }

        // POST: Class/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Class @class)
        {
            if (id != @class.Id) return NotFound();
            if (ModelState.IsValid)
            {
                _context.Update(@class);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(@class);
        }

        // GET: Class/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();
            var @class = await _context.Classes
                .Include(c => c.Students)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (@class == null) return NotFound();
            return View(@class);
        }

        // POST: Class/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var @class = await _context.Classes.FindAsync(id);
            if (@class != null)
            {
                _context.Classes.Remove(@class);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }
    }
}