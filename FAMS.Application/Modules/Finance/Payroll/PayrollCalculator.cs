namespace FAMS.Application.Modules.Finance.Payroll;

public static class PayrollCalculator
{
    private const decimal EobiRatePercent = 1m;
    private const decimal EobiCapMonthlySalary = 37_000m;

    public static decimal CalculateEobi(decimal basicSalary)
    {
        var pensionable = Math.Min(basicSalary, EobiCapMonthlySalary);
        return Math.Round(pensionable * EobiRatePercent / 100m, 2);
    }

    public static decimal CalculateMonthlyIncomeTax(decimal annualTaxableIncome)
    {
        decimal annualTax = annualTaxableIncome switch
        {
            <= 600_000m => 0m,
            <= 1_200_000m => (annualTaxableIncome - 600_000m) * 0.05m,
            <= 2_200_000m => 30_000m + (annualTaxableIncome - 1_200_000m) * 0.15m,
            <= 3_200_000m => 180_000m + (annualTaxableIncome - 2_200_000m) * 0.25m,
            <= 4_100_000m => 430_000m + (annualTaxableIncome - 3_200_000m) * 0.30m,
            _ => 700_000m + (annualTaxableIncome - 4_100_000m) * 0.35m
        };
        return Math.Round(annualTax / 12m, 2);
    }
}
