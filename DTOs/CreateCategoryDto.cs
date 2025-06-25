using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs;

public class CreateCategoryDto
{
    [Required]
    public string CategoryName { get; set; }

    [Required]
    public string Description { get; set; }
    
    
    
}
