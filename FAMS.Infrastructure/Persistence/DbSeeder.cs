using FAMS.Domain.Entities;
using FAMS.Domain.Enums;
using FAMS.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FAMS.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(FamsDbContext context, UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager, ILogger logger)
    {
        await context.Database.MigrateAsync();
        await SeedRolesAsync(roleManager, logger);
        await SeedCampusesAsync(context, logger);
        await SeedAdminUserAsync(userManager, context, logger);
        await SeedSampleDataAsync(context, logger);
    }

    private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager, ILogger logger)
    {
        string[] roles = [
            "SystemAdmin", "Executive", "Principal", "AcademicCoordinator", "Teacher",
            "Accountant", "HrOfficer", "Student", "Parent", "ProcurementOfficer"
        ];

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger.LogInformation("Created role: {Role}", role);
            }
        }
    }

    private static async Task SeedCampusesAsync(FamsDbContext context, ILogger logger)
    {
        // Bring campus roster to 31 per PRD §1, §3. Idempotent — only adds missing codes
        // and flips IsMainCampus on the HQ row.
        var roster = new (string Code, string Name, string City, string Address, string Principal, int Capacity, bool IsMain)[]
        {
            ("MC-01", "Falcon College — Main HQ Campus",       "Karachi",        "Main Road, Karachi",       "Dr. Ahmed Khan",       2000, true),
            ("NC-01", "Falcon College — Karachi North",         "Karachi",        "GT Road, Lahore",          "Prof. Sara Ali",       1500, false),
            ("SC-01", "Falcon College — Islamabad Capital",     "Islamabad",      "F-7, Islamabad",           "Dr. Imran Shah",       1200, false),
            ("FC-04", "Falcon College — Karachi Central",       "Karachi",        "Shahrah-e-Faisal, Karachi","Dr. Hina Qureshi",     1400, false),
            ("FC-05", "Falcon College — Karachi East",          "Karachi",        "Gulshan-e-Iqbal, Karachi", "Mr. Junaid Akhtar",    1300, false),
            ("FC-06", "Falcon College — Lahore Cantt",          "Lahore",         "Tufail Road, Lahore",      "Ms. Nadia Hussain",    1400, false),
            ("FC-07", "Falcon College — Lahore DHA",            "Lahore",         "DHA Phase 5, Lahore",      "Dr. Asad Iqbal",       1500, false),
            ("FC-08", "Falcon College — Lahore Gulberg",        "Lahore",         "Main Boulevard, Gulberg",  "Prof. Sana Yousaf",    1300, false),
            ("FC-09", "Falcon College — Lahore Model Town",     "Lahore",         "Model Town, Lahore",       "Mr. Faisal Mehmood",   1200, false),
            ("FC-10", "Falcon College — Faisalabad",            "Faisalabad",     "D-Ground, Faisalabad",     "Dr. Amir Bhatti",      1300, false),
            ("FC-11", "Falcon College — Rawalpindi",            "Rawalpindi",     "Saddar, Rawalpindi",       "Mrs. Tehmina Akbar",   1200, false),
            ("FC-12", "Falcon College — Multan",                "Multan",         "Bosan Road, Multan",       "Mr. Khurram Shahzad",  1100, false),
            ("FC-13", "Falcon College — Gujranwala",            "Gujranwala",     "Civil Lines, Gujranwala",  "Ms. Rabiya Saleem",    1000, false),
            ("FC-14", "Falcon College — Peshawar",              "Peshawar",       "University Town, Peshawar","Dr. Shafqat Khan",     1100, false),
            ("FC-15", "Falcon College — Quetta",                "Quetta",         "Jinnah Road, Quetta",      "Mr. Naveed Baloch",    900,  false),
            ("FC-16", "Falcon College — Sialkot",               "Sialkot",        "Cantt Area, Sialkot",      "Mrs. Sumera Asghar",   950,  false),
            ("FC-17", "Falcon College — Bahawalpur",            "Bahawalpur",     "Model Town, Bahawalpur",   "Dr. Tariq Aziz",       900,  false),
            ("FC-18", "Falcon College — Sargodha",              "Sargodha",       "Satellite Town, Sargodha", "Mr. Jamshed Khan",     850,  false),
            ("FC-19", "Falcon College — Sukkur",                "Sukkur",         "Society Area, Sukkur",     "Ms. Aisha Memon",      850,  false),
            ("FC-20", "Falcon College — Hyderabad",             "Hyderabad",      "Latifabad, Hyderabad",     "Dr. Saqib Bhutto",     1000, false),
            ("FC-21", "Falcon College — Mardan",                "Mardan",         "Sector B-1, Mardan",       "Mr. Wajid Khan",       800,  false),
            ("FC-22", "Falcon College — Sahiwal",               "Sahiwal",        "High Street, Sahiwal",     "Mrs. Farzana Rauf",    800,  false),
            ("FC-23", "Falcon College — Jhang",                 "Jhang",          "Civil Lines, Jhang",       "Mr. Adeel Saeed",      750,  false),
            ("FC-24", "Falcon College — Kasur",                 "Kasur",          "Railway Road, Kasur",      "Ms. Tahira Bibi",      750,  false),
            ("FC-25", "Falcon College — Rahim Yar Khan",        "Rahim Yar Khan", "Model Town, RYK",          "Mr. Shahid Saleem",    800,  false),
            ("FC-26", "Falcon College — Dera Ghazi Khan",       "Dera Ghazi Khan","Block 10, DG Khan",        "Dr. Imran Leghari",    750,  false),
            ("FC-27", "Falcon College — Gujrat",                "Gujrat",         "Mall Road, Gujrat",        "Mrs. Saira Cheema",    800,  false),
            ("FC-28", "Falcon College — Abbottabad",            "Abbottabad",     "Mansehra Road, Abbottabad","Mr. Asim Zaidi",       850,  false),
            ("FC-29", "Falcon College — Sheikhupura",           "Sheikhupura",    "Civil Lines, Sheikhupura", "Ms. Maira Iqbal",      750,  false),
            ("FC-30", "Falcon College — Mirpur (AJK)",          "Mirpur",         "Sector A-1, Mirpur",       "Dr. Adnan Mughal",     800,  false),
            ("FC-31", "Falcon College — Larkana",               "Larkana",        "VIP Road, Larkana",        "Mr. Khalid Soomro",    700,  false),
        };

        var existing = await context.Campuses.ToListAsync();
        var existingCodes = existing.Select(c => c.Code).ToHashSet();

        var toAdd = roster
            .Where(r => !existingCodes.Contains(r.Code))
            .Select(r => Campus.Create(
                r.Name, r.Code, r.City, r.Address,
                phone: $"{r.City.GetHashCode() & 0x0FFFFFFF:D8}".Substring(0, 8).PadLeft(8, '0'),
                email: $"{r.Code.ToLowerInvariant()}@falcon.edu.pk",
                principalName: r.Principal,
                maxCapacity: r.Capacity,
                isMainCampus: r.IsMain))
            .ToList();

        if (toAdd.Count > 0)
        {
            context.Campuses.AddRange(toAdd);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} new campuses (roster now: 31).", toAdd.Count);
        }

        // Flip IsMainCampus on the HQ row if not already set.
        var hq = await context.Campuses.FirstOrDefaultAsync(c => c.Code == "MC-01");
        if (hq is not null && !hq.IsMainCampus)
        {
            hq.MarkAsMainCampus();
            await context.SaveChangesAsync();
            logger.LogInformation("Marked {Code} as the Main HQ Campus.", hq.Code);
        }
    }

    private static async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager,
        FamsDbContext context, ILogger logger)
    {
        const string adminEmail = "admin@fams.local";
        if (await userManager.FindByEmailAsync(adminEmail) is not null) return;

        var mainCampus = await context.Campuses.FirstOrDefaultAsync(c => c.Code == "MC-01");

        var admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true,
            FirstName = "System",
            LastName = "Administrator",
            CampusId = mainCampus?.Id ?? Guid.Empty,
            IsActive = true
        };

        var result = await userManager.CreateAsync(admin, "Admin@12345!");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(admin, "SystemAdmin");
            logger.LogInformation("Seeded admin user: {Email}", adminEmail);
        }
        else
        {
            logger.LogError("Failed to seed admin: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }

    private static async Task SeedSampleDataAsync(FamsDbContext context, ILogger logger)
    {
        if (await context.Students.AnyAsync())
        {
            logger.LogInformation("Sample data already seeded — skipping.");
            return;
        }

        var mainCampus = await context.Campuses.FirstOrDefaultAsync(c => c.Code == "MC-01");
        if (mainCampus is null)
        {
            logger.LogWarning("Main campus not found — cannot seed sample data.");
            return;
        }
        var campusId = mainCampus.Id;
        const string seedUser = "system-seed";

        void Stamp(Domain.Common.BaseEntity e)
        {
            e.CampusId = campusId;
            e.CreatedAt = DateTime.UtcNow;
            e.UpdatedAt = DateTime.UtcNow;
            e.CreatedBy = seedUser;
            e.UpdatedBy = seedUser;
        }

        // Programs
        var programs = new[]
        {
            AcademicProgram.Create("Primary",          "PRI", 5, "Class 1 to Class 5"),
            AcademicProgram.Create("Secondary",        "SEC", 5, "Class 6 to Class 10"),
            AcademicProgram.Create("Higher Secondary", "HSC", 2, "FSc / FA"),
        };
        foreach (var p in programs) Stamp(p);
        context.Programs.AddRange(programs);

        // Classrooms (one per program)
        var classes = new[]
        {
            ClassRoom.Create("Class 5", "CL-05", programs[0].Id, 5),
            ClassRoom.Create("Class 9", "CL-09", programs[1].Id, 4),
            ClassRoom.Create("FSc Part 1", "FSC-1", programs[2].Id, 1),
        };
        foreach (var c in classes) Stamp(c);
        context.ClassRooms.AddRange(classes);

        // Sections (A & B per class)
        var sections = new List<Section>();
        foreach (var c in classes)
        {
            var a = Section.Create("A", c.Id, 30);
            var b = Section.Create("B", c.Id, 30);
            Stamp(a); Stamp(b);
            sections.Add(a); sections.Add(b);
        }
        context.Sections.AddRange(sections);

        // Staff
        var staffSeed = new (string fn, string ln, string fa, string cnic, string phone, string email,
            int dobYear, Gender g, int joinYear, string desig, string dept, string qual, decimal salary)[]
        {
            ("Ahmed",   "Khan",    "Yousuf Khan",  "42101-1111111-1", "0301-1111111", "ahmed.khan@falcon.edu.pk",   1978, Gender.Male,   2015, "Principal",       "Administration", "PhD Education", 250000),
            ("Saima",   "Bashir",  "Bashir Ahmad", "42101-2222222-2", "0301-2222222", "saima.bashir@falcon.edu.pk", 1985, Gender.Female, 2018, "Vice Principal",  "Administration", "MA Education",  180000),
            ("Imran",   "Ali",     "Ali Hassan",   "42101-3333333-3", "0301-3333333", "imran.ali@falcon.edu.pk",    1988, Gender.Male,   2019, "Math Teacher",    "Mathematics",    "MSc Math",      85000),
            ("Fatima",  "Sheikh",  "Sheikh Tariq", "42101-4444444-4", "0301-4444444", "fatima.sheikh@falcon.edu.pk",1990, Gender.Female, 2020, "English Teacher", "Languages",      "MA English",    80000),
            ("Bilal",   "Hussain", "Hussain Shah", "42101-5555555-5", "0301-5555555", "bilal.hussain@falcon.edu.pk",1986, Gender.Male,   2017, "Physics Teacher", "Sciences",       "MSc Physics",   90000),
            ("Hira",    "Malik",   "Malik Aslam",  "42101-6666666-6", "0301-6666666", "hira.malik@falcon.edu.pk",   1992, Gender.Female, 2021, "Biology Teacher", "Sciences",       "MSc Biology",   82000),
            ("Usman",   "Raza",    "Raza Khan",    "42101-7777777-7", "0301-7777777", "usman.raza@falcon.edu.pk",   1983, Gender.Male,   2016, "Accountant",      "Finance",        "MBA Finance",   95000),
            ("Nida",    "Tariq",   "Tariq Iqbal",  "42101-8888888-8", "0301-8888888", "nida.tariq@falcon.edu.pk",   1989, Gender.Female, 2018, "HR Officer",      "Human Resources","MBA HR",        78000),
        };
        var staff = staffSeed.Select(s => Staff.Create(
            s.fn, s.ln, s.fa, s.cnic, s.phone, s.email,
            new DateTime(s.dobYear, 6, 15, 0, 0, 0, DateTimeKind.Utc), s.g,
            new DateTime(s.joinYear, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            s.desig, s.dept, s.qual, s.salary)).ToList();
        foreach (var st in staff) Stamp(st);
        context.StaffMembers.AddRange(staff);

        // Students (24)
        var studentSeed = new (string fn, string ln, string father, int yob, Gender g, string phone)[]
        {
            ("Ali",     "Raza",      "Raza Hussain",   2014, Gender.Male,   "0321-1110001"),
            ("Sara",    "Khan",      "Yusuf Khan",     2014, Gender.Female, "0321-1110002"),
            ("Bilal",   "Ahmed",     "Ahmed Sheikh",   2014, Gender.Male,   "0321-1110003"),
            ("Ayesha",  "Tariq",     "Tariq Mahmood",  2014, Gender.Female, "0321-1110004"),
            ("Hamza",   "Iqbal",     "Iqbal Hussain",  2014, Gender.Male,   "0321-1110005"),
            ("Maryam",  "Saeed",     "Saeed Anwar",    2014, Gender.Female, "0321-1110006"),
            ("Zain",    "Akhtar",    "Akhtar Munir",   2014, Gender.Male,   "0321-1110007"),
            ("Iqra",    "Naveed",    "Naveed Khan",    2014, Gender.Female, "0321-1110008"),
            ("Omar",    "Farooq",    "Farooq Ahmad",   2010, Gender.Male,   "0321-1110009"),
            ("Hina",    "Aslam",     "Aslam Sheikh",   2010, Gender.Female, "0321-1110010"),
            ("Talha",   "Shahid",    "Shahid Hussain", 2010, Gender.Male,   "0321-1110011"),
            ("Rabia",   "Yousaf",    "Yousaf Ali",     2010, Gender.Female, "0321-1110012"),
            ("Hassan",  "Mehmood",   "Mehmood Khan",   2010, Gender.Male,   "0321-1110013"),
            ("Sania",   "Bukhari",   "Bukhari Sayed",  2010, Gender.Female, "0321-1110014"),
            ("Awais",   "Latif",     "Latif Khan",     2010, Gender.Male,   "0321-1110015"),
            ("Mahnoor", "Javed",     "Javed Iqbal",    2010, Gender.Female, "0321-1110016"),
            ("Daniyal", "Qureshi",   "Qureshi Asif",   2007, Gender.Male,   "0321-1110017"),
            ("Anaya",   "Hashmi",    "Hashmi Tariq",   2007, Gender.Female, "0321-1110018"),
            ("Rehan",   "Siddiqui",  "Siddiqui Anwar", 2007, Gender.Male,   "0321-1110019"),
            ("Zara",    "Mansoor",   "Mansoor Ali",    2007, Gender.Female, "0321-1110020"),
            ("Saad",    "Pervaiz",   "Pervaiz Ahmad",  2007, Gender.Male,   "0321-1110021"),
            ("Komal",   "Rashid",    "Rashid Khan",    2007, Gender.Female, "0321-1110022"),
            ("Faraz",   "Ibrahim",   "Ibrahim Yusuf",  2007, Gender.Male,   "0321-1110023"),
            ("Laiba",   "Shah",      "Shah Mahmood",   2007, Gender.Female, "0321-1110024"),
        };

        var students = new List<Student>();
        for (int i = 0; i < studentSeed.Length; i++)
        {
            var s = studentSeed[i];
            // 8 per class → first 8 in Class5, next 8 in Class9, last 8 in FSc
            var classIdx = i / 8;
            var sectionIdx = classIdx * 2 + (i % 2); // alternate A/B
            var classRoom = classes[classIdx];
            var section = sections[sectionIdx];
            var programId = classRoom.ProgramId;
            var roll = $"{DateTime.UtcNow:yy}-{(i + 1):D4}";

            var student = Student.Create(
                s.fn, s.ln, s.father,
                new DateTime(s.yob, 5, 10, 0, 0, 0, DateTimeKind.Utc), s.g,
                "House 12, Street 5, Karachi", s.phone,
                programId, classRoom.Id, section.Id,
                roll, $"{s.father}", s.phone);
            Stamp(student);
            students.Add(student);
        }
        context.Students.AddRange(students);

        // Fee invoices — mix of statuses
        var today = DateTime.UtcNow.Date;
        var invoices = new List<FeeInvoice>();
        var rnd = new Random(42);
        for (int i = 0; i < students.Count; i++)
        {
            var student = students[i];
            var fee = 15000m + (i % 3) * 5000m; // 15k / 20k / 25k
            var invoice = FeeInvoice.Create(
                student.Id, $"INV-{DateTime.UtcNow:yyyy}-{(i + 1):D4}",
                today.AddDays(-15), today.AddDays(15),
                fee, "Spring2026");
            Stamp(invoice);

            // Pattern: ~40% Paid, ~30% PartiallyPaid, ~30% Pending
            var r = rnd.NextDouble();
            if (r < 0.4) invoice.ApplyPayment(fee);
            else if (r < 0.7) invoice.ApplyPayment(fee * 0.5m);
            // else: leave as Pending
            invoices.Add(invoice);
        }
        context.FeeInvoices.AddRange(invoices);

        // Today's attendance for first 16 students (skip last 8 for "absent today" variety)
        var attendances = new List<Attendance>();
        var markedBy = staff[0].Id; // principal
        for (int i = 0; i < students.Count; i++)
        {
            var present = i % 5 != 0; // 1 in 5 absent
            var att = Attendance.CreateForStudent(students[i].Id, today, present, isLate: i % 7 == 0, markedBy);
            Stamp(att);
            attendances.Add(att);
        }
        context.Attendances.AddRange(attendances);

        await context.SaveChangesAsync();
        logger.LogInformation(
            "Sample data seeded: {Programs} programs, {Classes} classes, {Sections} sections, {Staff} staff, {Students} students, {Invoices} invoices, {Attendances} attendance records.",
            programs.Length, classes.Length, sections.Count, staff.Count, students.Count, invoices.Count, attendances.Count);
    }
}
