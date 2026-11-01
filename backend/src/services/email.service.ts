interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM } = process.env;
  const from = message.from || EMAIL_FROM;
  if (!RESEND_API_KEY || !from) {
    throw new Error('Email delivery is not configured: RESEND_API_KEY and a sender address are required');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.json().catch(() => null) as { message?: unknown } | null;
    const providerMessage =
      typeof responseBody?.message === 'string' ? `: ${responseBody.message}` : '';
    throw new Error(`Resend email delivery failed (HTTP ${response.status})${providerMessage}`);
  }
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

export const reportApprovedEmail = (
  studentName: string,
  counselorName: string,
  counselorSpecialization: string,
  reportLink: string
) => ({
  subject: 'Your counselling report is ready - ScholarEx',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h1>Your counselling report is ready</h1>
      <p>Hello ${escapeHtml(studentName)},</p>
      <p>Your report has been reviewed and approved by ScholarEx. It was prepared for
      <strong>${escapeHtml(counselorSpecialization)}</strong> counselling with
      <strong>${escapeHtml(counselorName)}</strong>.</p>
      <p><a href="${escapeHtml(reportLink)}">Sign in to view your report</a></p>
      <p style="font-size:12px;color:#6b7280">Your report is private to your ScholarEx account.</p>
    </div>
  `,
});

export const reportCreatedNotificationEmail = (
  counselorName: string,
  studentName: string,
  reportLink: string
) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
    <h1>Counselling report saved</h1>
    <p>Hello ${escapeHtml(counselorName)},</p>
    <p>Your report for ${escapeHtml(studentName)} is awaiting your review and approval before it can be sent to an administrator.
    The student will receive an email only after administrator approval.</p>
    <p><a href="${escapeHtml(reportLink)}">Review or update the report</a></p>
  </div>
`;

export const counselorApplicationReceivedEmail = (counselorName: string) => ({
  subject: 'Counselor application received - ScholarEx',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h1>We received your counselor application</h1>
      <p>Hello ${escapeHtml(counselorName)},</p>
      <p>Thank you for applying to join ScholarEx as a counselor. An administrator will review your submitted qualifications, experience, and certification details.</p>
      <p>We will email you when a decision has been made. You can sign in to the counselor portal after your application is approved.</p>
    </div>
  `,
});

export const studentRegistrationConfirmationEmail = (studentName: string) => ({
  from: 'Info <info@jzdtechnologies.com>',
  subject: 'Your ScholarEx account is ready',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h1>Welcome to ScholarEx</h1>
      <p>Hello ${escapeHtml(studentName)},</p>
      <p>Your student account has been created. You can now sign in using the email address and password you registered with.</p>
      <p><a href="${escapeHtml(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/login`)}">Sign in to ScholarEx</a></p>
      <p style="font-size:12px;color:#6b7280">For your security, we will never ask you to share your password by email.</p>
    </div>
  `,
});

export const passwordResetEmail = (accountName: string, resetLink: string) => ({
  subject: 'Reset your ScholarEx password',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h1>Reset your password</h1>
      <p>Hello ${escapeHtml(accountName)},</p>
      <p>We received a request to reset the password for your ScholarEx account. Use the link below within one hour to choose a new password.</p>
      <p><a href="${escapeHtml(resetLink)}">Reset your password</a></p>
      <p>If you did not request this, you can ignore this email. Your password will not change.</p>
    </div>
  `,
});

export const counselorApplicationDecisionEmail = (
  counselorName: string,
  approved: boolean,
  reviewNote?: string | null
) => ({
  subject: approved
    ? 'Your ScholarEx counselor application is approved'
    : 'Update on your ScholarEx counselor application',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h1>${approved ? 'Your application is approved' : 'An update on your application'}</h1>
      <p>Hello ${escapeHtml(counselorName)},</p>
      <p>${approved
        ? 'Your counselor application has been approved. You can now sign in and access the counselor portal.'
        : 'Your counselor application was not approved at this time. For further questions, contact ScholarEx at <a href="mailto:Info@jzdtechnologies.com">Info@jzdtechnologies.com</a>. You may also consider taking the counselor certification courses available through the ScholarEx platform before applying again.'}</p>
      ${reviewNote ? `<p><strong>Administrator note:</strong> ${escapeHtml(reviewNote)}</p>` : ''}
      ${approved ? `<p><a href="${escapeHtml(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/counselor/login`)}">Sign in to ScholarEx</a></p>` : ''}
    </div>
  `,
});

export const studentPaymentConfirmationEmail = (
  studentName: string,
  counselorName: string,
  specialization: string,
  date: string,
  startTime: string,
  endTime: string,
  amount: number
) => ({
  subject: 'Counselling session payment confirmed - ScholarEx',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h1>Your counselling session is confirmed</h1>
      <p>Hello ${escapeHtml(studentName)},</p>
      <p>We have received your payment of ₹${amount.toFixed(2)} for your counselling session.</p>
      <p><strong>Counselor:</strong> ${escapeHtml(counselorName)} (${escapeHtml(specialization)})</p>
      <p><strong>Date:</strong> ${escapeHtml(date)}<br /><strong>Time:</strong> ${escapeHtml(startTime)}–${escapeHtml(endTime)} IST</p>
      <p>You can review the session in your ScholarEx account.</p>
    </div>
  `,
});

