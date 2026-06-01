require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const bcrypt = require("bcryptjs");
const { PrismaClient, Role } = require("../frontend/node_modules/@prisma/client");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "osmandtholley@gmail.com";
const ADMIN_PASSWORD = "osmanT";

async function purgeUserData() {
  await prisma.attendance.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.courseStudent.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aiChatHistory.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.video.deleteMany();
  await prisma.lectureNote.deleteMany();
  await prisma.discussion.deleteMany();
  await prisma.liveClass.deleteMany();
  await prisma.course.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.admittedStudent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.lecturer.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await purgeUserData();

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const adminUser = await prisma.user.create({
    data: {
      fullName: "Osman Tholley",
      email: ADMIN_EMAIL,
      role: Role.ADMIN,
      password: passwordHash,
      isActive: true,
    },
  });

  await prisma.admin.create({
    data: {
      userId: adminUser.id,
      adminLevel: "SUPER",
    },
  });

  const catalog = [
    {
      departmentName: "Computing Sciences",
      programs: ["BSc Computer Science", "BSc Information Technology"],
    },
    {
      departmentName: "Public Health",
      programs: ["BSc Public Health", "BSc Community Health"],
    },
    {
      departmentName: "Business",
      programs: ["BSc Accounting", "BSc Business Administration"],
    },
    {
      departmentName: "Agriculture",
      programs: ["BSc Agriculture", "BSc Agribusiness"],
    },
    {
      departmentName: "Mass Communication",
      programs: ["BSc Mass Communication", "BSc Journalism"],
    },
  ];

  for (const entry of catalog) {
    const department = await prisma.department.create({
      data: { departmentName: entry.departmentName },
    });
    for (const programName of entry.programs) {
      await prisma.program.create({
        data: {
          departmentId: department.id,
          programName,
          duration: "4 years",
        },
      });
    }
  }

  console.log("Seed completed successfully.");
  console.log("Admin email:", ADMIN_EMAIL);
  console.log("All other users removed. Add students and lecturers via the admin portal.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
