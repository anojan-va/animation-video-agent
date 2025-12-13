import { useState, useEffect } from 'react';
import { Play, RotateCcw, AlertCircle, CheckCircle, Film, Download, FolderOpen, Trash2, Clock } from 'lucide-react';
import FileUploader from './components/FileUploader';
import LogConsole from './components/LogConsole';
import AssetGrid from './components/AssetGrid';
import { useWebSocket } from './hooks/useWebSocket';

type Status = 'idle' | 'processing' | 'ready' | 'error' | 'rendering';

interface AppState {
  status: Status;
  audioFile: File | null;
  scriptFile: File | null;
  logs: string[];
  assets: Array<{ name: string; path: string }>;
  generatedCount: number;
  totalCount: number;
  error: string | null;
  videoGenerated: boolean;
  videoPath: string | null;
  projectId: string | null;
  projects: Array<{ id: string; status: string; created_at: string }>;
  showProjectsList: boolean;
  // Enhanced progress tracking
  currentStep: string;
  completedSteps: string[];
  totalSteps: string[];
}

function App() {
  const [state, setState] = useState<AppState>({
    status: 'idle',
    audioFile: null,
    scriptFile: null,
    logs: [],
    assets: [],
    generatedCount: 0,
    totalCount: 0,
    error: null,
    videoGenerated: false,
    videoPath: null,
    projectId: null,
    projects: [],
    showProjectsList: false,
    // Enhanced progress tracking
    currentStep: '',
    completedSteps: [],
    totalSteps: [
      'Validating files',
      'Creating project',
      'Processing script',
      'Generating avatars',
      'Generating props',
      'Removing backgrounds',
      'Building configuration',
      'Copying assets to Remotion'
    ]
  });

  const { logs: wsLogs } = useWebSocket();

  useEffect(() => {
    if (wsLogs.length > 0) {
      setState((prev) => {
        const newLogs = [...prev.logs, ...wsLogs];
        
        // Track progress from logs
        const latestLog = wsLogs[wsLogs.length - 1];
        let currentStep = prev.currentStep;
        let completedSteps = [...prev.completedSteps];
        
        // Parse log messages to determine current step
        if (latestLog.includes('Starting asset generation')) {
          currentStep = 'Processing script';
        } else if (latestLog.includes('Generating avatar')) {
          currentStep = 'Generating avatars';
        } else if (latestLog.includes('Generating image asset') && !latestLog.includes('avatar')) {
          currentStep = 'Generating props';
        } else if (latestLog.includes('background removal')) {
          currentStep = 'Removing backgrounds';
        } else if (latestLog.includes('Building final configuration')) {
          currentStep = 'Building configuration';
        } else if (latestLog.includes('Copying assets')) {
          currentStep = 'Copying assets to Remotion';
        } else if (latestLog.includes('All assets generated successfully')) {
          currentStep = 'Asset generation complete';
          // Mark all steps as complete
          completedSteps = prev.totalSteps.filter(step => step !== 'Asset generation complete');
        }
        
        // Mark step as completed when moving to next
        if (currentStep !== prev.currentStep && prev.currentStep) {
          if (!completedSteps.includes(prev.currentStep)) {
            completedSteps.push(prev.currentStep);
          }
        }
        
        return {
          ...prev,
          logs: newLogs,
          currentStep,
          completedSteps
        };
      });
    }
  }, [wsLogs]);

  const handleFilesSelected = (audio: File, script: File) => {
    setState((prev) => ({
      ...prev,
      audioFile: audio,
      scriptFile: script,
    }));
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        projects: data.projects || [],
      }));
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const loadProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const project = await res.json();
      
      setState((prev) => ({
        ...prev,
        projectId,
        status: project.status === 'completed' ? 'ready' : project.status,
        videoGenerated: !!project.video_path,
        videoPath: project.video_path,
        error: project.error,
        showProjectsList: false,
      }));
      
      if (project.status === 'completed') {
        fetchAssets();
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchProjects();
        if (state.projectId === projectId) {
          setState((prev) => ({
            ...prev,
            projectId: null,
            status: 'idle',
            assets: [],
            videoGenerated: false,
            videoPath: null,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleStartGeneration = async () => {
    if (!state.audioFile || !state.scriptFile) {
      setState((prev) => ({
        ...prev,
        error: 'Please upload both audio and script files',
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        status: 'processing',
        error: null,
        logs: [],
        currentStep: 'Validating files',
        completedSteps: [],
      }));

      // Read and parse script file
      const scriptText = await state.scriptFile.text();
      const scriptData = JSON.parse(scriptText);

      // Handle audio file - we'll let the backend handle it directly
      let audioFile = null;
      if (state.audioFile) {
        // Convert audio file to base64 for sending in JSON
        const audioBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(state.audioFile);
        });
        audioFile = audioBase64 as string;
      }

      // Create project
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_data: scriptData,
          audio_file: audioFile,
        }),
      });

      if (!projectRes.ok) {
        throw new Error('Project creation failed');
      }

      const projectData = await projectRes.json();
      const projectId = projectData.project_id;

      setState((prev) => ({
        ...prev,
        projectId,
      }));

      // Refresh projects list
      fetchProjects();

      // Start generation
      const genRes = await fetch(`/api/projects/${projectId}/generate`, {
        method: 'POST',
      });

      if (!genRes.ok) {
        throw new Error('Generation failed');
      }

      // Poll for project status
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`/api/projects/${projectId}`);
        const statusData = await statusRes.json();

        setState((prev) => ({
          ...prev,
          status: statusData.status === 'completed' ? 'ready' : statusData.status,
          error: statusData.error,
        }));

        if (statusData.status === 'completed' || statusData.status === 'failed') {
          clearInterval(pollInterval);
          if (statusData.status === 'completed') {
            fetchAssets();
          }
        }
      }, 1000);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  };

  const handleRetry = async () => {
    if (!state.projectId) {
      setState((prev) => ({
        ...prev,
        error: 'No project to retry',
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        status: 'processing',
        error: null,
      }));

      const res = await fetch(`/api/projects/${state.projectId}/retry`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Retry failed');
      }

      // Poll for project status
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`/api/projects/${state.projectId}`);
        const statusData = await statusRes.json();

        setState((prev) => ({
          ...prev,
          status: statusData.status === 'completed' ? 'ready' : statusData.status,
          error: statusData.error,
        }));

        if (statusData.status === 'completed' || statusData.status === 'failed') {
          clearInterval(pollInterval);
          if (statusData.status === 'completed') {
            fetchAssets();
          }
        }
      }, 1000);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  };

  const fetchAssets = async () => {
    if (!state.projectId) return;
    
    try {
      const res = await fetch(`/api/projects/${state.projectId}/render-config`);
      const data = await res.json();
      
      // Extract assets from the render config
      const assets = [];
      if (data.visual_track) {
        data.visual_track.forEach((scene: any) => {
          if (scene.avatar?.asset) {
            assets.push({ name: scene.avatar.asset, path: `/assets/${scene.avatar.asset}` });
          }
          if (scene.prop?.asset) {
            assets.push({ name: scene.prop.asset, path: `/assets/${scene.prop.asset}` });
          }
        });
      }
      
      setState((prev) => ({
        ...prev,
        assets,
      }));
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    }
  };

  const handleRenderVideo = async () => {
    if (!state.projectId) {
      setState((prev) => ({
        ...prev,
        error: 'No project to render',
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        status: 'rendering',
        error: null,
      }));

      const res = await fetch(`/api/projects/${state.projectId}/render-video`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Render failed');
      }

      const data = await res.json();
      setState((prev) => ({
        ...prev,
        status: 'ready',
        videoGenerated: true,
        videoPath: data.video_path,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Render failed',
      }));
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'rendering':
        return 'bg-purple-50 border-purple-200';
      case 'ready':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'processing':
        return <div className="animate-spin h-5 w-5 text-blue-500" />;
      case 'rendering':
        return <div className="animate-spin h-5 w-5 text-purple-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                AI Kinetic Video Agent
              </h1>
              <p className="text-slate-300">
                Transform your voice and script into stunning animated videos
              </p>
            </div>
            <button
              onClick={() => setState((prev) => ({ ...prev, showProjectsList: !prev.showProjectsList }))}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <FolderOpen className="h-5 w-5" />
              {state.showProjectsList ? 'Hide Projects' : 'Show Projects'} ({state.projects.length})
            </button>
          </div>
        </div>

        {/* Projects List */}
        {state.showProjectsList && (
          <div className="mb-8 bg-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">All Projects</h2>
            {state.projects.length === 0 ? (
              <p className="text-slate-400">No projects yet. Create your first project!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.projects.map((project) => (
                  <div
                    key={project.id}
                    className={`bg-slate-700 rounded-lg p-4 border-2 ${
                      project.id === state.projectId
                        ? 'border-blue-500'
                        : project.status === 'completed'
                        ? 'border-green-600'
                        : project.status === 'failed'
                        ? 'border-red-600'
                        : 'border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-semibold">Project {project.id}</h3>
                      <div className="flex gap-2">
                        {project.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {project.status === 'failed' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {project.status === 'processing' && (
                          <Clock className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">
                      {new Date(project.created_at).toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadProject(project.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <div
              className={`rounded-lg border-2 p-6 ${getStatusColor(state.status)}`}
            >
              <div className="flex items-center gap-3 mb-4">
                {getStatusIcon(state.status)}
                <div>
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {state.status}
                  </h3>
                  {state.projectId && (
                    <p className="text-sm text-gray-600">
                      Project: {state.projectId}
                    </p>
                  )}
                  {state.status === 'processing' && (
                    <p className="text-sm text-gray-600">
                      Processing project...
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Steps */}
              {state.status === 'processing' && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Progress Steps:</h4>
                  {state.totalSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm ${
                        state.completedSteps.includes(step)
                          ? 'text-green-600'
                          : state.currentStep === step
                          ? 'text-blue-600 font-semibold'
                          : 'text-gray-400'
                      }`}
                    >
                      {state.completedSteps.includes(step) && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {state.currentStep === step && !state.completedSteps.includes(step) && (
                        <div className="h-4 w-4 border-2 border-blue-300 rounded-full animate-pulse" />
                      )}
                      {!state.completedSteps.includes(step) && state.currentStep !== step && (
                        <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                      )}
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {state.error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                  {state.error}
                </div>
              )}
            </div>

            {/* File Uploader */}
            <FileUploader onFilesSelected={handleFilesSelected} />

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleStartGeneration}
                disabled={state.status === 'processing' || state.status === 'rendering'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Play className="h-5 w-5" />
                Start Generation
              </button>

              {state.status === 'ready' && state.assets.length > 0 && (
                <button
                  onClick={handleRenderVideo}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Film className="h-5 w-5" />
                  Render Video
                </button>
              )}

              {state.videoGenerated && state.videoPath && (
                <a
                  href={state.videoPath}
                  download="video.mp4"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Download className="h-5 w-5" />
                  Download Video
                </a>
              )}

              {state.status === 'error' && (
                <button
                  onClick={handleRetry}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="h-5 w-5" />
                  Retry
                </button>
              )}
            </div>

          </div>

          {/* Right Column - Logs and Assets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Log Console */}
            <LogConsole logs={state.logs} />

            {/* Asset Grid */}
            <AssetGrid assets={state.assets} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
