import { StudentProfilePage } from "@/components/student-management/pages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentProfilePage id={id} />;
}
