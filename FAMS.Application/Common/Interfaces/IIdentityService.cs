namespace FAMS.Application.Common.Interfaces;

public record AppUserDto(string Id, string Email, string FirstName, string LastName, Guid CampusId,
    bool TwoFactorEnabled, IReadOnlyList<string> Roles);

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
}
