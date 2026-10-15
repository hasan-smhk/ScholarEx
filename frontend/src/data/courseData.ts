export type Page = "Home" | "CBSE" | "ICSE" | "State Board" | "Counselling Session" | "Skill Development";

export interface Course {
  id: number;
  board: string;
  level: string;
  title: string;
  instructor: string;
  description: string;
  price?: string;
}

export type CourseBoard = "CBSE" | "ICSE" | "State Board";
export type CourseLevel = "Primary" | "Secondary" | "Pre-Board" | "Board Exam";
export type CourseLanguage = "English" | "Kannada";

export interface BoardClass {
  name: string;
  kannadaName?: string;
  level: CourseLevel;
  subjects: Record<CourseLanguage, string[]>;
  description: Record<CourseLanguage, string>;
}

interface LevelContent {
  subjects: Record<CourseLanguage, string[]>;
  description: Record<CourseLanguage, string>;
}

const createBoardClasses = (
  levels: Record<CourseLevel, LevelContent>,
  includeKannadaNames = false,
): BoardClass[] =>
  Array.from({ length: 10 }, (_, index) => {
    const classNumber = index + 1;
    const level: CourseLevel =
      classNumber <= 5
        ? "Primary"
        : classNumber <= 8
          ? "Secondary"
          : classNumber === 9
            ? "Pre-Board"
            : "Board Exam";
    const content = levels[level];

    return {
      name: `Class ${classNumber}`,
      ...(includeKannadaNames && { kannadaName: `ತರಗತಿ ${classNumber}` }),
      level,
      subjects: content.subjects,
      description: content.description,
    };
  });

const englishContent = (
  subjects: string[],
  description: string,
): LevelContent => ({
  subjects: { English: subjects, Kannada: subjects },
  description: { English: description, Kannada: description },
});

export const BOARD_CLASS_DATA: Record<CourseBoard, BoardClass[]> = {
  CBSE: createBoardClasses({
    Primary: englishContent(
      ["English", "Mathematics", "EVS", "Hindi", "General Knowledge"],
      "Build confident foundations in literacy, numeracy, and curiosity through engaging, age-appropriate learning.",
    ),
    Secondary: englishContent(
      ["English", "Mathematics", "Science", "Social Science", "Hindi"],
      "Strengthen subject understanding with structured lessons, practice, and connections to everyday life.",
    ),
    "Pre-Board": englishContent(
      ["English", "Mathematics", "Science", "Social Science", "Computer Science"],
      "Prepare for board-level study with focused revision, problem-solving practice, and a clear study plan.",
    ),
    "Board Exam": englishContent(
      ["English", "Mathematics", "Science", "Social Science", "Computer Science"],
      "Review the complete CBSE syllabus and build exam readiness with guided practice and revision.",
    ),
  }),
  ICSE: createBoardClasses({
    Primary: englishContent(
      ["English", "Mathematics", "EVS", "Hindi", "General Knowledge"],
      "Develop strong language and numeracy skills through a broad, well-rounded primary curriculum.",
    ),
    Secondary: englishContent(
      ["English", "Mathematics", "Science", "Social Science", "Hindi"],
      "Explore each subject in depth and develop the analytical skills needed for the ICSE curriculum.",
    ),
    "Pre-Board": englishContent(
      ["English", "Mathematics", "Science", "Social Science", "Computer Applications"],
      "Build confidence with syllabus-focused revision, written practice, and board-style questions.",
    ),
    "Board Exam": englishContent(
      ["English", "Mathematics", "Science", "Social Science", "Computer Applications"],
      "Prepare for the ICSE board examination with comprehensive revision and exam-focused practice.",
    ),
  }),
  "State Board": createBoardClasses({
    Primary: {
      subjects: {
        English: ["Kannada", "English", "Mathematics", "EVS"],
        Kannada: ["ಕನ್ನಡ", "ಆಂಗ್ಲ", "ಗಣಿತ", "ಪರಿಸರ ಅಧ್ಯಯನ"],
      },
      description: {
        English: "Build early literacy, numeracy, and environmental awareness with Kannada and English language support.",
        Kannada: "ಕನ್ನಡ ಮತ್ತು ಆಂಗ್ಲ ಭಾಷಾ ಬೆಂಬಲದೊಂದಿಗೆ ಓದು, ಗಣಿತ ಮತ್ತು ಪರಿಸರ ಜ್ಞಾನಕ್ಕೆ ಭದ್ರ ಅಡಿಪಾಯ ನಿರ್ಮಿಸಿ.",
      },
    },
    Secondary: {
      subjects: {
        English: ["Kannada", "English", "Mathematics", "Science", "Social Science"],
        Kannada: ["ಕನ್ನಡ", "ಆಂಗ್ಲ", "ಗಣಿತ", "ವಿಜ್ಞಾನ", "ಸಮಾಜ ವಿಜ್ಞಾನ"],
      },
      description: {
        English: "Strengthen core concepts across languages, mathematics, science, and social science.",
        Kannada: "ಭಾಷೆಗಳು, ಗಣಿತ, ವಿಜ್ಞಾನ ಮತ್ತು ಸಮಾಜ ವಿಜ್ಞಾನದಲ್ಲಿ ಮೂಲಭೂತ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಬಲಪಡಿಸಿ.",
      },
    },
    "Pre-Board": {
      subjects: {
        English: ["Kannada", "English", "Mathematics", "Science", "Social Science"],
        Kannada: ["ಕನ್ನಡ", "ಆಂಗ್ಲ", "ಗಣಿತ", "ವಿಜ್ಞಾನ", "ಸಮಾಜ ವಿಜ್ಞಾನ"],
      },
      description: {
        English: "Get ready for SSLC-level learning with focused revision and practice across core subjects.",
        Kannada: "ಮುಖ್ಯ ವಿಷಯಗಳ ಪುನರವಲೋಕನ ಮತ್ತು ಅಭ್ಯಾಸದೊಂದಿಗೆ ಎಸ್‌ಎಸ್‌ಎಲ್‌ಸಿ ಕಲಿಕೆಗೆ ಸಿದ್ಧರಾಗಿ.",
      },
    },
    "Board Exam": {
      subjects: {
        English: ["Kannada", "English", "Mathematics", "Science", "Social Science"],
        Kannada: ["ಕನ್ನಡ", "ಆಂಗ್ಲ", "ಗಣಿತ", "ವಿಜ್ಞಾನ", "ಸಮಾಜ ವಿಜ್ಞಾನ"],
      },
      description: {
        English: "Review the Karnataka State Board syllabus and prepare for SSLC exams with guided practice.",
        Kannada: "ಮಾರ್ಗದರ್ಶಿತ ಅಭ್ಯಾಸದೊಂದಿಗೆ ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪಠ್ಯಕ್ರಮವನ್ನು ಪುನರವಲೋಕನ ಮಾಡಿ ಎಸ್‌ಎಸ್‌ಎಲ್‌ಸಿ ಪರೀಕ್ಷೆಗೆ ಸಿದ್ಧರಾಗಿ.",
      },
    },
  }, true),
};

