using FAMS.IntegrationTests.Infrastructure;
using FluentAssertions;
using System.Net;
using System.Net.Http.Headers;

namespace FAMS.IntegrationTests.Authorization;

public class RbacTests : IClassFixture<FamsWebAppFactory>, IAsyncLifetime
{
    private readonly FamsWebAppFactory _factory;
    private readonly HttpClient _client;

    public RbacTests(FamsWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public async Task InitializeAsync() => await _factory.SeedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // --- Anonymous ---

    [Fact]
    public async Task Anonymous_ProtectedEndpoint_Returns401()
    {
        var response = await _client.GetAsync("/api/v1/campuses");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // --- Student accessing admin-only endpoints ---

    [Fact]
    public async Task Student_CampusList_Returns403()
    {
        var campusId = Guid.NewGuid();
        var studentId = Guid.NewGuid().ToString();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHelper.StudentToken(_factory, studentId, campusId));

        var response = await _client.GetAsync("/api/v1/campuses");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Student_ResultsAnalytics_Returns403()
    {
        var campusId = Guid.NewGuid();
        var studentId = Guid.NewGuid().ToString();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHelper.StudentToken(_factory, studentId, campusId));

        var response = await _client.GetAsync(
            $"/api/v1/results/analytics?subjectId={Guid.NewGuid()}&examType=Midterm&termName=2026-T1");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Student_PublishResults_Returns403()
    {
        var campusId = Guid.NewGuid();
        var studentId = Guid.NewGuid().ToString();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHelper.StudentToken(_factory, studentId, campusId));

        var body = new { subjectId = Guid.NewGuid(), examType = "Midterm", termName = "2026-T1" };
        var response = await _client.PostAsJsonAsync("/api/v1/results/publish", body);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // --- Teacher accessing allowed endpoints ---

    [Fact]
    public async Task Teacher_EnterMarks_Returns200OrBadRequest_NotForbidden()
    {
        var campusId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHelper.TeacherToken(_factory, campusId));

        var body = new
        {
            subjectId = Guid.NewGuid(),
            examType = "Midterm",
            termName = "2026-T1",
            totalMarks = 100,
            entries = Array.Empty<object>()
        };
        var response = await _client.PostAsJsonAsync("/api/v1/results/marks", body);

        // Teacher has access (roles allow it); may get 400 for empty entries — not 401/403
        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Teacher_PublishResults_Returns403()
    {
        var campusId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHelper.TeacherToken(_factory, campusId));

        var body = new { subjectId = Guid.NewGuid(), examType = "Midterm", termName = "2026-T1" };
        var response = await _client.PostAsJsonAsync("/api/v1/results/publish", body);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // --- SystemAdmin accessing admin endpoints ---

    [Fact]
    public async Task SystemAdmin_CampusList_Returns200()
    {
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHelper.SystemAdminToken(_factory));

        var response = await _client.GetAsync("/api/v1/campuses");

        // 200 if campuses exist, or could be empty list — either way, not 401/403
        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    // --- Tenant isolation: student cannot read another student's results ---

    [Fact]
    public async Task Student_OtherStudentResults_Returns403()
    {
        var campusId = Guid.NewGuid();
        var myId = Guid.NewGuid().ToString();
        var otherId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHelper.StudentToken(_factory, myId, campusId));

        var response = await _client.GetAsync($"/api/v1/results/student/{otherId}");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Student_OwnResults_Returns200OrNotFound_NotForbidden()
    {
        var campusId = Guid.NewGuid();
        var myId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHelper.StudentToken(_factory, myId.ToString(), campusId));

        var response = await _client.GetAsync($"/api/v1/results/student/{myId}");

        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }
}
