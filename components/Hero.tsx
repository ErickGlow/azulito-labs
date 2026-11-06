import Image from "next/image";
import "../styles/hero.css";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-left">
        <span className="hero-tag">AI • Automation • Creative Engineering</span>

        <h1 className="hero-title">Azulito Labs</h1>

        <h2 className="hero-subtitle">
          From Prompt
          <br />
          to Product.
        </h2>

        <p className="hero-text">
          From AI video creation to production-ready applications. I build AI products, intelligent
          agents, automation systems, creative tools and games that people actually use.
        </p>

        <div className="hero-buttons">
          <a href="#projects" className="hero-btn">
            Explore Projects
          </a>
          <a href="/play" className="hero-btn secondary">
            ▶ Play Arándano Run
          </a>
        </div>
      </div>

      <div className="hero-right">
        <div className="hero-glow"></div>
        <figure className="hero-photo">
          {/* Фото настоящего Азулито: замените файл public/images/azulito-hero.jpg */}
          <Image
            src="/images/azulito-hero.jpg"
            alt="Azulito, the real bird behind Azulito Labs"
            width={900}
            height={900}
            priority
          />
          <figcaption>Meet Azulito — the real bird behind the lab.</figcaption>
        </figure>
      </div>
    </section>
  );
}
