using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;
using RestAPI.Entities;

namespace RestAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class CreateProductController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CreateProductController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct(CreateProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CategoryName))
            return BadRequest("Category name is required.");

        var category = await _dbContext.Categories
            .FirstOrDefaultAsync(c => c.CategoryName == dto.CategoryName);

        if (category == null)
            return BadRequest("Category not found.");

        var product = new Product
        {
            Name = dto.ProductName,
            Price = dto.ProductPrice,
            Description = dto.ProductDescription,
            CategoryId = category.Id
        };

        _dbContext.Products.Add(product);
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Product created successfully." });
    }
}