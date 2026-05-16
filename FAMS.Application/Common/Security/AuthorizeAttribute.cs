namespace FAMS.Application.Common.Security;

[AttributeUsage(AttributeTargets.Class, AllowMultiple = true, Inherited = false)]
public sealed class AuthorizeAttribute : Attribute
{
    public string? Roles { get; set; }
    public string? Policy { get; set; }

    public AuthorizeAttribute() { }
    public AuthorizeAttribute(string roles) { Roles = roles; }
}
