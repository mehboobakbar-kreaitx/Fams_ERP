using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class Section : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public Guid ClassRoomId { get; private set; }
    public Guid? TeacherId { get; private set; }
    public int MaxStudents { get; private set; }
    public bool IsActive { get; private set; } = true;

    public ClassRoom ClassRoom { get; private set; } = null!;
    public Staff? Teacher { get; private set; }
    public ICollection<Student> Students { get; private set; } = new List<Student>();

    private Section() { }

    public static Section Create(string name, Guid classRoomId, int maxStudents, Guid? teacherId = null)
    {
        return new Section
        {
            Name = name,
            ClassRoomId = classRoomId,
            TeacherId = teacherId,
            MaxStudents = maxStudents,
            IsActive = true
        };
    }

    public void AssignTeacher(Guid teacherId) => TeacherId = teacherId;
}
