using FAMS.Application.Modules.Finance.Payroll;
using FluentAssertions;

namespace FAMS.UnitTests.Finance;

public class PayrollCalculatorTests
{
    // ── EOBI ──────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(10_000, 100)]      // 1 % of 10 000
    [InlineData(37_000, 370)]      // at the cap
    [InlineData(50_000, 370)]      // above cap — capped at 37 000
    [InlineData(0,      0)]
    public void CalculateEobi_UsesCapCorrectly(decimal basic, decimal expected)
    {
        var result = PayrollCalculator.CalculateEobi(basic);
        result.Should().Be(expected);
    }

    // ── Income tax slabs (FY 2024–25) ─────────────────────────────────────────

    [Fact]
    public void IncomeTax_BelowFirstSlab_IsZero()
    {
        var monthly = PayrollCalculator.CalculateMonthlyIncomeTax(600_000m);
        monthly.Should().Be(0m);
    }

    [Fact]
    public void IncomeTax_SecondSlab_CorrectRate()
    {
        // Annual 900 000 → (900 000 – 600 000) × 5 % = 15 000 → / 12 = 1 250
        var monthly = PayrollCalculator.CalculateMonthlyIncomeTax(900_000m);
        monthly.Should().Be(1_250m);
    }

    [Fact]
    public void IncomeTax_ThirdSlab_CorrectRate()
    {
        // Annual 1 700 000 → 30 000 + (1 700 000 – 1 200 000) × 15 % = 105 000 → / 12 = 8 750
        var monthly = PayrollCalculator.CalculateMonthlyIncomeTax(1_700_000m);
        monthly.Should().Be(8_750m);
    }

    [Fact]
    public void IncomeTax_FourthSlab_CorrectRate()
    {
        // Annual 2 700 000 → 180 000 + (2 700 000 – 2 200 000) × 25 % = 305 000 → / 12 ≈ 25 416.67
        var monthly = PayrollCalculator.CalculateMonthlyIncomeTax(2_700_000m);
        monthly.Should().Be(Math.Round(305_000m / 12m, 2));
    }

    [Fact]
    public void IncomeTax_FifthSlab_CorrectRate()
    {
        // Annual 3 700 000 → 430 000 + (3 700 000 – 3 200 000) × 30 % = 580 000 → / 12 ≈ 48 333.33
        var monthly = PayrollCalculator.CalculateMonthlyIncomeTax(3_700_000m);
        monthly.Should().Be(Math.Round(580_000m / 12m, 2));
    }

    [Fact]
    public void IncomeTax_TopSlab_CorrectRate()
    {
        // Annual 5 000 000 → 700 000 + (5 000 000 – 4 100 000) × 35 % = 1 015 000 → / 12 ≈ 84 583.33
        var monthly = PayrollCalculator.CalculateMonthlyIncomeTax(5_000_000m);
        monthly.Should().Be(Math.Round(1_015_000m / 12m, 2));
    }

    [Fact]
    public void IncomeTax_AtSlabBoundary_IsExact()
    {
        // At exactly 1 200 000 → 30 000 / 12 = 2 500
        var monthly = PayrollCalculator.CalculateMonthlyIncomeTax(1_200_000m);
        monthly.Should().Be(2_500m);
    }
}
