export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  id: string;
  title: string;
  desc: string;
  tech: string[];
  links: ProjectLink[];
}

export const projects: Project[] = [
  {
    id: "arandano-run",
    title: "Arándano Run",
    desc: "A 3D browser game: baby Azulito hops across 110 Colombian cities, dodging taxis and buses while collecting arándanos.",
    tech: ["Next.js", "React Three Fiber", "three.js", "TypeScript"],
    links: [{ label: "Play", href: "/play" }],
  },
  {
    id: "build-crm",
    title: "Construction Mini-CRM",
    desc: "Objects and tasks for construction sites. All access rules live in the database: RLS, a guarded status workflow and tamper-proof history.",
    tech: ["React", "TypeScript", "Supabase", "PostgreSQL RLS"],
    links: [
      { label: "Live demo", href: "https://build-crm-xi.vercel.app" },
      { label: "Code", href: "https://github.com/ErickGlow/build-crm" },
    ],
  },
  {
    id: "product-card-ai",
    title: "AI Product Cards",
    desc: "LLM service that drafts B2B product pages for measuring instruments — with automatic checks that block invented specs.",
    tech: ["Python", "LLM API", "Flask", "pytest"],
    links: [{ label: "Code", href: "https://github.com/ErickGlow/product-card-ai" }],
  },
  {
    id: "ai-telegram-bot",
    title: "Multi-model AI Telegram Bot",
    desc: "Telegram bot for text and image generation across several models, with a job queue, credits billing and Telegram Stars payments.",
    tech: ["Python", "aiogram", "PostgreSQL", "Redis", "Docker"],
    links: [{ label: "Code", href: "https://github.com/ErickGlow/ai-telegram-bot-Colombia" }],
  },
];
