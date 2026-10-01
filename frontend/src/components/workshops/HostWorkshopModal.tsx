import React from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { HOST_CONTACT_NUMBER } from '../../config/site';
import { X, Sparkles, PhoneCall } from 'lucide-react';

export const HostWorkshopModal: React.FC = () => {
  const { isHostModalOpen, setIsHostModalOpen } = useWorkify();

  if (!isHostModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 shadow-2xl p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-5 border-b border-[#DDE0E8] dark:border-white/10 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                Host a Workshop
              </h2>
              <p className="text-xs text-[#636875] dark:text-gray-400">
                Partner with Workify & F1 Forge
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsHostModalOpen(false)}
            className="p-1.5 rounded-xl text-[#636875] hover:text-[#070C1F] dark:text-gray-400 dark:hover:text-white hover:bg-[#F3F4F7] dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-[#070C1F] dark:text-gray-200 leading-relaxed font-medium">
            Want to host a workshop? Contact us to get it listed.
          </p>

          <div className="p-5 rounded-2xl bg-[#F3F4F7] dark:bg-white/5 border border-[#DDE0E8] dark:border-white/10">
            <span className="text-xs font-semibold text-[#636875] dark:text-gray-400 block mb-2">
              Direct Contact
            </span>
            <a
              href={`tel:${HOST_CONTACT_NUMBER}`}
              className="inline-flex items-center gap-2 text-base font-bold text-[#2F6BFF] hover:text-[#1F54E0] transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{HOST_CONTACT_NUMBER}</span>
            </a>
          </div>

          <button
            onClick={() => setIsHostModalOpen(false)}
            className="w-full py-3 px-5 rounded-xl bg-[#F3F4F7] dark:bg-white/10 hover:bg-[#DDE0E8] dark:hover:bg-white/15 text-[#070C1F] dark:text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
