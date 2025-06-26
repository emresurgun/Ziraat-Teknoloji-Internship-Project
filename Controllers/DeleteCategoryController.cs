using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestAPI.Data;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]  
public class DeleteCategoryController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public DeleteCategoryController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteCategory([FromBody] DeleteCategoryDto dto)
    {
        var category = await _dbContext.Categories
            .FirstOrDefaultAsync(c => c.CategoryName == dto.CategoryName.Trim());
        if (category == null)
            return NotFound("Category not found.");

        if (!User.IsInRole("Admin"))
        {
            return StatusCode(403, "You must be an admin to delete categories.");
        }

        _dbContext.Categories.Remove(category);
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Category and related products deleted successfully." });
    }
}