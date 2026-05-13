import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import "../styles/Home.css";
import CitizenFooter from "../components/Citizen/CitizenFooter";
import logoImage from "../assets/Logo.png";
import srilankaImg from "../assets/Srilanka.png";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
    });
  }, []);

  return (
    <div className="landing-root">
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo" onClick={() => window.scrollTo(0, 0)}>
          <img src={logoImage} alt="CRIMSON logo" className="nav-logo-icon" />
          <span className="nav-logo-text">CRIMSON</span>
        </div>
        <ul className="nav-links">
          <li onClick={() => window.scrollTo(0, 0)}>Home</li>
          <li>Report</li>
          <li>Heatmap</li>
          <li>Support</li>
        </ul>
        <button className="btn-signin" onClick={() => navigate("/login")}>Sign In</button>
      </nav>

      {/* HERO */}
      <section className="hero" data-aos="fade-up">
        <div className="hero-left" data-aos="fade-right" data-aos-delay="70">
          <p className="hero-tag">● OFFICIAL GOVERNMENT PORTAL</p>
          <h1 className="hero-title">
            <span className="hero-line">
              AI-Powered <span className="red">Crime Reporting</span>
            </span>
            <span className="hero-line"> &amp; Predictive Policing</span>
          </h1>
          <p className="hero-sub">
            Empowering safer communities in Sri Lanka through advanced technology.
            Report incidents securely, view real-time safety analytics, and access
            emergency services instantly.
          </p>
          <div className="hero-badges">
            <span>🔒 Secure</span>
            <span>👤 Anonymous</span>
            <span>✅ Gov Verified</span>
          </div>
        </div>

        <div className="hero-right" data-aos="fade-left" data-aos-delay="130">
          <img src={srilankaImg} alt="Sri Lanka" className="map-img" />
        </div>
      </section>

      {/* ACCESS LEVEL */}
      <section className="access-section" data-aos="fade-up">
        <h2 className="access-title">Choose Your Access Level</h2>
        <p className="access-sub">
          Select the appropriate portal to continue. Unauthorized access to
          restricted areas is prohibited and monitored.
        </p>

        <div className="access-cards">
          {/* CITIZEN */}
          <div className="access-card">
            <span className="access-icon">🌐</span>
            <h3>Citizen Access</h3>
            <p>
              Report incidents anonymously, view public safety maps, receive
              alerts, and track your submitted cases.
            </p>
            <button
              className="btn-access btn-citizen"
              onClick={() => navigate("/login/citizen")}
            >
              Enter Portal →
            </button>
          </div>

          {/* OFFICER */}
          <div className="access-card">
            <span className="access-icon">🛡️</span>
            <h3>Officer Portal</h3>
            <p>
              Secure login for authorized police personnel. Manage cases, view
              predictive analytics, and coordinate response.
            </p>
            <button
              className="btn-access btn-officer"
              onClick={() => navigate("/officer/login")}
            >
              Officer Login 🔐
            </button>
          </div>

          {/* ADMIN */}
          <div className="access-card">
            <span className="access-icon">⚙️</span>
            <h3>Administrative System</h3>
            <p>
              System configuration, user management, and high-level oversight
              for ministry officials.
            </p>
            <button
              className="btn-access btn-admin"
              onClick={() => navigate("/login/admin")}
            >
              Admin Login →
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES & BENEFITS */}
      <section className="info-section feature-section" data-aos="fade-up">
        <p className="section-kicker">Platform Capabilities</p>
        <h2 className="section-title">Features &amp; Benefits</h2>
        <p className="section-subtitle">
          CRIMSON combines secure reporting, analytics, and coordinated response tools
          to improve safety outcomes for citizens and law enforcement.
        </p>
        <div className="feature-grid">
          <article className="feature-card">
            <h3>Secure Incident Reporting</h3>
            <p>
              Submit crime reports with encrypted channels, optional anonymity,
              and guided forms that reduce missing information.
            </p>
          </article>
          <article className="feature-card">
            <h3>AI Risk Intelligence</h3>
            <p>
              Predictive analytics and hotspot insights help officers prioritize
              patrols, prevention actions, and case triage.
            </p>
          </article>
          <article className="feature-card">
            <h3>Role-Based Portals</h3>
            <p>
              Dedicated interfaces for citizens, officers, and admins streamline
              workflows while enforcing accountability and access controls.
            </p>
          </article>
          <article className="feature-card">
            <h3>Rapid Emergency Access</h3>
            <p>
              Integrated emergency numbers and support channels ensure immediate
              help is always visible and easy to access.
            </p>
          </article>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="info-section how-section" data-aos="fade-up">
        <p className="section-kicker">Process Flow</p>
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">
          A seamless end-to-end intelligence cycle powered by AI and human expertise.
        </p>
        <div className="how-grid">
          <article className="how-step">
            <span className="how-step__number">1</span>
            <h3>Secure Reporting</h3>
            <p>Citizens file encrypted reports with precise GPS coordinates via the mobile app or web portal.</p>
          </article>
          <article className="how-step">
            <span className="how-step__number">2</span>
            <h3>AI Triaging</h3>
            <p>The system analyzes urgency levels and automatically routes critical data to the nearest station.</p>
          </article>
          <article className="how-step">
            <span className="how-step__number">3</span>
            <h3>Rapid Response</h3>
            <p>Officers coordinate field efforts using real-time dashboards and predictive routing tools.</p>
          </article>
          <article className="how-step">
            <span className="how-step__number">4</span>
            <h3>Outcome &amp; Support</h3>
            <p>Comprehensive case resolution with integrated coordination for victim assistance and trauma care.</p>
          </article>
        </div>
      </section>

      {/* INTELLIGENCE CORE */}
      <section className="ai-section" data-aos="fade-up">
        <p className="section-kicker">Intelligence Core</p>
        <h2 className="section-title ai-section__title">AI &amp; Predictive Analytics</h2>
        <p className="ai-section__intro">
          CRIMSON utilizes advanced machine learning architectures to transform raw data into actionable public safety strategies.
        </p>

        <div className="ai-cards">
          <article className="ai-card">
            <h3 className="ai-card__title">Crime Hotspot Heatmaps</h3>
            <p className="ai-card__desc">Dynamic visualization of high-probability incident zones updated every 90 seconds.</p>
          </article>
          <article className="ai-card">
            <h3 className="ai-card__title">LSTM-based Trend Forecasting</h3>
            <p className="ai-card__desc">Long short-term memory networks predict temporal patterns and seasonal crime surges.</p>
          </article>
          <article className="ai-card">
            <h3 className="ai-card__title">Pattern Recognition</h3>
            <p className="ai-card__desc">Neural profiling connects disparate incidents based on behavioural and contextual markers.</p>
          </article>
          <article className="ai-card">
            <h3 className="ai-card__title">Explainable AI (XAI)</h3>
            <p className="ai-card__desc">Transparent decision metrics ensuring algorithm accountability and public trust oversight.</p>
          </article>
        </div>
      </section>

      {/* VICTIM SUPPORT SERVICES */}
      <section className="victim" data-aos="fade-up">
        <p className="section-kicker">Victim Support Services</p>
        <p className="victim__intro">
          Justice goes beyond reporting. We provide a comprehensive framework for healing and recovery.
        </p>
        <div className="victim__grid">
          <article className="victim__card">
            <h3 className="victim__title">Legal Aid</h3>
            <p className="victim__desc">Connection to government-appointed counsel and legal advice for incident proceedings.</p>
          </article>
          <article className="victim__card">
            <h3 className="victim__title">Counseling</h3>
            <p className="victim__desc">Confidential mental health support and trauma-informed counseling for survivors and families.</p>
          </article>
          <article className="victim__card">
            <h3 className="victim__title">Medical Assistance</h3>
            <p className="victim__desc">Immediate medical referrals and coordination with regional trauma centers and clinics.</p>
          </article>
          <article className="victim__card">
            <h3 className="victim__title">Financial Support</h3>
            <p className="victim__desc">Coordination for access to compensation funds and temporary financial assistance programs.</p>
          </article>
        </div>
      </section>

      {/* EMERGENCY NUMBERS */}
      <div className="emergency-wrapper" data-aos="fade-up">
        <section className="emergency-section">
          <div className="emergency-card red-border">
            <p className="emer-label">POLICE EMERGENCY</p>
            <p className="emer-num">119</p>
            <span className="emer-icon">📞</span>
          </div>
          <div className="emergency-card blue-border">
            <p className="emer-label">NATIONAL HELP DESK</p>
            <p className="emer-num">118</p>
            <span className="emer-icon">📞</span>
          </div>
          <div className="emergency-card gray-border">
            <p className="emer-label">TECHNICAL SUPPORT</p>
            <p className="emer-num">1919</p>
            <span className="emer-icon">🔧</span>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <CitizenFooter />
    </div>
  );
}