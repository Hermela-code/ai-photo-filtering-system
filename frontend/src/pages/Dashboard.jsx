import React, { useState, useEffect } from 'react';

export default function Dashboard({ setCurrentPage }) {
  const [stats, setStats] = useState({
    images_processed: 0,
    avg_confidence: 0.0,
    pending_reviews: 0
  });
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stats from database on mount
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/ai-photo-filtering-system/backend/api/get_dashboard_stats.php');
        const result = await response.json();
        if (result.status === 'success') {
          setStats({
            images_processed: result.data.images_processed,
            avg_confidence: result.data.avg_confidence,
            pending_reviews: result.data.pending_reviews
          });
          setActivities(result.data.recent_activity || []);
        } else {
          setError(result.message || 'Failed to load system metrics.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Could not connect to the database server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Images Processed', val: stats.images_processed.toLocaleString(), color: 'text-blue-500 bg-blue-50 border-blue-100', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Avg. Confidence', val: `${stats.avg_confidence}%`, color: 'text-emerald-500 bg-emerald-50 border-emerald-100', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
    { label: 'Pending Reviews', val: stats.pending_reviews, color: 'text-amber-500 bg-amber-50 border-amber-100', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-serif">System Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Monitor AI engine health and system-wide privacy metrics</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 font-bold">
          Loading system overview...
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold">
          {error}
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((s, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">{s.label}</span>
                  <span className="text-3xl font-black text-gray-900 block mt-1 font-serif tracking-tight">{s.val}</span>
                </div>
                <div className={`p-3 rounded-xl border ${s.color}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Quick Actions & Server Health */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* AI Engine Status Widget */}
              <div className="bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-800 relative overflow-hidden">
                {/* Background design accent */}
                <div className="absolute -right-4 -top-4 opacity-10">
                  <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white tracking-wide font-serif">Engine Status</h3>
                    <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Online
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-gray-400 font-medium">
                      <span>InsightFace Model</span>
                      <span className="text-gray-200">Loaded (buffalo_l)</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 font-medium">
                      <span>MySQL Polling</span>
                      <span className="text-gray-200">Active (3s interval)</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 font-medium">
                      <span>Hardware Mode</span>
                      <span className="text-gray-200">CPU Compute</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action Button */}
              <button 
                onClick={() => setCurrentPage('children')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-sm shadow-orange-200 flex flex-col items-center justify-center gap-1 transition-all duration-200 border border-orange-400 group"
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="tracking-wide">Launch New Project</span>
              </button>
            </div>

            {/* Right Column: Activity Audit Log */}
            <div className="lg:col-span-2 bg-white border border-gray-200/60 rounded-2xl shadow-sm p-6 min-h-[300px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 text-lg font-serif">Recent Activity Log</h3>
                <button onClick={() => setCurrentPage('children')} className="text-xs font-bold text-orange-500 hover:text-orange-600 transition">View all</button>
              </div>
              
              <div className="space-y-6">
                {activities.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12 font-medium">No recent activities found.</p>
                ) : (
                  activities.map((log, idx) => (
                    <div key={log.id || idx} className="flex gap-4">
                      {/* Timeline Connector & Icon */}
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full border ${log.color} z-10 shrink-0`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d={log.icon} />
                          </svg>
                        </div>
                        {/* Vertical Line connecting timeline except for the last item */}
                        {idx !== activities.length - 1 && (
                          <div className="w-px h-full bg-gray-100 my-1"></div>
                        )}
                      </div>
                      
                      {/* Log Content */}
                      <div className="pb-4 pt-1">
                        <p className="text-sm text-gray-800">
                          <span className="font-bold text-gray-900">{log.user}</span> {log.action} <span className="font-medium text-gray-900 italic">"{log.target}"</span>
                        </p>
                        <span className="text-xs font-medium text-gray-400 mt-0.5 block">{log.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}