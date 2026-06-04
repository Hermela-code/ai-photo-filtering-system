import React, { useState, useEffect } from 'react';
import ProjectDetail from '../components/ProjectDetail';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

export default function Children() {
  // Navigation & UI States
  const [isCreating, setIsCreating] = useState(false);
  const [activeProject, setActiveProject] = useState(null);

  // Data States
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form States
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [childName, setChildName] = useState('');

  // Deletion Modal States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Success Toast States
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // --- API CALL: Fetch Projects ---
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/ai-photo-filtering-system/backend/api/get_projects.php');
      const result = await response.json();

      if (result.status === 'success') {
        setProjects(result.data);
      } else {
        setError(result.message || "Failed to load projects.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Could not connect to the database.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run fetch immediately when the page loads
  useEffect(() => {
    fetchProjects();
  }, []);

  // --- API CALL: Create New Project ---
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || !childName.trim()) {
      alert("Project Name and Target Child Name are required.");
      return;
    }

    const payload = {
      name: projectName,
      target_child_name: childName,
      description: projectDescription
    };

    try {
      const response = await fetch('/ai-photo-filtering-system/backend/api/create_project.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setToastMessage("Success! Project created.");
        setShowToast(true);

        // Reset and redirect after a short delay so the user can read the Toast
        setTimeout(() => {
          // Reset form and close modal
          setProjectName('');
          setChildName('');
          setProjectDescription('');
          setIsCreating(false);

          // Immediately transition the user to the ProjectDetail view
          setActiveProject(result.project);

          // Refresh the grid to show the new project
          fetchProjects();
        }, 1500);
      } else {
        alert("Creation Error: " + result.message);
      }
    } catch (error) {
      console.error("Network failure:", error);
      alert("Failed to connect to the backend server.");
    }
  };

  // --- API CALL: Delete Project ---
  const handleDelete = (projectId, e) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
    setIsConfirmOpen(true);
  };

  const executeDeletion = async () => {
    if (!projectToDelete) return;

    try {
      const response = await fetch('/ai-photo-filtering-system/backend/api/delete_project.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id: projectToDelete }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setProjects(prevProjects => prevProjects.filter(p => p.id !== projectToDelete));
      } else {
        alert("Deletion Error: " + result.message);
      }
    } catch (error) {
      console.error("Network failure:", error);
      alert("Failed to connect to the backend server.");
    } finally {
      setIsConfirmOpen(false);
      setProjectToDelete(null);
    }
  };

  // --- SUB-VIEW ROUTER FOR DETAIL OVERLAYS ---
  if (activeProject) {
    return (
      <ProjectDetail
        project={activeProject}
        onBack={() => setActiveProject(null)}
      />
    );
  }

  // --- VIEW 1: Render Creation Page Form ---
  if (isCreating) {
    return (
      <div className="max-w-3xl mx-auto pt-4 animate-fade-in">
        <div className="flex items-start gap-4 mb-8">
          <button
            onClick={() => setIsCreating(false)}
            className="p-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight font-serif">New Project</h2>
            <p className="text-sm text-gray-400 mt-1">Create a new photo filtering batch</p>
          </div>
        </div>

        <form onSubmit={handleCreateProject} className="bg-white border border-gray-200/70 rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800 block">Project Name</label>
              <input type="text" required placeholder="e.g., School Event 2025" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-orange-400 bg-gray-50/20" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800 block">Target Child Name</label>
              <input type="text" required placeholder="e.g., Emma Thompson" value={childName} onChange={(e) => setChildName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-orange-400 bg-gray-50/20" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800 block">Description (optional)</label>
            <textarea rows="2" placeholder="Brief description..." value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-orange-400 resize-none bg-gray-50/20" />
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Create Project
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- VIEW 2: Main Projects Dashboard Grid ---
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight font-serif">Projects</h2>
          <p className="text-sm text-gray-500 mt-1">Manage active and completed photo pipelines</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-3 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Photos
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 font-bold">Loading database...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold">{error}</div>
      ) : projects.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-500 font-medium">No projects found. Create one to get started!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[220px] hover:shadow-md transition">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-snug font-serif">{project.name}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">Target: {project.child_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${project.statusStyle}`}>
                      {project.status === 'Uploading' || project.status === 'Processing' ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      ) : null}
                      {project.status}
                    </span>
                    <button 
                      onClick={(e) => handleDelete(project.id, e)}
                      className="text-gray-400 hover:text-red-500 p-2.5 rounded-xl hover:bg-red-50 transition border border-transparent hover:border-red-100"
                      title="Delete Project"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-gray-400 pt-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>{project.totalPhotos} photos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{project.matchedPhotos} matches</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2">
                {project.hasProgress ? (
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${project.progressPercent}%` }} />
                  </div>
                ) : <div className="w-full border-t border-gray-100" />}
              </div>

              <div className="flex items-center justify-center pt-2 mt-1">
                <button onClick={() => setActiveProject(project)} className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-500 hover:bg-gray-50 rounded-xl transition border border-transparent hover:border-gray-100">
                  {project.status === 'In Review' ? 'Review Matches' : 'Open Project'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="Delete Project"
        message="Are you sure you want to permanently delete this project and all its files? This action cannot be undone."
        onConfirm={executeDeletion}
        onCancel={() => {
          setIsConfirmOpen(false);
          setProjectToDelete(null);
        }}
      />

      {/* Reusable Toast Notification */}
      <Toast 
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}