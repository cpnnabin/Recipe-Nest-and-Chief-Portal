import { Link } from "react-router-dom";
import { HeartHandshake, Sparkles, UsersRound } from "lucide-react";
import logoImage from "../assets/img.png";

const featureCards = [
  {
    icon: HeartHandshake,
    title: "Client Picks",
    text: "Trusted home-style picks curated for daily meals",
  },
  {
    icon: Sparkles,
    title: "Quick Discover",
    text: "Find recipes by mood, occasion, and taste in seconds",
  },
  {
    icon: UsersRound,
    title: "Chif Community",
    text: "Save, review, and follow favorites with your people",
  },
];

const ClintLandingPage = () => {
  return (
    <main className="landing-page landing-page-clint">
      <section className="landing-shell">
        <div className="landing-logo-card">
          <img
            src={logoImage}
            alt="Chif Portal Logo"
            className="landing-logo-img"
          />
        </div>

        <div className="landing-brand-copy">
          <h1>Chif Portal</h1>
          <p className="landing-subtitle">Smart picks for everyday recipes</p>
          <p className="landing-tagline">(Your chief-side food hub)</p>
        </div>

        <div className="landing-feature-grid">
          {featureCards.map((feature) => {
            const FeatureIcon = feature.icon;

            return (
              <article key={feature.title} className="landing-feature-card">
                <span className="landing-feature-icon" aria-hidden="true">
                  <FeatureIcon size={28} strokeWidth={2.2} />
                </span>
                <h2>{feature.title}</h2>
                <p>{feature.text}</p>
              </article>
            );
          })}
        </div>

        <div className="landing-actions">
          <Link to="/login" className="landing-action-btn landing-action-btn-light">
            Chif Login
          </Link>
          <Link to="/signup" className="landing-action-btn landing-action-btn-outline">
            Chif Register
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ClintLandingPage;