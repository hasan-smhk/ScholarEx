import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Activity, BookOpenCheck, CalendarClock, CheckCircle2, Clock3, Search, Save, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandMark from '../components/BrandMark';
import { COUNSELING_CHECKLIST } from '../data/counselingChecklist';
import {
	getAdminOverview,
	getAdminCounselorCertifications,
	getAdminReports,
	reviewAdminCounselorCertification,
	reviewAdminCounselorApplication,
	resendAdminCounselorApplicationEmail,
	reviewAdminBookingCancellation,
	recordAdminBookingRefund,
	reviewReport as submitReportReview,
	updateAdminReportChecklist,
	updateAdminCounselorFee,
	updateAdminEnrollmentProgress,
} from '../services/api';

interface Student {
	id: string;
	name: string;
	email: string;
	specialization: string;
	createdAt: string;
	hasUsedFreeSession: boolean;
	_count: { enrollments: number; bookings: number };
}

interface Enrollment {
	id: string;
	progress: number;
	completed: boolean;
	enrolledAt: string;
	completedAt: string | null;
	student: Pick<Student, 'id' | 'name' | 'email'>;
	course: { id: string; title: string; board: string; level: string };
}

interface Booking {
	id: string;
	isFreeSession: boolean;
	paymentStatus: string;
	cancellationStatus: 'NONE' | 'REQUESTED' | 'APPROVED' | 'REJECTED';
	cancellationRequestedAt: string | null;
	cancellationReviewedAt: string | null;
	cancellationReviewNote: string | null;
	cancelledAt: string | null;
	amount: number;
	razorpayOrderId: string | null;
	razorpayPaymentId: string | null;
	refundReference: string | null;
	refundProcessedAt: string | null;
	createdAt: string;
	student: Pick<Student, 'id' | 'name' | 'email'>;
	slot: {
		date: string;
		startTime: string;
		endTime: string;
		counselor: { name: string; specialization: string };
	};
	report: { id: string; createdAt: string; approvalStatus: string } | null;
}

interface Counselor {
	id: string;
	name: string;
	specialization: string;
	sessionFee: number;
}

interface CounselorCertificationRecord {
	id: string;
	name: string;
	email: string;
	specialization: string;
	mobileNumber: string | null;
	professionalQualifications: string | null;
	certificationDetails: string | null;
	certificationStatus: 'NOT_PROVIDED' | 'PENDING_VERIFICATION' | 'VERIFIED';
	certificationVerifiedAt: string | null;
	approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
	approvalReviewNote: string | null;
	approvalReviewedAt: string | null;
	applicationEmailSentAt: string | null;
	approvalEmailSentAt: string | null;
	createdAt: string;
	experience: { yearsExperience: number; details: string | null } | null;
	certificationEnrollment: { status: string; enrolledAt: string } | null;
}

interface CounselingReport {
	id: string;
	approvalStatus: 'COUNSELOR_REVIEW' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
	isAiGenerated: boolean;
	profileScores: {
		goalClarity: number;
		academicEngagement: number;
		studyPlanning: number;
		learningConfidence: number;
		careerExploration: number;
	} | null;
	createdAt: string;
	emailSentAt: string | null;
	reviewNote: string | null;
	strengths: string | null;
	areasOfImprovement: string | null;
	recommendations: string | null;
	nextSteps: string | null;
	booking: {
		id: string;
		student: Pick<Student, 'id' | 'name' | 'email'>;
		sessionChecklistAnswers: Record<string, string> | null;
		slot: {
			date: string;
			startTime: string;
			counselor: { name: string; specialization: string };
		};
	};
}

interface AdminOverview {
	students: Student[];
	enrollments: Enrollment[];
	bookings: Booking[];
	counselors: Counselor[];
}

interface ActivityItem {
	id: string;
	label: string;
	detail: string;
	timestamp: string;
	icon: 'course' | 'booking' | 'report';
}

const dateTime = (value: string) => new Date(value).toLocaleString(undefined, {
	dateStyle: 'medium',
	timeStyle: 'short',
});

