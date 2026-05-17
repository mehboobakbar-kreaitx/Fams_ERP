using FAMS.IntegrationTests.Infrastructure;
using FluentAssertions;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace FAMS.IntegrationTests.TenantIsolation;

/// <summary>
/// Verifies that campus-scoped roles cannot access data belonging to other campuses,
/// and that the correct HTTP status codes are returned for boundary conditions.
/// </summary>
public class TenantIsolationTests : IClassFixture<FamsWebAppFactory>, IAsyncLifetime
{
    private readonly FamsWebAppFactory _factory;
    private readonly HttpClient _client;

    public TenantIsolationTests(FamsWebAppFactory factory)
    {
        _factory = factory;
        _client  = factory.CreateClient();
    }

    public async Task InitializeAsync() => await _factory.SeedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ── student self-access ───────────────────────────────────────────────────

    [Fact]
    public async Task Student_AccessOwnAttendanceSummary_IsNotForbidden()
    {
        var campusId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer",
                TestAuthHelper.StudentToken(_factory, studentId.ToString(), campusId));

        var response = await _client.GetAsync(
            $"/api/v1/academic/attendance/student/{studentId}/summary");

        // RBAC passes for own record; data may be empty (no seeded attendance) but not 403/401
        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Student_AccessOtherStudentAttendanceSummary_Returns403()
    {
        var campusId = Guid.NewGuid();
        var myId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer",
                TestAuthHelper.StudentToken(_factory, myId.ToString(), campusId));

        var response = await _client.GetAsync(
            $"/api/v1/academic/attendance/student/{otherId}/summary");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── role-based access for results ────────────────────────────────────────

    [Fact]
    public async Task Teacher_UnpublishResults_Returns403()
    {
        var campusId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer",
                TestAuthHelper.TeacherToken(_factory, campusId));

        var body = new { subjectId = Guid.NewGuid(), examType = "Midterm", termName = "2026-T1" };
        var response = await _client.PostAsJsonAsync("/api/v1/results/unpublish", body);

        // Only Principal and SystemAdmin can unpublish
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Teacher_MarkAttendanceForSection_IsNotForbidden()
    {
        var campusId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer",
                TestAuthHelper.TeacherToken(_factory, campusId));

        var body = new
        {
            sectionId = Guid.NewGuid(),
            date = DateTime.UtcNow.ToString("O"),
            entries = Array.Empty<object>(),
            isOfflineEntry = false,
        };
        var response = await _client.PostAsJsonAsync("/api/v1/academic/attendance", body);

        // Teacher is authorised for this endpoint; may get 400 for validation but not 401/403
        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    // ── campus scoping on results ─────────────────────────────────────────────

    [Fact]
    public async Task CampusATeacher_QueryStudentResults_ReturnsEmptyForUnknownStudent()
    {
        var campusId = Guid.NewGuid();
        var unknownStudentId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer",
                TestAuthHelper.TeacherToken(_factory, campusId));

        var response = await _client.GetAsync(
            $"/api/v1/results/student/{unknownStudentId}?publishedOnly=false");

        // Campus-scoped teacher gets 200 with empty array (no cross-campus data leakage)
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task Anonymous_AttendanceReport_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.GetAsync(
            $"/api/v1/academic/attendance/report?sectionId={Guid.NewGuid()}&startDate=2026-01-01&endDate=2026-12-31");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
