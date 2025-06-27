using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs;

public class UpdatePasswordDto
{
    [Required]
    public string Username { get; set; }
    [Required]
    public string NewPassword { get; set; }
}