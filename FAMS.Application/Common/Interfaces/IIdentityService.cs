namespace FAMS.Application.Common.Interfaces;

public record AppUserDto(string Id, string Email, string FirstName, string LastName, Guid CampusId,
    Guid? SchoolId, bool TwoFactorEnabled, IReadOnlyList<string> Roles);

public interface IIdentityService
{
    Task<AppUserDto?> FindByEmailAsync(string email);
    Task<AppUserDto?> FindByIdAsync(string id);
    Task<bool> CheckPasswordAsync(string userId, string password);
    Task<bool> VerifyTwoFactorTokenAsync(string userId, string code);
    Task SetRefreshTokenAsync(string userId, string? refreshToken, DateTime? expiry);
    Task<(string? RefreshToken, DateTime? Expiry)> GetRefreshTokenAsync(string userId);
    Task UpdateLastLoginAsync(string userId);
    Task<(bool Succeeded, string? Error)> ChangePasswordAsync(string userId, string oldPassword, string newPassword);
    Task<string> GetOrCreateAuthenticatorKeyAsync(string userId);
    Task<bool> EnableTwoFactorAsync(string userId, string code);
    Task<(bool Succeeded, string? Error)> ResetPasswordAsync(string email, string token, string newPassword);
    Task<string> GeneratePasswordResetTokenAsync(string email);
    Task<(bool Succeeded, string? UserId, string? Error)> CreateUserAsync(
        string email, string password, string firstName, string lastName,
        Guid? schoolId, Guid campusId, string role);
    Task UpdateCampusIdAsync(string userId, Guid campusId);
}
