using System.ComponentModel.DataAnnotations;

public class DeleteProductDto
{
    [Required]
    public string ProductName { get; set; } = string.Empty;
}