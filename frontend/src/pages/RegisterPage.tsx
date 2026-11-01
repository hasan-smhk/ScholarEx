import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { registerUser } from '../services/api';
import BrandMark from '../components/BrandMark';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'STUDENT' | 'COUNSELOR';
  mobileNumber: string;
  professionalQualifications: string;
  specialization: string;
  moreThanOneYear: '' | 'yes' | 'no';
  yearsExperience: string;
  experienceDetails: string;
  hasCertification: '' | 'yes' | 'no';
  certificationDetails: string;
  enrollInCertificationProgram: '' | 'yes' | 'no';
}

export default function RegisterPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const registrationOptions = location.state as { role?: 'STUDENT' | 'COUNSELOR' } | null;
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: registrationOptions?.role === 'COUNSELOR' ? 'COUNSELOR' : 'STUDENT',
    mobileNumber: '',
    professionalQualifications: '',
    specialization: '',
    moreThanOneYear: '',
    yearsExperience: '',
    experienceDetails: '',
    hasCertification: '',
    certificationDetails: '',
    enrollInCertificationProgram: '',
  });

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const e: Record<string, string | undefined> = {};

    if (!form.name.trim()) e.name = 'Name is required';

    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';

    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';

    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';

    if (form.role === 'COUNSELOR') {
      const mobileDigits = form.mobileNumber.replace(/\D/g, '');
      if (mobileDigits.length < 10 || mobileDigits.length > 15) {
        e.mobileNumber = 'Enter a valid mobile number with 10 to 15 digits';
      }
      if (form.professionalQualifications.trim().length < 2) {
        e.professionalQualifications = 'Professional qualifications are required';
      }
      if (!form.specialization.trim()) e.specialization = 'Counselling specialization is required';
      if (!form.moreThanOneYear) e.moreThanOneYear = 'Please choose Yes or No';
      const years = Number(form.yearsExperience);
      if (
        form.yearsExperience === '' ||
        !Number.isInteger(years) ||
        years < 0 ||
        years > 80 ||
        (form.moreThanOneYear === 'yes' && years <= 1) ||
        (form.moreThanOneYear === 'no' && years > 1)
      ) {
        e.yearsExperience = form.moreThanOneYear === 'yes'
          ? 'Enter at least 2 full years of experience'
          : 'Enter 0 or 1 year';
      }
      if (form.moreThanOneYear === 'yes' && form.experienceDetails.trim().length < 2) {
        e.experienceDetails = 'Please describe your professional experience';
      }
      if (!form.hasCertification) e.hasCertification = 'Please indicate your certification status';
      if (form.hasCertification === 'yes' && form.certificationDetails.trim().length < 2) {
        e.certificationDetails = 'Please provide relevant certification details';
      }
      if (form.moreThanOneYear === 'no' && !form.enrollInCertificationProgram) {
        e.enrollInCertificationProgram = 'Choose whether to enrol or continue without enrolment';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      const response = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.role === 'COUNSELOR' ? {
          mobileNumber: form.mobileNumber,
          professionalQualifications: form.professionalQualifications,
          specialization: form.specialization,
          moreThanOneYear: form.moreThanOneYear === 'yes',
          yearsExperience: Number(form.yearsExperience),
          experienceDetails: form.experienceDetails,
          hasCertification: form.hasCertification === 'yes',
          certificationDetails: form.certificationDetails,
          enrollInCertificationProgram: form.enrollInCertificationProgram === 'yes',
        } : {}),
      });

      navigate(form.role === 'COUNSELOR' ? '/counselor/login' : '/student/login', {
        state: {
          fromRegister: true,
          email: form.email,
          applicationEmailSent: response.data.applicationEmailSent,
          confirmationEmailSent: response.data.confirmationEmailSent,
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);

      if (err?.response?.data?.errors) {
        const apiErrors = err.response.data.errors;
        const mapped: Record<string, string> = {};
        Object.keys(apiErrors).forEach((key) => {
          mapped[key] = apiErrors[key];
        });
        setErrors(mapped);
      } else if (err?.response?.data?.message || err?.response?.data?.error) {
        setServerError(err.response.data.message || err.response.data.error);
      } else {
        setServerError('Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function updateField<K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [String(key)]: undefined }));
    setServerError(null);
  }

  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-[#071b24] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(94, 234, 212, 0.18) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-cyan-600/15 blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300">
            <BrandMark className="h-11 w-14 rounded-xl bg-white object-contain p-0.5 shadow-lg shadow-teal-950/40" />
            <span className="text-xl font-black tracking-tight sm:text-2xl">
              Scholar<span className="text-teal-300">Ex</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-teal-300/40 hover:text-teal-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10 sm:py-12">
          <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[0.8fr_1fr] lg:gap-16">
            <section className="hidden max-w-lg lg:block">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100">
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                Learning built around you
              </div>
              <h1 className="text-5xl font-black leading-tight tracking-tight xl:text-6xl">
                Start your
                <br />
                learning <span className="text-teal-300">journey.</span>
              </h1>
              <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
                Create your ScholarEx account to explore board courses, discover learning modules, and get personalised guidance.
              </p>
              <div className="mt-10 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium text-slate-200">
                <GraduationCap aria-hidden="true" className="h-6 w-6 text-teal-300" />
                Learn at your pace, with support at every step.
              </div>
            </section>

            <section className="w-full rounded-3xl border border-white/10 bg-[#0d2933]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl motion-safe:animate-[login-enter_.65s_ease-out_both] motion-reduce:animate-none sm:p-9">
              <div className="mb-7 text-center lg:text-left">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300 lg:hidden">
                  <BookOpen aria-hidden="true" className="h-6 w-6" />
                </div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-teal-300">Join ScholarEx</p>
                <h2 className="text-3xl font-black tracking-tight text-white">Create your account</h2>
                <p className="mt-2 text-slate-300">
                  {form.role === 'COUNSELOR'
                    ? 'Create a counsellor account to manage appointments, student forms, and your professional profile.'
                    : 'Register as a student to explore courses and claim free counselling.'}
                </p>
              </div>

              {serverError && (
                <div role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
                  {serverError}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-200">Full name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    disabled={submitting}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    placeholder="Your full name"
                    className={`w-full rounded-xl border bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition duration-200 focus:ring-4 focus:ring-teal-300/10 ${
                      errors.name ? 'border-red-400 focus:border-red-300' : 'border-white/10 focus:border-teal-300/70'
                    }`}
                  />
                  {errors.name && <p id="name-error" className="mt-1.5 text-sm text-red-300">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-200">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={submitting}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    placeholder="you@example.com"
                    className={`w-full rounded-xl border bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition duration-200 focus:ring-4 focus:ring-teal-300/10 ${
                      errors.email ? 'border-red-400 focus:border-red-300' : 'border-white/10 focus:border-teal-300/70'
                    }`}
                  />
                  {errors.email && <p id="email-error" className="mt-1.5 text-sm text-red-300">{errors.email}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-200">Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      disabled={submitting}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      placeholder="At least 6 characters"
                      className={`w-full rounded-xl border bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition duration-200 focus:ring-4 focus:ring-teal-300/10 ${
                        errors.password ? 'border-red-400 focus:border-red-300' : 'border-white/10 focus:border-teal-300/70'
                      }`}
                    />
                    {errors.password && <p id="password-error" className="mt-1.5 text-sm text-red-300">{errors.password}</p>}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-200">Confirm password</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      disabled={submitting}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                      placeholder="Re-enter password"
                      className={`w-full rounded-xl border bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition duration-200 focus:ring-4 focus:ring-teal-300/10 ${
                        errors.confirmPassword ? 'border-red-400 focus:border-red-300' : 'border-white/10 focus:border-teal-300/70'
                      }`}
                    />
                    {errors.confirmPassword && <p id="confirm-password-error" className="mt-1.5 text-sm text-red-300">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-slate-200">I am registering as</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { id: 'role-student', value: 'STUDENT', label: 'Student' },
                      { id: 'role-counselor', value: 'COUNSELOR', label: 'Counselor' },
                    ] as const).map((role) => (
                      <label
                        key={role.value}
                        htmlFor={role.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                          form.role === role.value
                            ? 'border-teal-300/50 bg-teal-300/10 text-teal-100'
                            : 'border-white/10 bg-[#071b24]/50 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <input
                          id={role.id}
                          name="role"
                          type="radio"
                          value={role.value}
                          checked={form.role === role.value}
                          onChange={() => updateField('role', role.value)}
                          disabled={submitting}
                          className="h-4 w-4 accent-teal-400 focus:ring-teal-300"
                        />
                        {role.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {form.role === 'COUNSELOR' && (
                  <section className="space-y-4 rounded-2xl border border-teal-200/15 bg-[#071b24]/50 p-4" aria-label="Counsellor registration details">
                    <h3 className="text-lg font-bold text-white">Professional profile</h3>
                    <div>
                      <label htmlFor="mobileNumber" className="mb-2 block text-sm font-semibold text-slate-200">Mobile number</label>
                      <input
                        id="mobileNumber"
                        type="tel"
                        autoComplete="tel"
                        value={form.mobileNumber}
                        onChange={(event) => updateField('mobileNumber', event.target.value)}
                        disabled={submitting}
                        aria-invalid={Boolean(errors.mobileNumber)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-white/10 bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-teal-300/70"
                      />
                      {errors.mobileNumber && <p className="mt-1 text-sm text-red-300">{errors.mobileNumber}</p>}
                    </div>
                    <div>
                      <label htmlFor="specialization" className="mb-2 block text-sm font-semibold text-slate-200">Counselling specialization</label>
                      <input
                        id="specialization"
                        value={form.specialization}
                        onChange={(event) => updateField('specialization', event.target.value)}
                        disabled={submitting}
                        aria-invalid={Boolean(errors.specialization)}
                        placeholder="Career guidance, academic counselling..."
                        className="w-full rounded-xl border border-white/10 bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-teal-300/70"
                      />
                      {errors.specialization && <p className="mt-1 text-sm text-red-300">{errors.specialization}</p>}
                    </div>
                    <div>
                      <label htmlFor="professionalQualifications" className="mb-2 block text-sm font-semibold text-slate-200">Professional qualifications</label>
                      <textarea
                        id="professionalQualifications"
                        rows={3}
                        value={form.professionalQualifications}
                        onChange={(event) => updateField('professionalQualifications', event.target.value)}
                        disabled={submitting}
                        aria-invalid={Boolean(errors.professionalQualifications)}
                        placeholder="Degrees, relevant training, and qualifications"
                        className="w-full rounded-xl border border-white/10 bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-teal-300/70"
                      />
                      {errors.professionalQualifications && <p className="mt-1 text-sm text-red-300">{errors.professionalQualifications}</p>}
                    </div>

                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold text-slate-200">Do you have more than one year of professional experience?</legend>
                      <div className="grid grid-cols-2 gap-3">
                        {(['yes', 'no'] as const).map((answer) => (
                          <label key={answer} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200">
                            <input
                              type="radio"
                              name="moreThanOneYear"
                              value={answer}
                              checked={form.moreThanOneYear === answer}
                              onChange={() => {
                                updateField('moreThanOneYear', answer);
                                updateField('yearsExperience', answer === 'yes' ? '' : '0');
                                updateField('experienceDetails', '');
                                updateField('enrollInCertificationProgram', '');
                              }}
                              disabled={submitting}
                              className="accent-teal-400"
                            />
                            {answer === 'yes' ? 'Yes' : 'No'}
                          </label>
                        ))}
                      </div>
                      {errors.moreThanOneYear && <p className="mt-1 text-sm text-red-300">{errors.moreThanOneYear}</p>}
                    </fieldset>

                    {form.moreThanOneYear && (
                      <>
                        <div>
                          <label htmlFor="yearsExperience" className="mb-2 block text-sm font-semibold text-slate-200">Years of professional experience</label>
                          <input
                            id="yearsExperience"
                            type="number"
                            min={form.moreThanOneYear === 'yes' ? 2 : 0}
                            max={form.moreThanOneYear === 'yes' ? 80 : 1}
                            step="1"
                            value={form.yearsExperience}
                            onChange={(event) => updateField('yearsExperience', event.target.value)}
                            disabled={submitting}
                            aria-invalid={Boolean(errors.yearsExperience)}
                            className="w-full rounded-xl border border-white/10 bg-[#071b24]/80 px-4 py-3 text-white outline-none focus:border-teal-300/70"
                          />
                          {errors.yearsExperience && <p className="mt-1 text-sm text-red-300">{errors.yearsExperience}</p>}
                        </div>
                        {form.moreThanOneYear === 'yes' ? (
                          <div>
                            <label htmlFor="experienceDetails" className="mb-2 block text-sm font-semibold text-slate-200">Professional experience details</label>
                            <textarea
                              id="experienceDetails"
                              rows={3}
                              value={form.experienceDetails}
                              onChange={(event) => updateField('experienceDetails', event.target.value)}
                              disabled={submitting}
                              aria-invalid={Boolean(errors.experienceDetails)}
                              placeholder="Describe relevant roles, responsibilities, and experience"
                              className="w-full rounded-xl border border-white/10 bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-teal-300/70"
                            />
                            {errors.experienceDetails && <p className="mt-1 text-sm text-red-300">{errors.experienceDetails}</p>}
                          </div>
                        ) : (
                          <fieldset>
                            <legend className="mb-2 text-sm font-semibold text-slate-200">Would you like to enrol in the ScholarEx counsellor certification programme?</legend>
                            <p className="mb-3 text-xs leading-5 text-slate-400">You can enrol now or continue registration without enrolling. Your experience or certification choice does not automatically block registration.</p>
                            <div className="grid grid-cols-2 gap-3">
                              {([
                                ['yes', 'Enrol and continue'],
                                ['no', 'Continue without enrolment'],
                              ] as const).map(([answer, label]) => (
                                <label key={answer} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200">
                                  <input
                                    type="radio"
                                    name="enrollInCertificationProgram"
                                    checked={form.enrollInCertificationProgram === answer}
                                    onChange={() => updateField('enrollInCertificationProgram', answer)}
                                    disabled={submitting}
                                    className="accent-teal-400"
                                  />
                                  {label}
                                </label>
                              ))}
                            </div>
                            {errors.enrollInCertificationProgram && <p className="mt-1 text-sm text-red-300">{errors.enrollInCertificationProgram}</p>}
                          </fieldset>
                        )}
                      </>
                    )}

                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold text-slate-200">Do you have a relevant professional certification?</legend>
                      <div className="grid grid-cols-2 gap-3">
                        {(['yes', 'no'] as const).map((answer) => (
                          <label key={answer} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200">
                            <input
                              type="radio"
                              name="hasCertification"
                              checked={form.hasCertification === answer}
                              onChange={() => {
                                updateField('hasCertification', answer);
                                updateField('certificationDetails', '');
                              }}
                              disabled={submitting}
                              className="accent-teal-400"
                            />
                            {answer === 'yes' ? 'Yes' : 'No'}
                          </label>
                        ))}
                      </div>
                      {errors.hasCertification && <p className="mt-1 text-sm text-red-300">{errors.hasCertification}</p>}
                    </fieldset>
                    {form.hasCertification === 'yes' && (
                      <div>
                        <label htmlFor="certificationDetails" className="mb-2 block text-sm font-semibold text-slate-200">Certification details</label>
                        <textarea
                          id="certificationDetails"
                          rows={3}
                          value={form.certificationDetails}
                          onChange={(event) => updateField('certificationDetails', event.target.value)}
                          disabled={submitting}
                          aria-invalid={Boolean(errors.certificationDetails)}
                          placeholder="Certification name, issuing organization, and award date"
                          className="w-full rounded-xl border border-white/10 bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-teal-300/70"
                        />
                        <p className="mt-1 text-xs text-slate-400">Certification is marked verified only after an administrator completes verification.</p>
                        {errors.certificationDetails && <p className="mt-1 text-sm text-red-300">{errors.certificationDetails}</p>}
                      </div>
                    )}
                  </section>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative w-full overflow-hidden rounded-xl bg-teal-500 px-4 py-3.5 font-bold text-[#06232b] shadow-lg shadow-teal-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-300 hover:shadow-teal-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-200 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none"
                >
                  {submitting ? 'Creating your account...' : 'Create account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-300">
                Already have an account?{' '}
                <Link
                  to={form.role === 'COUNSELOR' ? '/counselor/login' : '/student/login'}
                  className="font-semibold text-teal-300 transition-colors hover:text-teal-200 hover:underline"
                >
                  {form.role === 'COUNSELOR' ? 'Counselor sign in' : 'Student sign in'}
                </Link>
              </p>
              <p className="mt-4 text-center text-xs leading-6 text-slate-400">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-teal-300 hover:underline">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-teal-300 hover:underline">Privacy Policy</Link>.
              </p>
            </section>
          </div>
        </main>

        <footer className="py-2 text-center text-xs text-slate-500">© 2026 ScholarEx Education</footer>
      </div>
    </div>
  );
}