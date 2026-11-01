export const COUNSELING_CHECKLIST_QUESTION_IDS = [
  'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10',
  'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10',
  'c1', 'c2', 'c3', 'c4', 'c5', 'c6',
  'd1', 'd2', 'd3', 'd4',
] as const;

export const AI_SAFE_COUNSELING_CHECKLIST_QUESTION_IDS = [
  'a1', 'a4', 'a5', 'a6', 'a8', 'a9', 'a10',
  'b1', 'b2', 'b5', 'b6', 'b8', 'b9', 'b10',
  'c1', 'c2', 'c6',
] as const;

export function isCompleteCounselingChecklist(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const answers = value as Record<string, unknown>;
  return COUNSELING_CHECKLIST_QUESTION_IDS.every(
    (id) => {
      const answer = answers[id];
      return typeof answer === 'string' && answer.trim().length > 0 && answer.length <= 3000;
    }
  ) && Object.keys(answers).every((id) =>
    COUNSELING_CHECKLIST_QUESTION_IDS.includes(id as (typeof COUNSELING_CHECKLIST_QUESTION_IDS)[number])
  );
}
