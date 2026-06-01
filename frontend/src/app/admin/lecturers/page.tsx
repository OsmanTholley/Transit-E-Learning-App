import { redirect } from "next/navigation";

export default function LecturersIndexPage() {
  redirect("/admin/lecturers/all");
}
