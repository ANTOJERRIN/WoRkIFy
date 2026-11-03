import { ArrowLeft, ArrowUpRight, CalendarDays, Code2, Users } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { useWorkify } from '../../context/WorkifyContext';

export function LoginPage() {
  const { setCurrentPage } = useWorkify();
  return <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-14 w-full">
    <button onClick={() => setCurrentPage('workshops')} className="inline-flex gap-2 items-center text-sm font-semibold text-[#636875] dark:text-gray-400 mb-8"><ArrowLeft size={16} /> Back to workshops</button>
    <div className="grid lg:grid-cols-2 rounded-[2rem] overflow-hidden border border-[#DDE0E8] dark:border-white/10 shadow-sm bg-white dark:bg-[#0B1533]">
      <section className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-[#0B1533] text-white relative overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full bg-[#2F6BFF]/20 blur-3xl -right-32 -top-24" />
        <div className="relative"><span className="inline-flex items-center gap-2 border border-white/15 rounded-full px-3 py-1.5 text-xs text-blue-200"><span className="w-1.5 h-1.5 rounded-full bg-[#8B4CFF]" /> YOUR NEXT BUILD STARTS HERE</span>
          <h2 className="text-5xl font-extrabold leading-[1.16] tracking-tight mt-9 mb-6 font-['Plus_Jakarta_Sans']">Learn together.<br />Build something<br /><span className="text-[#94A9FF]">that matters.</span></h2>
          <p className="text-slate-400 text-sm leading-7 max-w-sm">A space for curious minds, hands-on workshops, and the ideas you turn into real projects.</p>
        </div>
        <div className="relative mt-14 space-y-5">{[[CalendarDays, 'Live workshops', 'Learn directly from practitioners.'], [Code2, 'Practical learning', 'Go from an idea to a working build.'], [Users, 'A community of builders', 'Keep learning alongside curious people.']].map(([Icon, title, description]) => { const FeatureIcon = Icon as typeof Code2; return <div key={String(title)} className="flex gap-4 items-center"><div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[#A6B5FF]"><FeatureIcon size={19} /></div><div><h3 className="font-semibold text-sm">{String(title)}</h3><p className="text-xs text-slate-400 mt-1">{String(description)}</p></div></div>; })}</div>
        <p className="relative flex items-center gap-2 text-xs text-slate-400 mt-14">WORKIFY <span className="text-slate-600">/</span> Built by F1 Forge <ArrowUpRight size={13} /></p>
      </section>
      <section className="p-6 sm:p-10 lg:p-14 xl:p-16"><AuthForm /></section>
    </div>
  </div>;
}
