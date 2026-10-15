// services/emailService.ts
import api from './api';

export interface EmailNotification {
  type: 'SESSION_BOOKED' | 'SESSION_REMINDER' | 'REPORT_SUBMITTED' | 'REPORT_READY' | 'PAYMENT_CONFIRMATION';
  recipientEmail: string;
  recipientName: string;
  data: Record<string, any>;
}

/**
 * Send session booking confirmation email
 */
export const sendSessionBookingEmail = async (
  studentEmail: string,
  studentName: string,
  counselorName: string,
  date: string,
  time: string,
  token: string
) => {
  try {
    const response = await api.post(
      '/notifications/send-email',
      {
        type: 'SESSION_BOOKED',
        recipientEmail: studentEmail,
        recipientName: studentName,
        data: {
          counselorName,
          date,
          time,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to send booking email:', error);
    throw error;
  }
};

/**
 * Send session reminder email (24 hours before)
 */
export const sendSessionReminderEmail = async (
  studentEmail: string,
  studentName: string,
  counselorName: string,
  date: string,
  time: string,
  token: string
) => {
  try {
    const response = await api.post(
      '/notifications/send-email',
      {
        type: 'SESSION_REMINDER',
        recipientEmail: studentEmail,
        recipientName: studentName,
        data: {
          counselorName,
          date,
          time,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    throw error;
  }
};

/**
 * Send report submission confirmation to student
 */
export const sendReportSubmittedEmail = async (
  studentEmail: string,
  studentName: string,
  counselorName: string,
  reportTitle: string,
  token: string
) => {
  try {
    const response = await api.post(
      '/notifications/send-email',
      {
        type: 'REPORT_SUBMITTED',
        recipientEmail: studentEmail,
        recipientName: studentName,
        data: {
          counselorName,
          reportTitle,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to send report email:', error);
    throw error;
  }
};

/**
 * Send report ready notification
 */
export const sendReportReadyEmail = async (
  studentEmail: string,
  studentName: string,
  counselorName: string,
  date: string,
  token: string
) => {
  try {
    const response = await api.post(
      '/notifications/send-email',
      {
        type: 'REPORT_READY',
        recipientEmail: studentEmail,
        recipientName: studentName,
        data: {
          counselorName,
          date,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to send report ready email:', error);
    throw error;
  }
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmationEmail = async (
  studentEmail: string,
  studentName: string,
  counselorName: string,
  amount: number,
  date: string,
  time: string,
  transactionId: string,
  token: string
) => {
  try {
    const response = await api.post(
      '/notifications/send-email',
      {
        type: 'PAYMENT_CONFIRMATION',
        recipientEmail: studentEmail,
        recipientName: studentName,
        data: {
          counselorName,
          amount,
          date,
          time,
          transactionId,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to send payment email:', error);
    throw error;
  }
};

/**
 * Get all email notifications for a user
 */
export const getEmailNotifications = async (token: string) => {
  try {
    const response = await api.get('/notifications/emails', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string, token: string) => {
  try {
    const response = await api.patch(
      `/notifications/${notificationId}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};
