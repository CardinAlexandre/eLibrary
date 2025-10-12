using AuthService.DTOs;
using AuthService.Models;
using AuthService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AuthService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtService _jwtService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtService jwtService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtService = jwtService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        await _userManager.AddToRoleAsync(user, "Member");

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtService.GenerateToken(user, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();

        _logger.LogInformation("User registered: {Email}", dto.Email);

        return Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList()
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);

        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtService.GenerateToken(user, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();

        _logger.LogInformation("User logged in: {Email}", dto.Email);

        return Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList()
        });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh([FromBody] RefreshTokenDto dto)
    {
        var user = await _userManager.FindByIdAsync(dto.UserId.ToString());

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid refresh token" });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtService.GenerateToken(user, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();

        return Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList()
        });
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new UserProfileDto
        {
            UserId = user.Id,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList(),
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            IsActive = user.IsActive
        });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;

        if (dto.Email != user.Email)
        {
            var setEmailResult = await _userManager.SetEmailAsync(user, dto.Email);
            if (!setEmailResult.Succeeded)
            {
                return BadRequest(new { errors = setEmailResult.Errors.Select(e => e.Description) });
            }
            await _userManager.SetUserNameAsync(user, dto.Email);
        }

        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        if (!string.IsNullOrEmpty(dto.NewPassword))
        {
            if (string.IsNullOrEmpty(dto.CurrentPassword))
            {
                return BadRequest(new { message = "Current password is required to change password" });
            }

            var passwordResult = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!passwordResult.Succeeded)
            {
                return BadRequest(new { errors = passwordResult.Errors.Select(e => e.Description) });
            }
        }

        var roles = await _userManager.GetRolesAsync(user);

        _logger.LogInformation("User profile updated: {UserId}", userId);

        return Ok(new UserProfileDto
        {
            UserId = user.Id,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList(),
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            IsActive = user.IsActive
        });
    }

    [Authorize]
    [HttpPost("promote-admin")]
    public async Task<ActionResult<AuthResponseDto>> PromoteToAdmin()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        var roles = await _userManager.GetRolesAsync(user);
        
        if (!roles.Contains("Admin"))
        {
            await _userManager.AddToRoleAsync(user, "Admin");
            roles = await _userManager.GetRolesAsync(user);
            
            _logger.LogInformation("User promoted to Admin: {UserId}", userId);
        }

        var token = _jwtService.GenerateToken(user, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();

        return Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList()
        });
    }

    [Authorize]
    [HttpPost("remove-admin")]
    public async Task<ActionResult<AuthResponseDto>> RemoveAdminRole()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        var roles = await _userManager.GetRolesAsync(user);
        
        if (roles.Contains("Admin"))
        {
            await _userManager.RemoveFromRoleAsync(user, "Admin");
            roles = await _userManager.GetRolesAsync(user);
            
            _logger.LogInformation("Admin role removed from user: {UserId}", userId);
        }

        var token = _jwtService.GenerateToken(user, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();

        return Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList()
        });
    }
}

