import React, { useEffect, useRef, useState } from "react";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import { api } from "../../lib/api";
import "../../styles/Citizen/About.css";

// ── Simple hook to add .visible class when element enters viewport ──
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── Icons (inline SVG) ──
const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconCpu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);
const IconMap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);
const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconGlobe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const featureIconMap = {
  instant_reporting: <IconZap />,
  anonymity: <IconShield />,
  ai_insights: <IconCpu />,
  heatmaps: <IconMap />,
  victim_support: <IconHeart />,
  multi_platform: <IconGlobe />,
};

const defaultAboutContent = {
  whoWeAre:
    "CRIMSON is a government-grade AI-powered crime reporting and predictive policing system designed specifically for the unique geographical and societal landscape of Sri Lanka. Our platform bridges the critical gap between citizens and law enforcement through advanced technology, ensuring that safety is proactive, not just reactive.",
  quote:
    "Our goal is to redefine public safety by putting powerful, anonymous, and real-time tools into the hands of every citizen while providing police with the AI insights they need to prevent crimes before they occur.",
  mission:
    "To create a transparent, efficient, and technology-driven bridge between the public and law enforcement, reducing crime rates through citizen engagement and data-driven intelligence.",
  vision:
    "To be the national standard for public safety in Sri Lanka, fostering a culture of mutual trust where technology serves as the ultimate deterrent against crime.",
  features: [
    {
      iconKey: "instant_reporting",
      title: "Instant Reporting",
      desc: "Report incidents in seconds with real-time GPS tracking and multimedia evidence upload.",
    },
    {
      iconKey: "anonymity",
      title: "Complete Anonymity",
      desc: "Advanced encryption ensures whistleblowers can report safely without fear of retaliation.",
    },
    {
      iconKey: "ai_insights",
      title: "AI Predictive Insights",
      desc: "ML algorithms analyze historical data to predict potential crime hotspots before they emerge.",
    },
    {
      iconKey: "heatmaps",
      title: "Live Heatmaps",
      desc: "Dynamic visualizations of crime trends across different districts and timeframes.",
    },
    {
      iconKey: "victim_support",
      title: "Victim Support",
      desc: "Integrated links to emergency services, counseling, and legal aid resources.",
    },
    {
      iconKey: "multi_platform",
      title: "Multi-platform",
      desc: "Available as a web portal, mobile app, and specialized PWA for low-connectivity areas.",
    },
  ],
  stats: [
    { value: "50,000+", label: "Active Users" },
    { value: "100+", label: "Police Stations" },
    { value: "95%", label: "AI Accuracy" },
    { value: "<2min", label: "Response Goal" },
  ],
};

// ── Reusable reveal wrapper ──
function Reveal({ children, className = "", style = {} }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`} style={style}>
      {children}
    </div>
  );
}

export default function About() {
  const [aboutContent, setAboutContent] = useState(defaultAboutContent);

  useEffect(() => {
    let active = true;

    const loadAboutContent = async () => {
      try {
        const res = await api.get("/about/content");
        const data = res?.data?.data;
        if (!active || !data) return;

        setAboutContent({
          whoWeAre: data.whoWeAre || defaultAboutContent.whoWeAre,
          quote: data.quote || defaultAboutContent.quote,
          mission: data.mission || defaultAboutContent.mission,
          vision: data.vision || defaultAboutContent.vision,
          features: Array.isArray(data.features) && data.features.length
            ? data.features
            : defaultAboutContent.features,
          stats: Array.isArray(data.stats) && data.stats.length
            ? data.stats
            : defaultAboutContent.stats,
        });
      } catch {
        // Keep fallback static content if backend is unavailable.
      }
    };

    loadAboutContent();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="about-page">
      {/* Navbar */}
      <CitizenNavbar />

      <main>
        {/* ── Hero Title ── */}
        <section className="hero-section">
          <Reveal>
            <h1 className="page-title">About Us</h1>
          </Reveal>
        </section>

        {/* ── Who We Are ── */}
        <section className="who-section">
          <div className="who-inner">
            <Reveal>
              <div className="who-left">
                <h2 className="who-heading">
                  Who We Are <span className="heading-line" />
                </h2>
                <p className="who-body">
                  {aboutContent.whoWeAre}
                </p>
              </div>
            </Reveal>
            <Reveal className="quote-card-wrap" style={{ transitionDelay: "0.15s" }}>
              <blockquote className="quote-card">
                {aboutContent.quote}
              </blockquote>
            </Reveal>
          </div>
        </section>

        {/* ── Mission & Vision ── */}
        <section className="mv-section">
          <div className="mv-grid">
            <Reveal className="mv-card">
              <div className="mv-icon"><IconTarget /></div>
              <h3 className="mv-title">Our Mission</h3>
              <p className="mv-desc">
                {aboutContent.mission}
              </p>
            </Reveal>
            <Reveal className="mv-card" style={{ transitionDelay: "0.15s" }}>
              <div className="mv-icon"><IconEye /></div>
              <h3 className="mv-title">Our Vision</h3>
              <p className="mv-desc">
                {aboutContent.vision}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── What Makes CRIMSON Different ── */}
        <section className="features-section">
          <Reveal>
            <h2 className="features-title">What Makes CRIMSON Different</h2>
            <p className="features-subtitle">Innovative features built for real-world impact</p>
          </Reveal>
          <div className="features-grid">
            {aboutContent.features.map((f, i) => (
              <Reveal key={f.title} className="feature-card" style={{ transitionDelay: `${i * 0.07}s` }}>
                <div className="feature-icon">{featureIconMap[f.iconKey] || <IconZap />}</div>
                <div className="feature-text">
                  <h4 className="feature-title">{f.title}</h4>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="stats-section">
          {aboutContent.stats.map((s, i) => (
            <Reveal key={s.label} className="stat-item" style={{ transitionDelay: `${i * 0.09}s` }}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </Reveal>
          ))}
        </section>
      </main>

      <CitizenFooter />
    </div>
  );
}