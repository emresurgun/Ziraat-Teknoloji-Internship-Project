using System.ComponentModel.DataAnnotations;

public class DeleteProductDto
{
    [Required]
    public string ProductName { get; set; } 
    [Required]
    public string CategoryName { get; set; } 
}