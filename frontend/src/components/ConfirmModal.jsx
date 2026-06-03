import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-100 flex flex-col gap-6 animate-scale-up"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 font-serif">{title}</h3>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
