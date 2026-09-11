export { examRegistrationMutations, examTermQueries } from './api/exam-term-queries';
export {
  actionableExamTerms,
  canActOnExamTerm,
  examTermBlockedNote,
  type ExamRegistrationReason,
} from './model/exam-term-filter';
export {
  examRegistrationLabel,
  examSeatsLabelKey,
  isRegistered,
  splitExamTerms,
  type ExamRegistrationLabel,
  type ExamRegistrationState,
  type ExamTerm,
  type ExamTermKind,
  type ExamTermSplit,
} from './model/exam-term';
export { ExamTermCard } from './ui/exam-term-card';
