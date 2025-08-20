using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;
using RestAPI.Entities;

namespace RestAPI.Controllers
{
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
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
        {
            if (!User.IsInRole("Admin"))
            {
                return StatusCode(403, "You must be an admin to create products.");
            }

            var category = await _dbContext.Categories
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.CategoryName.ToLower() == dto.CategoryName.Trim().ToLower());

            if (category == null)
                return NotFound("Category not found.");

            if (category.Products.Any(p => p.Name.ToLower() == dto.ProductName.Trim().ToLower()))
                return BadRequest("Product with this name already exists in the category.");

            // Ensure Description is never null or empty
            var description = string.IsNullOrWhiteSpace(dto.Description) ? "No description" : dto.Description.Trim();

            var product = new Product
            {
                Name = dto.ProductName.Trim(),
                Price = dto.Price,
                Description = description,
                Category = category
            };

            _dbContext.Products.Add(product);
            await _dbContext.SaveChangesAsync();

            return Ok("Product created successfully.");
        }
    }
}