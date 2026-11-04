import { QuizEditorView } from '@/views/quiz-editor';

export default async function QuizEditorPage({
  params,
}: {
  params: Promise<{
    institutionId: string;
    offeringId: string;
    spaceId: string;
    quizId: string;
  }>;
}) {
  const { institutionId, offeringId, spaceId, quizId } = await params;

  return (
    <QuizEditorView
      institutionId={institutionId}
      offeringId={offeringId}
      spaceId={spaceId}
      quizId={quizId}
    />
  );
}
