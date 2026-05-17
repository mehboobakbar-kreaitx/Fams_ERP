using System.Security.Cryptography;
using System.Text;
using FAMS.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FAMS.Infrastructure.Services;

public class JazzCashService : IJazzCashService
{
    private readonly string _merchantId;
    private readonly string _password;
    private readonly string _integritySalt;
    private readonly string _apiUrl;
    private readonly ILogger<JazzCashService> _logger;

    public JazzCashService(IConfiguration configuration, ILogger<JazzCashService> logger)
    {
        _merchantId = configuration["JazzCash:MerchantId"] ?? throw new InvalidOperationException("JazzCash:MerchantId not configured");
        _password = configuration["JazzCash:Password"] ?? throw new InvalidOperationException("JazzCash:Password not configured");
        _integritySalt = configuration["JazzCash:IntegritySalt"] ?? throw new InvalidOperationException("JazzCash:IntegritySalt not configured");
        _apiUrl = configuration["JazzCash:ApiUrl"] ?? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
        _logger = logger;
    }

    public Task<JazzCashInitiateResult> InitiatePaymentAsync(JazzCashPaymentRequest request, CancellationToken ct = default)
    {
        var txnDateTime = DateTime.Now.ToString("yyyyMMddHHmmss");
        var expiryDateTime = DateTime.Now.AddHours(1).ToString("yyyyMMddHHmmss");
        var amountPaisa = ((long)(request.Amount * 100)).ToString();

        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["pp_Version"]        = "1.1",
            ["pp_TxnType"]        = "MWALLET",
            ["pp_Language"]       = "EN",
            ["pp_MerchantID"]     = _merchantId,
            ["pp_Password"]       = _password,
            ["pp_TxnRefNo"]       = request.TxnRefNo,
            ["pp_Amount"]         = amountPaisa,
            ["pp_TxnCurrency"]    = "PKR",
            ["pp_TxnDateTime"]    = txnDateTime,
            ["pp_BillReference"]  = request.TxnRefNo,
            ["pp_Description"]    = request.Description,
            ["pp_TxnExpiryDateTime"] = expiryDateTime,
            ["pp_ReturnURL"]      = request.ReturnUrl,
            ["pp_SecureHash"]     = string.Empty,
        };

        if (!string.IsNullOrWhiteSpace(request.CustomerEmail))
            fields["pp_CustomerEmail"] = request.CustomerEmail;
        if (!string.IsNullOrWhiteSpace(request.CustomerMobile))
            fields["pp_CustomerMobileNo"] = request.CustomerMobile;

        fields["pp_SecureHash"] = ComputeSecureHash(fields);

        _logger.LogInformation("JazzCash payment initiated for TxnRef {TxnRefNo}", request.TxnRefNo);

        return Task.FromResult(new JazzCashInitiateResult(_apiUrl, fields));
    }

    public bool VerifyWebhookSignature(IDictionary<string, string> formFields)
    {
        if (!formFields.TryGetValue("pp_SecureHash", out var receivedHash) || string.IsNullOrEmpty(receivedHash))
            return false;

        var sorted = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var (k, v) in formFields)
        {
            if (k != "pp_SecureHash" && !string.IsNullOrEmpty(v))
                sorted[k] = v;
        }

        var expected = ComputeSecureHash(sorted);
        var result = string.Equals(expected, receivedHash, StringComparison.OrdinalIgnoreCase);

        if (!result)
            _logger.LogWarning("JazzCash webhook signature mismatch for TxnRef {TxnRefNo}",
                formFields.TryGetValue("pp_TxnRefNo", out var txnRef2) ? txnRef2 : "(unknown)");

        return result;
    }

    private string ComputeSecureHash(IDictionary<string, string> fields)
    {
        // JazzCash HMAC: salt + sorted non-empty field values joined with &
        var values = fields
            .Where(kv => kv.Key != "pp_SecureHash" && !string.IsNullOrEmpty(kv.Value))
            .OrderBy(kv => kv.Key, StringComparer.Ordinal)
            .Select(kv => kv.Value);

        var data = _integritySalt + "&" + string.Join("&", values);
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_integritySalt));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
