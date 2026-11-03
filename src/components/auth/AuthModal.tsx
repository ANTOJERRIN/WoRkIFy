import { useCallback } from 'react';
import { X } from 'lucide-react';
import { useModalDialog } from '../layout/useModalDialog';
import { useWorkify } from '../../context/WorkifyContext';
import { AuthForm } from './AuthForm';

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, setCurrentPage } = useWorkify();
  const close = useCallback(() => setIsAuthModalOpen(false), [setIsAuthModalOpen]);
  const ref = useModalDialog(isAuthModalOpen, close);
  if (!isAuthModalOpen) return null;
  return <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Sign in to Workify" tabIndex={-1} className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0B1533] p-6 sm:p-8 shadow-2xl">
      <button aria-label="Close" onClick={close} className="ml-auto mb-2 flex p-2 rounded-xl hover:bg-[#F3F4F7] dark:hover:bg-white/10"><X size={20} /></button>
      <AuthForm />
      <button onClick={() => setCurrentPage('workshops')} className="w-full text-sm text-[#636875] dark:text-gray-400 mt-6">Explore workshops</button>
    </div>
  </div>;
}
