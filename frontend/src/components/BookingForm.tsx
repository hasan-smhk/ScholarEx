// src/components/BookingForm.tsx
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown, CreditCard, Loader2, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/api';

interface Counselor {
  id: string;
  name: string;
  specialization: string;
}

interface Props {
  counselor: Counselor;
  hasUsedFreeSession: boolean;
  onClose: () => void;
}

interface SubjectAssessment {
  subject: string;
  overall: string;
  comments: string;
}

const subjects = [
  'Maths',
  'Science',
  'Computer Science',
  'Kannada',
  'Economics',
  'Civics',
  'Accounts',
  'Commerce',
  'Hindi',
  'English',
];
const inputClassName =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

export default function BookingForm({ counselor, hasUsedFreeSession, onClose }: Props) {
  const navigate = useNavigate();
  const { user, token, markFreeSessionUsed } = useAuth();
  const [formData, setFormData] = useState({
    studentName: user?.name || '',
    studentAge: '',
    schoolCollege: '',
    fatherName: '',
    fatherOccupation: '',
    fatherAge: '',
    fatherEducation: '',
    motherName: '',
    motherOccupation: '',
    motherAge: '',
    motherEducation: '',
    AnnualfamilyIncome: '',
    familyType: '',
    address: '',
    phoneNo: '',
    emailId: user?.email || '',
    educationBackground: '',
    currentStream: '',
    careerAspiration: '',
    marksPercentage: '',
    areasOfInterest: '',
    hobbies: '',
    subjectAssessments: [] as SubjectAssessment[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjectsDropdownOpen, setSubjectsDropdownOpen] = useState(false);
  const bookingSubmitRef = useRef(false);

  const isFirstTimeUser = !hasUsedFreeSession;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSubjectChange = (
    index: number,
    field: keyof Omit<SubjectAssessment, 'subject'>,
    value: string
  ) => {
    setFormData((current) => ({
      ...current,
      subjectAssessments: current.subjectAssessments.map((assessment, rowIndex) =>
        rowIndex === index ? { ...assessment, [field]: value } : assessment
      ),
    }));
  };

  const toggleSubject = (subject: string) => {
    setFormData((current) => {
      const selected = current.subjectAssessments.some((assessment) => assessment.subject === subject);
      return {
        ...current,
        subjectAssessments: selected
          ? current.subjectAssessments.filter((assessment) => assessment.subject !== subject)
          : [...current.subjectAssessments, { subject, overall: '', comments: '' }],
      };
    });
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (bookingSubmitRef.current) return;

  if (!token) {
    navigate('/login', { state: { from: { pathname: '/counselors' } } });
    return;
  }

  bookingSubmitRef.current = true;
  setSubmitting(true);
  setError(null);

  try {
    const response = await createBooking(
      {
        ...formData,
        studentAge: Number(formData.studentAge),
        AnnualfamilyIncome: formData.AnnualfamilyIncome
          ? Number(formData.AnnualfamilyIncome)
          : null,
        marksPercentage: Number(formData.marksPercentage),
        subjectPreferences: formData.subjectAssessments.map(({ subject }) => subject).join(', '),
        preferredCounselorId: counselor.id,
      },
      token
    );

    const bookingId = response.data.id;
    if (response.data.isFreeSession) markFreeSessionUsed();
    onClose();

    if (response.data.isFreeSession) {
      navigate(`/booking/${bookingId}/complete`);
    } else {
      navigate(`/booking/${bookingId}`); // Go to payment page
    }
  } catch (err: any) {
    console.error('Booking error:', err);
    setError(
      err.response?.data?.error ||
        err.message ||
        'Failed to create booking. Please try again.'
    );
  } finally {
    bookingSubmitRef.current = false;
    setSubmitting(false);
  }
};



  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* ── Match Summary ── */}
      <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Counselor preference</p>
            <p className="font-bold text-gray-900">{counselor.name}</p>
            <p className="text-xs text-indigo-600">{counselor.specialization}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Available counseling hours</p>
            <p className="font-bold text-gray-900">Monday–Friday, 5:00 PM–8:00 PM</p>
            <p className="text-xs text-gray-500">Your counselor and exact slot are matched after you submit this form.</p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-white/70 p-3 text-sm text-indigo-800">
          <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          We match your goals and interests with counselor expertise, then assign the earliest suitable open slot.
        </div>

        {/* Free session badge */}
        {isFirstTimeUser ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <p className="text-sm text-green-700 font-semibold">
              First session is FREE for you!
            </p>
          </div>
        ) : (
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-sm text-violet-700 font-semibold">
              The assigned counselor’s fee will be shown before payment.
            </p>
          </div>
        )}
      </div>

      {/* ── Student & Family Details ── */}
      <fieldset className="space-y-4 rounded-2xl border border-gray-200 p-4 sm:p-5">
        <legend className="px-2 text-base font-black text-gray-900">Student & Family Details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="studentName" className="mb-1.5 block text-sm font-bold text-gray-700">Student Name *</label>
            <input id="studentName" name="studentName" value={formData.studentName} onChange={handleChange} required className={inputClassName} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="studentAge" className="mb-1.5 block text-sm font-bold text-gray-700">Age *</label>
            <input id="studentAge" name="studentAge" type="number" min="1" max="120" value={formData.studentAge} onChange={handleChange} required className={inputClassName} />
          </div>
          <div>
            <label htmlFor="schoolCollege" className="mb-1.5 block text-sm font-bold text-gray-700">School / College *</label>
            <input id="schoolCollege" name="schoolCollege" value={formData.schoolCollege} onChange={handleChange} required className={inputClassName} autoComplete="organization" />
          </div>
          <div>
            <label htmlFor="familyType" className="mb-1.5 block text-sm font-bold text-gray-700">Nuclear / Joint Family *</label>
            <select id="familyType" name="familyType" value={formData.familyType} onChange={handleChange} required className={inputClassName}>
              <option value="">Select family type</option>
              <option value="Nuclear">Nuclear</option>
              <option value="Joint">Joint</option>
            </select>
          </div>
          <div>
            <label htmlFor="phoneNo" className="mb-1.5 block text-sm font-bold text-gray-700">Phone Number *</label>
            <input id="phoneNo" name="phoneNo" type="tel" value={formData.phoneNo} onChange={handleChange} required className={inputClassName} autoComplete="tel" />
          </div>
          <div>
            <label htmlFor="emailId" className="mb-1.5 block text-sm font-bold text-gray-700">Email ID *</label>
            <input id="emailId" name="emailId" type="email" value={formData.emailId} onChange={handleChange} required className={inputClassName} autoComplete="email" />
          </div>
        </div>
        <div>
          <label htmlFor="address" className="mb-1.5 block text-sm font-bold text-gray-700">Address *</label>
          <textarea id="address" name="address" value={formData.address} onChange={handleChange} required rows={2} className={`${inputClassName} resize-y`} autoComplete="street-address" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="fatherName" className="mb-1.5 block text-sm font-bold text-gray-700">Father's Name</label>
            <input id="fatherName" name="fatherName" value={formData.fatherName} onChange={handleChange} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="fatherOccupation" className="mb-1.5 block text-sm font-bold text-gray-700">Father's Occupation</label>
            <input id="fatherOccupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="fatherEducation" className="mb-1.5 block text-sm font-bold text-gray-700">Father's Education</label>
            <input id="fatherEducation" name="fatherEducation" value={formData.fatherEducation} onChange={handleChange} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="motherName" className="mb-1.5 block text-sm font-bold text-gray-700">Mother's Name</label>
            <input id="motherName" name="motherName" value={formData.motherName} onChange={handleChange} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="motherOccupation" className="mb-1.5 block text-sm font-bold text-gray-700">Mother's Occupation</label>
            <input id="motherOccupation" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="motherEducation" className="mb-1.5 block text-sm font-bold text-gray-700">Mother's Education</label>
            <input id="motherEducation" name="motherEducation" value={formData.motherEducation} onChange={handleChange} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="AnnualfamilyIncome" className="mb-1.5 block text-sm font-bold text-gray-700">Annual Family Income *</label>
            <input id="AnnualfamilyIncome" name="AnnualfamilyIncome" type="number" min="0" step="1" value={formData.AnnualfamilyIncome} onChange={handleChange} required className={inputClassName} />
          </div>
        </div>
      </fieldset>

      {/* ── Education & Goals ── */}
      <fieldset className="space-y-4 rounded-2xl border border-gray-200 p-4 sm:p-5">
        <legend className="px-2 text-base font-black text-gray-900">Education & Goals</legend>
        <div>
          <label htmlFor="currentStream" className="mb-1.5 block text-sm font-bold text-gray-700">Currently Studying in Class / Stream *</label>
          <input
            id="currentStream"
            name="currentStream"
            value={formData.currentStream}
            onChange={handleChange}
            placeholder="e.g., 11th (First Year) - Economics, Civics, Accounts, Commerce, Hindi, English"
            required
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="educationBackground" className="mb-1.5 block text-sm font-bold text-gray-700">Education / Board Background *</label>
          <input id="educationBackground" name="educationBackground" value={formData.educationBackground} onChange={handleChange} placeholder="e.g., Karnataka State Board" required className={inputClassName} />
        </div>
        <div>
          <label htmlFor="careerAspiration" className="mb-1.5 block text-sm font-bold text-gray-700">Aim / Goal *</label>
          <textarea id="careerAspiration" name="careerAspiration" value={formData.careerAspiration} onChange={handleChange} placeholder="What would you like to achieve?" required rows={3} className={`${inputClassName} resize-y`} />
        </div>
        <div>
          <label htmlFor="marksPercentage" className="mb-1.5 block text-sm font-bold text-gray-700">Latest marks percentage *</label>
          <input
            id="marksPercentage"
            name="marksPercentage"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.marksPercentage}
            onChange={handleChange}
            placeholder="0–100"
            required
            className={inputClassName}
          />
          <p className="mt-1 text-xs text-gray-500">Students at 85% or above will see a counseling recommendation on their dashboard.</p>
        </div>
        <div>
          <label htmlFor="areasOfInterest" className="mb-1.5 block text-sm font-bold text-gray-700">Areas of Interest</label>
          <input id="areasOfInterest" name="areasOfInterest" value={formData.areasOfInterest} onChange={handleChange} placeholder="e.g., Technology, Medicine, Business" className={inputClassName} />
        </div>
        <div>
          <label htmlFor="hobbies" className="mb-1.5 block text-sm font-bold text-gray-700">Hobbies & Personal Interests</label>
          <textarea id="hobbies" name="hobbies" value={formData.hobbies} onChange={handleChange} placeholder="Tell us about your hobbies and interests" rows={2} className={`${inputClassName} resize-y`} />
        </div>
      </fieldset>

      {/* ── Subject Assessment ── */}
      <fieldset className="rounded-2xl border border-gray-200 p-4 sm:p-5">
        <legend className="px-2 text-base font-black text-gray-900">Subject Assessment</legend>
        <p className="mb-4 text-sm text-gray-500">Choose the subjects you study, then optionally add a rating and comments for each one.</p>
        <div className="relative mb-5">
          <button
            type="button"
            aria-expanded={subjectsDropdownOpen}
            aria-controls="booking-subject-options"
            onClick={() => setSubjectsDropdownOpen((open) => !open)}
            className={`${inputClassName} flex items-center justify-between bg-white text-left`}
          >
            <span className={formData.subjectAssessments.length ? 'text-gray-900' : 'text-gray-500'}>
              {formData.subjectAssessments.length
                ? `${formData.subjectAssessments.length} subject${formData.subjectAssessments.length === 1 ? '' : 's'} selected`
                : 'Choose your subjects'}
            </span>
            <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${subjectsDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {subjectsDropdownOpen && (
            <div id="booking-subject-options" className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              {subjects.map((subject) => {
                const checked = formData.subjectAssessments.some((assessment) => assessment.subject === subject);
                return (
                  <label key={subject} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubject(subject)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {subject}
                  </label>
                );
              })}
            </div>
          )}
        </div>
        {formData.subjectAssessments.length > 0 ? (
          <div className="space-y-4">
          {formData.subjectAssessments.map((assessment, index) => (
            <div key={assessment.subject} className="grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-[1fr_1fr_2fr] sm:items-end">
              <div>
                <span className="mb-1.5 block text-sm font-bold text-gray-700">Subject</span>
                <p className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900">{assessment.subject}</p>
              </div>
              <div>
                <label htmlFor={`overall-${index}`} className="mb-1.0 block text-sm font-bold text-gray-700">Overall</label>
                <select id={`overall-${index}`} value={assessment.overall} onChange={(event) => handleSubjectChange(index, 'overall', event.target.value)} className={inputClassName}>
                  <option value="">Select rating</option>
                  <option value="Below 60% Poor">Below 60% Poor</option>
                  <option value="Above 65% Average">Above 65% Average</option>
                  <option value="Above 80% Good">Above 80% Good</option>
                  <option value="Above 90% Excellent">Above 90%   Excellent</option>
                </select>
              </div>
              <div>
                <label htmlFor={`comments-${index}`} className="mb-1.5 block text-sm font-bold text-gray-700">Comments</label>
                <input id={`comments-${index}`} value={assessment.comments} onChange={(event) => handleSubjectChange(index, 'comments', event.target.value)} placeholder="e.g., College has not been attended due to health" className={inputClassName} />
              </div>
            </div>
          ))}
          </div>
        ) : (
          <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Select one or more subjects from the dropdown to add assessments.
          </p>
        )}
      </fieldset>

      {/* ── Action Buttons ── */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : isFirstTimeUser ? (
            '🎉 Book Free Session'
          ) : (
            'Continue to Payment →'
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
