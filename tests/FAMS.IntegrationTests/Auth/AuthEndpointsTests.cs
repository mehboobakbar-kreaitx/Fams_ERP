using FAMS.IntegrationTests.Infrastructure;
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace FAMS.IntegrationTests.Auth;

public class AuthEndpointsTests : IClassFixture<FamsWebAppFactory>, IAsyncLifetime
{
    private readonly FamsWebAppFactory _factory;
    private readonly HttpClient _client;

    public AuthEndpointsTests(FamsWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public async Task InitializeAsync() => await _factory.SeedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Login_ValidTeacherCredentials_Returns200WithTokens()
    {
        // The seeder creates a teacher account; adjust email/password to match DbSeeder
        var payload = new { email = "teacher@campus1.fams.io", password = "Teacher@2026!" };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", payload);

        // Teacher does not require MFA — expect a full token response
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
        body.GetProperty("refreshToken").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var payload = new { email = "teacher@campus1.fams.io", password = "Wrong@2026!" };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", payload);

        // Auth failures return 401 (invalid credentials), not 400
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_UnknownEmail_Returns401()
    {
        var payload = new { email = "nobody@nowhere.test", password = "Pass@123!" };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_SystemAdmin_ReturnsMfaEnrollmentRequired()
    {
        // Seeded SystemAdmin has no MFA enrolled — handler returns MfaEnrollmentRequired
        var payload = new { email = "superadmin@fams.io", password = "SuperAdmin@2026!" };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", payload);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("mfaRequired").GetBoolean().Should().BeTrue();
        body.GetProperty("mfaEnrollmentRequired").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task Refresh_ValidTokens_Returns200WithNewPair()
    {
        // 1 — log in as a teacher to get real tokens
        var loginPayload = new { email = "teacher@campus1.fams.io", password = "Teacher@2026!" };
        var loginResp = await _client.PostAsJsonAsync("/api/v1/auth/login", loginPayload);
        loginResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginBody = await loginResp.Content.ReadFromJsonAsync<JsonElement>();
        var access = loginBody.GetProperty("accessToken").GetString()!;
        var refresh = loginBody.GetProperty("refreshToken").GetString()!;

        // 2 — use them to refresh
        var refreshPayload = new { accessToken = access, refreshToken = refresh };
        var refreshResp = await _client.PostAsJsonAsync("/api/v1/auth/refresh", refreshPayload);

        refreshResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var refreshBody = await refreshResp.Content.ReadFromJsonAsync<JsonElement>();
        refreshBody.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Refresh_WrongRefreshToken_Returns401()
    {
        var loginPayload = new { email = "teacher@campus1.fams.io", password = "Teacher@2026!" };
        var loginResp = await _client.PostAsJsonAsync("/api/v1/auth/login", loginPayload);
        var loginBody = await loginResp.Content.ReadFromJsonAsync<JsonElement>();
        var access = loginBody.GetProperty("accessToken").GetString()!;

        var payload = new { accessToken = access, refreshToken = "invalid-refresh" };
        var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh", payload);

        // Refresh with bad token → 401 (same as login failures)
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
