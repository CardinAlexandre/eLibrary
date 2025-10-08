using AuthService.Models;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Data;

public static class SeedData
{
    public static async Task Initialize(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole<Guid>> roleManager)
    {
        // Create roles
        string[] roles = { "Admin", "Librarian", "Member" };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid> { Name = role });
            }
        }

        // Create admin user
        var adminEmail = "admin@elibrary.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Admin",
                LastName = "User",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(adminUser, "Admin@2025!");

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

        // Create librarian user
        var librarianEmail = "librarian@elibrary.com";
        var librarianUser = await userManager.FindByEmailAsync(librarianEmail);

        if (librarianUser == null)
        {
            librarianUser = new ApplicationUser
            {
                UserName = librarianEmail,
                Email = librarianEmail,
                FirstName = "Librarian",
                LastName = "User",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(librarianUser, "Librarian@2025!");

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(librarianUser, "Librarian");
            }
        }

        // Create member user
        var memberEmail = "member@elibrary.com";
        var memberUser = await userManager.FindByEmailAsync(memberEmail);

        if (memberUser == null)
        {
            memberUser = new ApplicationUser
            {
                UserName = memberEmail,
                Email = memberEmail,
                FirstName = "Member",
                LastName = "User",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(memberUser, "Member@2025!");

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(memberUser, "Member");
            }
        }
    }
}

