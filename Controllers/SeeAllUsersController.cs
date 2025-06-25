using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;

namespace RestAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class SeeAllUsersController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public SeeAllUsersController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _dbContext.Users.Select(u => new SeeAllUsersDto
        {
            Id = u.Id,
            Username = u.Username,
            Role = u.Role
        }).ToListAsync();

        return Ok(users);
    }
}