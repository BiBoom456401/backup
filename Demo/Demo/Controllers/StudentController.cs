using Demo.Data;
using Demo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace Demo.Controllers
{
    [Authorize(Roles = "Admin")]
    public class StudentController : Controller
    {
        private readonly ApplicationDbContext _context;

        public StudentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Student
        public async Task<IActionResult> Index(string searchString, int? classId)
        {
            var classes = await _context.Classes.ToListAsync();
            ViewBag.Classes = new SelectList(classes, "Id", "Name");

            var students = _context.Students.Include(s => s.Class).AsQueryable();

            if (!string.IsNullOrEmpty(searchString))
            {
                students = students.Where(s => s.FullName.Contains(searchString) || s.StudentCode.Contains(searchString));
            }

            if (classId.HasValue)
            {
                students = students.Where(s => s.ClassId == classId.Value);
            }

            return View(await students.ToListAsync());
        }

        // GET: Student/Create
        public IActionResult Create()
        {
            ViewBag.Classes = new SelectList(_context.Classes, "Id", "Name");
            return View();
        }

        // POST: Student/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Student student)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    _context.Add(student);
                    await _context.SaveChangesAsync();
                    TempData["Success"] = "Thêm sinh viên thành công!";
                    return RedirectToAction(nameof(Index));
                }
                catch (Exception ex)
                {
                    TempData["Error"] = "Lỗi khi thêm sinh viên: " + ex.Message;
                }
            }
            else
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                TempData["Error"] = "Lỗi nhập liệu: " + string.Join(" | ", errors);
            }

            ViewBag.Classes = new SelectList(_context.Classes, "Id", "Name", student.ClassId);
            return View(student);
        }

        // GET: Student/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var student = await _context.Students.FindAsync(id);
            if (student == null) return NotFound();

            ViewBag.Classes = new SelectList(_context.Classes, "Id", "Name", student.ClassId);
            return View(student);
        }

        // POST: Student/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Student student)
        {
            if (id != student.Id) return NotFound();

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(student);
                    await _context.SaveChangesAsync();
                    TempData["Success"] = "Cập nhật sinh viên thành công!";
                    return RedirectToAction(nameof(Index));
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!_context.Students.Any(e => e.Id == student.Id))
                        return NotFound();
                    throw;
                }
                catch (Exception ex)
                {
                    TempData["Error"] = "Lỗi khi cập nhật: " + ex.Message;
                }
            }

            ViewBag.Classes = new SelectList(_context.Classes, "Id", "Name", student.ClassId);
            return View(student);
        }

        // GET: Student/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();

            var student = await _context.Students
                .Include(s => s.Class)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (student == null) return NotFound();

            return View(student);
        }

        // POST: Student/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student != null)
            {
                _context.Students.Remove(student);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Xóa sinh viên thành công!";
            }
            else
            {
                TempData["Error"] = "Không tìm thấy sinh viên để xóa.";
            }

            return RedirectToAction(nameof(Index));
        }
    }
}
