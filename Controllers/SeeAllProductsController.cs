using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;

namespace RestAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class SeeAllProductsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public SeeAllProductsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllProducts()
    {
        var products = await _dbContext.Products
            .Include(p => p.Category)
            .Select(p => new SeeAllProductsDto
            {
                ProductName = p.Name,
                Description = p.Description,
                Price = p.Price,
                CategoryName = p.Category.CategoryName
            })
            .ToListAsync();

        return Ok(products);
    }
}