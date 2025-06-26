using System.ComponentModel.DataAnnotations;

namespace RestAPI.DTOs
{
    public class ChangeCategoryDescriptionDto
    {
        [Required]
        public string CategoryName { get; set; }

        [Required]
        public string NewDescription { get; set; }
    }
}