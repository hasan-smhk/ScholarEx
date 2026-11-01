# Admin access

Set these values in `backend/.env` before running the database seed:

```env
JWT_SECRET=<long-random-secret>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<at-least-12-characters>
ADMIN_NAME=ScholarEx Administrator
```

From `backend/`, apply pending migrations and regenerate Prisma Client before
seeding:

```sh
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

Use a unique, randomly generated `JWT_SECRET` in each environment. The backend
refuses to start without it. Provision or rotate the administrator account by
running the seed command above. Public registration cannot create administrator
accounts.

Administrators sign in at `/admin/login`. Their signed session token expires
after seven days, is persisted for page refreshes, and can be ended with **Sign
out** in the dashboard. The admin API independently verifies the token and
administrator role for every request.

The dashboard monitors student profiles, course enrollment/progress, counseling
booking and payment status, counselor report submissions, and available activity
timestamps. The current platform does not have a separate assignment-upload
model, so coursework monitoring is based on course progress and counseling
report records.

## Counselling reports and counselor fees

The report-review, counselor-fee, and session-checklist migrations are applied
by the setup commands above. After payment is confirmed, the counselor adds a
session link, which is emailed to the student's registered address. When the
session starts, the counselor can record the student's answers in the four
sections of the counselor checklist in the dashboard. The checklist contains
the 30 questions from the counseling form.

The counselor generates, edits, and approves the AI report first. Selected
academic and career responses are sent to the configured AI provider; family,
relationship, and emotional-wellbeing answers remain in ScholarEx and are
excluded from AI generation. The administrator can edit the report and must
approve it before it is released.
Students can access and receive the report by email only after administrator
approval. If delivery fails, an administrator can retry it from the report
review panel.

Configure an OpenAI-compatible provider in `backend/.env` to enable AI report
generation:

```env
OPENAI_API_KEY=<provider-api-key>
# Optional; defaults to https://api.openai.com/v1
OPENAI_BASE_URL=https://api.openai.com/v1
# Optional; defaults to gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
```

Emails are sent through Resend using `RESEND_API_KEY` and `EMAIL_FROM` in
`backend/.env`. Create a Resend API key and verify the sending domain in Resend
before setting `EMAIL_FROM=Info@jzdtechnologies.com`; the sender address must
belong to a verified domain. Student career report and session-link emails use
`Info <info@jzdtechnologies.com>`. Keep the API key private and restart the
backend after updating the environment. If email delivery fails, the backend
logs the Resend status and provider error; students can retry report delivery
from the report page. New counselor records default to ₹500 per paid session;
administrators can configure a different fee for each counselor. The free
first interaction is a student career report; all new counseling sessions
require payment.

Student registration automatically attempts a confirmation email from
`info@jzdtechnologies.com`; verify that address/domain with Resend. If delivery
fails, registration still succeeds and the sign-in page reports that the email
could not be sent.

Students and counselors can use **Forgot password?** on the sign-in page to
request a reset link. Configure `FRONTEND_URL` in `backend/.env` to the public
frontend URL so the link points to the deployed site. Reset links expire after
one hour and can only be used once. Apply the pending Prisma migration and run
`npx prisma generate` before restarting the backend.

## Counseling payments, cancellations, and refunds

Paid bookings use Razorpay Checkout. The backend verifies the checkout signature
and booking amount before marking the booking paid, then sends confirmation
emails to both the student and counselor. Delivery timestamps are saved per
recipient. If either email fails, the student can retry delivery from the
booking confirmation page after Resend delivery is fixed.

An unpaid slot reservation is held for 60 minutes from booking creation. After
that, the next booking/payment request marks the unpaid booking failed and
releases its slot; the student must choose another slot.

Students first complete a free career assessment and receive a branded report
by email and in the student portal, where it can be printed or saved as PDF.
This does not create a counseling booking. Students then choose a counselor;
the slot remains a temporary reservation until they complete payment. New
bookings are paid, and the counselor receives the student's assessment details.

Counselors add a Zoom or Google Meet HTTPS link to each appointment in the
counselor dashboard. For a paid session, a link saved before payment is held
back until Razorpay confirms payment; if the counselor adds the link afterward,
it is emailed then. Link emails use `Info <info@jzdtechnologies.com>`. If link
delivery fails, the counselor can retry from the appointment.

Payment confirmation also runs through the Razorpay webhook at
`POST https://<your-backend-domain>/api/payments/webhook`. In the Razorpay
Dashboard, configure this public HTTPS URL and subscribe to `payment.captured`
and `order.paid`. Generate a webhook secret in Razorpay and set that same value
as `RAZORPAY_WEBHOOK_SECRET` in `backend/.env`; it is separate from
`RAZORPAY_KEY_SECRET`. Keep the webhook secret private. The backend verifies the
signature against the original request body, checks the captured INR amount and
order-to-booking association, and treats duplicate events idempotently. Razorpay
retries webhook deliveries that receive a server error.

