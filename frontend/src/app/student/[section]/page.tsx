import { PortalPage } from "@/components/portal-page";

export default async function StudentSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <PortalPage role="student" section={section} />;
}
