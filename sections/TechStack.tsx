"use client";

import "../styles/tech.css";

const stack = [
  "OpenAI",
  "Claude API",
  "Next.js",
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Supabase",
  "Redis",
  "three.js",
  "Docker",
  "Git",
  "FFmpeg",
  "n8n",
];

export default function TechStack() {
  return (
    <section className="tech" id="tech">
      <span>TECHNOLOGIES</span>

      <h2>What I Build With</h2>

      <div className="tech-grid">
        {stack.map((item) => (
          <div key={item} className="tech-card">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}