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
    public class SeeAllCategoriesController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public SeeAllCategoriesController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCategories()
        {
            var categories = await _dbContext.Categories
                .Select(c => new SeeAllCategoriesDto
                {
                    Id = c.Id,
                    CategoryName = c.CategoryName,  // Burada Name olarak değiştir
                    Description = c.Description,
                }).ToListAsync();

            return Ok(categories);
        }
    }
}