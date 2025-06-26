using System.ComponentModel.DataAnnotations;

public class UpdateCategoryDto
{
    [Required]
    public string CurrentCategoryName { get; set; }

    [Required]
    public string NewCategoryName { get; set; }
}