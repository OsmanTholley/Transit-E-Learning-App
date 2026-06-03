import Link from "next/link";
import { TransitLogo } from "@/components/brand/transit-logo";

const roles = [
  {
    id: "student",
    title: "Student",
    description: "Access courses, lectures, quizzes, discussions, and your AI tutor.",
    href: "/login?role=student",
    cta: "Sign in as student",
  },
  {
    id: "staff",
    title: "Staff",
    description: "Administrators and lecturers manage programs, content, and student records.",
    href: "/login?role=staff",
    cta: "Sign in as staff",
  },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B3D91] via-[#0d4aa8] to-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col items-center text-center">
          <TransitLogo size="lg" variant="light" subtitle="E-Learning" />
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Welcome to Transit E-Learning
          </h1>
          <p className="mt-3 max-w-xl text-sm text-blue-100 sm:text-base">
            Choose how you want to sign in. Students use their college ID; staff use their
            institutional email.
          </p>
        </header>

        <section className="mt-10 grid flex-1 gap-5 sm:grid-cols-2 sm:items-stretch">
          {roles.map((role) => (
            <Link
              key={role.id}
              href={role.href}
              className="group flex flex-col rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFC107]"
            >
              <span className="inline-flex w-fit rounded-full bg-[#0B3D91]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0B3D91]">
                {role.title}
              </span>
              <h2 className="mt-4 text-xl font-semibold text-slate-900 group-hover:text-[#0B3D91]">
                {role.title} portal
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{role.description}</p>
              <span className="mt-6 inline-flex items-center text-sm font-semibold text-[#0B3D91] group-hover:underline">
                {role.cta}
                <span aria-hidden className="ml-1">
                  →
                </span>
              </span>
            </Link>
          ))}
        </section>

        <footer className="mt-10 text-center text-xs text-slate-500">
          <p>Transit College S/L · E-Learning Platform</p>
          <Link href="/register" className="mt-2 inline-block font-semibold text-[#0B3D91] hover:underline">
            New student? Verify your ID to register
          </Link>
        </footer>
      </div>
    </main>
  );
}
