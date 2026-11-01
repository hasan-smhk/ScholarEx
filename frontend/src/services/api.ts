import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';
const api = axios.create({ baseURL: API_BASE });

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const requestPasswordReset = (email: string) =>
  api.post<{ message: string }>('/auth/forgot-password', { email });

export const resetPassword = (token: string, password: string) =>
  api.post<{ message: string }>('/auth/reset-password', { token, password });

export const loginAdmin = (email: string, password: string) =>
  api.post('/auth/admin/login', { email, password });

export const register = (name: string, email: string, password: string) =>
  api.post('/auth/register', { name, email, password });

export const registerUser = (payload: {
  name: string;
  email: string;
  password: string;
  role?: 'STUDENT' | 'COUNSELOR';
  mobileNumber?: string;
  professionalQualifications?: string;
  specialization?: string;
  moreThanOneYear?: boolean;
  yearsExperience?: number;
  experienceDetails?: string;
  hasCertification?: boolean;
  certificationDetails?: string;
  enrollInCertificationProgram?: boolean;
}) => api.post('/auth/register', payload);

// Counselors
export const getCounselors = () => api.get('/counselors');

export const getCounselorById = (counselorId: string) => api.get(`/counselors/${counselorId}`);

export const getMyCounselorProfile = (token: string) =>
  api.get('/counselors/me', { headers: { Authorization: 'Bearer ' + token } });

export const updateMyCounselorProfile = (token: string, profile: {
  name: string;
  mobileNumber: string;
  professionalQualifications: string;
  specialization: string;
  description: string;
  yearsExperience: number;
  experienceDetails: string;
  certificationDetails: string;
}) => api.patch('/counselors/me', profile, { headers: { Authorization: 'Bearer ' + token } });

export const enrollInCounselorCertification = (token: string) =>
  api.post('/counselors/me/certification-enrollment', {}, { headers: { Authorization: `Bearer ${token}` } });

export const getMyCounselorAppointments = (token: string) =>
  api.get('/counselors/me/bookings', { headers: { Authorization: `Bearer ${token}` } });

export const getMyCounselorAvailability = (token: string) =>
  api.get('/counselors/me/slots', { headers: { Authorization: `Bearer ${token}` } });

export const updateMyCounselorAvailability = (token: string, date: string, startTimes: string[]) =>
  api.put(
    '/counselors/me/availability',
    { date, startTimes },
    { headers: { Authorization: 'Bearer ' + token } }
  );

