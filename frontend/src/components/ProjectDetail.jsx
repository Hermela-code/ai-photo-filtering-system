import React, { useState, useEffect } from 'react';

export default function ProjectDetail({ project, onBack }) {
  // Track the active sub-navigation tab (defaulting to review or upload depending on status)
  const [activeTab, setActiveTab] = useState(project.status === 'Uploading' ? 'targetChild' : 'review');
  const [activeFilter, setActiveFilter] = useState('All');

  // File Upload states for Phase 2 & Phase 3
  const [sampleFiles, setSampleFiles] = useState([]);
  const [sourceFiles, setSourceFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [projectStatus, setProjectStatus] = useState(project.status);
  const [totalPhotos, setTotalPhotos] = useState(project.totalPhotos || 0);
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);

  // Fetch project details and matched photos from backend
  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`/ai-photo-filtering-system/backend/api/get_project_details.php?id=${project.id}`);
      const result = await response.json();
      if (result.status === 'success') {
        const data = result.data;
        setProjectStatus(data.status);
        setTotalPhotos(data.totalPhotos || 0);
        if (data.photos) {
          setReviewPhotos(data.photos);
        }
      }
    } catch (err) {
      console.error("Error fetching project details:", err);
    }
  };

  // Poll project details every 3 seconds to sync processing status and matches
  useEffect(() => {
    fetchProjectDetails();

    const interval = setInterval(() => {
      fetchProjectDetails();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Top header metrics mapping
  const stats = [
    { label: 'Total Photos', val: totalPhotos, iconColor: 'text-blue-500 bg-blue-50', d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'AI Matches', val: reviewPhotos.length, iconColor: 'text-orange-500 bg-orange-50', d: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 7a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zm0 7a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z' },
    { label: 'Approved', val: reviewPhotos.filter(p => p.status === 'approved').length, iconColor: 'text-emerald-500 bg-emerald-50', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'References', val: sampleFiles.length || (projectStatus !== 'Uploading' ? 3 : 0), iconColor: 'text-amber-500 bg-amber-50', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  ];

  // Action tabs
  const tabs = [
    { id: 'targetChild', label: 'Target Child', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'upload', label: 'Upload Bulk Folder', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { id: 'review', label: 'Review', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  // Handle photo actions (approve or reject) and sync with database
  const handlePhotoAction = async (photoId, newStatus) => {
    // Optimistic UI update
    const previousPhotos = [...reviewPhotos];
    setReviewPhotos(reviewPhotos.map(photo => 
      photo.id === photoId ? { ...photo, status: newStatus } : photo
    ));

    try {
      const response = await fetch('/ai-photo-filtering-system/backend/api/update_photo_status.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          photo_id: photoId,
          status: newStatus
        })
      });

      const result = await response.json();
      if (result.status !== 'success') {
        // Rollback on server failure
        setReviewPhotos(previousPhotos);
        alert("Error updating photo status: " + (result.message || "Unknown error"));
      } else {
        // Sync project status if changed
        if (result.data && result.data.project_status) {
          setProjectStatus(result.data.project_status);
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setReviewPhotos(previousPhotos);
      alert("Failed to connect to the server.");
    }
  };

  // Handler to upload target child samples and bulk source files
  const handleUploadFiles = async () => {
    if (sampleFiles.length === 0 || sourceFiles.length === 0) {
      alert("Both child reference photos and bulk photos folder are required.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('project_id', project.id);
    
    Array.from(sampleFiles).forEach(file => { formData.append('samples[]', file); });
    Array.from(sourceFiles).forEach(file => { formData.append('bulk[]', file); });

    try {
      const response = await fetch('/ai-photo-filtering-system/backend/api/upload_project_files.php', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.status === 'success') {
        alert("Success! Ingestion started and project is now processing.");
        setProjectStatus('Processing');
        setTotalPhotos(result.total_source_photos || sourceFiles.length);
        setActiveTab('review');
      } else {
        setUploadError(result.message || "Failed to upload files.");
        alert("Upload Error: " + (result.message || "Failed to upload files."));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("Could not connect to the upload server.");
      alert("Failed to connect to the server.");
    } finally {
      setIsUploading(false);
    }
  };

  const reviewFilters = [
    { label: 'All', count: reviewPhotos.length },
    { label: 'High Conf.', count: reviewPhotos.filter(p => p.confidence >= 80).length },
    { label: 'Medium Conf.', count: reviewPhotos.filter(p => p.confidence >= 50 && p.confidence < 80).length },
    { label: 'Low Conf.', count: reviewPhotos.filter(p => p.confidence < 50).length },
    { label: 'Approved', count: reviewPhotos.filter(p => p.status === 'approved').length },
    { label: 'Rejected', count: reviewPhotos.filter(p => p.status === 'rejected').length },
    { label: 'Pending Review', count: reviewPhotos.filter(p => p.status === 'pending').length }
  ];

  const filteredPhotos = reviewPhotos.filter(photo => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Approved') return photo.status === 'approved';
    if (activeFilter === 'Rejected') return photo.status === 'rejected';
    if (activeFilter === 'Pending Review') return photo.status === 'pending';
    if (activeFilter === 'High Conf.') return photo.confidence >= 80;
    if (activeFilter === 'Medium Conf.') return photo.confidence >= 50 && photo.confidence < 80;
    if (activeFilter === 'Low Conf.') return photo.confidence < 50;
    return true;
  });

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (score >= 50) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button onClick={onBack} className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight font-serif capitalize">{project.name}</h2>
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shrink-0 ${
            projectStatus === 'Uploading' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
            projectStatus === 'Processing' ? 'bg-purple-50 text-purple-600 border-purple-100 animate-pulse' :
            projectStatus === 'In Review' ? 'bg-orange-50 text-orange-600 border-orange-100' :
            projectStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            'bg-gray-50 text-gray-600 border-gray-100'
          }`}>{projectStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">{stat.label}</span>
              <span className="text-3xl font-black text-gray-900 block font-serif">{stat.val}</span>
            </div>
            <div className={`p-3 rounded-xl ${stat.iconColor}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={stat.d} />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {projectStatus === 'Uploading' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-orange-200 bg-orange-50/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-sm font-bold text-gray-800 block">Ingestion Pipeline Setup</span>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500 mt-1">
              <span className={sampleFiles.length > 0 ? "text-emerald-600" : "text-amber-600"}>{sampleFiles.length > 0 ? `✓ Reference Photos: ${sampleFiles.length} selected` : '✗ Missing Reference Photos'}</span>
              <span className={sourceFiles.length > 0 ? "text-emerald-600" : "text-amber-600"}>{sourceFiles.length > 0 ? `✓ Bulk Photos: ${sourceFiles.length} selected` : '✗ Missing Bulk Photos'}</span>
            </div>
          </div>
          <button disabled={sampleFiles.length === 0 || sourceFiles.length === 0 || isUploading} onClick={handleUploadFiles} className={`font-bold px-6 py-3 rounded-xl text-sm transition shadow-sm flex items-center gap-2 ${sampleFiles.length > 0 && sourceFiles.length > 0 && !isUploading ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'}`}>
            {isUploading ? "Uploading..." : "Start Ingestion & Processing"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-transparent'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 font-serif">Upload Bulk Session Photos</h3>
            <div className="border-2 border-dashed border-gray-200 bg-white rounded-2xl p-6 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[340px]">
              {projectStatus === 'Uploading' ? (
                <>
                  <input type="file" multiple webkitdirectory="true" directory="true" accept="image/*" onChange={(e) => setSourceFiles(e.target.files)} className="hidden" id="source-files-input" />
                  <label htmlFor="source-files-input" className="cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm flex items-center gap-2 transition">Select Bulk Session Folder</label>
                  {sourceFiles.length > 0 && <p className="text-sm font-bold text-emerald-600">{sourceFiles.length} photos selected</p>}
                </>
              ) : <p className="text-sm font-bold text-emerald-600">✓ Bulk session photos are uploaded and processing</p>}
            </div>
          </div>
        )}

        {activeTab === 'targetChild' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 font-serif">Select Target Child Reference Photos</h3>
            <div className="border-2 border-dashed border-gray-200 bg-white rounded-2xl p-6 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[300px]">
              {projectStatus === 'Uploading' ? (
                <>
                  <input type="file" multiple accept="image/*" onChange={(e) => setSampleFiles(e.target.files)} className="hidden" id="sample-files-input" />
                  <label htmlFor="sample-files-input" className="cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm flex items-center gap-2 transition">Select Reference Photos</label>
                  {sampleFiles.length > 0 && <p className="text-sm font-bold text-emerald-600">{sampleFiles.length} reference photos selected</p>}
                </>
              ) : <p className="text-sm font-bold text-emerald-600">✓ Target child references are uploaded</p>}
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {reviewFilters.map((pill, idx) => (
                <button key={idx} onClick={() => setActiveFilter(pill.label)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${activeFilter === pill.label ? 'bg-orange-500 border-orange-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  {pill.label} <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100">{pill.count}</span>
                </button>
              ))}
            </div>

            {projectStatus === 'Uploading' ? (
              <div className="border-2 border-dashed border-gray-200 bg-white rounded-2xl p-6 sm:p-12 text-center shadow-sm min-h-[250px] flex flex-col items-center justify-center">
                <p className="text-sm font-bold text-gray-600">Pending Ingestion. Please select child reference photos and a bulk session folder.</p>
              </div>
            ) : projectStatus === 'Processing' ? (
              <div className="border-2 border-dashed border-gray-200 bg-white rounded-2xl p-6 sm:p-12 text-center shadow-sm min-h-[250px] flex flex-col items-center justify-center border-orange-200 bg-orange-50/5 animate-pulse">
                <svg className="w-10 h-10 text-orange-400 animate-spin mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                <p className="text-sm font-bold text-gray-600">AI search engine is currently scanning...</p>
              </div>
            ) : filteredPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredPhotos.map((photo) => (
                  <div key={photo.id} className="bg-white rounded-2xl p-3 border border-gray-200 shadow-sm flex flex-col gap-3">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img 
                        src={`/ai-photo-filtering-system/uploads/children/child_${project.profile_id}/project_${project.id}/source/${photo.filename}`} 
                        className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition duration-200" 
                        onClick={() => setEnlargedPhoto(photo)} 
                        alt="Match" 
                      />
                      <span className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-black border uppercase ${getConfidenceColor(photo.confidence)}`}>{photo.confidence}% Match</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        disabled={photo.status === 'rejected'}
                        onClick={() => handlePhotoAction(photo.id, 'rejected')} 
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          photo.status === 'rejected' 
                            ? 'opacity-50 cursor-not-allowed bg-red-600 text-white border-transparent' 
                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {photo.status === 'rejected' ? 'Rejected ✘' : 'Reject'}
                      </button>
                      <button 
                        disabled={photo.status === 'approved'}
                        onClick={() => handlePhotoAction(photo.id, 'approved')} 
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          photo.status === 'approved' 
                            ? 'opacity-50 cursor-not-allowed bg-green-600 text-white border-transparent' 
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {photo.status === 'approved' ? 'Approved ✔' : 'Approve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 bg-white rounded-2xl p-6 sm:p-12 text-center shadow-sm">
                <p className="text-sm font-bold text-gray-600">No photos match this filter.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {enlargedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in"
          onClick={() => setEnlargedPhoto(null)}
        >
          {/* Close Button */}
          <button 
            className="absolute top-6 right-6 text-white hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition"
            onClick={() => setEnlargedPhoto(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Photo Modal Box */}
          <div 
            className="relative max-w-5xl max-h-[85vh] flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={`/ai-photo-filtering-system/uploads/children/child_${project.profile_id}/project_${project.id}/source/${enlargedPhoto.filename}`} 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
              alt="Enlarged review" 
            />
            <div className="text-white text-xs font-semibold tracking-wide bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex gap-4">
              <span>{enlargedPhoto.filename}</span>
              <span className="text-gray-600">|</span>
              <span className="text-orange-400">{enlargedPhoto.confidence}% Match</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}