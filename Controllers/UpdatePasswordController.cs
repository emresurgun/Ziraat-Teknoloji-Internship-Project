using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;

namespace RestAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UpdatePasswordController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public UpdatePasswordController(AppDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    [HttpPost]
    public async Task<IActionResult> ChangePassword([FromBody] UpdatePasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            return BadRequest("Target username and new password are required.");
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == dto.Username.ToLower());
        if (user == null)
        {
            return NotFound("Target user not found.");
        }

        var currentUsername = User.Identity?.Name;

        if (!string.Equals(currentUsername, user.Username, StringComparison.OrdinalIgnoreCase) &&
            !User.IsInRole("Admin"))
        {
            return StatusCode(403,"Only admins can change other users' passwords.");
        }

        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(dto.NewPassword));
        var hashedPassword = Convert.ToBase64String(hashedBytes);

        user.PasswordHash = hashedPassword;
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully." });
    }
}