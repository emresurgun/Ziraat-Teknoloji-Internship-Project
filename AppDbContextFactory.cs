using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using RestAPI.Data;

namespace RestAPI
{
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseSqlServer("Server=localhost,1433;Database=sqlserver;User Id=sa;Password=bfsjdJVFSOV8WvvjNKJfvds34135;Encrypt=False;TrustServerCertificate=True;MultipleActiveResultSets=true;Connection Timeout=30;");
            return new AppDbContext(optionsBuilder.Options);
        }
    }
}