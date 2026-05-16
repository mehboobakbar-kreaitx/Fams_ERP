using FAMS.Application.Common.Interfaces;
using FAMS.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace FAMS.Infrastructure.Services;

public class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public IdentityService(UserManager<ApplicationUser> userManager) => _userManager = userManager;

    private static async Task<AppUserDto> ToDtoAsync(UserManager<ApplicationUser> mgr, ApplicationUser user)
    {
        var roles = await mgr.GetRolesAsync(user);
        return new AppUserDto(user.Id, user.Email ?? string.Empty, user.FirstName, user.LastName,
            user.CampusId, user.TwoFactorEnabled, roles.ToList());
    }

    public async Task<AppUserDto?> FindByEmailAsync(string email)
    {
        var u = await _userManager.FindByEmailAsync(email);
        return u is null ? null : await ToDtoAsync(_userManager, u);
    }

    public async Task<AppUserDto?> FindByIdAsync(string id)
    {
        var u = await _userManager.FindByIdAsync(id);
        return u is null ? null : await ToDtoAsync(_userManager, u);
    }

    public async Task<bool> CheckPasswordAsync(string userId, string password)
    {
        var u = await _userManager.FindByIdAsync(userId);
        if (u is null || !u.IsActive) return false;
        return await _userManager.CheckPasswordAsync(u, password);
    }

    public async Task<bool> VerifyTwoFactorTokenAsync(string userId, string code)
    {
        var u = await _userManager.FindByIdAsync(userId);
        if (u is null) return false;
        return await _userManager.VerifyTwoFactorTokenAsync(u, _userManager.Options.Tokens.AuthenticatorTokenProvider, code);
    }

    public async Task SetRefreshTokenAsync(string userId, string? refreshToken, DateTime? expiry)
    {
        var u = await _userManager.FindByIdAsync(userId);
        if (u is null) return;
        u.RefreshToken = refreshToken;
        u.RefreshTokenExpiry = expiry;
        await _userManager.UpdateAsync(u);
    }

    public async Task<(string? RefreshToken, DateTime? Expiry)> GetRefreshTokenAsync(string userId)
    {
        var u = await _userManager.FindByIdAsync(userId);
        return u is null ? (null, null) : (u.RefreshToken, u.RefreshTokenExpiry);
    }

    public async Task UpdateLastLoginAsync(string userId)
    {
        var u = await _userManager.FindByIdAsync(userId);
        if (u is null) return;
        u.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(u);
    }

    public async Task<(bool Succeeded, string? Error)> ChangePasswordAsync(string userId, string oldPassword, string newPassword)
    {
        var u = await _userManager.FindByIdAsync(userId);
        if (u is null) return (false, "User not found.");
        var result = await _userManager.ChangePasswordAsync(u, oldPassword, newPassword);
        return result.Succeeded
            ? (true, null)
            : (false, string.Join("; ", result.Errors.Select(e => e.Description)));
    }

    public async Task<string> GetOrCreateAuthenticatorKeyAsync(string userId)
    {
        var u = await _userManager.FindByIdAsync(userId) ?? throw new InvalidOperationException("User not found.");
        var key = await _userManager.GetAuthenticatorKeyAsync(u);
        if (string.IsNullOrWhiteSpace(key))
        {
            await _userManager.ResetAuthenticatorKeyAsync(u);
            key = await _userManager.GetAuthenticatorKeyAsync(u);
        }
        return key ?? string.Empty;
    }

    public async Task<bool> EnableTwoFactorAsync(string userId, string code)
    {
        var u = await _userManager.FindByIdAsync(userId);
        if (u is null) return false;
        var valid = await _userManager.VerifyTwoFactorTokenAsync(u, _userManager.Options.Tokens.AuthenticatorTokenProvider, code);
        if (!valid) return false;
        var result = await _userManager.SetTwoFactorEnabledAsync(u, true);
        return result.Succeeded;
    }

    public async Task<string> GeneratePasswordResetTokenAsync(string email)
    {
        var u = await _userManager.FindByEmailAsync(email);
        if (u is null) return string.Empty;
        return await _userManager.GeneratePasswordResetTokenAsync(u);
    }

    public async Task<(bool Succeeded, string? Error)> ResetPasswordAsync(string email, string token, string newPassword)
    {
        var u = await _userManager.FindByEmailAsync(email);
        if (u is null) return (false, "User not found.");
        var result = await _userManager.ResetPasswordAsync(u, token, newPassword);
        return result.Succeeded
            ? (true, null)
            : (false, string.Join("; ", result.Errors.Select(e => e.Description)));
    }
}
