using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestAPI.Data;

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
        var category = await _dbContext.Categories.FindAsync(dto.Id);
        if (category == null)
            return NotFound("Category not found.");

        _dbContext.Categories.Remove(category);
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Category and related products deleted successfully." });
    }
}