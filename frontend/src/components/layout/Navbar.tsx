import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Plus, LogOut, ChevronDown, Menu, X, ArrowUpRight } from 'lucide-react';
import { useWorkify } from '../../context/WorkifyContext';
import type { PageRoute } from '../../types';

export const Navbar = () => {
  const { isLoggedIn, isAdmin, logout, currentPage, setCurrentPage, setIsHostModalOpen, setIsAuthModalOpen, userProfile, darkMode, toggleDarkMode } = useWorkify();
  const [openMenu, setOpenMenu] = useState<'account' | 'mobile' | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const accountRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLButtonElement>(null);
  const links: { label: string; page: PageRoute }[] = [
    { label: 'Workshops', page: 'workshops' }, { label: 'Dashboard', page: 'dashboard' },
    { label: 'Profile', page: 'profile' }, ...(isAdmin ? [{ label: 'Admin', page: 'admin' as const }] : []),
  ];

  useEffect(() => {
    if (!openMenu) return;
    const closeOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        (openMenu === 'account' ? accountRef : mobileRef).current?.focus();
        setOpenMenu(null);
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openMenu]);

  const navigate = (page: PageRoute) => { setCurrentPage(page); setOpenMenu(null); };
  const isActive = (page: PageRoute) => currentPage === page || (page === 'workshops' && currentPage === 'workshop-detail');

  return (
    <header className="site-header" ref={headerRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenMenu(null);
    }}>
      <a className="site-skip-link" href="#main-content">Skip to content</a>
      <div className="site-container nav-inner">
        <button className="site-brand" onClick={() => navigate(isLoggedIn ? 'workshops' : 'landing')} aria-label="Workify home">
          <img src="/workify-logo.png" alt="" width="38" height="38" /><span>Workify<span className="brand-period">.</span></span>
        </button>
        {isLoggedIn ? (
          <nav className="desktop-nav" aria-label="Main navigation">{links.map(({ label, page }) => <button key={page} onClick={() => navigate(page)} aria-current={isActive(page) ? 'page' : undefined} className="nav-link">{label}</button>)}</nav>
        ) : <span className="nav-descriptor">A place for curious people.</span>}
        <div className="nav-actions">
          <button className="site-icon-button" onClick={toggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}</button>
          {isLoggedIn ? <>
            <button className="site-button site-button-secondary nav-host" onClick={() => { setOpenMenu(null); setIsHostModalOpen(true); }}><Plus size={16} aria-hidden="true" />Host</button>
            <div className="account-wrap">
              <button className="account-trigger" ref={accountRef} aria-label="Account options" aria-expanded={openMenu === 'account'} aria-controls="account-navigation" onClick={() => setOpenMenu(openMenu === 'account' ? null : 'account')}><img src={userProfile.avatarUrl || '/workify-logo.png'} alt="" width="30" height="30" /><ChevronDown size={14} aria-hidden="true" /></button>
              {openMenu === 'account' && <nav className="account-popover" id="account-navigation" aria-label="Account navigation"><div className="account-info"><strong>{userProfile.name}</strong><span>{userProfile.email}</span></div>{links.map(({ label, page }) => <button key={page} className="nav-link" onClick={() => navigate(page)} aria-current={isActive(page) ? 'page' : undefined}>{label}</button>)}<button className="nav-link signout-link" onClick={() => { setOpenMenu(null); logout(); }}><LogOut size={16} aria-hidden="true" />Sign out</button></nav>}
            </div>
            <button className="site-icon-button mobile-toggle" ref={mobileRef} aria-label={openMenu === 'mobile' ? 'Close navigation' : 'Open navigation'} aria-expanded={openMenu === 'mobile'} aria-controls="mobile-navigation" onClick={() => setOpenMenu(openMenu === 'mobile' ? null : 'mobile')}>{openMenu === 'mobile' ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}</button>
          </> : <button className="site-button site-button-ink nav-signin" onClick={() => setIsAuthModalOpen(true)}>Sign in <ArrowUpRight size={16} aria-hidden="true" /></button>}
        </div>
      </div>
      {isLoggedIn && openMenu === 'mobile' && <nav className="mobile-nav site-container" id="mobile-navigation" aria-label="Mobile navigation">{links.map(({ label, page }) => <button key={page} className="nav-link" aria-current={isActive(page) ? 'page' : undefined} onClick={() => navigate(page)}>{label}</button>)}<button className="nav-link" onClick={() => { setOpenMenu(null); setIsHostModalOpen(true); }}><Plus size={17} aria-hidden="true" />Host a workshop</button><button className="nav-link signout-link" onClick={() => { setOpenMenu(null); logout(); }}><LogOut size={16} aria-hidden="true" />Sign out</button></nav>}
    </header>
  );
};
