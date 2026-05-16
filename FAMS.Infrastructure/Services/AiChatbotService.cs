using FAMS.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;
using System.Text.Json;

namespace FAMS.Infrastructure.Services;

public class AiChatbotService : IAiChatbotService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<AiChatbotService> _logger;

    public AiChatbotService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<AiChatbotService> logger)
    {
        _http = httpClientFactory.CreateClient("Anthropic");
        _config = config;
        _logger = logger;
    }

    public async Task<string> GetResponseAsync(string userMessage, string userRole, Guid campusId, CancellationToken ct = default)
    {
        var apiKey = _config["Anthropic:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Anthropic API key not configured; returning fallback response.");
            return "AI chatbot is not configured. Please contact your administrator.";
        }

        var model = _config["Anthropic:Model"] ?? "claude-sonnet-4-6";
        var systemPrompt = $"You are FAMS Assistant for Falcon Academic Management System. " +
                          $"The current user is a {userRole} at campus {campusId}. " +
                          $"Provide concise, helpful answers about academic operations.";

        _http.DefaultRequestHeaders.Clear();
        _http.DefaultRequestHeaders.Add("x-api-key", apiKey);
        _http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

        var body = new
        {
            model,
            max_tokens = 1024,
            system = systemPrompt,
            messages = new[] { new { role = "user", content = userMessage } }
        };

        var response = await _http.PostAsJsonAsync("https://api.anthropic.com/v1/messages", body, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var content = doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString();
        return content ?? string.Empty;
    }
}
