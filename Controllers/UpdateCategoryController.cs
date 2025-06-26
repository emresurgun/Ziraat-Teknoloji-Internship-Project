using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UpdateCategoryController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public UpdateCategoryController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPut]
    public async Task<IActionResult> UpdateCategory(UpdateCategoryDto dto)
    {
        var category = await _dbContext.Categories
            .FirstOrDefaultAsync(c => c.CategoryName.ToLower() == dto.CurrentCategoryName.Trim().ToLower());

        if (category == null)
            return NotFound("Category not found.");

        category.CategoryName = dto.NewCategoryName.Trim();

        await _dbContext.SaveChangesAsync();
        return Ok("Category updated.");
    }
}