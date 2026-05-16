using MediatR;

namespace FAMS.Application.Common.Notifications.Events;

/// <summary>
/// Published when a student is marked absent. Any number of channel handlers (SMS, email,
/// in-app, audit log) can subscribe. PRD FR-ATT-04 / FR-PLT-03.
/// </summary>
public record StudentMarkedAbsentEvent(
    Guid StudentId,
    string StudentFirstName,
    string StudentLastName,
    DateTime Date,
    string? ParentPhone,
    string? ParentEmail,
    Guid CampusId) : INotification;
