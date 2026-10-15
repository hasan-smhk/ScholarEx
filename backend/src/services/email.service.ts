import nodemailer from 'nodemailer';

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error('Email delivery is not configured: SMTP settings are missing');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
  });
  await transporter.sendMail({
    from: EMAIL_FROM || EMAIL_USER,
    to: message.to,
    subject: message.subject,
    html: message.html,
  });
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
    <h1>Counselling report submitted for review</h1>
    <p>Hello ${escapeHtml(counselorName)},</p>
    <p>Your report for ${escapeHtml(studentName)} has been sent to an administrator for review.
    The student will receive an email only after approval.</p>
    <p><a href="${escapeHtml(reportLink)}">View or update the report</a></p>
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
        : 'Your counselor application was not approved at this time.'}</p>
      ${reviewNote ? `<p><strong>Administrator note:</strong> ${escapeHtml(reviewNote)}</p>` : ''}
      ${approved ? `<p><a href="${escapeHtml(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/counselor/login`)}">Sign in to ScholarEx</a></p>` : ''}
    </div>
  `,
});
