import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="soft-grid flex min-h-dvh items-start justify-center px-4 py-4 sm:items-center sm:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(49,94,251,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(221,122,0,0.16),_transparent_32%)]" />
      <div className="relative z-10 grid w-full max-w-6xl gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="order-2 px-2 lg:order-1">
          <p className="inline-flex rounded-full border border-border/80 bg-card px-4 py-2 text-xs uppercase tracking-[0.35em] text-subtle">
            Cloud-first academic workspace
          </p>
          <h1 className="mt-5 font-heading text-3xl font-bold leading-tight text-text sm:text-5xl">
            Organize files, notices, teachers, and labs from one responsive dashboard.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-subtle sm:mt-6 sm:text-lg">
            Built for mobile, tablet, and desktop with Next.js, Firebase authentication, Firestore, Cloudinary uploads,
            Tailwind CSS, and Framer Motion.
          </p>
        </div>
        <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
