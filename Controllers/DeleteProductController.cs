using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class DeleteProductController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public DeleteProductController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteProduct([FromBody] DeleteProductDto dto)
    {
        if (!User.IsInRole("Admin"))
        {
            return StatusCode(403, "You must be an admin to delete products.");
        }

        var categoryName = dto.CategoryName.Trim();
        var productName = dto.ProductName.Trim();

        var category = await _dbContext.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.CategoryName == categoryName);

        if (category == null)
            return NotFound("Category not found.");

        var product = category.Products.FirstOrDefault(p => p.Name == productName);
        if (product == null)
            return NotFound("Product not found in the specified category.");

        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Product deleted successfully." });
    }
}