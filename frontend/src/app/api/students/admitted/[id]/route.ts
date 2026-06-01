import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;

    const admitted = await prisma.admittedStudent.findUnique({ where: { id } });
    if (!admitted) {
      return NextResponse.json({ error: "Admitted student not found." }, { status: 404 });
    }

    if (admitted.registeredAt) {
      return NextResponse.json(
        { error: "Cannot remove a student who has already registered." },
        { status: 400 },
      );
    }

    await prisma.admittedStudent.delete({ where: { id } });

    return NextResponse.json({ message: "Removed from admitted registry." });
  } catch (error) {
    console.error("DELETE /api/students/admitted/[id]:", error);
    return NextResponse.json({ error: "Failed to remove admitted student." }, { status: 500 });
  }
}
