# Acadex

Cloud-first academic file management system built with Next.js App Router, Firebase Authentication, Firestore, Cloudinary uploads, Tailwind CSS, and Framer Motion.

## Highlights

- Role-based authentication for `admin` and `user`
- Admin dashboard with analytics, recent uploads, subject breakdowns, and quick actions
- User dashboard with live search, notices, monthly exam calendar, and subject-based browsing
- Admin CRUD for subjects, teachers, notices, labs, exams, and academic files
- Teacher-to-subject linking managed by admins
- Five UI themes with dynamic English/Bangla translations
- Phone-number login with temporary password flow for students
- Ready for Vercel deployment with server actions only

## Tech Stack

- Next.js 15
- Firebase Authentication
- Firestore
- Cloudinary for academic file uploads
- Tailwind CSS
- Framer Motion

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SESSION_COOKIE_NAME=academic-session
```

For `FIREBASE_PRIVATE_KEY`, keep newline escapes as `\\n` in Vercel.

## Firestore Collections

### `users`
- `uid`
- `email`
- `phone`
- `loginId`
- `role`
- `mustChangePassword`
- `createdAt`

### `subjects`
- `name`
- `code`
- `createdAt`

### `files`
- `title`
- `fileUrl`
- `publicId`
- `resourceType`
- `format`
- `subjectId`
- `subjectName`
- `uploadDate`
- `uploadedBy`
- `fileType`
- `fileSize`

### `notices`
- `text`
- `fileUrl`
- `date`
- `attachmentName`

### `teachers`
- `name`
- `designation`
- `email`
- `phone`
- `subjectIds`
- `createdAt`

### `labs`
- `title`
- `description`
- `subjectId`
- `subjectName`
- `fileUrl`
- `date`

### `exams`
- `title`
- `subjectId`
- `subjectName`
- `examDate`
- `startTime`
- `room`
- `note`

## Default Subjects

- Computer Application in Pharmacy (`Pharm-2111`)
- Physiology and Anatomy -2 (`Pharm-2109`)
- Pharmacognosy -2 (`Pharm-2107`)
- Basic Pharmaceutics -1 (`Pharm-2105`)
- Pharmaceutical Technology -1 (`Pharm-2101`)
- Pharmacology -1 (`Pharm-2103`)
- Other

## Deployment

1. Install dependencies:

```bash
npm install
```

2. Run locally:

```bash
npm run dev
```

3. Deploy to Vercel and add the same environment variables.

## Firebase Setup Notes

- Enable Email/Password sign-in in Firebase Authentication
- Create a Firestore database in production mode
- Generate a Firebase service account for server actions
- Add Firestore security rules matching the examples below
