import React, { useEffect } from 'react';

export default function Toast({ message, isVisible, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-5 right-5 z-50 bg-white border border-gray-100 border-l-4 border-emerald-500 rounded-xl shadow-lg p-4 flex items-center gap-3 max-w-sm animate-slide-in-right">
      {/* Success Checkmark Icon */}
      <div className="bg-emerald-50 text-emerald-500 p-1.5 rounded-lg shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <div className="flex-1 text-sm font-semibold text-gray-800">
        {message}
      </div>

      {/* Close button */}
      <button 
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
