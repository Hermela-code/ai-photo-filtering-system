import React from 'react';

export default function AllJobs() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">All Project Workspace Jobs</h2>
          <p className="text-sm text-gray-500 mt-1">Initialize or monitor automated partition folders</p>
        </div>
        <button className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-md shadow-orange-100 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          New Project
        </button>
      </div>

      <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm text-center py-16">
        <p className="text-sm text-gray-400 font-medium">Select or create a workflow project payload mapping folder above.</p>
      </div>
    </div>
  );
}