import type { Project } from "../lib/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="card">
      <h3>{project.title}</h3>
      <p>{project.desc}</p>

      <div className="chips">
        {project.tech.map((tech) => (
          <span key={tech}>{tech}</span>
        ))}
      </div>

      <div className="card-links">
        {project.links.map((link) => {
          const external = link.href.startsWith("http");
          return (
            <a
              key={link.href}
              href={link.href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <button>{link.label}</button>
            </a>
          );
        })}
      </div>
    </div>
  );
}
