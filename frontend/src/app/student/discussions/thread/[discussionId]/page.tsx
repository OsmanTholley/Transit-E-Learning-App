import { DiscussionThreadPage } from "@/components/student/discussions/discussion-thread-page";

export default async function DiscussionThreadRoute({
  params,
}: {
  params: Promise<{ discussionId: string }>;
}) {
  const { discussionId } = await params;
  return <DiscussionThreadPage discussionId={discussionId} />;
}
