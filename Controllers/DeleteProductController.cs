using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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

        var category = await _dbContext.Categories
            .FirstOrDefaultAsync(c => c.CategoryName == dto.CategoryName.Trim());
        var trimmedName = dto.ProductName.Trim();
        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Name == trimmedName);

        if (product == null)
        {
            return NotFound("Product not found.");
        }
       
        if (category == null)
            return NotFound("Category not found.");

        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Product deleted successfully." });
    }
}