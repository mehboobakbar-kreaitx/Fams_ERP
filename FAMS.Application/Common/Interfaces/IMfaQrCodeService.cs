namespace FAMS.Application.Common.Interfaces;

public interface IMfaQrCodeService
{
    string GenerateDataUrl(string payload);
}
