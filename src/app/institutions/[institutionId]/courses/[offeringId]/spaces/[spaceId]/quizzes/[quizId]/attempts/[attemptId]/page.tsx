import { QuizAttemptView } from '@/views/quiz-attempt';

export default async function QuizAttemptPage({
  params,
}: {
  params: Promise<{
    institutionId: string;
    offeringId: string;
    spaceId: string;
    quizId: string;
    attemptId: string;
  }>;
}) {
  const { institutionId, offeringId, spaceId, quizId, attemptId } = await params;

  return (
    <QuizAttemptView
      institutionId={institutionId}
      offeringId={offeringId}
      spaceId={spaceId}
      quizId={quizId}
      attemptId={attemptId}
    />
  );
}
