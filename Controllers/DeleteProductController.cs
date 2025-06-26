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
        // Rol kontrolü
        if (!User.IsInRole("Admin"))
        {
            return StatusCode(403, "You must be an admin to delete products.");
        }

        var trimmedName = dto.ProductName.Trim();
        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Name == trimmedName);

        if (product == null)
        {
            return NotFound("Product not found.");
        }

        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Product deleted successfully." });
    }
}