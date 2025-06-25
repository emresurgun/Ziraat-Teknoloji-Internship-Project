using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs;

public class UserRegisterDto
{
    [Required]
    public string username { get; set; }
    [Required]
    public string password { get; set; }
}