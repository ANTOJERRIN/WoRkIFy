import { Search, BookmarkCheck, Video } from 'lucide-react';

const steps = [
  { number: '01', icon: Search, title: 'Find your session.', description: 'Sign in to explore workshops. Find a topic that sparks your curiosity and check the details.' },
  { number: '02', icon: BookmarkCheck, title: 'Make it a plan.', description: 'Register for a session and keep your upcoming workshops together in your dashboard.' },
  { number: '03', icon: Video, title: 'Join. Ask. Try.', description: 'Join on Google Meet when the session opens. Learn with your host and other curious people.' },
];

export const WhyWorkifySection = () => (
  <section id="how-it-works" className="journey-section site-container" aria-labelledby="journey-title">
    <div className="section-heading">
      <div><p className="section-label">FROM CURIOUS TO CONNECTED</p><h2 id="journey-title">Good learning starts<br />with showing up.</h2></div>
      <p>One place to discover, register,<br className="desktop-break" /> and get ready for your next session.</p>
    </div>
    <ol className="journey-grid">
      {steps.map(({ number, icon: Icon, title, description }) => (
        <li className="journey-step" key={number}>
          <div className="journey-step-top"><span className="step-number">{number}</span><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></div>
          <h3>{title}</h3><p>{description}</p>
        </li>
      ))}
    </ol>
  </section>
);
