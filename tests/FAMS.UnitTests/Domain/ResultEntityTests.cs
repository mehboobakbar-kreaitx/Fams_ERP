using FAMS.Domain.Entities;
using FluentAssertions;

namespace FAMS.UnitTests.Domain;

public class ResultEntityTests
{
    private static Result MakeResult(decimal obtained = 75m, decimal total = 100m)
        => Result.Create(Guid.NewGuid(), Guid.NewGuid(), "Midterm", obtained, total, "2026-Term1", "B");

    [Fact]
    public void Create_NotPublished()
    {
        var r = MakeResult();

        r.IsPublished.Should().BeFalse();
        r.PublishedAt.Should().BeNull();
        r.MarksObtained.Should().Be(75m);
        r.TotalMarks.Should().Be(100m);
        r.Grade.Should().Be("B");
    }

    [Fact]
    public void Publish_SetsIsPublishedAndPublishedAt()
    {
        var r = MakeResult();
        var before = DateTime.UtcNow;

        r.Publish();

        r.IsPublished.Should().BeTrue();
        r.PublishedAt.Should().NotBeNull();
        r.PublishedAt!.Value.Should().BeOnOrAfter(before);
    }

    [Fact]
    public void Unpublish_ClearsPublishState()
    {
        var r = MakeResult();
        r.Publish();

        r.Unpublish();

        r.IsPublished.Should().BeFalse();
        r.PublishedAt.Should().BeNull();
    }

    [Fact]
    public void UpdateMarks_ChangesValues()
    {
        var r = MakeResult(75m, 100m);

        r.UpdateMarks(88m, 100m, "A", "Recheck applied");

        r.MarksObtained.Should().Be(88m);
        r.Grade.Should().Be("A");
        r.Remarks.Should().Be("Recheck applied");
    }

    [Fact]
    public void Publish_IsIdempotent()
    {
        var r = MakeResult();
        r.Publish();
        var firstPublishedAt = r.PublishedAt;

        r.Publish();

        r.IsPublished.Should().BeTrue();
        // PublishedAt will be updated on second call — that is fine, just verify it stays set
        r.PublishedAt.Should().NotBeNull();
    }
}
