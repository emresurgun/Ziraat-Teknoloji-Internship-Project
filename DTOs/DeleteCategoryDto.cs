using System.ComponentModel.DataAnnotations;

public class DeleteCategoryDto
{
    [Required]
    public string CategoryName { get; set; } = string.Empty;
}