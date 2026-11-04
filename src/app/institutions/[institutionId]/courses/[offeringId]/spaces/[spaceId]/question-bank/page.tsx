import { QuestionBankView } from '@/views/question-bank';

export default async function QuestionBankPage({
  params,
}: {
  params: Promise<{ institutionId: string; offeringId: string; spaceId: string }>;
}) {
  const { institutionId, offeringId, spaceId } = await params;

  return (
    <QuestionBankView
      institutionId={institutionId}
      offeringId={offeringId}
      spaceId={spaceId}
    />
  );
}
