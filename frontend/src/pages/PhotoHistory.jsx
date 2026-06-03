import React, { useState, useEffect } from 'react';

export default function PhotoHistory() {
  // State to track if we are viewing the master list or a specific child's history
  const [selectedChild, setSelectedChild] = useState(null);
  const [masterArchives, setMasterArchives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // States for specific event gallery (Phase 4)
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [isPhotosLoading, setIsPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Fetch archives on component mount
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost/photosort/backend/api/get_photo_history.php');
        const result = await response.json();

        if (result.status === 'success') {
          setMasterArchives(result.data);
        } else {
          setError(result.message || 'Failed to load photo history.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Could not connect to the database.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Fetch event photos when selectedEvent changes (Phase 4)
  useEffect(() => {
    if (!selectedEvent) {
      setEventPhotos([]);
      return;
    }

    const fetchPhotos = async () => {
      setIsPhotosLoading(true);
      setPhotosError(null);
      try {
        const response = await fetch(`http://localhost/photosort/backend/api/get_archived_photos.php?project_id=${selectedEvent.id}`);
        const result = await response.json();
        if (result.status === 'success') {
          setEventPhotos(result.data);
        } else {
          setPhotosError(result.message || 'Failed to load archived photos.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setPhotosError('Could not connect to the database.');
      } finally {
        setIsPhotosLoading(false);
      }
    };

    fetchPhotos();
  }, [selectedEvent]);

  // Filter the fetched archives by child's name
  const filteredArchives = masterArchives.filter((child) =>
    child.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current selected child's details from master list to ensure up-to-date references
  const currentChild = selectedChild 
    ? (masterArchives.find((c) => c.id === selectedChild.id) || selectedChild)
    : null;

  // --- VIEW 1: Master Directory (List of Children) ---
  if (!currentChild) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-serif">Photo History</h2>
            <p className="text-sm text-gray-500 mt-1">Master directory of all archived target profiles.</p>
          </div>
        </div>

        <div className="w-full relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Search master directories by child's name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200/80 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-orange-400 text-gray-700 transition shadow-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 font-bold">
            Loading database...
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold">
            {error}
          </div>
        ) : filteredArchives.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-500 font-medium">
            {searchTerm ? 'No matching archives found.' : 'No archives found.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredArchives.map((child) => (
              <div 
                key={child.id} 
                onClick={() => setSelectedChild(child)}
                className="bg-white border border-gray-200/70 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group flex flex-col items-center text-center space-y-4"
              >
                {/* Large Master Folder Icon */}
                <div className="relative">
                  <svg className="w-20 h-20 text-orange-400 group-hover:text-orange-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 4h6l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                  {/* Profile Silhouette Overlay (Fixed) */}
                  <svg className="w-7 h-7 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors font-serif truncate w-48">
                    {child.name}
                  </h3>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {child.history.length} {child.history.length === 1 ? 'Event' : 'Events'} • {child.totalPhotos} {child.totalPhotos === 1 ? 'Photo' : 'Photos'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- VIEW 3: Event Image Gallery & Single-Photo Drill-Down ---
  if (selectedEvent) {
    if (selectedPhoto) {
      return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
          {/* Inline view controls */}
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to Gallery
            </button>
            
            <div className="text-right">
              <h3 className="font-bold text-gray-900 text-sm font-serif truncate w-64">{selectedPhoto.filename}</h3>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider mt-0.5">{selectedEvent.event} Timeline</p>
            </div>
          </div>

          {/* Image Display */}
          <div className="flex flex-col items-center gap-6 pt-2">
            <div className="w-full flex justify-center bg-gray-50/50 p-6 rounded-3xl border border-gray-200/60 shadow-sm">
              <img 
                src={`http://localhost/photosort/uploads/children/child_${selectedChild.id}/project_${selectedEvent.id}/source/${selectedPhoto.filename}`} 
                className="w-full h-auto max-h-[75vh] object-contain rounded-2xl shadow-md border border-gray-200/40" 
                alt="Enlarged archived match" 
              />
            </div>

            {/* Metadata badge */}
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl shadow-sm">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              <span className="text-xs font-black uppercase tracking-wider">{Math.round(selectedPhoto.confidence)}% Match Confidence</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedEvent(null)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-serif capitalize">
              {selectedEvent.event}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{selectedEvent.date} • {selectedEvent.photoCount} {selectedEvent.photoCount === 1 ? 'Photo' : 'Photos'} • {selectedEvent.size}</p>
          </div>
        </div>

        {isPhotosLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 font-bold">
            Loading archive gallery...
          </div>
        ) : photosError ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold">
            {photosError}
          </div>
        ) : eventPhotos.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-500 font-medium">
            No archived photos found for this event.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {eventPhotos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-2xl p-2.5 border border-gray-200/70 shadow-sm flex flex-col gap-2 group hover:border-orange-300 transition-all">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
                  <img 
                    src={`http://localhost/photosort/uploads/children/child_${selectedChild.id}/project_${selectedEvent.id}/source/${photo.filename}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer" 
                    onClick={() => setSelectedPhoto(photo)}
                    alt="Archived match" 
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-wider backdrop-blur-md bg-emerald-50 text-emerald-700 border-emerald-200">
                    {Math.round(photo.confidence)}% Match
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-medium truncate px-1">
                  {photo.filename}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- VIEW 2: Child's Internal History (Folders & Zips) ---
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => {
            setSelectedChild(null);
            setSelectedEvent(null);
            setSelectedPhoto(null);
          }}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-serif capitalize">
            {currentChild.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Timeline of daily events and compressed archives.</p>
        </div>
      </div>

      {/* Daily Event List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {currentChild.history.map((event) => (
          <div 
            key={event.id} 
            onClick={() => setSelectedEvent(event)}
            className="bg-white border border-gray-200/70 rounded-2xl p-5 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-colors cursor-pointer"
          >
            
            <div className="flex items-center gap-4">
              {/* Dynamic Icon: Show Folder if open, Zip if compressed */}
              <div className={`p-3 rounded-xl ${event.type === 'zip' ? 'bg-purple-50 text-purple-500' : 'bg-orange-50 text-orange-500'}`}>
                {event.type === 'zip' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    {/* Tiny zip zipper detail */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7v2m0 2v2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 4h6l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                )}
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 text-base">{event.date}</h4>
                <p className="text-xs text-gray-500 font-medium truncate w-40">{event.event}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{event.photoCount} {event.photoCount === 1 ? 'Photo' : 'Photos'}</span>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{event.size}</span>
                </div>
              </div>
            </div>

            {/* Download/Action Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `http://localhost/photosort/backend/api/download_event_archive.php?project_id=${event.id}`;
              }}
              className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            
          </div>
        ))}
      </div>
    </div>
  );
}