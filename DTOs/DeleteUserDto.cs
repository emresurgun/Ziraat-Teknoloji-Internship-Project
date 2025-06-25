using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs;

public class DeleteUserDto
{
    [Required]
    public string Username { get; set; }
}