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

The report-review and counselor-fee migrations are applied by the setup
commands above. Counselors can generate a draft from the student's academic,
subject, and counselling-interest details; family, contact, and demographic
details are excluded. Counselors review and submit the draft, and students
cannot access it until an administrator approves it. An approved report is
emailed to the student; if delivery fails, an administrator can retry the
email from the report review panel.

Configure an OpenAI-compatible provider in `backend/.env` to enable draft
generation:

```env
OPENAI_API_KEY=<provider-api-key>
# Optional; defaults to https://api.openai.com/v1
OPENAI_BASE_URL=https://api.openai.com/v1
# Optional; defaults to gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
```

Report approval emails use the configured `SMTP_HOST`, `SMTP_PORT`, `EMAIL_USER`,
`EMAIL_PASSWORD`, and optional `EMAIL_FROM` settings. Without these settings,
email delivery fails explicitly and admins can retry after configuration is
fixed. New counselor records default to ₹500 per paid session; administrators
can configure a different fee for each counselor. The first student session
remains free.

## Counsellor registration and courses

Public registration supports students and counsellors through the existing
authentication endpoint. Counsellor registration creates a pending `COUNSELOR`
application, links a private profile, and stores professional experience
separately from certification-program enrolment. The public form never accepts
an administrator role. Applicants receive a confirmation email when SMTP
delivery is available; an administrator can retry a failed confirmation from
the admin panel.

Administrators manually review submitted qualifications, experience, and
certification details. The admin panel is the only path to approve or reject an
application. Approval adds the counselor to the student-facing counselor list,
unlocks counselor sign-in and features, and sends an email notification; failed
decision emails can be retried from the same panel. Pending and rejected
counselors are not shown to students and cannot access counselor APIs. The
current policy does not mandate a particular experience minimum or
certification; configure `COUNSELOR_REGISTRATION_REQUIRE_EXPERIENCE=true` only
when the organization adopts a minimum of more than one year.

A counsellor reporting an existing certification remains pending verification
until an administrator separately checks the details; a counsellor cannot mark
their own certification as verified. A counsellor with one year or less may
enrol in the optional ScholarEx counsellor certification programme or continue
without enrolment.

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
