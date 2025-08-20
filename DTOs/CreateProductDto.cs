using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs
{
    public class CreateProductDto
    {
        [Required]
        public string CategoryName { get; set; }
        [Required]
        public string ProductName { get; set; }
        [Required]
        public decimal Price { get; set; }
        [Required]
        public string Description { get; set; }
    }
}