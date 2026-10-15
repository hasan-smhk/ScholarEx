import {
  Atom,
  BookOpen,
  Calculator,
  FlaskConical,
  Languages,
  Laptop,
  Microscope,
  Palette,
  type LucideIcon,
} from 'lucide-react';

const subjectIcons: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /\b(math(?:s|ematics)?|algebra|geometry|calculus)\b/i, icon: Calculator },
  { match: /\b(physics|chemistry)\b/i, icon: Atom },
  { match: /\b(biology|life science)\b/i, icon: Microscope },
  { match: /\b(science)\b/i, icon: FlaskConical },
  { match: /\b(english|language|literature|kannada|hindi)\b/i, icon: Languages },
  { match: /\b(computer|coding|programming|technology)\b/i, icon: Laptop },
  { match: /\b(art|design|drawing)\b/i, icon: Palette },
];

export default function SubjectIcon({
  title,
  className = 'h-8 w-8',
}: {
  title: string;
  className?: string;
}) {
  const Icon = subjectIcons.find(({ match }) => match.test(title))?.icon ?? BookOpen;

  return <Icon aria-hidden="true" className={className} />;
}
