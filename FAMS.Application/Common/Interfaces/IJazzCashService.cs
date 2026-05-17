namespace FAMS.Application.Common.Interfaces;

public interface IJazzCashService
{
    /// <summary>Builds the payment initiation URL + signed payload to redirect the user to JazzCash.</summary>
    Task<JazzCashInitiateResult> InitiatePaymentAsync(JazzCashPaymentRequest request, CancellationToken ct = default);

    /// <summary>Validates the HMAC signature on an incoming JazzCash callback/webhook.</summary>
    bool VerifyWebhookSignature(IDictionary<string, string> formFields);
}

public record JazzCashPaymentRequest(
    string TxnRefNo,
    decimal Amount,
    string Description,
    string ReturnUrl,
    string? CustomerEmail,
    string? CustomerMobile);

public record JazzCashInitiateResult(
    string PaymentUrl,
    IDictionary<string, string> FormFields);
