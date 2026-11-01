import { COUNSELING_CHECKLIST } from './counselingChecklist';

describe('counselor session checklist', () => {
  it('retains the four reference sections and all 30 questions', () => {
    expect(COUNSELING_CHECKLIST.map((section) => section.title)).toEqual([
      'Section A',
      'Section B',
      'Section C',
      'Section D',
    ]);
    expect(COUNSELING_CHECKLIST.map((section) => section.questions.length)).toEqual([10, 10, 6, 4]);
    expect(new Set(COUNSELING_CHECKLIST.flatMap((section) =>
      section.questions.map((question) => question.id)
    )).size).toBe(30);
  });
});
