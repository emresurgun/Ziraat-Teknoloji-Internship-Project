using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;

namespace RestAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DeleteUserController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;
    
    public DeleteUserController(AppDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    [HttpDelete("DeleteUser")]
    public async Task<IActionResult> DeleteUser([FromBody] DeleteUserDto dto)
    {
        var currentUsername = User.Identity?.Name;
        if (!string.Equals(currentUsername, dto.Username, StringComparison.OrdinalIgnoreCase) && !User.IsInRole("Admin"))
        {
            return StatusCode(403, "Only admins can delete other users.");
        }
        
        if (string.IsNullOrEmpty(dto.Username))
            return BadRequest("Username is required.");
        
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == dto.Username.ToLower());
        if (user == null)
        {
            return NotFound("User not found.");
        }
        
        _dbContext.Users.Remove(user);
        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "User deleted successfully." });
        
    }
}