export default function AdminPanel() {
	const navigate = useNavigate();
	const { user, token, logout } = useAuth();
	const [overview, setOverview] = useState<AdminOverview>({ students: [], enrollments: [], bookings: [], counselors: [] });
	const [reports, setReports] = useState<CounselingReport[]>([]);
	const [counselorCertifications, setCounselorCertifications] = useState<CounselorCertificationRecord[]>([]);
	const [selectedStudentId, setSelectedStudentId] = useState('');
	const [search, setSearch] = useState('');
	const [progressDrafts, setProgressDrafts] = useState<Record<string, number>>({});
	const [feeDrafts, setFeeDrafts] = useState<Record<string, number>>({});
	const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
	const [editingChecklistReportId, setEditingChecklistReportId] = useState('');
	const [checklistDrafts, setChecklistDrafts] = useState<Record<string, Record<string, string>>>({});
	const [applicationNotes, setApplicationNotes] = useState<Record<string, string>>({});
	const [activeSection, setActiveSection] = useState<'students' | 'counselors'>('students');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [savingEnrollmentId, setSavingEnrollmentId] = useState('');
	const [savingCounselorId, setSavingCounselorId] = useState('');
	const [reviewingReportId, setReviewingReportId] = useState('');
	const [savingChecklistReportId, setSavingChecklistReportId] = useState('');
	const [reviewingCertificationId, setReviewingCertificationId] = useState('');
	const [reviewingApplicationId, setReviewingApplicationId] = useState('');
	const [resendingApplicationEmailId, setResendingApplicationEmailId] = useState('');
	const [processingBookingId, setProcessingBookingId] = useState('');
	const [refundReferenceDrafts, setRefundReferenceDrafts] = useState<Record<string, string>>({});
	const [bookingActionMessage, setBookingActionMessage] = useState('');

	useEffect(() => {
		async function loadOverview() {
			if (!token) return;
			setLoading(true);
			setError('');
			try {
				const [{ data }, { data: reportData }, { data: certificationData }] = await Promise.all([
					getAdminOverview(token),
					getAdminReports(token),
					getAdminCounselorCertifications(token),
				]);
				setOverview(data);
				setReports(reportData);
				setCounselorCertifications(certificationData);
				setSelectedStudentId((current) => current || data.students[0]?.id || '');
				setProgressDrafts(Object.fromEntries(data.enrollments.map((item: Enrollment) => [item.id, item.progress])));
				setFeeDrafts(Object.fromEntries(data.counselors.map((item: Counselor) => [item.id, item.sessionFee])));
			} catch (err: any) {
				setError(err.response?.data?.error || 'Could not load student activity.');
			} finally {
				setLoading(false);
			}
		}

		loadOverview();
	}, [token]);

	async function refreshReports() {
		if (!token) return;
		const { data } = await getAdminReports(token);
		setReports(data);
	}

	async function refreshBookings() {
		if (!token) return;
		const { data } = await getAdminOverview(token);
		setOverview((current) => ({ ...current, bookings: data.bookings }));
	}

	async function reviewBookingCancellation(bookingId: string, status: 'APPROVED' | 'REJECTED') {
		if (!token) return;
		setProcessingBookingId(bookingId);
		setError('');
		setBookingActionMessage('');
		try {
			await reviewAdminBookingCancellation(bookingId, status, token);
			setBookingActionMessage(status === 'APPROVED'
				? 'Cancellation approved and slot released. Process any refund manually in Razorpay, then record its reference.'
				: 'Cancellation request rejected.');
			try {
				await refreshBookings();
			} catch {
				setBookingActionMessage((current) => `${current} Reload the page to refresh booking details.`);
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Could not review the cancellation request.');
		} finally {
			setProcessingBookingId('');
		}
	}

	async function markBookingRefunded(bookingId: string) {
		if (!token) return;
		const refundReference = (refundReferenceDrafts[bookingId] || '').trim();
		if (!refundReference) {
			setError('Enter the Razorpay refund reference after processing the refund.');
			return;
		}
		setProcessingBookingId(bookingId);
		setError('');
		setBookingActionMessage('');
		try {
			await recordAdminBookingRefund(bookingId, refundReference, token);
			setBookingActionMessage('Refund reference recorded.');
			try {
				await refreshBookings();
			} catch {
				setBookingActionMessage('Refund reference recorded, but booking details could not refresh. Reload the page.');
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Could not record the refund.');
		} finally {
			setProcessingBookingId('');
		}
	}

	async function reviewCounselorCertification(counselorId: string, verified: boolean) {
		if (!token) return;
		try {
			setReviewingCertificationId(counselorId);
			const { data } = await reviewAdminCounselorCertification(counselorId, verified, token);
			setCounselorCertifications((current) => current.map((counselor) =>
				counselor.id === counselorId
					? { ...counselor, certificationStatus: data.certificationStatus, certificationVerifiedAt: data.certificationVerifiedAt }
					: counselor
			));
		} catch (err: any) {
			setError(err.response?.data?.error || 'Could not update certification verification.');
		} finally {
			setReviewingCertificationId('');
		}
	}

	async function refreshCounselorApplications() {
		if (!token) return;
		const { data } = await getAdminCounselorCertifications(token);
		setCounselorCertifications(data);
	}

	async function reviewCounselorApplication(counselorId: string, status: 'APPROVED' | 'REJECTED') {
		if (!token) return;
		setReviewingApplicationId(counselorId);
		setError('');
		try {
			const { data } = await reviewAdminCounselorApplication(
				counselorId,
				status,
				applicationNotes[counselorId] || '',
				token
			);
			setCounselorCertifications((current) => current.map((item) =>
				item.id === counselorId ? { ...item, ...data } : item
			));
		} catch (err: any) {
			setError(err.response?.data?.error || 'Could not review counselor application.');
			if (err.response?.status === 502) await refreshCounselorApplications();
		} finally {
			setReviewingApplicationId('');
		}
	}

	async function resendCounselorApplicationEmail(counselorId: string) {
		if (!token) return;
		setResendingApplicationEmailId(counselorId);
		setError('');
		try {
			const { data } = await resendAdminCounselorApplicationEmail(counselorId, token);
			setCounselorCertifications((current) => current.map((item) =>
				item.id === counselorId ? { ...item, ...data } : item
			));
		} catch (err: any) {
			setError(err.response?.data?.error || 'Could not resend counselor application email.');
		} finally {
			setResendingApplicationEmailId('');
		}
	}

	const filteredStudents = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		if (!normalizedSearch) return overview.students;
		return overview.students.filter((student) =>
			`${student.name} ${student.email}`.toLowerCase().includes(normalizedSearch)
		);
	}, [overview.students, search]);

	const selectedStudent = overview.students.find((student) => student.id === selectedStudentId) || null;
	const studentEnrollments = overview.enrollments.filter((item) => item.student.id === selectedStudentId);
	const studentBookings = overview.bookings.filter((item) => item.student.id === selectedStudentId);
	const activity = useMemo<ActivityItem[]>(() => {
		const courseItems = studentEnrollments.map((item) => ({
			id: `enrollment-${item.id}`,
			label: item.completed ? 'Course completed' : 'Course activity',
			detail: `${item.course.title} · ${Math.round(item.progress)}% complete`,
			timestamp: item.completedAt || item.enrolledAt,
			icon: 'course' as const,
		}));
		const bookingItems = studentBookings.flatMap((item) => [
			{
				id: `booking-${item.id}`,
				label: 'Counseling session booked',
				detail: `${item.slot.counselor.name} · ${new Date(item.slot.date).toLocaleDateString()} · ${item.slot.startTime}`,
				timestamp: item.createdAt,
				icon: 'booking' as const,
			},
			...(item.report ? [{
				id: `report-${item.report.id}`,
				label: 'Counselor report submitted',
				detail: `Report for ${item.slot.counselor.name} session`,
				timestamp: item.report.createdAt,
				icon: 'report' as const,
			}] : []),
		]);
		return [...courseItems, ...bookingItems].sort(
			(left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
		);
	}, [studentBookings, studentEnrollments]);

	const completedCourses = overview.enrollments.filter((item) => item.completed).length;
	const pendingPayments = overview.bookings.filter((item) => item.paymentStatus === 'PENDING').length;
	const submittedReports = overview.bookings.filter((item) => item.report).length;

	async function saveProgress(enrollmentId: string) {
		if (!token) return;
		setSavingEnrollmentId(enrollmentId);
		setError('');
		try {
			const progress = progressDrafts[enrollmentId] ?? 0;
			const { data: updatedEnrollment } = await updateAdminEnrollmentProgress(enrollmentId, progress, token);
			setOverview((current) => ({
				...current,
				enrollments: current.enrollments.map((item) => item.id === enrollmentId ? updatedEnrollment : item),
			}));
		} catch (err: any) {
			setError(err.response?.data?.error || 'Could not update course progress.');
		} finally {
			setSavingEnrollmentId('');
		}
	}

	async function saveCounselorFee(counselorId: string) {
		if (!token) return;
		setSavingCounselorId(counselorId);
		setError('');
		try {
			const { data } = await updateAdminCounselorFee(counselorId, feeDrafts[counselorId] ?? 0, token);
			setOverview((current) => ({
				...current,
				counselors: current.counselors.map((item) => item.id === counselorId ? data : item),
			}));
		} catch (err: any) {
			setError(err.response?.data?.error || 'Could not update counselor fee.');
		} finally {
			setSavingCounselorId('');
		}
	}

	function startChecklistEdit(report: CounselingReport) {
		setChecklistDrafts((current) => ({
			...current,
			[report.id]: { ...(report.booking.sessionChecklistAnswers || {}) },
		}));
		setEditingChecklistReportId(report.id);
	}

	async function saveChecklist(report: CounselingReport) {
		if (!token) return;
		const answers = checklistDrafts[report.id] || {};
		if (COUNSELING_CHECKLIST.some((section) =>
			section.questions.some((question) => !answers[question.id]?.trim())
		)) {
			setError('Complete every checklist question before saving.');
			return;
		}

		setSavingChecklistReportId(report.id);
		setError('');
		try {
			const { data } = await updateAdminReportChecklist(report.id, answers, token);
			setReports((current) => current.map((item) => item.id === report.id
				? {
					...item,
					approvalStatus: data.report.approvalStatus,
					emailSentAt: data.report.emailSentAt,
					reviewNote: data.report.reviewNote,
					...(data.changed
						? {
							strengths: null,
							areasOfImprovement: null,
							recommendations: null,
							nextSteps: null,
							profileScores: null,
							isAiGenerated: false,
						}
						: {}),
					booking: { ...item.booking, sessionChecklistAnswers: data.booking.sessionChecklistAnswers },
				}
				: item
			));
			setEditingChecklistReportId('');
			setChecklistDrafts((current) => {
				const next = { ...current };
				delete next[report.id];
				return next;
			});
			setBookingActionMessage(data.changed
				? 'Checklist saved. The old report was cleared, and counselor approval has been reset. The counselor must regenerate and approve the report before admin review and student delivery.'
				: 'Checklist saved. No answers changed, so the existing review status remains.');
		} catch (err: any) {
			setError(err.response?.data?.error || 'Could not save checklist answers.');
		} finally {
			setSavingChecklistReportId('');
		}
	}

	async function handleReportReview(report: CounselingReport, status: 'APPROVED' | 'REJECTED') {
		if (!token) return;
		const reviewNote = (reviewNotes[report.id] || '').trim();
		if (status === 'REJECTED' && !reviewNote) {
			setError('Add a review note before requesting report changes.');
			return;
		}
		setReviewingReportId(report.id);
		setError('');
		try {
			await submitReportReview(report.id, status, reviewNote, token);
			await refreshReports();
		} catch (err: any) {
			setError(err.response?.data?.error || 'Could not submit report review.');
			if (err.response?.status === 502) await refreshReports();
		} finally {
			setReviewingReportId('');
		}
	}

	return (
		<main className="scholar-page scholar-page-admin min-h-screen text-slate-900">
			<header className="scholar-dashboard-hero border-b border-slate-200 bg-white">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
					<div>
						<p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
							<BrandMark className="h-8 w-10 rounded-md bg-white object-contain p-0.5 shadow-sm" />
							ScholarEx · Administration
						</p>
						<h1 className="mt-1 text-2xl font-bold">{activeSection === 'students' ? 'Student management' : 'Counselor management'}</h1>
					</div>
					<div className="flex items-center gap-4">
						<div className="hidden text-right sm:block">
							<p className="text-sm font-semibold">{user?.name}</p>
							<p className="text-xs text-slate-500">Administrator</p>
						</div>
						<button onClick={logout} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
							Sign out
						</button>
					</div>
				</div>
			</header>

			<div className="mx-auto max-w-7xl px-5 py-8">
				<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Platform overview">
					<Metric icon={<Users className="h-5 w-5" />} label="Students" value={overview.students.length} />
					<Metric icon={<BookOpenCheck className="h-5 w-5" />} label="Courses completed" value={completedCourses} />
					<Metric icon={<CalendarClock className="h-5 w-5" />} label="Payments pending" value={pendingPayments} />
					<Metric icon={<CheckCircle2 className="h-5 w-5" />} label="Reports submitted" value={submittedReports} />
				</section>

				{error && <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
				{bookingActionMessage && <p role="status" className="mt-5 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{bookingActionMessage}</p>}

				<nav className="mt-8 flex gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm" aria-label="Admin management sections">
					{([
						{ id: 'students', label: 'Manage students', count: overview.students.length },
						{ id: 'counselors', label: 'Manage counselors', count: counselorCertifications.filter((item) => item.approvalStatus === 'PENDING').length },
					] as const).map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => setActiveSection(item.id)}
							aria-current={activeSection === item.id ? 'page' : undefined}
							className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
								activeSection === item.id
									? 'bg-teal-800 text-white shadow-sm'
									: 'text-slate-600 hover:bg-teal-50 hover:text-teal-900'
							}`}
						>
							{item.label}
							<span className={`rounded-full px-2 py-0.5 text-xs ${
								activeSection === item.id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
							}`}>{item.count}</span>
						</button>
					))}
				</nav>

				{activeSection === 'students' && (
				<section className="scholar-panel-card mt-6 rounded-lg border border-slate-200 bg-white p-5">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
						<div>
							<h2 className="text-lg font-bold">Counselling report review</h2>
							<p className="text-sm text-slate-500">Review every report before it is released to a student by email.</p>
						</div>
						<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
							{reports.filter((report) => report.approvalStatus === 'PENDING_REVIEW').length} awaiting review
						</span>
					</div>
					{reports.length ? (
						<div className="space-y-4">
							{reports.map((report) => (
								<article key={report.id} className="rounded-lg border border-slate-200 p-4">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<h3 className="font-semibold">{report.booking.student.name} · {report.booking.slot.counselor.name}</h3>
											<p className="mt-1 text-sm text-slate-500">
												{report.booking.slot.counselor.specialization} · {dateTime(report.createdAt)}
												{report.isAiGenerated ? ' · AI-assisted draft' : ''}
											</p>
										</div>
										<span className={`rounded-full px-3 py-1 text-xs font-bold ${
											report.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
											report.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
											'bg-amber-100 text-amber-800'
										}`}>
											{report.approvalStatus.replace('_', ' ')}
										</span>
									</div>
									<dl className="mt-4 grid gap-3 sm:grid-cols-2">
										{[
											['Strengths', report.strengths],
											['Areas for improvement', report.areasOfImprovement],
											['Recommendations', report.recommendations],
											['Next steps', report.nextSteps],
										].map(([label, content]) => (
											<div key={label} className="rounded-md bg-slate-50 p-3">
												<dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
												<dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{content || 'Not provided'}</dd>
											</div>
										))}
									</dl>
									{report.reviewNote && <p className="mt-3 text-sm text-red-700">Review note: {report.reviewNote}</p>}
									<button
										type="button"
										onClick={() => navigate(`/booking/${report.booking.id}/report`)}
										className="mt-4 rounded-md border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
									>
										Edit report
									</button>
									{report.booking.sessionChecklistAnswers && (
										<div className="mt-4">
											{editingChecklistReportId === report.id ? (
												<div className="space-y-5 rounded-lg border border-teal-200 bg-teal-50/40 p-4">
													{COUNSELING_CHECKLIST.map((section) => (
														<fieldset key={section.title} className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
															<legend className="px-2 font-bold text-slate-800">{section.title}</legend>
															{section.questions.map((question) => (
																<div key={question.id}>
																	<label htmlFor={`admin-checklist-${report.id}-${question.id}`} className="mb-1 block text-sm font-semibold text-slate-700">
																		{question.text}
																	</label>
																	<textarea
																		id={`admin-checklist-${report.id}-${question.id}`}
																		value={checklistDrafts[report.id]?.[question.id] || ''}
																		onChange={(event) => setChecklistDrafts((current) => ({
																			...current,
																			[report.id]: { ...(current[report.id] || {}), [question.id]: event.target.value },
																		}))}
																		maxLength={3000}
																		rows={2}
																		className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
																	/>
																</div>
															))}
														</fieldset>
													))}
													<p className="text-sm text-amber-800">
														Saving changed answers clears the old report and resets its approvals. The counselor must regenerate and approve the report before admin review.
													</p>
													<div className="flex justify-end gap-2">
														<button
															type="button"
															onClick={() => setEditingChecklistReportId('')}
															className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
														>
															<X className="h-4 w-4" /> Cancel
														</button>
														<button
															type="button"
															onClick={() => saveChecklist(report)}
															disabled={savingChecklistReportId === report.id}
															className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
														>
															<Save className="h-4 w-4" />
															{savingChecklistReportId === report.id ? 'Saving...' : 'Save checklist'}
														</button>
													</div>
												</div>
											) : (
												<button
													type="button"
													onClick={() => startChecklistEdit(report)}
													className="rounded-md border border-teal-300 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50"
												>
													Edit checklist answers
												</button>
											)}
										</div>
									)}
									{report.approvalStatus === 'PENDING_REVIEW' && (
										<div className="mt-4 space-y-3">
											<textarea
												value={reviewNotes[report.id] || ''}
												onChange={(event) => setReviewNotes((current) => ({ ...current, [report.id]: event.target.value }))}
												placeholder="Optional note for approval; required when requesting changes"
												maxLength={2000}
												className="w-full rounded-md border border-slate-300 p-3 text-sm"
												aria-label={`Review note for ${report.booking.student.name}`}
											/>
											<div className="flex flex-wrap gap-2">
												<button
													onClick={() => handleReportReview(report, 'APPROVED')}
													disabled={reviewingReportId === report.id}
													className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
												>
													{reviewingReportId === report.id ? 'Processing...' : 'Approve & email student'}
												</button>
												<button
													onClick={() => handleReportReview(report, 'REJECTED')}
													disabled={reviewingReportId === report.id}
													className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
												>
													Request changes
												</button>
											</div>
										</div>
									)}
									{report.approvalStatus === 'APPROVED' && !report.emailSentAt && (
										<button
											onClick={() => handleReportReview(report, 'APPROVED')}
											disabled={reviewingReportId === report.id}
											className="mt-4 rounded-md border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
										>
											Retry student email
										</button>
									)}
									{report.approvalStatus === 'APPROVED' && report.emailSentAt && (
										<p className="mt-3 text-xs text-emerald-700">Student email sent {dateTime(report.emailSentAt)}.</p>
									)}
								</article>
							))}
						</div>
					) : <p className="py-6 text-center text-sm text-slate-500">No counselling reports have been submitted yet.</p>}
				</section>

				)}

				{activeSection === 'counselors' && (
				<>
				<section className="scholar-panel-card mt-6 rounded-lg border border-slate-200 bg-white p-5">
					<div className="mb-4">
						<h2 className="text-lg font-bold">Counselor applications and access</h2>
						<p className="text-sm text-slate-500">
							Review submitted qualifications, experience, and certification manually. Only administrator approval makes an applicant available to students and unlocks the counselor portal.
						</p>
					</div>
					{counselorCertifications.length ? (
						<div className="space-y-4">
							{counselorCertifications.map((counselor) => (
								<article key={`application-${counselor.id}`} className="rounded-xl border border-slate-200 p-5">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<h3 className="font-semibold text-slate-900">{counselor.name}</h3>
											<p className="mt-1 text-sm text-slate-500">{counselor.email} · {counselor.mobileNumber || 'No mobile number'}</p>
											<p className="mt-1 text-xs text-slate-500">Applied {dateTime(counselor.createdAt)}</p>
										</div>
										<span className={`rounded-full px-3 py-1 text-xs font-bold ${
											counselor.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
											counselor.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
											'bg-amber-100 text-amber-800'
										}`}>
											{counselor.approvalStatus}
										</span>
									</div>
									<div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
										<p><span className="font-semibold">Specialization:</span> {counselor.specialization}</p>
										<p><span className="font-semibold">Qualifications:</span> {counselor.professionalQualifications || 'Not provided'}</p>
										<p><span className="font-semibold">Experience:</span> {counselor.experience?.yearsExperience ?? 0} years{counselor.experience?.details ? ` · ${counselor.experience.details}` : ''}</p>
										<p><span className="font-semibold">Certification:</span> {counselor.certificationDetails || 'Not provided'}</p>
									</div>
									{counselor.approvalReviewNote && (
										<p className="mt-3 text-sm text-slate-600"><span className="font-semibold">Previous review note:</span> {counselor.approvalReviewNote}</p>
									)}
									<label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor={`application-note-${counselor.id}`}>
										Administrator review note
									</label>
									<textarea
										id={`application-note-${counselor.id}`}
										value={applicationNotes[counselor.id] ?? ''}
										onChange={(event) => setApplicationNotes((current) => ({ ...current, [counselor.id]: event.target.value }))}
										maxLength={2000}
										placeholder="Optional note for this decision"
										className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-600"
									/>
									<div className="mt-4 flex flex-wrap gap-2">
										{counselor.approvalStatus !== 'APPROVED' ? (
											<button
												onClick={() => reviewCounselorApplication(counselor.id, 'APPROVED')}
												disabled={reviewingApplicationId === counselor.id}
												className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
											>
												{reviewingApplicationId === counselor.id ? 'Saving...' : 'Approve and add counselor'}
											</button>
										) : !counselor.approvalEmailSentAt ? (
											<button
												onClick={() => reviewCounselorApplication(counselor.id, 'APPROVED')}
												disabled={reviewingApplicationId === counselor.id}
												className="rounded-xl border border-indigo-300 px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
											>
												{reviewingApplicationId === counselor.id ? 'Sending...' : 'Retry approval notification'}
											</button>
										) : (
											<p className="self-center text-xs text-emerald-700">Approval notification sent {dateTime(counselor.approvalEmailSentAt)}.</p>
										)}
										{counselor.approvalStatus !== 'REJECTED' && (
											<button
												onClick={() => reviewCounselorApplication(counselor.id, 'REJECTED')}
												disabled={reviewingApplicationId === counselor.id}
												className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
											>
												{reviewingApplicationId === counselor.id ? 'Saving...' : 'Reject application'}
											</button>
										)}
										{!counselor.applicationEmailSentAt && (
											<button
												onClick={() => resendCounselorApplicationEmail(counselor.id)}
												disabled={resendingApplicationEmailId === counselor.id}
												className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
											>
												{resendingApplicationEmailId === counselor.id ? 'Sending...' : 'Resend application confirmation'}
											</button>
										)}
									</div>
									{counselor.applicationEmailSentAt && (
										<p className="mt-3 text-xs text-slate-500">Application confirmation sent {dateTime(counselor.applicationEmailSentAt)}.</p>
									)}
								</article>
							))}
						</div>
					) : <p className="py-4 text-sm text-slate-500">No counselor applications yet.</p>}
				</section>

				<section className="scholar-panel-card mt-6 rounded-lg border border-slate-200 bg-white p-5">
					<h2 className="text-lg font-bold">Counsellor certification verification</h2>
					<p className="mb-4 text-sm text-slate-500">Certification claims remain unverified until an administrator checks the submitted details and explicitly verifies them.</p>
					{counselorCertifications.length ? (
						<div className="space-y-4">
							{counselorCertifications.map((counselor) => (
								<article key={counselor.id} className="rounded-lg border border-slate-200 p-4">
									<div className="flex flex-wrap items-start justify-between gap-4">
										<div>
											<h3 className="font-semibold">{counselor.name}</h3>
											<p className="text-sm text-slate-500">{counselor.email} · {counselor.mobileNumber || 'No mobile number'}</p>
										</div>
										<span className={`rounded-full px-3 py-1 text-xs font-bold ${
											counselor.certificationStatus === 'VERIFIED'
												? 'bg-emerald-50 text-emerald-700'
												: counselor.certificationStatus === 'PENDING_VERIFICATION'
													? 'bg-amber-50 text-amber-700'
													: 'bg-slate-100 text-slate-600'
										}`}>
											{counselor.certificationStatus.replace('_', ' ')}
										</span>
									</div>
									<p className="mt-3 text-sm"><span className="font-semibold">Qualifications:</span> {counselor.professionalQualifications || 'Not provided'}</p>
									<p className="mt-2 text-sm"><span className="font-semibold">Experience:</span> {counselor.experience?.yearsExperience ?? 0} years{counselor.experience?.details ? ` · ${counselor.experience.details}` : ''}</p>
									<p className="mt-2 text-sm"><span className="font-semibold">Certification details:</span> {counselor.certificationDetails || 'Not provided'}</p>
									<p className="mt-2 text-sm"><span className="font-semibold">Programme enrolment:</span> {counselor.certificationEnrollment?.status || 'Not enrolled'}</p>
									{counselor.certificationStatus !== 'NOT_PROVIDED' && (
										<button
											onClick={() => reviewCounselorCertification(counselor.id, counselor.certificationStatus !== 'VERIFIED')}
											disabled={reviewingCertificationId === counselor.id}
											className="mt-4 rounded-md border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
										>
											{reviewingCertificationId === counselor.id
												? 'Saving...'
												: counselor.certificationStatus === 'VERIFIED'
													? 'Revoke verification'
													: 'Verify certification'}
										</button>
									)}
								</article>
							))}
						</div>
					) : <p className="py-4 text-sm text-slate-500">No counselor accounts are registered.</p>}
				</section>

				<section className="scholar-panel-card mt-6 rounded-lg border border-slate-200 bg-white p-5">
					<h2 className="text-lg font-bold">Counselor session fees</h2>
					<p className="mb-4 text-sm text-slate-500">Counselor fees must be at least ₹500. Each paid booking includes a ₹25 service fee (₹525 minimum total).</p>
					{overview.counselors.length ? (
						<div className="divide-y divide-slate-100">
							{overview.counselors.map((counselor) => (
								<div key={counselor.id} className="flex flex-wrap items-center gap-3 py-3">
									<div className="min-w-48 flex-1">
										<p className="font-semibold">{counselor.name}</p>
										<p className="text-sm text-slate-500">{counselor.specialization}</p>
									</div>
									<label className="flex items-center gap-2 text-sm">
										<span>₹</span>
										<input
											type="number"
											min="500"
											step="1"
											value={feeDrafts[counselor.id] ?? counselor.sessionFee}
											onChange={(event) => setFeeDrafts((current) => ({ ...current, [counselor.id]: Number(event.target.value) }))}
											aria-label={`Session fee for ${counselor.name}`}
											className="w-28 rounded-md border border-slate-300 px-3 py-2"
										/>
									</label>
									<button
										onClick={() => saveCounselorFee(counselor.id)}
										disabled={savingCounselorId === counselor.id || (feeDrafts[counselor.id] ?? counselor.sessionFee) === counselor.sessionFee}
										className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{savingCounselorId === counselor.id ? 'Saving...' : 'Save fee'}
									</button>
								</div>
							))}
						</div>
					) : <p className="py-4 text-sm text-slate-500">No counselors found.</p>}
				</section>
				</>
				)}

				{activeSection === 'students' && (
				<div className="mt-8 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
					<section className="scholar-panel-card overflow-hidden rounded-lg border border-slate-200 bg-white">
						<div className="border-b border-slate-200 p-4">
							<h2 className="font-bold">Student directory</h2>
							<label className="mt-3 flex items-center gap-2 rounded-md border border-slate-300 px-3">
								<Search className="h-4 w-4 text-slate-400" />
								<input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search name or email"
									className="min-w-0 flex-1 py-2 text-sm outline-none"
									aria-label="Search students by name or email"
								/>
							</label>
						</div>
						{loading ? (
							<p className="p-5 text-sm text-slate-500">Loading students...</p>
						) : filteredStudents.length ? (
							<ul className="max-h-[620px] divide-y divide-slate-100 overflow-auto">
								{filteredStudents.map((student) => (
									<li key={student.id}>
										<button
											onClick={() => setSelectedStudentId(student.id)}
											aria-current={selectedStudentId === student.id ? 'true' : undefined}
											className={`w-full px-4 py-4 text-left hover:bg-slate-50 ${selectedStudentId === student.id ? 'border-l-4 border-indigo-600 bg-indigo-50/60' : ''}`}
										>
											<span className="block font-semibold">{student.name}</span>
											<span className="mt-1 block truncate text-sm text-slate-500">{student.email}</span>
											<span className="mt-2 block text-xs text-slate-500">
												{student._count.enrollments} courses · {student._count.bookings} sessions
											</span>
										</button>
									</li>
								))}
							</ul>
						) : (
							<p className="p-5 text-sm text-slate-500">No students match this search.</p>
						)}
					</section>

					<div className="min-w-0 space-y-6">
						{selectedStudent ? (
							<>
								<section className="border-b border-slate-200 pb-5">
									<p className="text-xs font-bold uppercase tracking-wide text-slate-500">Student profile</p>
									<h2 className="mt-1 text-2xl font-bold">{selectedStudent.name}</h2>
									<div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
										<span>{selectedStudent.email}</span>
										<span>Joined {dateTime(selectedStudent.createdAt)}</span>
										<span>{selectedStudent.hasUsedFreeSession ? 'Historical free session used' : 'Paid-session workflow'}</span>
									</div>
								</section>

								<section>
									<div className="mb-3 flex items-center justify-between">
										<h3 className="font-bold">Course progress</h3>
										<span className="text-sm text-slate-500">{studentEnrollments.length} enrollments</span>
									</div>
									{studentEnrollments.length ? (
										<div className="divide-y divide-slate-200 border-y border-slate-200">
											{studentEnrollments.map((enrollment) => (
												<div key={enrollment.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_220px] sm:items-center">
													<div>
														<p className="font-semibold">{enrollment.course.title}</p>
														<p className="text-sm text-slate-500">{enrollment.course.board} · {enrollment.course.level} · Started {dateTime(enrollment.enrolledAt)}</p>
													</div>
													<div className="flex items-center gap-3">
														<input
															type="range"
															min="0"
															max="100"
															step="5"
															value={progressDrafts[enrollment.id] ?? enrollment.progress}
															onChange={(event) => setProgressDrafts((current) => ({ ...current, [enrollment.id]: Number(event.target.value) }))}
															aria-label={`Progress for ${enrollment.course.title}`}
															className="min-w-0 flex-1 accent-indigo-600"
														/>
														<span className="w-10 text-right text-sm tabular-nums">{progressDrafts[enrollment.id] ?? enrollment.progress}%</span>
														<button
															onClick={() => saveProgress(enrollment.id)}
															disabled={savingEnrollmentId === enrollment.id || (progressDrafts[enrollment.id] ?? enrollment.progress) === enrollment.progress}
															className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
														>
															{savingEnrollmentId === enrollment.id ? 'Saving' : 'Update'}
														</button>
													</div>
												</div>
											))}
										</div>
									) : <p className="border-y border-slate-200 py-5 text-sm text-slate-500">No course enrollments yet.</p>}
								</section>

								<section>
									<h3 className="mb-3 font-bold">Counseling & submissions</h3>
									{studentBookings.length ? (
										<div className="overflow-x-auto border-y border-slate-200">
											<table className="w-full min-w-[760px] text-left text-sm">
												<thead className="text-xs uppercase text-slate-500">
													<tr><th className="py-3 pr-4">Session</th><th className="py-3 pr-4">Payment</th><th className="py-3 pr-4">Report</th><th className="py-3 pr-4">Booked</th><th className="py-3">Action</th></tr>
												</thead>
												<tbody className="divide-y divide-slate-100">
													{studentBookings.map((booking) => (
														<tr key={booking.id}>
															<td className="py-3 pr-4">
																<span className="block font-semibold">{booking.slot.counselor.name}</span>
																<span className="text-slate-500">{new Date(booking.slot.date).toLocaleDateString()} · {booking.slot.startTime}-{booking.slot.endTime}</span>
															</td>
															<td className="py-3 pr-4">
																<span className={`rounded px-2 py-1 text-xs font-semibold ${booking.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : booking.paymentStatus === 'REFUNDED' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
																	{booking.isFreeSession ? 'FREE' : booking.paymentStatus}
																</span>
																{!booking.isFreeSession && <span className="mt-1 block text-xs text-slate-500">₹{booking.amount}</span>}
																{booking.razorpayPaymentId && (
																	<span className="mt-1 block max-w-40 break-all text-xs text-slate-500" title={`Razorpay payment ID: ${booking.razorpayPaymentId}`}>
																		Payment ID: {booking.razorpayPaymentId}
																	</span>
																)}
															</td>
															<td className="py-3 pr-4">
																{booking.report
																	? `${booking.report.approvalStatus.replace('_', ' ')} · ${dateTime(booking.report.createdAt)}`
																	: 'Not submitted'}
															</td>
															<td className="py-3 pr-4 text-slate-500">{dateTime(booking.createdAt)}</td>
															<td className="py-3">
																<div className="flex flex-col items-start gap-2">
																	{!booking.cancelledAt && booking.report && <button
																		onClick={() => navigate(`/booking/${booking.id}/report`)}
																		className="font-semibold text-indigo-700 hover:text-indigo-900"
																	>
																		View report
																	</button>}
																	{booking.cancellationStatus === 'REQUESTED' && (
																		<div className="flex gap-2">
																			<button
																				type="button"
																				onClick={() => reviewBookingCancellation(booking.id, 'APPROVED')}
																				disabled={processingBookingId === booking.id}
																				className="rounded border border-emerald-200 px-2 py-1 text-xs font-bold text-emerald-800 disabled:opacity-50"
																			>
																				Approve cancel
																			</button>
																			<button
																				type="button"
																				onClick={() => reviewBookingCancellation(booking.id, 'REJECTED')}
																				disabled={processingBookingId === booking.id}
																				className="rounded border border-rose-200 px-2 py-1 text-xs font-bold text-rose-800 disabled:opacity-50"
																			>
																				Reject
																			</button>
																		</div>
																	)}
																	{booking.cancellationStatus === 'APPROVED' && !booking.isFreeSession && booking.paymentStatus === 'PAID' && (
																		<div className="flex flex-col gap-1">
																			<p className="max-w-48 text-xs text-slate-500">
																				Process the refund in Razorpay using the payment ID above, then enter its refund ID here.
																			</p>
																			<input
																				value={refundReferenceDrafts[booking.id] ?? ''}
																				onChange={(event) => setRefundReferenceDrafts((current) => ({ ...current, [booking.id]: event.target.value }))}
																				placeholder="Razorpay refund ID"
																				aria-label={`Razorpay refund reference for booking ${booking.id}`}
																				className="w-40 rounded border border-slate-300 px-2 py-1 text-xs"
																			/>
																			<button
																				type="button"
																				onClick={() => markBookingRefunded(booking.id)}
																				disabled={processingBookingId === booking.id}
																				className="rounded border border-indigo-200 px-2 py-1 text-xs font-bold text-indigo-800 disabled:opacity-50"
																			>
																				Record manual refund
																			</button>
																		</div>
																	)}
																	{booking.cancellationStatus !== 'NONE' && (
																		<span className="text-xs text-slate-500">
																			Cancellation: {booking.cancellationStatus}
																			{booking.cancellationReviewNote ? ` · ${booking.cancellationReviewNote}` : ''}
																		</span>
																	)}
																	{booking.paymentStatus === 'REFUNDED' && booking.refundReference && (
																		<span className="text-xs text-slate-500">Refund ref: {booking.refundReference}</span>
																	)}
																</div>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : <p className="border-y border-slate-200 py-5 text-sm text-slate-500">No counseling sessions yet.</p>}
								</section>

								<section>
									<h3 className="mb-3 flex items-center gap-2 font-bold"><Activity className="h-4 w-4 text-indigo-600" /> Recent activity</h3>
									{activity.length ? (
										<ol className="divide-y divide-slate-200 border-y border-slate-200">
											{activity.map((item) => (
												<li key={item.id} className="flex gap-3 py-3">
													<span className="mt-0.5 text-indigo-600">
														{item.icon === 'course' ? <BookOpenCheck className="h-4 w-4" /> : item.icon === 'booking' ? <CalendarClock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
													</span>
													<div className="min-w-0 flex-1">
														<p className="text-sm font-semibold">{item.label}</p>
														<p className="text-sm text-slate-500">{item.detail}</p>
													</div>
													<time className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
														<Clock3 className="h-3 w-3" />{dateTime(item.timestamp)}
													</time>
												</li>
											))}
										</ol>
									) : <p className="border-y border-slate-200 py-5 text-sm text-slate-500">No activity recorded yet.</p>}
								</section>
							</>
						) : (
							<div className="flex min-h-64 items-center justify-center border-y border-slate-200 text-sm text-slate-500">
								{loading ? 'Loading student records...' : 'Select a student to inspect their activity.'}
							</div>
						)}
					</div>
				</div>
				)}
			</div>
		</main>
	);
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
	return (
		<div className="scholar-metric-card flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-4">
			<span className="text-indigo-600">{icon}</span>
			<div>
				<p className="text-sm text-slate-500">{label}</p>
				<p className="text-2xl font-bold tabular-nums">{value}</p>
			</div>
		</div>
	);
}
