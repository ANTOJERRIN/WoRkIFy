import { ArrowRight, ArrowDown, Video } from 'lucide-react';
import { useWorkify } from '../../context/WorkifyContext';

export const HeroSection = () => {
  const { setCurrentPage } = useWorkify();
  return (
    <section className="landing-hero site-container" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="section-label"><span className="label-line" /> A little curiosity. A new skill.</p>
        <h1 id="hero-title">Find your next<br /><span>hands-on</span><br />workshop.</h1>
        <p className="hero-description">Learn directly from people who build. Explore live sessions, practice new skills, and connect with other learners.</p>
        <div className="hero-actions">
          <button className="site-button site-button-primary" onClick={() => setCurrentPage('workshops')}>Explore workshops <ArrowRight size={18} aria-hidden="true" /></button>
          <a className="site-text-link" href="#how-it-works">How it works <ArrowDown size={16} aria-hidden="true" /></a>
        </div>
        <p className="hero-footnote"><Video size={16} aria-hidden="true" /> Live sessions, online on Google Meet.</p>
      </div>
      <aside className="workshop-editorial" aria-label="Our approach to learning">
        <div className="editorial-top"><span>THE WORKSHOP MINDSET</span><ArrowRight size={20} aria-hidden="true" /></div>
        <div className="editorial-type"><span>Stay</span><span className="editorial-outline">curious.</span><span>Get hands-on.</span></div>
        <div className="editorial-bottom"><span className="editorial-symbol" aria-hidden="true">✳</span><p>A space to ask questions,<br />try things, and learn together.</p></div>
        <div className="editorial-caption"><span>Less watching. More doing.</span><span>WORKIFY</span></div>
      </aside>
    </section>
  );
};

