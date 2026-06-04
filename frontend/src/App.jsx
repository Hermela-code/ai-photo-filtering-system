import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Children from './pages/Children';
import PhotoHistory from './pages/PhotoHistory'; // NEW IMPORT

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  // Update the router switch statement
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'children':
        return <Children />;
      case 'photoHistory':
        return <PhotoHistory />; // NEW ROUTE
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-gray-50 text-gray-900 font-sans antialiased overflow-hidden">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="min-h-16 py-3 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-medium text-gray-500">
            <button onClick={() => setCurrentPage('dashboard')} className="hover:text-gray-900 transition">Dashboard</button>
            <span>/</span>
            {/* Quick cleanup to map 'children' to 'Projects' in the breadcrumb */}
            <span className="text-gray-900 capitalize font-semibold">
              {currentPage === 'children' ? 'Projects' : currentPage.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-semibold border transition ${
                isPrivacyMode 
                  ? 'bg-purple-50 border-purple-200 text-purple-600' 
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="hidden sm:inline">Privacy Mode:</span> {isPrivacyMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}