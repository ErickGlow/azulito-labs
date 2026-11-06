"use client";

import "../styles/featured.css";

export default function FeaturedProject() {
  return (
    <section id="featured" className="featured">
      <div className="featured-left">
        <span>FEATURED PROJECT</span>

        <h2>Arándano Run</h2>

        <p>
          A 3D browser game set in Colombia. Spin a giant blueberry globe, pick a department and
          guide baby Azulito through the streets of its cities — dodging yellow taxis, buses, motos
          and pedestrians while collecting arándanos.
        </p>

        <div className="stats">
          <div>
            <h3>33</h3>
            <span>Departments</span>
          </div>
          <div>
            <h3>110</h3>
            <span>City levels</span>
          </div>
          <div>
            <h3>3D</h3>
            <span>Runs in the browser</span>
          </div>
        </div>

        <a href="/play" className="hero-btn" style={{ marginTop: 28, display: "inline-block" }}>
          ▶ Play now
        </a>
      </div>

      <div className="featured-right">
        <div className="screen">
          <div className="terminal">
            <span>Level</span>
            <p>Magdalena → Santa Marta</p>
            <div className="arrow">↓</div>
            <span>Goal</span>
            <p>Cross the city · dodge the traffic · collect arándanos</p>
          </div>
        </div>
      </div>
    </section>
  );
}
