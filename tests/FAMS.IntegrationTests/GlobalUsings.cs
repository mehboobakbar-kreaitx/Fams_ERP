global using Xunit;
global using FluentAssertions;
global using System.Net.Http.Json;
global using Microsoft.Extensions.Configuration;

// Run integration-test classes sequentially — each spins up Docker containers
// and they should not race each other.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