export const counselorPaymentConfirmationEmail = (
  counselorName: string,
  studentName: string,
  specialization: string,
  date: string,
  startTime: string,
  endTime: string,
  amount: number
) => ({
  subject: 'New counselling session confirmed - ScholarEx',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h1>A counselling session is confirmed</h1>
      <p>Hello ${escapeHtml(counselorName)},</p>
      <p>${escapeHtml(studentName)} has booked a counselling session in ${escapeHtml(specialization)}.</p>
      <p><strong>Date:</strong> ${escapeHtml(date)}<br /><strong>Time:</strong> ${escapeHtml(startTime)}–${escapeHtml(endTime)} IST</p>
      <p><strong>Session fee:</strong> ₹${amount.toFixed(2)}</p>
      <p>Sign in to your ScholarEx counselor account to review the appointment.</p>
    </div>
  `,
});

export const studentSessionLinkEmail = (
  studentName: string,
  counselorName: string,
  date: string,
  startTime: string,
  endTime: string,
  meetingLink: string
) => ({
  from: 'Info <info@jzdtechnologies.com>',
  subject: 'Your ScholarEx counselling session link',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h1>Your counselling session link</h1>
      <p>Hello ${escapeHtml(studentName)},</p>
      <p>Your session with ${escapeHtml(counselorName)} is scheduled for
      ${escapeHtml(date)}, ${escapeHtml(startTime)}–${escapeHtml(endTime)} IST.</p>
      <p><a href="${escapeHtml(meetingLink)}">Join your session on Zoom or Google Meet</a></p>
      <p style="font-size:12px;color:#6b7280">If you were not expecting this message, sign in to your ScholarEx account to review your booking.</p>
    </div>
  `,
});

export const studentCareerReportEmail = (
  studentName: string,
  report: {
    strengths: string;
    developmentAreas: string;
    interests: string;
    careerDirectionsToExplore: string;
    streamOptionsToDiscuss: string;
    counselingActionPlan: string;
  },
  reportLink: string
) => ({
  from: 'Info <info@jzdtechnologies.com>',
  subject: 'Your free ScholarEx career guidance report',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#1f2937">
      <img src="${escapeHtml(`${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')}/scholarex-logo.png`)}" alt="ScholarEx" style="display:block;max-width:190px;height:auto;margin:0 auto 24px" />
      <h1>Your free AI career guidance report</h1>
      <p>Hello ${escapeHtml(studentName)},</p>
      <p>Your ScholarEx report is ready. It is a starting point for exploring your interests and options, not a final career decision.</p>
      ${[
        ['Strengths', report.strengths],
        ['Development areas', report.developmentAreas],
        ['Interests', report.interests],
        ['Career directions to explore', report.careerDirectionsToExplore],
        ['Stream options to discuss', report.streamOptionsToDiscuss],
        ['Counselling action plan', report.counselingActionPlan],
      ].map(([heading, content]) => `
        <section style="margin:18px 0;padding:16px;border-left:4px solid #0f766e;background:#f8fafc">
          <h2 style="margin:0 0 8px;color:#0f766e;font-size:18px">${escapeHtml(heading)}</h2>
          <p style="margin:0;white-space:pre-wrap;line-height:1.6">${escapeHtml(content)}</p>
        </section>
      `).join('')}
      <p><a href="${escapeHtml(reportLink)}">Open and download your report</a></p>
      <p style="font-size:12px;color:#6b7280">Career and stream suggestions are exploratory. Confirm course eligibility and requirements with your school.</p>
    </div>
  `,
});
