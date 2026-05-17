using System.Text;
using FAMS.Application.Common.Interfaces;
using QRCoder;

namespace FAMS.Infrastructure.Services;

public class MfaQrCodeService : IMfaQrCodeService
{
    public string GenerateDataUrl(string payload)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new SvgQRCode(data);
        var svg = qrCode.GetGraphic(4);
        var bytes = Encoding.UTF8.GetBytes(svg);
        return $"data:image/svg+xml;base64,{Convert.ToBase64String(bytes)}";
    }
}
