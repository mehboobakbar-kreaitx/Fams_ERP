using Amazon.S3;
using Amazon.S3.Model;
using FAMS.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace FAMS.Infrastructure.Services;

public class StorageService : IStorageService
{
    private readonly IAmazonS3 _s3;
    private readonly ILogger<StorageService> _logger;

    public StorageService(IAmazonS3 s3, ILogger<StorageService> logger)
    {
        _s3 = s3;
        _logger = logger;
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string bucketName, CancellationToken ct = default)
    {
        await _s3.PutObjectAsync(new PutObjectRequest
        {
            BucketName = bucketName,
            Key = fileName,
            InputStream = fileStream
        }, ct);
        _logger.LogInformation("Uploaded {Key} to {Bucket}", fileName, bucketName);
        return fileName;
    }

    public async Task<Stream> DownloadAsync(string fileName, string bucketName, CancellationToken ct = default)
    {
        var response = await _s3.GetObjectAsync(bucketName, fileName, ct);
        return response.ResponseStream;
    }

    public async Task DeleteAsync(string fileName, string bucketName, CancellationToken ct = default)
    {
        await _s3.DeleteObjectAsync(bucketName, fileName, ct);
        _logger.LogInformation("Deleted {Key} from {Bucket}", fileName, bucketName);
    }

    public Task<string> GetPresignedUrlAsync(string fileName, string bucketName, int expiryMinutes = 60)
    {
        var url = _s3.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = bucketName,
            Key = fileName,
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes)
        });
        return Task.FromResult(url);
    }
}
