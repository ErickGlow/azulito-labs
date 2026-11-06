import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";

import About from "../sections/About";
import Journey from "../sections/Journey";
import FeaturedProject from "../sections/FeaturedProject";
import Projects from "../sections/Projects";
import TechStack from "../sections/TechStack";
import Contact from "../sections/Contact";

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />

        <Reveal>
          <About />
        </Reveal>
        <Reveal>
          <Journey />
        </Reveal>
        <Reveal>
          <FeaturedProject />
        </Reveal>
        <Reveal>
          <Projects />
        </Reveal>
        <Reveal>
          <TechStack />
        </Reveal>
        <Reveal>
          <Contact />
        </Reveal>
      </main>

      <Footer />
    </>
  );
}