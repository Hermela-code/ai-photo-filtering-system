import React from 'react';

export default function ReviewQueue() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Review Queue</h2>
        <p className="text-sm text-gray-500 mt-1">Jobs awaiting your review and approval</p>
      </div>

      <div className="bg-white border border-gray-200/70 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center border border-amber-100 shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-800 text-base">Emma's Birthday Party</h4>
              <span className="bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full">In Progress</span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-1">Emma Thompson • by Demo Photographer • 245 images • 67 matched</p>
          </div>
        </div>
        <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition">
          Review
        </button>
      </div>
    </div>
  );
}