import React from 'react';

export default function Sidebar({ currentPage, setCurrentPage }) {
  const sidebarItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' 
    },
    { 
      id: 'children', 
      label: 'Projects', // Renamed for clarity based on your recent updates
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' 
    },
    { 
      id: 'photoHistory', 
      label: 'Photo History', 
      icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' // Archive box icon
    }
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col sm:flex-row md:flex-col justify-between shrink-0 z-10">
      <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-stretch w-full">
        <div className="p-4 md:p-6 flex items-center gap-3">
          <div className="bg-orange-500 text-white p-2 rounded-xl shadow-md shadow-orange-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" strokeWidth="2.5" />
            </svg>
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-gray-900 leading-none">PhotoFilter</h1>
            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase block mt-1">AI Privacy System</span>
          </div>
        </div>

        <nav className="px-4 pb-4 sm:pb-0 md:pb-0 flex flex-row md:flex-col gap-1.5 md:gap-1 overflow-x-auto sm:overflow-visible w-full md:w-auto">
          {sidebarItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full sm:w-auto md:w-full flex items-center justify-between px-3.5 md:px-4 py-2 md:py-3 rounded-xl font-bold text-sm transition-all duration-150 shrink-0 ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  <span className={isActive ? 'text-white' : 'text-gray-600'}>
                    {item.label}
                  </span>
                </div>
                {isActive && (
                  <svg className="hidden md:block w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="hidden md:flex p-4 border-t border-gray-100 items-center gap-3 bg-gray-50/50">
        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0 border border-orange-200">
          HG
        </div>
        <div className="overflow-hidden">
          <h4 className="text-sm font-bold text-gray-800 truncate leading-tight">Hermela Girma</h4>
          <span className="text-xs text-gray-400 font-medium block mt-0.5">Admin</span>
        </div>
      </div>
    </aside>
  );
}