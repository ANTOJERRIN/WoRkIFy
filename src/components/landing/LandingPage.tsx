import React from 'react';
import { HeroSection } from './HeroSection';
import { WhyWorkifySection } from './WhyWorkifySection';
import { AILandscapeSection } from './AILandscapeSection';
import { F1ForgeSection } from './F1ForgeSection';

export const LandingPage: React.FC = () => {
  return (
    <div className="w-full flex flex-col">
      <HeroSection />
      <WhyWorkifySection />
      <AILandscapeSection />
      <F1ForgeSection />
    </div>
  );
};
