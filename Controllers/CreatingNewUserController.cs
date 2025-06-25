using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.Entities;
using RestAPI.DTOs;

namespace RestAPI.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class CreatingNewUserController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;
    
    public CreatingNewUserController(AppDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }
    
    [HttpPost("CreateUser")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        var normalizedUsername = dto.Username?.Trim().ToLower();
        if (string.IsNullOrWhiteSpace(normalizedUsername) ||
            string.IsNullOrWhiteSpace(dto.Password) ||
            string.IsNullOrWhiteSpace(dto.Role))
        {
            return BadRequest("Username, password, and role are required.");
        }
        
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(dto.Password));
        var hashedPassword = Convert.ToBase64String(hashedBytes);

        var existingUser = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedUsername);
        if (existingUser != null)
        {
            return BadRequest("Username is already taken.");
        }

        var user = new User
        {
            Username = dto.Username,
            PasswordHash = hashedPassword,
            Role = dto.Role,
        };
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var response = new UserResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Role = user.Role,
        };
        return Created($"/users/{user.Id}", response);
    }
    
}