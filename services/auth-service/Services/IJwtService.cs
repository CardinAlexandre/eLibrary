using AuthService.Models;

namespace AuthService.Services;

public interface IJwtService
{
    string GenerateToken(ApplicationUser user, IList<string> roles);
    string GenerateRefreshToken();
}

