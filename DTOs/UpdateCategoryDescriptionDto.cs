using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs
{
    public class UpdateCategoryDescriptionDto
    {
        [Required]
        public string CategoryName { get; set; }

        [Required]
        public string NewDescription { get; set; }
    }
}