import { Link } from 'react-router-dom';
import { ArrowRight, Search, Share2, UsersRound } from 'lucide-react';
import logoImage from '../assets/img.png';

const featureCards = [
  {
    icon: Search,
    title: 'Discover Recipes',
    text: 'Momo dekhi Dal Bhat samma sabai',
  },
  {
    icon: Share2,
    title: 'Share Recipes',
    text: 'Aafno recipe share garnus',
  },
  {
    icon: UsersRound,
    title: 'Join Community',
    text: 'Nepali food lovers sanga judnu',
  },
];

const Landing = () => {
  return (
    <main className="landing-page">
      <section className="landing-shell">
        <div className="landing-logo-card">
          <img
            src={logoImage}
            alt="Recipe Nest Logo"
            className="landing-logo-img"
          />
        </div>

        <div className="landing-brand-copy">
          <h1>Recipe Nest</h1>
          <p className="landing-subtitle">Nepali Khana ko Sansar</p>
          <p className="landing-tagline">(Nepali Food World)</p>
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
            Login
          </Link>
          <Link to="/signup" className="landing-action-btn landing-action-btn-outline">
            Register
          </Link>
        </div>

        <Link to="/landing-chif" className="landing-admin-link">
          <span>Open Chif Portal Landing</span>
          <ArrowRight size={18} strokeWidth={2.4} />
        </Link>
      </section>
    </main>
  );
};

export default Landing;