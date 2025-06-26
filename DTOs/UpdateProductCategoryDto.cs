using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs;

public class UpdateProductCategoryDto
{
    [Required]
    public string CurrentCategoryName { get; set; }

    [Required]
    public string ProductName { get; set; }

    [Required]
    public string NewCategoryName { get; set; }
}