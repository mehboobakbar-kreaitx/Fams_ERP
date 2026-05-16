namespace FAMS.Application.Modules.Admissions.Queries.GetAdmissionsFunnel;

public record FunnelStage(string Stage, int Count, decimal ConversionFromPrevious);

public record AdmissionsFunnelDto(List<FunnelStage> Stages, decimal OverallConversion);
