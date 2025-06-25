using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs;

public class UpdateUsernameDto
{
    [Required]
    public string OldUsername { get; set; }
    [Required]
    public string NewUsername { get; set; }
}