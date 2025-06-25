namespace RestAPI.DTOs
{
    public class SeeAllCategoriesDto
    {
        public int Id { get; set; }
        public string CategoryName { get; set; }
        public string Description { get; set; }
        public int? ParentCategoryId { get; set; }  // Nullable olabilir, parent kategori olmayabilir.
    }
}