namespace RestAPI.Entities
{
    public class Category
    {
        public int Id { get; set; }
        public string CategoryName { get; set; }
        public string Description { get; set; }

      
        public int? ParentCategoryId { get; set; }
        public Category? ParentCategory { get; set; }
        
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}