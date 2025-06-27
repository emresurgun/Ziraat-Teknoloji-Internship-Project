using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;

namespace RestAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UpdateProductNameController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    
    public UpdateProductNameController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPut]
    public async Task<IActionResult> ChangeProductName(UpdateProductNameDto dto)
    {
        if (!User.IsInRole("Admin"))
        {
            return StatusCode(403, "You must be an admin to delete products.");
        }
        
        var categoryName = dto.CategoryName.Trim();
        
        var category = await _dbContext.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.CategoryName == categoryName);
        
        if (category == null)
            return NotFound("Category not found.");
        
        var currentProduct = await _dbContext.Products.FirstOrDefaultAsync(p =>
            p.Name.ToLower() == dto.CurrentProdcutName.Trim().ToLower() &&
            p.CategoryId == category.Id);
        
        if (currentProduct == null)
            return NotFound("Product not found in the specified category.");
        
        currentProduct.Name = dto.NewProdcutName;
        await _dbContext.SaveChangesAsync();
        return Ok("Product Name has been changed.");
    }
}