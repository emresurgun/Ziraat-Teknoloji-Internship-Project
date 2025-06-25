using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;

namespace RestAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/ChangeUsername")]
public class ChangeUsernameController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;
    
    public ChangeUsernameController(AppDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    [HttpPut("UpdateUsername")]
    public async Task<IActionResult> UpdateUsername([FromBody] UpdateUsernameDto dto)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == dto.OldUsername.ToLower());
        
        var currentUsername = User.Identity?.Name;
        if (!string.Equals(currentUsername, user.Username, StringComparison.OrdinalIgnoreCase) &&
            !User.IsInRole("Admin"))
        {
            return StatusCode(403,"Only admins can change other users' usernames.");
        }
        
        if (string.IsNullOrWhiteSpace(dto.OldUsername) || string.IsNullOrWhiteSpace(dto.NewUsername))
        {
            return BadRequest("Both old and new usernames are required.");
        }
        
        if (user == null)
        {
            return NotFound("User not found.");
        }
        
        var usernameTaken = await _dbContext.Users.AnyAsync(u => u.Username.ToLower() == dto.NewUsername.ToLower());
        if (usernameTaken)
        {
            return BadRequest("New username is already taken.");
        }
        
        user.Username = dto.NewUsername;
        await _dbContext.SaveChangesAsync();
        
        return Ok(new { message = "Username updated successfully." });
    }
}