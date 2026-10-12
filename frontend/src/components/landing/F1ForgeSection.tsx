import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { F1FORGE_URL } from '../../config/site';
import { useWorkify } from '../../context/WorkifyContext';

export const F1ForgeSection = () => {
  const { setIsHostModalOpen } = useWorkify();
  const hasWebsite = /^https?:\/\//.test(F1FORGE_URL) && !F1FORGE_URL.includes('[FILL');
  return (
    <section className="maker-section site-container" aria-labelledby="maker-title">
      <div className="maker-panel">
        <div className="maker-intro">
          <p className="section-label">THE PEOPLE BEHIND THE PLATFORM</p>
          <h2 id="maker-title">Built by F1 Forge.</h2>
          <p>We’re bringing people who build and people who want to learn into the same room. Workify is a home for live workshops from F1 Forge and other hosts.</p>
          {hasWebsite && <a className="site-text-link" href={F1FORGE_URL} target="_blank" rel="noreferrer">Meet F1 Forge <ArrowUpRight size={16} aria-hidden="true" /></a>}
        </div>
        <div className="maker-host">
          <span className="section-label">BRING WHAT YOU KNOW</span>
          <h3>Have something<br />worth teaching?</h3>
          <p>Let’s talk about your next workshop.</p>
          <button className="site-button site-button-secondary" onClick={() => setIsHostModalOpen(true)}>Host a workshop <ArrowRight size={17} aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  );
};
