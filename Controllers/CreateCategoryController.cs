using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;
using RestAPI.Entities;

namespace RestAPI.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class CreateCategoryController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CreateCategoryController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        if (string.IsNullOrEmpty(dto.CategoryName) || string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest("Category name and description are required.");
        

        var existingCategory = await _dbContext.Categories
            .FirstOrDefaultAsync(c => c.CategoryName == dto.CategoryName);
        if (existingCategory != null)
            return BadRequest("Category name already exists.");

        var category = new Category
        {
            CategoryName = dto.CategoryName,
            Description = dto.Description,
        };

        _dbContext.Categories.Add(category);
        await _dbContext.SaveChangesAsync();

        return Created($"/categories/{category.Id}", category);
    }
}