export const updateMyCounselorMeetingLink = (bookingId: string, meetingLink: string, token: string) =>
  api.patch(
    `/counselors/me/bookings/${bookingId}/meeting-link`,
    { meetingLink },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const saveCounselingSessionChecklist = (
  bookingId: string,
  answers: Record<string, string>,
  token: string
) =>
  api.put(
    `/counselors/me/bookings/${bookingId}/checklist`,
    { answers },
    { headers: { Authorization: 'Bearer ' + token } }
  );

export const getAdminCounselorCertifications = (token: string) =>
  api.get('/admin/counselor-certifications', { headers: { Authorization: `Bearer ${token}` } });

export const reviewAdminCounselorCertification = (counselorId: string, verified: boolean, token: string) =>
  api.patch(
    `/admin/counselors/${counselorId}/certification-verification`,
    { verified },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const reviewAdminCounselorApplication = (
  counselorId: string,
  status: 'APPROVED' | 'REJECTED',
  reviewNote: string,
  token: string
) =>
  api.patch(
    `/admin/counselors/${counselorId}/approval`,
    { status, reviewNote },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const resendAdminCounselorApplicationEmail = (counselorId: string, token: string) =>
  api.post(
    `/admin/counselors/${counselorId}/application-email`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const getCounselorSlots = (token: string) =>
  api
    .get('/counselors', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => ({
      data: (response.data || []).flatMap((counselor: any) => counselor.slots || []),
    }));

export const getCounselorBookings = (token: string) =>
  api
    .get('/reports/counselor/my-reports', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => ({
      data: (response.data || []).map((report: any) => ({
        ...report.booking,
        report: { approvalStatus: report.approvalStatus, createdAt: report.createdAt },
      })),
    }));

export const getMyBookings = (token: string) =>
  api.get('/bookings/my-bookings', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getCounselingEligibility = (token: string) =>
  api.get('/bookings/eligibility', {
    headers: { Authorization: `Bearer ${token}` },
  });

export interface StudentCareerReport {
  strengths: string;
  developmentAreas: string;
  interests: string;
  careerDirectionsToExplore: string;
  streamOptionsToDiscuss: string;
  counselingActionPlan: string;
}

export interface StudentCareerAssessment {
  id: string;
  studentClass: string;
  schoolCollege: string;
  phoneNumber: string;
  educationBoard: string;
  academicPerformance: string;
  strongSubjects: string;
  dislikedSubjects: string;
  hobbies: string;
  strengths: string;
  improvementAreas: string;
  coursesOfInterest: string;
  learningStyle: string;
  likes: string;
  dislikes: string;
  careerGoal: string;
  parentsAspiration: string;
  report: StudentCareerReport | null;
  reportEmailSentAt: string | null;
}

export const getMyCareerAssessment = (token: string) =>
  api.get<StudentCareerAssessment | null>('/career-assessments/me', {
    headers: { Authorization: 'Bearer ' + token },
  });

export const saveMyCareerAssessment = (
  assessment: Omit<StudentCareerAssessment, 'id' | 'report' | 'reportEmailSentAt'>,
  token: string
) =>
  api.post<{ assessment: StudentCareerAssessment; emailSent: boolean; emailError?: string; alreadyGenerated?: boolean }>(
    '/career-assessments/me',
    assessment,
    { headers: { Authorization: 'Bearer ' + token } }
  );

export const resendMyCareerReport = (token: string) =>
  api.post<{ emailSent: boolean }>(
    '/career-assessments/me/email',
    {},
    { headers: { Authorization: 'Bearer ' + token } }
  );

export const getBookingById = (bookingId: string, token: string) =>
  api.get(`/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const submitBookingDetails = (bookingId: string, details: any, token: string) =>
  api.put(`/bookings/${bookingId}/details`, details, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getBookingReport = (bookingId: string, token: string) =>
  api.get(`/bookings/${bookingId}/report`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getCourses = (board?: string) => api.get('/courses', { params: board ? { board } : {} });

export const getCourseById = (courseId: string) => api.get(`/courses/${courseId}`);

export const enrollInCourse = (courseId: string, token: string) =>
  api.post(
    '/enrollments',
    { courseId },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const getMyEnrollments = (token: string) =>
  api.get('/enrollments/student/my-enrollments', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getEnrollment = (enrollmentId: string, token: string) =>
  api.get(`/enrollments/${enrollmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateEnrollmentProgress = (enrollmentId: string, progress: number, token: string) =>
  api.put(
    `/enrollments/${enrollmentId}/progress`,
    { progress },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const unenrollFromCourse = (enrollmentId: string, token: string) =>
  api.delete(`/enrollments/${enrollmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const createPaymentOrder = (bookingId: string, amount: number, token: string) =>
  api.post(
    '/payments/create-order',
    { bookingId, amount },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const verifyPayment = (
  orderId: string,
  paymentId: string,
  signature: string,
  bookingId: string,
  token: string
) =>
  api.post(
    '/payments/verify-payment',
    { orderId, paymentId, signature, bookingId },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const recoverBookingPayment = (bookingId: string, token: string) =>
  api.post(
    `/payments/booking/${bookingId}/recover`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const getPaymentDetails = (bookingId: string, token: string) =>
  api.get(`/payments/booking/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const resendPaymentConfirmationEmails = (bookingId: string, token: string) =>
  api.post(
    `/payments/booking/${bookingId}/confirmation-email`,
    {},
    { headers: { Authorization: 'Bearer ' + token } }
  );

export const requestBookingCancellation = (bookingId: string, token: string) =>
  api.post(
    `/bookings/${bookingId}/cancellation`,
    {},
    { headers: { Authorization: 'Bearer ' + token } }
  );

export const createReport = (reportData: any, token: string) =>
  api.post('/reports', reportData, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const generateReportDraft = (bookingId: string, token: string) =>
  api.post(
    `/reports/${bookingId}/generate`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const getAdminReports = (token: string) =>
  api.get('/reports', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const reviewReport = (
  reportId: string,
  status: 'APPROVED' | 'REJECTED',
  reviewNote: string,
  token: string
) =>
  api.patch(
    `/reports/${reportId}/review`,
    { status, reviewNote },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const updateReport = (reportId: string, reportData: any, token: string) =>
  api.put(`/reports/${reportId}`, reportData, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const uploadReport = (bookingId: string, reportData: any, token: string) =>
  api.post(
    '/reports',
    { bookingId, ...reportData },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const getReportByBooking = (bookingId: string, token: string) =>
  api.get(`/reports/booking/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getMyReports = (token: string) =>
  api.get('/reports/student/my-reports', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getCounselorReports = (token: string) =>
  api.get('/reports/counselor/my-reports', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteReport = (reportId: string, token: string) =>
  api.delete(`/reports/${reportId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getAdminOverview = (token: string) =>
  api.get('/admin/overview', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const reviewAdminBookingCancellation = (
  bookingId: string,
  status: 'APPROVED' | 'REJECTED',
  token: string
) =>
  api.patch(
    `/admin/bookings/${bookingId}/cancellation`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const recordAdminBookingRefund = (
  bookingId: string,
  refundReference: string,
  token: string
) =>
  api.patch(
    `/admin/bookings/${bookingId}/refund`,
    { refundReference },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const updateAdminEnrollmentProgress = (enrollmentId: string, progress: number, token: string) =>
  api.patch(
    `/admin/enrollments/${enrollmentId}/progress`,
    { progress },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const updateAdminCounselorFee = (counselorId: string, sessionFee: number, token: string) =>
  api.patch(
    `/admin/counselors/${counselorId}/session-fee`,
    { sessionFee },
    { headers: { Authorization: `Bearer ${token}` } }
  );

// Replace the entire createBooking function with this:
export const createBooking = (data: Record<string, unknown>, token: string) => {
  return api.post('/bookings', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};



export const getCounsellors = () => {
  return api.get('/counsellors');
};


export default api;
