import { ArrowUpRight } from 'lucide-react';
import { F1FORGE_URL } from '../../config/site';

export const Footer = () => {
  const hasWebsite = /^https?:\/\//.test(F1FORGE_URL) && !F1FORGE_URL.includes('[FILL');
  return (
    <footer className="site-footer">
      <div className="site-container footer-inner">
        <div className="footer-brand"><img src="/workify-logo.png" alt="" width="32" height="32" /><span>Workify</span><span className="footer-tagline">Make room for learning.</span></div>
        <div className="footer-meta"><span>© {new Date().getFullYear()} Workify</span>{hasWebsite ? <a href={F1FORGE_URL} target="_blank" rel="noreferrer">Built by F1 Forge <ArrowUpRight size={14} aria-hidden="true" /></a> : <span>Built by F1 Forge</span>}</div>
      </div>
    </footer>
  );
};
