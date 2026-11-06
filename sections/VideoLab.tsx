"use client";

import "../styles/videolab.css";

export default function VideoLab() {
  return (
    <section id="videos" className="videolab">

      <div className="video-left">

        <span>SHOWREEL</span>

        <h2>
          AI Video Lab
        </h2>

        <p>
          I create AI-powered videos, cinematic storytelling, automation
          workflows and experimental content using the latest generative
          models.
        </p>

        <button>
          Watch Showreel
        </button>

      </div>

      <div className="video-right">

        <div className="video-card">

          <div className="play">
            ▶
          </div>

          <p>
            AI SHOWREEL
          </p>

        </div>

      </div>

    </section>
  );
}