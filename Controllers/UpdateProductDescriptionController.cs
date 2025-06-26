using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;

namespace RestAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UpdateProductDescriptionController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public UpdateProductDescriptionController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpPut]
        public async Task<IActionResult> UpdateDescription(UpdateProductDescriptionDto dto)
        {
            if (!User.IsInRole("Admin"))
            {
                return StatusCode(403, "You must be an admin to update product descriptions.");
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

            product.Description = dto.NewDescription;
            await _dbContext.SaveChangesAsync();

            return Ok("Product description updated successfully.");
        }
    }
}