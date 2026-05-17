using Hangfire.Dashboard;

namespace FAMS.API.Extensions;

public class HangfireAuthFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        return httpContext.User.IsInRole("SystemAdmin");
    }
}
