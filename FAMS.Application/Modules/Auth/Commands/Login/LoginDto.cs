namespace FAMS.Application.Modules.Auth.Commands.Login;

public record LoginDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    string UserId,
    IReadOnlyList<string> Roles,
    Guid CampusId,
    string FullName,
    bool MfaRequired,
    bool MfaEnrollmentRequired = false);
