export const aiTutorSubmenu = [
  { label: "Ask AI", href: "/student/ai-tutor", slug: "" },
  { label: "My Conversations", href: "/student/ai-tutor/conversations", slug: "conversations" },
  { label: "Subject Tutors", href: "/student/ai-tutor/subjects", slug: "subjects" },
  { label: "Solved Questions", href: "/student/ai-tutor/solved", slug: "solved" },
  { label: "Formula Helper", href: "/student/ai-tutor/formulas", slug: "formulas" },
  { label: "Diagram Explanations", href: "/student/ai-tutor/diagrams", slug: "diagrams" },
  { label: "Revision Assistant", href: "/student/ai-tutor/revision", slug: "revision" },
  { label: "AI Study Planner", sidebarLabel: "Study Planner", href: "/student/ai-tutor/planner", slug: "planner" },
  { label: "Recommended Topics", href: "/student/ai-tutor/recommended", slug: "recommended" },
  { label: "Learning Analytics", href: "/student/ai-tutor/analytics", slug: "analytics" },
] as const;

export type AiTutorViewSlug = (typeof aiTutorSubmenu)[number]["slug"];

export function getAiTutorViewTitle(slug: string) {
  const item = aiTutorSubmenu.find((s) => s.slug === slug);
  return item?.label ?? "AI Tutor";
}

export const subjectTutors = [
  { id: "physics", name: "Physics Tutor", icon: "⚛️", description: "Mechanics, optics, waves, and calculations" },
  { id: "mathematics", name: "Mathematics Tutor", icon: "∑", description: "Algebra, calculus, statistics, and proofs" },
  { id: "computer-science", name: "Computer Science Tutor", icon: "💻", description: "Programming, databases, and algorithms" },
  { id: "agriculture", name: "Agriculture Tutor", icon: "🌾", description: "Crop science, soil, and farm management" },
  { id: "public-health", name: "Public Health Tutor", icon: "🏥", description: "Epidemiology, hygiene, and community health" },
  { id: "business", name: "Business Tutor", icon: "📊", description: "Accounting, management, and economics" },
  { id: "education", name: "Education Tutor", icon: "📚", description: "Pedagogy, curriculum, and teaching methods" },
  { id: "general", name: "General Academic Tutor", icon: "🎓", description: "Cross-disciplinary study support" },
] as const;
