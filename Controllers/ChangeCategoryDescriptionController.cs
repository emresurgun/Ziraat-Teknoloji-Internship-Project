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
    public class ChangeCategoryDescriptionController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public ChangeCategoryDescriptionController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpPut("UpdateDescription")]
        public async Task<IActionResult> UpdateDescription([FromBody] ChangeCategoryDescriptionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CategoryName))
            {
                return BadRequest("Category name must not be empty.");
            }

            var category = await _dbContext.Categories
                .FirstOrDefaultAsync(c => c.CategoryName.Trim().ToLower() == dto.CategoryName.Trim().ToLower());

            if (category == null)
            {
                return NotFound("Category not found.");
            }

            if (string.IsNullOrWhiteSpace(dto.NewDescription))
            {
                return BadRequest("New description must not be empty.");
            }

            category.Description = dto.NewDescription.Trim();
            await _dbContext.SaveChangesAsync();

            return Ok("Category description updated successfully.");
        }
    }
}