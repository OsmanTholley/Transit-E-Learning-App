import { redirect } from "next/navigation";

export default function StudentsIndexPage() {
  redirect("/admin/students/all");
}
