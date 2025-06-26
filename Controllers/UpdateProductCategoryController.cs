using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;

namespace RestAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UpdateProductCategoryController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public UpdateProductCategoryController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPut]
    public async Task<IActionResult> UpdateCategory([FromBody] UpdateProductCategoryDto dto)
    {
        if (!User.IsInRole("Admin"))
        {
            return StatusCode(403, "You must be an admin to update product category.");
        }

        var currentCategoryName = dto.CurrentCategoryName.Trim();
        var newCategoryName = dto.NewCategoryName.Trim();
        var productName = dto.ProductName.Trim();

        var currentCategory = await _dbContext.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.CategoryName.ToLower() == currentCategoryName.ToLower());

        if (currentCategory == null)
            return NotFound("Current category not found.");

        var product = currentCategory.Products.FirstOrDefault(p => p.Name.ToLower() == productName.ToLower());

        if (product == null)
            return NotFound("Product not found in the current category.");

        var newCategory = await _dbContext.Categories
            .FirstOrDefaultAsync(c => c.CategoryName.ToLower() == newCategoryName.ToLower());

        if (newCategory == null)
            return NotFound("New category not found.");

        product.Category = newCategory;
        await _dbContext.SaveChangesAsync();

        return Ok("Product category updated successfully.");
    }
}