If a student returns to an unpaid booking after Checkout was interrupted, the
booking page also checks the saved Razorpay order and captured payments. The
student can select **Already Paid? Check Status** to run the check again. Only a
captured payment is confirmed; an authorized-but-not-captured payment is not
captured automatically.

Students may request cancellation of a confirmed session before it starts.
Administrators review requests in the student management panel. Approval
cancels the booking and releases its slot; rejection leaves the session
confirmed. Refunds are **manual, not automatic**: after approving cancellation,
an administrator processes any eligible refund in Razorpay using the stored
Razorpay payment ID, then records the refund ID in the admin panel. The booking
is marked refunded only after that reference is recorded. Complimentary
sessions do not have a monetary refund.

Before deploying these changes, run `npx prisma migrate deploy` from `backend\`
to add cancellation, payment reference, payment-email, and session-link delivery
fields to the database. Run `npx prisma generate` and restart the backend after
applying the migration.

## Counsellor registration and courses

Public registration supports students and counsellors through the existing
authentication endpoint. Counsellor registration creates a pending `COUNSELOR`
application, links a private profile, and stores professional experience
separately from certification-program enrolment. The public form never accepts
an administrator role. Applicants receive a confirmation email when Resend
delivery is available; an administrator can retry a failed confirmation from
the admin panel.

Administrators manually review submitted qualifications, experience, and
certification details. The admin panel is the only path to approve or reject an
application. Approval adds the counselor to the student-facing counselor list,
unlocks counselor sign-in and features, and sends an email notification; failed
decision emails can be retried from the same panel. Pending and rejected
counselors are not shown to students and cannot access counselor APIs. The
rejection email directs applicants to contact `Info@jzdtechnologies.com` for
questions and suggests the ScholarEx counselor certification courses. The
current policy does not mandate a particular experience minimum or
certification; configure `COUNSELOR_REGISTRATION_REQUIRE_EXPERIENCE=true` only
when the organization adopts a minimum of more than one year.

A counsellor reporting an existing certification remains pending verification
until an administrator separately checks the details; a counsellor cannot mark
their own certification as verified. A counsellor with one year or less may
enrol in the optional ScholarEx counsellor certification programme or continue
without enrolment.

Approved counsellors manage their own bookable availability in the dashboard.
They can add or remove one-hour weekday sessions between 5:00 PM and 8:00 PM
India Standard Time (IST);
changes are reflected in student booking, and booking requests can reserve only
an active, unbooked slot. Removing an availability time preserves the slot and
any related appointment history. The `20261028184100_manual_counselor_availability`
migration disables legacy auto-generated slots and retires the pre-seeded
`Syed Baqar` profile without deleting its appointment records. Counselors must
add their availability after this migration is deployed.

Counsellor profile and appointment endpoints are scoped to the authenticated
counsellor. Counsellors can update their own professional details, view
assigned student appointment and academic/intake details, and add or update
HTTPS meeting links. Family and contact details from student counselling
forms are not included in the counselor appointment view.

The existing course catalogue contains student learning courses (board
subjects and skill-development courses), while counsellor profiles are used to
provide counselling for students. Counsellors may browse course information,
but student course enrolment remains limited to student accounts. Counsellor
certification-program enrolment is stored separately and does not create a
student course-enrolment record.
