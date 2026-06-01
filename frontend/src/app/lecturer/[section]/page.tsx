import { PortalPage } from "@/components/portal-page";

export default async function LecturerSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <PortalPage role="lecturer" section={section} />;
}
