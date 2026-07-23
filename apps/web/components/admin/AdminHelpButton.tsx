'use client';

import { useState } from 'react';

export function AdminHelpButton() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:shadow-lg transition-all z-50"
        aria-label="Help"
      >
        ?
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative z-10 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#18181B]">Help & Support</h3>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-[#FAFAF9] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#EAF5EE] flex items-center justify-center text-[#1A6B3C] flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#18181B]">Email support</p>
                  <p className="text-xs text-[#71717A] mt-0.5">support@sabipro.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#FAFAF9] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#E6F1FB] flex items-center justify-center text-[#185FA5] flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#18181B]">Platform guide</p>
                  <p className="text-xs text-[#71717A] mt-0.5">Visit our documentation for admin guides</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full mt-4 py-2.5 text-sm font-semibold text-white bg-[#1A6B3C] rounded-full hover:bg-[#15573A] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
