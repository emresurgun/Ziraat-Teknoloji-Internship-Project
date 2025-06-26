// DTO
namespace RestAPI.DTOs
{
    public class UpdateProductDescriptionDto
    {
        public string ProductName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string NewDescription { get; set; } = string.Empty;
    }
}