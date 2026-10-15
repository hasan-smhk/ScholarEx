import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Loader2, ArrowLeft, Download, Edit2, Save, CheckCircle2, Sparkles } from 'lucide-react';
import { getReportByBooking, createReport, getBookingById, generateReportDraft } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportNotificationBanner from '../components/ReportNotificationBanner';

interface Booking {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  slot: {
    date: string;
    startTime: string;
    endTime: string;
    counselor: {
      name: string;
      specialization: string;
    };
  };
  educationBackground: string;
  currentStream: string;
  careerAspiration: string | null;
  areasOfInterest: string | null;
  report?: { approvalStatus: string } | null;
}

interface Report {
  id: string;
  strengths: string;
  areasOfImprovement: string;
  recommendations: string;
  nextSteps: string;
  createdAt: string;
  updatedAt: string;
  approvalStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  isAiGenerated: boolean;
  reviewNote: string | null;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });

const CounselorReportPage: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const isCounselor = user?.role === 'COUNSELOR' || user?.role === 'ADMIN';

  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    show: false,
    type: 'success',
    message: '',
  });

  const [formData, setFormData] = useState({
    strengths: '',
    areasOfImprovement: '',
    recommendations: '',
    nextSteps: '',
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, token, isCounselor]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!bookingId || !token) {
        setError('Invalid session');
        return;
      }

      const bookingRes = await getBookingById(bookingId, token);
      setBooking(bookingRes.data);

      try {
        const reportRes = await getReportByBooking(bookingId, token);
        setReport(reportRes.data);
        setIsAiGenerated(reportRes.data.isAiGenerated);
        setIsEditing(isCounselor && reportRes.data.approvalStatus === 'REJECTED');
        setFormData({
          strengths: reportRes.data.strengths || '',
          areasOfImprovement: reportRes.data.areasOfImprovement || '',
          recommendations: reportRes.data.recommendations || '',
          nextSteps: reportRes.data.nextSteps || '',
        });
      } catch (err: any) {
        if (err.response?.status !== 404) {
          throw err;
        }
        setReport(null);
        setIsAiGenerated(false);
        setIsEditing(isCounselor);
        setFormData({
          strengths: '',
          areasOfImprovement: '',
          recommendations: '',
          nextSteps: '',
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!bookingId || !token) return;
    try {
      setGenerating(true);
      const { data } = await generateReportDraft(bookingId, token);
      setFormData(data);
      setIsAiGenerated(true);
      setNotification({
        show: true,
        type: 'success',
        message: 'AI draft generated from relevant academic and counselling details. Review it before submitting.',
      });
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        message: err.response?.data?.error || 'Could not generate the AI report draft.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !token) return;

    try {
      setSubmitting(true);
      const response = await createReport(
        {
          bookingId,
          ...formData,
          isAiGenerated,
        },
        token
      );
      setReport(response.data.report);
      setIsEditing(false);
      setNotification({
        show: true,
        type: 'success',
        message: 'Report submitted for admin review. The student will be emailed after approval.',
      });
    } catch (err: any) {
      console.error(err);
      setNotification({
        show: true,
        type: 'error',
        message: ` Error: ${err?.response?.data?.error || 'Failed to save report'}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!booking || !report) return;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Counselling Report - ${escapeHtml(booking.student.name)}</title>
<style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
  .section { margin: 20px 0; padding: 20px; border-left: 4px solid #667eea; background: #f9fafb; }
  .label { font-weight: bold; color: #667eea; margin-top: 15px; }
  .divider { border-top: 1px solid #ddd; margin: 20px 0; }
  .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  td { padding: 10px; border-bottom: 1px solid #ddd; }
  .bold { font-weight: bold; }
</style>
</head>
<body>
  <div class="header">
    <h1>📋 Counseling Session Report</h1>
    <p>ScholarEx</p>
  </div>

  <div style="padding: 30px;">
    <h2>Academic and counselling context</h2>
    <table>
      <tr><td class="bold">Student:</td><td>${escapeHtml(booking.student.name)}</td></tr>
      <tr><td class="bold">Education background:</td><td>${escapeHtml(booking.educationBackground || 'N/A')}</td></tr>
      <tr><td class="bold">Current stream:</td><td>${escapeHtml(booking.currentStream || 'N/A')}</td></tr>
      <tr><td class="bold">Career aspiration:</td><td>${escapeHtml(booking.careerAspiration || 'N/A')}</td></tr>
      <tr><td class="bold">Areas of interest:</td><td>${escapeHtml(booking.areasOfInterest || 'N/A')}</td></tr>
    </table>

    <h2>Session Details</h2>
    <table>
      <tr><td class="bold">Date:</td><td>${new Date(booking.slot.date).toLocaleDateString()}</td></tr>
      <tr><td class="bold">Time:</td><td>${booking.slot.startTime} - ${booking.slot.endTime}</td></tr>
      <tr><td class="bold">Counselor:</td><td>${escapeHtml(booking.slot.counselor.name)}</td></tr>
      <tr><td class="bold">Specialization:</td><td>${escapeHtml(booking.slot.counselor.specialization)}</td></tr>
    </table>

    <h2>Counselor Assessment</h2>

    <div class="section"><div class="label">💪 Student Strengths</div><p>${escapeHtml(report.strengths || 'N/A')}</p></div>
    <div class="section"><div class="label">🎯 Areas for Improvement</div><p>${escapeHtml(report.areasOfImprovement || 'N/A')}</p></div>
    <div class="section"><div class="label">💡 Recommendations</div><p>${escapeHtml(report.recommendations || 'N/A')}</p></div>
    <div class="section"><div class="label">📈 Next Steps</div><p>${escapeHtml(report.nextSteps || 'N/A')}</p></div>

    <div class="footer"><p>Generated on ${new Date().toLocaleString()}</p><p>© ${new Date().getFullYear()} ScholarEx. All rights reserved.</p></div>
  </div>
</body>
</html>`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
    element.setAttribute('download', `Report_${booking.student.name.replace(/[^\w.-]+/g, '_')}_${Date.now()}.html`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setNotification({ show: true, type: 'success', message: '📄 Report downloaded as HTML' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium">{error}</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center"><p className="text-gray-500">Booking not found</p></div>
      </div>
    );
  }

  return (
    <div className="scholar-page min-h-screen pb-16">
      <ReportNotificationBanner show={notification.show} type={notification.type} message={notification.message} onClose={() => setNotification({ ...notification, show: false })} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Counselor Report</h1>
                <p className="text-sm text-gray-500 mt-1">Student: <span className="font-bold">{booking.student.name}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {report && !isEditing && (!isCounselor ? report.approvalStatus === 'APPROVED' : true) && (
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Session Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{new Date(booking.slot.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-medium text-gray-900">{booking.slot.startTime} - {booking.slot.endTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Education Background</p>
              <p className="font-medium text-gray-900">{booking.educationBackground}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Stream</p>
              <p className="font-medium text-gray-900">{booking.currentStream}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {isEditing ? (<><Edit2 className="w-5 h-5" /> Edit Report</>) : report ? (<><FileText className="w-5 h-5" /> Report Content</>) : (<><FileText className="w-5 h-5" /> Create New Report</>)}
            </h2>
            {isCounselor && report && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                <Edit2 className="w-4 h-4" /> Edit Report
              </button>
            )}
          </div>

          {isCounselor ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {isEditing && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-violet-900">
                    Generate a draft using only academic, interest, and subject details relevant to {booking.slot.counselor.specialization}.
                    Family, contact, and demographic details are excluded. These selected details are sent to your configured AI provider.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateDraft}
                    disabled={generating}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60"
                  >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generating ? 'Generating...' : 'Generate AI draft'}
                  </button>
                </div>
                {isAiGenerated && <p className="mt-2 text-xs font-semibold text-violet-800">AI-generated draft — review and edit before submission.</p>}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Student Strengths</label>
              <textarea name="strengths" value={formData.strengths} onChange={handleChange} readOnly={!isEditing} placeholder="e.g., Strong analytical skills, good focus..." className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-indigo-200' : 'border-gray-100 bg-gray-50 text-gray-600'}`} rows={3} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Areas for Improvement</label>
              <textarea name="areasOfImprovement" value={formData.areasOfImprovement} onChange={handleChange} readOnly={!isEditing} placeholder="e.g., Time management, subject focus..." className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-indigo-200' : 'border-gray-100 bg-gray-50 text-gray-600'}`} rows={3} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Recommendations</label>
              <textarea name="recommendations" value={formData.recommendations} onChange={handleChange} readOnly={!isEditing} placeholder="e.g., Join study groups, practice past papers..." className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-indigo-200' : 'border-gray-100 bg-gray-50 text-gray-600'}`} rows={3} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Next Steps</label>
              <textarea name="nextSteps" value={formData.nextSteps} onChange={handleChange} readOnly={!isEditing} placeholder="e.g., Complete module 3, schedule follow-up..." className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-indigo-200' : 'border-gray-100 bg-gray-50 text-gray-600'}`} rows={3} />
            </div>

            {isEditing && (
              <div className="flex gap-4 pt-6">
                <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>) : (<><Save className="w-4 h-4" /> Save Changes</>)}
                </button>
                <button type="button" onClick={() => { setIsEditing(false); if (report) { setFormData({ strengths: report.strengths, areasOfImprovement: report.areasOfImprovement, recommendations: report.recommendations, nextSteps: report.nextSteps }); } }} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              </div>
            )}
          </form>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <h3 className="font-bold">
                {report
                  ? 'Your report is approved'
                  : booking.report?.approvalStatus === 'PENDING_REVIEW'
                    ? 'Your report is being reviewed'
                    : booking.report?.approvalStatus === 'REJECTED'
                      ? 'Your counselor is revising the report'
                      : 'Your report is not ready yet'}
              </h3>
              <p className="mt-1 text-sm">
                {report
                  ? 'The approved report is shown below.'
                  : 'We will email you when your counselor submits the report and an administrator approves it.'}
              </p>
            </div>
          )}

          {!isCounselor && report && (
            <div className="mt-6 space-y-4">
              {[
                ['Student strengths', report.strengths],
                ['Areas for improvement', report.areasOfImprovement],
                ['Recommendations', report.recommendations],
                ['Next steps', report.nextSteps],
              ].map(([heading, content]) => (
                <section key={heading} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <h3 className="font-bold text-gray-900">{heading}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-gray-700">{content || 'Not provided'}</p>
                </section>
              ))}
            </div>
          )}

          {isCounselor && !isEditing && report && (
            <div className="mt-8 bg-indigo-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-indigo-600" />
                <h3 className="text-lg font-bold text-indigo-900">
                  {report.approvalStatus === 'APPROVED'
                    ? 'Report approved'
                    : report.approvalStatus === 'REJECTED'
                      ? 'Changes requested'
                      : 'Awaiting admin review'}
                </h3>
              </div>
              <p className="text-indigo-700 mb-4">
                {report.approvalStatus === 'APPROVED'
                  ? 'The student has been emailed and can view the report.'
                  : report.approvalStatus === 'REJECTED'
                    ? 'Update the report and submit it for review again.'
                    : 'The student cannot view this report until an administrator approves it.'}
              </p>
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"><Edit2 className="w-4 h-4" /> Edit Report</button>
            </div>
          )}
          {isCounselor && report?.approvalStatus === 'REJECTED' && report.reviewNote && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Admin review note: {report.reviewNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CounselorReportPage;