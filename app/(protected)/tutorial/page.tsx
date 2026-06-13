import Link from "next/link";
import {
  BookOpen,
  Bot,
  CalendarDays,
  Download,
  FileUp,
  GraduationCap,
  KeyRound,
  Megaphone,
  Search,
  ShieldCheck,
  Table2,
  Users2
} from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { requireUser } from "@/lib/auth/guards";

const quickStart = [
  {
    title: "Open the 3-line menu",
    text: "Use the menu to reach Search, AI Assistant, Settings, Notices, Teachers, Labs, and this Tutorial page."
  },
  {
    title: "Use the bottom capsule on mobile",
    text: "Dashboard, Subjects, Routine, and Search stay at the bottom for fast one-hand navigation."
  },
  {
    title: "Preview before downloading",
    text: "Open files inside Acadex first. Download only when you need an offline copy."
  },
  {
    title: "Ask Acadex AI",
    text: "Type natural questions in English, Bangla, or mixed language to find and explain resources."
  }
];

const featureSections = [
  {
    title: "Dashboard",
    icon: GraduationCap,
    text: "See your subjects, total files, uploaded PDFs, notices, today classes, calendar highlights, and reading activity."
  },
  {
    title: "Subjects",
    icon: BookOpen,
    text: "Select a semester, open a subject, enter sections or folders, then preview or download files uploaded by admin or manager."
  },
  {
    title: "AI Assistant",
    icon: Bot,
    text: "Ask for notes, slides, teachers, notices, or topic explanations. AI ranks Acadex resources and shows open and download buttons."
  },
  {
    title: "Search",
    icon: Search,
    text: "Find files, subjects, teachers, labs, notices, and updates. On mobile, search opens from the bottom capsule."
  },
  {
    title: "Routine",
    icon: Table2,
    text: "View weekly class times by subject and teacher. Admins and managers can add or update class routines."
  },
  {
    title: "Calendar",
    icon: CalendarDays,
    text: "Check exam dates and events. Passed exams disappear automatically from active calendar lists."
  },
  {
    title: "Notices",
    icon: Megaphone,
    text: "Read notices and open attachments inside the website. New unseen notices can appear as a notification popup."
  },
  {
    title: "Teachers",
    icon: Users2,
    text: "Browse teacher profiles and linked subjects. Admins can connect teachers to subject sections and routines."
  },
  {
    title: "Files and downloads",
    icon: Download,
    text: "Files keep their original format. Use Preview/Open for in-site viewing and Download for a pure copy."
  },
  {
    title: "Settings",
    icon: KeyRound,
    text: "Change theme, surface mode, profile settings, and optionally connect a personal OpenAI API key."
  }
];

const adminSteps = [
  "Create users from Admin Panel so Firebase Auth and Firestore stay synced.",
  "Create semesters first, then subjects under the correct semester.",
  "Add teachers and link them to subjects, sections, and routines.",
  "Upload files inside subject sections or folders for a clean Windows-like structure.",
  "Publish notices with optional attachments. Notice text is optional when a file is uploaded.",
  "Add exam or event dates in Calendar and class times in Routine.",
  "Review reading activity and AI usage logs from the Admin dashboard."
];

const managerSteps = [
  "Managers can use the Manager Panel for assigned upload and academic update work.",
  "Managers can add files, update routine, and manage calendar items when permitted.",
  "Managers should keep file names clear so students and AI search can find resources quickly."
];

const aiTips = [
  "Example: Give me Pharmacology notes about antibiotics.",
  "Example: Show all files from Physical Pharmacy.",
  "Example: Amoxicillin lecture slides.",
  "Example: ড্রাগ মেটাবলিজমের নোট দাও।",
  "Use Analyze with AI from a file preview to get summaries, key concepts, viva questions, MCQs, and exam points."
];

export default async function TutorialPage() {
  const user = await requireUser();

  return (
    <div className="space-y-5">
      <Panel className="overflow-hidden rounded-[36px] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-subtle">Acadex guide</p>
            <h1 className="mt-3 font-heading text-4xl font-black text-text sm:text-5xl">Learn Acadex in minutes</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-subtle sm:text-base">
              This tutorial explains the website features for students, managers, and admins while keeping the current
              Acadex workflow simple: find resources, open files, download safely, follow routine, read notices, and ask AI.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/ai" className="rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
                Open AI Assistant
              </Link>
              <Link href="/subjects" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-text transition hover:bg-white/20">
                Browse Subjects
              </Link>
            </div>
          </div>
          <div className="rounded-[30px] border border-white/15 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-subtle">Current role</p>
            <p className="mt-3 font-heading text-3xl font-black capitalize text-text">{user.role}</p>
            <p className="mt-2 text-sm text-subtle">
              Tutorial sections automatically include the features available to your account type.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {quickStart.map((item, index) => (
          <Panel key={item.title} className="rounded-[28px]">
            <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-accent text-sm font-black text-white">
              {index + 1}
            </span>
            <h2 className="mt-4 font-heading text-lg font-bold text-text">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-subtle">{item.text}</p>
          </Panel>
        ))}
      </div>

      <Panel className="rounded-[32px]">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-white/10 p-3 text-text">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-2xl font-black text-text">Feature map</h2>
            <p className="text-sm text-subtle">Every major section and what it is used for.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureSections.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-[26px] border border-white/15 bg-white/10 p-5">
                <span className="inline-flex rounded-2xl bg-white/10 p-3 text-text">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-text">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-subtle">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="rounded-[32px]">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-white/10 p-3 text-text">
              <FileUp className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-xl font-black text-text">Admin workflow</h2>
              <p className="text-sm text-subtle">Best order for setting up the website.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {adminSteps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-xs font-black text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-subtle">{step}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="rounded-[32px]">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-white/10 p-3 text-text">
              <Bot className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-xl font-black text-text">AI and manager tips</h2>
              <p className="text-sm text-subtle">How to make Acadex easier to search and study from.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {managerSteps.concat(aiTips).map((tip) => (
              <div key={tip} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6 text-subtle">
                {tip}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
