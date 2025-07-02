using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestAPI.Data;
using RestAPI.DTOs;
using RestAPI.Entities;

namespace RestAPI.Controllers;
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UserRegisterDto userDto)
    {
        if (userDto == null)
            return BadRequest(new { message = "Request body is null." });

        if (string.IsNullOrWhiteSpace(userDto.username) || string.IsNullOrWhiteSpace(userDto.password))
            return BadRequest(new { message = "Username and password are required." });

        var normalizedUsername = userDto.username.Trim().ToLower();

        var existingUser = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedUsername);

        if (existingUser != null)
        {
            // Return clear, explicit message if username is already taken
            return Conflict(new { message = "Username is already taken." });
        }

        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(userDto.password));
        var hashedPassword = Convert.ToBase64String(hashedBytes);

        var user = new User
        {
            Username = userDto.username,
            PasswordHash = hashedPassword,
            Role = "User"
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var response = new UserResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Role = user.Role
        };

        return Created($"/users/{user.Id}", response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
    {
        if (loginDto == null)
            return BadRequest(new { message = "Request body is null." });

        var normalizedUsername = loginDto.Username?.Trim().ToLower();
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedUsername);

        if (user == null)
            return BadRequest(new { message = "User not found." });

        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(loginDto.Password));
        var hashedPassword = Convert.ToBase64String(hashedBytes);

        if (hashedPassword != user.PasswordHash)
            return Unauthorized(new { message = "Invalid credentials." });

        var token = GenerateToken(user);
        return Ok(new { Token = token });
    }

    private string GenerateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role),
        };

        var key = _configuration["Jwt:Key"];
        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];
        var durationInMinutes = int.Parse(_configuration["Jwt:DurationInMinutes"]);

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(durationInMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}