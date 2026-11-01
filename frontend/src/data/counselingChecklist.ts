export interface CounselingChecklistQuestion {
  id: string;
  text: string;
}

export interface CounselingChecklistSection {
  title: string;
  questions: CounselingChecklistQuestion[];
}

export const COUNSELING_CHECKLIST: CounselingChecklistSection[] = [
  {
    title: 'Section A',
    questions: [
      { id: 'a1', text: 'How will you Achieve your Goal' },
      { id: 'a2', text: 'Your 3 Strengths you are proud of!' },
      { id: 'a3', text: 'Your 3 Weakness you feel bad about!' },
      { id: 'a4', text: 'Which is your Favourite Subjects & Why?' },
      { id: 'a5', text: 'Is Mathematics a subject of Learning or Understanding' },
      { id: 'a6', text: 'You Study to acquire knowledge or to obtain high Marks' },
      { id: 'a7', text: 'Tell us about your Brother, Sister, Name, Age, Studying and How do you describe them' },
      { id: 'a8', text: 'Randomly Write the subjects which you like the Most to the least interested subjects' },
      { id: 'a9', text: 'Do you take Tuitions? Which Subjects' },
      { id: 'a10', text: 'In a day how many hours do you study?' },
    ],
  },
  {
    title: 'Section B',
    questions: [
      { id: 'b1', text: 'which is your favourite sports & Why?' },
      { id: 'b2', text: 'According to you how important it is to have English Grammar correct' },
      { id: 'b3', text: 'What do you get Praised for most often' },
      { id: 'b4', text: 'Are you willing to take Major risk in life' },
      { id: 'b5', text: 'Write down 2 strong talents that you have?' },
      { id: 'b6', text: 'Usually how do you prepare for your Exams' },
      { id: 'b7', text: 'What goals do your parents have for you and Why?' },
      { id: 'b8', text: 'Ten years from now where do you want to see yourself?' },
      { id: 'b9', text: 'What is your AIM in life?' },
      { id: 'b10', text: 'How are you Planning to reach your goals/aims' },
    ],
  },
  {
    title: 'Section C',
    questions: [
      { id: 'c1', text: 'How confident are you obtaining your goals' },
      { id: 'c2', text: 'How Much do these distract you while studying' },
      { id: 'c3', text: 'Tell us about your one good friend and his / her qualities' },
      { id: 'c4', text: 'Write one incident in school/college which you recall the most' },
      { id: 'c5', text: 'Is there anyone your ROLE MODEL? Describe' },
      { id: 'c6', text: 'Do you read newspapers or any other books or Magazines? Name them' },
    ],
  },
  {
    title: 'Section D',
    questions: [
      { id: 'd1', text: 'How good and open is your communication with the following: Class Teacher, Mom, Dad, Best Friend, Sister/Brother, Others' },
      { id: 'd2', text: 'How Strong are these emotions in you Generally: Boredom, Happiness, Sadness, Irritation, Anger, Fear, Restlessness, Anxiety, Worry' },
      { id: 'd3', text: 'How often and how much do you feel angry with the following: Classmate, Best Friend, Yourself, Mom/Dad, Teachers, Education System' },
      { id: 'd4', text: 'How much do you use each of these methods to express anger: Crying, Shouting, Destructive Behavior, Sulking, By Banging doors, Abusive Language' },
    ],
  },
];
