namespace FAMS.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserName { get; }
    Guid? CampusId { get; }
    string? Role { get; }
    IEnumerable<string> Roles { get; }
    bool IsAuthenticated { get; }
}
