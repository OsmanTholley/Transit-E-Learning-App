import { redirect } from "next/navigation";

/** Legacy admin nav path → live classroom dashboard */
export default function AdminLiveClassesRedirectPage() {
  redirect("/admin/live-classroom");
}
