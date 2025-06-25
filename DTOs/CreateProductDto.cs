using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs;

public class CreateProductDto
{
    [Required]
    public string ProductName { get; set; }

    [Required]
    public decimal ProductPrice { get; set; }

    public string? ProductDescription { get; set; }

    [Required]
    public string CategoryName { get; set; }
}