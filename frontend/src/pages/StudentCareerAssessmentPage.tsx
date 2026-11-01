import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getMyCareerAssessment,
  saveMyCareerAssessment,
  StudentCareerAssessment,
} from '../services/api';

type AssessmentForm = Omit<StudentCareerAssessment, 'id' | 'report' | 'reportEmailSentAt'>;

const emptyAssessment: AssessmentForm = {
  studentClass: '',
  schoolCollege: '',
  phoneNumber: '',
  educationBoard: '',
  academicPerformance: '',
  strongSubjects: '',
  dislikedSubjects: '',
  hobbies: '',
  strengths: '',
  improvementAreas: '',
  coursesOfInterest: '',
  learningStyle: '',
  likes: '',
  dislikes: '',
  careerGoal: '',
  parentsAspiration: '',
};

const textFields: Array<{ name: keyof AssessmentForm; label: string; placeholder: string; required?: boolean }> = [
  { name: 'studentClass', label: 'Class / current level', placeholder: 'For example, Class IX or first-year college', required: true },
  { name: 'schoolCollege', label: 'School or college', placeholder: 'Your school or college name', required: true },
  { name: 'phoneNumber', label: 'Phone number', placeholder: 'A number to contact you', required: true },
  { name: 'educationBoard', label: 'Education board / academic background', placeholder: 'For example, ICSE, CBSE, or Karnataka State Board', required: true },
  { name: 'academicPerformance', label: 'Academic background and performance', placeholder: 'Describe your recent academic performance', required: true },
  { name: 'strongSubjects', label: 'Subjects you like or score well in', placeholder: 'List the subjects you enjoy or do well in' },
  { name: 'dislikedSubjects', label: 'Subjects you dislike or find difficult', placeholder: 'List subjects you would like support with' },
  { name: 'hobbies', label: 'Favorite hobbies and talents', placeholder: 'For example, art, music, sports, or other talents' },
  { name: 'strengths', label: 'Known strengths', placeholder: 'For example, creative, analytical, or communication skills' },
  { name: 'improvementAreas', label: 'Skills or areas you would like to improve', placeholder: 'For example, memory, confidence, or social skills' },
  { name: 'coursesOfInterest', label: 'Courses or learning you are interested in', placeholder: 'List any courses or subjects you want to explore' },
  { name: 'likes', label: 'Likes and activities you enjoy', placeholder: 'For example, design, arts, crafts, or puzzles' },
  { name: 'dislikes', label: 'Dislikes or activities you prefer to avoid', placeholder: 'Share anything you do not enjoy, if any' },
  { name: 'careerGoal', label: 'Your favorite profession or career goal', placeholder: 'Share a goal, or leave blank if you are still exploring' },
  { name: 'parentsAspiration', label: 'Your parents’ career aspiration for you', placeholder: 'Optional' },
];

export default function StudentCareerAssessmentPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<AssessmentForm>(emptyAssessment);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    getMyCareerAssessment(token)
      .then(({ data }) => {
        if (!active || !data) return;
        if (data.report) {
          navigate('/counselors', { replace: true });
          return;
        }
        const { id: _id, report: _report, reportEmailSentAt: _sent, ...answers } = data;
        setForm(answers);
      })
      .catch((requestError: any) => {
        if (active) setError(requestError.response?.data?.error || 'Could not load your assessment.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await saveMyCareerAssessment(form, token);
      navigate(data.alreadyGenerated ? '/counselors' : '/my-career-report');
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Could not generate your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="flex min-h-[65vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-teal-700" /></main>;
  }

  return (
    <main className="scholar-page min-h-screen px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 rounded-3xl bg-gradient-to-br from-teal-900 to-cyan-800 p-7 text-white sm:p-10">
          <div className="flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-teal-200" />
            <p className="text-sm font-bold uppercase tracking-widest text-teal-100">Free AI student report</p>
          </div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Start with your interests and strengths</h1>
          <p className="mt-3 max-w-2xl leading-7 text-white/80">
            Share your academic background, strengths, and goals to create a free ScholarEx career guidance report.
            No counseling session or payment is required.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <section>
            <h2 className="text-xl font-black text-slate-900">Personal and academic details</h2>
            <p className="mt-1 text-sm text-slate-600">Your account email will be used to deliver your report.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Student name</label>
                <input value={user?.name || ''} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Email address</label>
                <input value={user?.email || ''} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600" />
              </div>
              {textFields.slice(0, 5).map((field) => (
                <div key={field.name} className={field.name === 'academicPerformance' ? 'sm:col-span-2' : ''}>
                  <label htmlFor={field.name} className="mb-1.5 block text-sm font-bold text-slate-700">
                    {field.label}{field.required ? ' *' : ''}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    value={form[field.name]}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder}
                    required={field.required}
                    maxLength={2000}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900">Strengths, learning, and interests</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {textFields.slice(5).map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="mb-1.5 block text-sm font-bold text-slate-700">{field.label}</label>
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={form[field.name]}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder}
                    maxLength={2000}
                    rows={3}
                    className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              ))}
              <div>
                <label htmlFor="learningStyle" className="mb-1.5 block text-sm font-bold text-slate-700">Preferred learning style</label>
                <select
                  id="learningStyle"
                  value={form.learningStyle}
                  onChange={(event) => setForm((current) => ({ ...current, learningStyle: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">Select if known</option>
                  {['Visual', 'Auditory', 'Mathematical / Logical', 'Social', 'Physical', 'Verbal', 'Intrapersonal', 'Not sure'].map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <p className="text-xs leading-5 text-slate-500">
            This report is exploratory guidance, not a diagnosis or a final career decision. Do not enter sensitive information such as passwords or financial details.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-4 font-bold text-white hover:bg-teal-900 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Generating your free report…</> : <><Sparkles className="h-5 w-5" /> Generate my free report</>}
          </button>
        </form>
      </div>
    </main>
  );
}
