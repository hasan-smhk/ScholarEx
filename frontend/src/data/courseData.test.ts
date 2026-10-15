import { BOARD_CLASS_DATA, CourseBoard, CourseLevel } from './courseData';

const expectedLevels: CourseLevel[] = [
  'Primary',
  'Primary',
  'Primary',
  'Primary',
  'Primary',
  'Secondary',
  'Secondary',
  'Secondary',
  'Pre-Board',
  'Board Exam',
];

describe('board class catalog', () => {
  it.each(Object.keys(BOARD_CLASS_DATA) as CourseBoard[])(
    'provides Classes 1–10 and level metadata for %s',
    (board) => {
      const classes = BOARD_CLASS_DATA[board];

      expect(classes).toHaveLength(10);
      expect(classes.map(({ level }) => level)).toEqual(expectedLevels);
      expect(classes.map(({ name }) => name)).toEqual(
        Array.from({ length: 10 }, (_, index) => `Class ${index + 1}`),
      );
    },
  );

  it('provides Kannada and English content for Karnataka State Board', () => {
    const [firstClass] = BOARD_CLASS_DATA['State Board'];

    expect(firstClass.kannadaName).toBe('ತರಗತಿ 1');
    expect(firstClass.subjects.English).toContain('Kannada');
    expect(firstClass.subjects.Kannada).toContain('ಕನ್ನಡ');
    expect(firstClass.description.English).not.toBe(firstClass.description.Kannada);
  });
});