export interface Section {
  title: string;
  copy: string;
  icon: string;
}

export interface Session {
  id: number;
  student: string;
  class: string;
  topic: string;
  date: string;
}

export const navItems: Page[] = ["Counselling Session", "CBSE", "ICSE", "State Board", "Skill Development"];

export const courses: Course[] = [
  {
    id: 1,
    board: "CBSE",
    level: "Class 9",
    title: "Foundations of Mathematics",
    instructor: "Dr. Sharma",
    description: "Build numerical confidence with concept mastery and guided practice.",
    price: "₹799",
  },
  {
    id: 2,
    board: "ICSE",
    level: "Class 10",
    title: "ICSE English Mastery",
    instructor: "Ajay Reddy",
    description: "Improve writing, comprehension, and exam strategies for ICSE English.",
    price: "₹899",
  },
  {
    id: 3,
    board: "State Board",
    level: "Class 11",
    title: "State Board Science - Karnataka",
    instructor: "Priya Nair",
    description: "Strong fundamentals in science with local board-aligned guidance and revision support.",
    price: "₹849",
  },
  {
    id: 4,
    board: "Skill Development",
    level: "Beginner",
    title: "Intro to Python for Beginners",
    instructor: "Vikram Joshi",
    description: "Start coding with practical Python projects and beginner-friendly lessons.",
    price: "₹999",
  },
  {
    id: 5,
    board: "CBSE",
    level: "Class 10",
    title: "CBSE Class 10 Mathematics – Mastery",
    instructor: "Asha Sharma",
    description: "Master core CBSE maths concepts with exam-focused problem solving.",
    price: "₹999",
  },
  {
    id: 6,
    board: "CBSE",
    level: "Class 12",
    title: "CBSE Class 12 Physics – Conceptual",
    instructor: "Ravi Kulkarni",
    description: "Develop conceptual clarity and score better with high-yield practice sets.",
    price: "₹1099",
  },
  {
    id: 7,
    board: "ICSE",
    level: "Class 12",
    title: "ICSE Class 12 Biology - Exam Practice",
    instructor: "Neha Mishra",
    description: "Practice diagrams, long answers, and board-style assessments with expert feedback.",
    price: "₹949",
  },
  {
    id: 8,
    board: "Skill Development",
    level: "Beginner",
    title: "Foundations of UX Design",
    instructor: "Priya Nair",
    description: "Learn user research, wireframes, and design thinking for modern digital products.",
    price: "₹799",
  },
];

export const sections: Section[] = [
  { title: "Counselling Session", copy: "One-on-one guidance for subject selection and exam planning.", icon: "💬" },
  { title: "CBSE", copy: "Comprehensive lessons and practice for CBSE syllabus.", icon: "📚" },
  { title: "ICSE", copy: "In-depth explanations and curated practice questions.", icon: "📖" },
  { title: "State Board", copy: "Localized syllabus, exam strategies, and sample papers.", icon: "🎯" },
  { title: "Skill Development", copy: "Career-focused skills like coding, communication, and design.", icon: "🚀" },
];

export const sessions: Session[] = [
  { id: 1, student: "Asha Sharma", class: "Class 10", topic: "Board selection & subject planning", date: "2024-10-05" },
  { id: 2, student: "Ravi Kulkarni", class: "Class 11", topic: "Career guidance – Science vs Commerce", date: "2024-10-06" },
  { id: 3, student: "Neha Mishra", class: "Class 9", topic: "Academic planning for CBSE", date: "2024-10-07" },
  { id: 4, student: "Vikram Joshi", class: "Class 12", topic: "JEE preparation strategy", date: "2024-10-08" },
  { id: 5, student: "Priya Nair", class: "Class 11", topic: "NEET vs JEE - choosing a path", date: "2024-10-09" },
];
