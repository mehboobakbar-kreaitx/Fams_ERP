namespace FAMS.Application.Common.Interfaces;

public interface IStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string bucketName, CancellationToken ct = default);
    Task<Stream> DownloadAsync(string fileName, string bucketName, CancellationToken ct = default);
    Task DeleteAsync(string fileName, string bucketName, CancellationToken ct = default);
    Task<string> GetPresignedUrlAsync(string fileName, string bucketName, int expiryMinutes = 60);
}
