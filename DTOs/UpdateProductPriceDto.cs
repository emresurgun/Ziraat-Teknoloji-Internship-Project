using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs;

public class UpdateProductPriceDto
{
    [Required]
    public string CategoryName { get; set; }

    [Required]
    public string ProductName { get; set; }

    [Required]
    public decimal NewPrice { get; set; }
}