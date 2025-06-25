using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs;

public class LookİnsideCategoryDto
{
    [Required]
    public string CategoryName { get; set; }
}