// components/EmailTemplates.tsx
/**
 * Reusable email templates for all notification types
 */

export const SESSION_BOOKED_TEMPLATE = (data: {
  studentName: string;
  counselorName: string;
  date: string;
  time: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #333;
    }
    .details-box {
      background: #f8f9ff;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #667eea;
    }
    .detail-value {
      color: #333;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      background: #f8f9ff;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Session Booked!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.studentName},</p>
      <p>Great! Your counseling session has been successfully booked with ${data.counselorName}.</p>
      
      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">📅 Date:</span>
          <span class="detail-value">${data.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">⏰ Time:</span>
          <span class="detail-value">${data.time}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">👨‍🏫 Counselor:</span>
          <span class="detail-value">${data.counselorName}</span>
        </div>
      </div>

      <p>Please make sure to be online a few minutes before the scheduled time. You can join the session from your ScholarEx dashboard.</p>
      
      <a href="https://scholarex.com/dashboard" class="button">View Your Dashboard</a>

      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        If you need to reschedule, please contact us at support@scholarex.com
      </p>
    </div>
    <div class="footer">
      <p>© 2024 ScholarEx. All rights reserved.</p>
      <p>This is an automated email. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
`;

export const SESSION_REMINDER_TEMPLATE = (data: {
  studentName: string;
  counselorName: string;
  date: string;
  time: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #333;
    }
    .details-box {
      background: #fff8f0;
      border-left: 4px solid #f5576c;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
    }
    .detail-label {
      font-weight: 600;
      color: #f5576c;
    }
    .detail-value {
      color: #333;
    }
    .button {
      display: inline-block;
      background: #f5576c;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      background: #f8f9ff;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Session Reminder</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.studentName},</p>
      <p>Your counseling session with ${data.counselorName} is coming up tomorrow!</p>
      
      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">📅 Date:</span>
          <span class="detail-value">${data.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">⏰ Time:</span>
          <span class="detail-value">${data.time}</span>
        </div>
      </div>

      <p>Please ensure you are:</p>
      <ul>
        <li>Connected to a stable internet connection</li>
        <li>In a quiet environment</li>
        <li>Online a few minutes before the scheduled time</li>
      </ul>
      
      <a href="https://scholarex.com/dashboard" class="button">Join Session</a>

      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        If you need to reschedule, contact us as soon as possible.
      </p>
    </div>
    <div class="footer">
      <p>© 2024 ScholarEx. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const REPORT_READY_TEMPLATE = (data: {
  studentName: string;
  counselorName: string;
  date: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #333;
    }
    .highlight-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      margin: 20px 0;
      border-radius: 8px;
      text-align: center;
    }
    .highlight-box p {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      background: #f8f9ff;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Your Report is Ready!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.studentName},</p>
      <p>${data.counselorName} has submitted your counseling session report!</p>
      
      <div class="highlight-box">
        <p>✨ Your personalized counseling report is now available</p>
      </div>

      <p>The report includes:</p>
      <ul>
        <li>📊 Detailed session summary</li>
        <li>💪 Your identified strengths</li>
        <li>🎯 Areas for improvement</li>
        <li>💡 Personalized recommendations</li>
        <li>📈 Next steps for your success</li>
      </ul>

      <p style="text-align: center; margin: 30px 0;">
        <a href="https://scholarex.com/dashboard/reports" class="button">View Your Report</a>
      </p>

      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        You can download and share this report with your parents or guardians.
      </p>
    </div>
    <div class="footer">
      <p>© 2024 ScholarEx. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const PAYMENT_CONFIRMATION_TEMPLATE = (data: {
  studentName: string;
  counselorName: string;
  amount: number;
  date: string;
  time: string;
  transactionId: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #333;
    }
    .invoice-box {
      background: #f8f9ff;
      border: 1px solid #e0e0e0;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .invoice-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .invoice-row:last-child {
      border-bottom: none;
    }
    .invoice-label {
      font-weight: 600;
      color: #666;
    }
    .invoice-value {
      color: #333;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 15px 0;
      border-top: 2px solid #667eea;
      margin-top: 10px;
      font-size: 18px;
      font-weight: 700;
    }
    .button {
      display: inline-block;
      background: #11998e;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      background: #f8f9ff;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Payment Confirmed</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.studentName},</p>
      <p>Thank you for your payment! Your counseling session has been confirmed.</p>
      
      <div class="invoice-box">
        <div class="invoice-row">
          <span class="invoice-label">Session Counselor:</span>
          <span class="invoice-value">${data.counselorName}</span>
        </div>
        <div class="invoice-row">
          <span class="invoice-label">Session Date:</span>
          <span class="invoice-value">${data.date}</span>
        </div>
        <div class="invoice-row">
          <span class="invoice-label">Session Time:</span>
          <span class="invoice-value">${data.time}</span>
        </div>
        <div class="invoice-row">
          <span class="invoice-label">Amount Paid:</span>
          <span class="invoice-value">₹${data.amount}</span>
        </div>
        <div class="invoice-row">
          <span class="invoice-label">Transaction ID:</span>
          <span class="invoice-value">${data.transactionId}</span>
        </div>
        <div class="total-row">
          <span>Invoice Total</span>
          <span style="color: #11998e;">₹${data.amount}</span>
        </div>
      </div>

      <a href="https://scholarex.com/dashboard" class="button">View Details</a>

      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        A receipt has been attached to this email for your records.
      </p>
    </div>
    <div class="footer">
      <p>© 2024 ScholarEx. All rights reserved.</p>
      <p>For invoice queries, contact support@scholarex.com</p>
    </div>
  </div>
</body>
</html>
`;
