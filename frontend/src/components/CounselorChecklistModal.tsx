import { useState } from 'react';
import type { FormEvent } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { COUNSELING_CHECKLIST } from '../data/counselingChecklist';
import { saveCounselingSessionChecklist } from '../services/api';

interface CounselorChecklistModalProps {
  booking: {
    id: string;
    student: { name: string };
    slot: { date: string };
    sessionChecklistAnswers: Record<string, string> | null;
  };
  token: string;
  onClose: () => void;
  onSaved: (answers: Record<string, string>, completedAt: string) => Promise<void>;
}

export default function CounselorChecklistModal({
  booking,
  token,
  onClose,
  onSaved,
}: CounselorChecklistModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    booking.sessionChecklistAnswers || {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function saveAnswers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (COUNSELING_CHECKLIST.some((section) =>
      section.questions.some((question) => !answers[question.id]?.trim())
    )) {
      setError('Complete every question before saving the checklist.');
      return;
    }

    try {
      setSaving(true);
      const { data } = await saveCounselingSessionChecklist(booking.id, answers, token);
      await onSaved(data.sessionChecklistAnswers, data.sessionChecklistCompletedAt);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.error ||
        requestError.message ||
        'Could not save the checklist and generate the AI report.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="counselor-checklist-title"
        className="scholar-panel-card max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-5 sm:p-6">
          <div>
            <h2 id="counselor-checklist-title" className="text-xl font-black text-gray-900">
              Counselor session checklist
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {booking.student.name} · {new Date(booking.slot.date).toLocaleDateString('en-IN')}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close checklist" className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={saveAnswers} className="space-y-6 p-5 sm:p-6">
          {COUNSELING_CHECKLIST.map((section) => (
            <fieldset key={section.title} className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
              <legend className="px-2 text-lg font-black text-slate-900">{section.title}</legend>
              {section.questions.map((question) => (
                <div key={question.id}>
                  <label htmlFor={`answer-${question.id}`} className="mb-2 block text-sm font-bold text-slate-800">
                    {question.text}
                  </label>
                  <textarea
                    id={`answer-${question.id}`}
                    value={answers[question.id] || ''}
                    onChange={(event) => setAnswers((current) => ({
                      ...current,
                      [question.id]: event.target.value,
                    }))}
                    maxLength={3000}
                    rows={2}
                    required
                    className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              ))}
            </fieldset>
          ))}

          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">
              Close
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-bold text-white hover:bg-teal-800 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving and generating report...' : 'Save checklist and generate report'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
