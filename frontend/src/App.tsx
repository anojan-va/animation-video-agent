import { useState, useEffect } from 'react';
import { Play, RotateCcw, AlertCircle, CheckCircle, Film, Download } from 'lucide-react';
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
  });

  const { logs: wsLogs } = useWebSocket();

  useEffect(() => {
    if (wsLogs.length > 0) {
      setState((prev) => ({
        ...prev,
        logs: [...prev.logs, ...wsLogs],
      }));
    }
  }, [wsLogs]);

  const handleFilesSelected = (audio: File, script: File) => {
    setState((prev) => ({
      ...prev,
      audioFile: audio,
      scriptFile: script,
    }));
  };

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
      }));

      // Upload files
      const formData = new FormData();
      formData.append('audio', state.audioFile);
      formData.append('script', state.scriptFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadRes.json();

      // Start generation
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_path: uploadData.script_path,
          audio_path: uploadData.audio_path,
        }),
      });

      if (!genRes.ok) {
        throw new Error('Generation failed');
      }

      // Poll for status
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch('/api/status');
        const statusData = await statusRes.json();

        setState((prev) => ({
          ...prev,
          status: statusData.status,
          generatedCount: statusData.generated_assets,
          totalCount: statusData.total_assets,
          error: statusData.error,
        }));

        if (statusData.status === 'ready' || statusData.status === 'error') {
          clearInterval(pollInterval);
          if (statusData.status === 'ready') {
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
    try {
      setState((prev) => ({
        ...prev,
        status: 'processing',
        error: null,
      }));

      const res = await fetch('/api/retry', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Retry failed');
      }

      // Poll for status
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch('/api/status');
        const statusData = await statusRes.json();

        setState((prev) => ({
          ...prev,
          status: statusData.status,
          generatedCount: statusData.generated_assets,
          totalCount: statusData.total_assets,
          error: statusData.error,
        }));

        if (statusData.status === 'ready' || statusData.status === 'error') {
          clearInterval(pollInterval);
          if (statusData.status === 'ready') {
            fetchAssets();
          }
        }
      }, 1000);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        assets: data.assets,
      }));
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    }
  };

  const handleRenderVideo = async () => {
    try {
      setState((prev) => ({
        ...prev,
        status: 'rendering',
        error: null,
      }));

      const res = await fetch('/api/render-video', {
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
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Kinetic Video Agent
          </h1>
          <p className="text-slate-300">
            Transform your voice and script into stunning animated videos
          </p>
        </div>

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
                  {state.status === 'processing' && (
                    <p className="text-sm text-gray-600">
                      {state.generatedCount} / {state.totalCount} assets
                    </p>
                  )}
                </div>
              </div>

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

            {/* Progress Bar */}
            {state.status === 'processing' && state.totalCount > 0 && (
              <div className="bg-white rounded-lg p-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(state.generatedCount / state.totalCount) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {Math.round(
                    (state.generatedCount / state.totalCount) * 100
                  )}%
                </p>
              </div>
            )}
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
