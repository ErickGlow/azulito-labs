"use client";

import "../styles/journey.css";

const journey = [
  {
    year: "2012–2022",
    title: "Flight Engineer, Mission Control",
    text: "Ten years leading real-time telemetry analysis and mission-critical spacecraft operations at Russia's Mission Control Center.",
  },
  {
    year: "2023–2025",
    title: "Crypto Trader & Portfolio Manager",
    text: "Managed multi-million dollar portfolios and built automated trading systems and signal tools across CEX/DEX platforms.",
  },
  {
    year: "2025–Now",
    title: "AI Automation Engineer",
    text: "Building AI agents, automation pipelines and production-grade Python systems with the Claude and OpenAI APIs.",
  },
  {
    year: "Today",
    title: "Founder of Azulito Labs",
    text: "Creating AI products, viral content, intelligent automation and creative digital experiences.",
  },
];

export default function Journey() {
  return (
    <section className="journey" id="journey">
      <h2>My Journey</h2>

      <div className="timeline">
        {journey.map((item) => (
          <div className="timeline-item" key={item.title}>
            <div className="dot"></div>

            <div className="content">
              <span>{item.year}</span>

              <h3>{item.title}</h3>

              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}