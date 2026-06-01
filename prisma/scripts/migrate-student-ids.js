/**
 * Migrates all student_id values to TCSL/001, TCSL/002, … ordered by created_at.
 * Run: node prisma/scripts/migrate-student-ids.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const { PrismaClient } = require("../../frontend/node_modules/@prisma/client");

const prisma = new PrismaClient();
const PREFIX = "TCSL/";

function formatId(sequence) {
  return `${PREFIX}${String(sequence).padStart(3, "0")}`;
}

async function main() {
  const students = await prisma.student.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, studentId: true },
  });

  if (students.length === 0) {
    console.log("No students to migrate.");
    return;
  }

  const used = new Set();
  let sequence = 1;

  for (const student of students) {
    let nextId = formatId(sequence);
    while (used.has(nextId)) {
      sequence += 1;
      nextId = formatId(sequence);
    }

    if (student.studentId !== nextId) {
      await prisma.student.update({
        where: { id: student.id },
        data: { studentId: nextId },
      });
      console.log(`Updated ${student.studentId} → ${nextId}`);
    } else {
      console.log(`Already correct: ${nextId}`);
    }

    used.add(nextId);
    sequence += 1;
  }

  console.log(`Migrated ${students.length} student ID(s) to ${PREFIX}### format.`);
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
