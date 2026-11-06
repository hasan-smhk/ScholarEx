# ScholarEx

ScholarEx is a counseling platform where students book counseling sessions, pay for them online, and receive a session link and, after review, a counseling report. Counselors manage their availability and run sessions, and admins approve counselors and reports.

## Features

### Roles
- **Student:** browse counselors, book a free first session, book paid follow-up sessions, pay through Razorpay, and receive the session link and final report by email.
- **Counselor:** register (pending admin approval), sign in through the counselor tab, set weekday availability, generate session links, complete the session checklist, and generate, edit, and approve AI reports.
- **Admin:** approve or reject counselor registrations, review and edit counselor-approved reports, and approve them for delivery. Admins see the homepage and advertisements only.

### Booking and payment
- First session is free and requires the full booking form.
- Second and later sessions require payment through Razorpay, and the payment is verified with a signed webhook.
- Students can only book slots that counselors have enabled and that aren't already taken. The server checks this again at booking time.

### Counselor availability
- Counselors set their own availability for Monday to Friday, 5:00 PM to 8:00 PM, in one-hour slots.
- Changes appear in the student booking interface the next time a student selects a date.

### Session flow
1. The session is approved, and the student pays the counseling fee.
2. A confirmation email is sent to the student.
3. The counselor generates a session link and sends it to the student's registered email.
4. During the session, the counselor completes the checklist in the dashboard, based on the student's answers.
5. The counselor generates an AI report from the completed checklist and reviews it.
6. The counselor approves the report, and the admin reviews and approves it.
7. The report is emailed automatically to the student.

Both counselors and admins can edit the AI-generated report before approving it.

### Modules
- **Counselling Session:** active.
- **ICSE, CBSE, State Board, Other Courses:** hidden through a single config file (`frontend/src/config/modules.ts`) and blocked at the route and API level. Set `enabled: true` to turn one back on.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Axios, Tailwind CSS, lucide-react, Create React App with CRACO |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with Prisma ORM |
| Auth | JWT (Bearer tokens), bcrypt password hashing, role-based access control |
| Payments | Razorpay (Orders API and webhooks) |
| Email | Resend |
| Meetings | Zoom and Google (session links) |
| AI | Pluggable AI provider for session reports (server-side only) |

## Project Structure

