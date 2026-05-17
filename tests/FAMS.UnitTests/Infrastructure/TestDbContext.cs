using FAMS.Application.Common.Interfaces;
using FAMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace FAMS.UnitTests.Infrastructure;

/// <summary>Factory helpers for creating an in-memory FamsDbContext in unit tests.</summary>
public static class TestDbContext
{
    public static FamsDbContext Create(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<FamsDbContext>()
            .UseInMemoryDatabase(dbName ?? Guid.NewGuid().ToString())
            .Options;

        var currentUser = new Mock<ICurrentUserService>();
        currentUser.Setup(x => x.UserId).Returns(Guid.NewGuid().ToString());
        currentUser.Setup(x => x.CampusId).Returns(Guid.NewGuid());

        return new FamsDbContext(options, currentUser.Object);
    }
}
