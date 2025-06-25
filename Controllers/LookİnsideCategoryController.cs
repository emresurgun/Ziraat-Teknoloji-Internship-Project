using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.DTOs;
using RestAPI.Data;

namespace RestAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class LookInsideCategoryController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public LookInsideCategoryController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost]
    public async Task<IActionResult> GetCategoryContents([FromBody] LookİnsideCategoryDto dto)
    {
        var category = await _dbContext.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.CategoryName == dto.CategoryName);

        if (category == null)
            return NotFound("Category not found.");

        var products = category.Products.Select(p => new
        {
            p.Name,
            p.Description,
            p.Price
        });

        var subCategories = await _dbContext.Categories
            .Where(sc => sc.ParentCategoryId == category.Id)
            .Select(sc => new
            {
                sc.CategoryName,
                sc.Description
            })
            .ToListAsync();

        return Ok(new
        {
            Category = category.CategoryName,
            Products = products,
            SubCategories = subCategories
        });
    }
}