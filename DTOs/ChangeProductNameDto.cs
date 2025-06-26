using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs;

public class ChangeProductNameDto
{
    [Required]
    public string CurrentProdcutName { get; set; } 
    [Required]
    public string CategoryName { get; set; }
    [Required]
    public string NewProdcutName { get; set; } 
}