using MediatR;

namespace FAMS.Application.Common.Notifications.Events;

/// <summary>
/// Published when a result is published to a student. PRD FR-RES-10.
/// </summary>
public record ResultPublishedEvent(
    Guid StudentId,
    string StudentFirstName,
    string StudentLastName,
    string TermName,
    string ExamType,
    string? ParentPhone,
    string? ParentEmail,
    Guid CampusId) : INotification;
