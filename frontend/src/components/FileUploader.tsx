import React, { useRef, useState } from 'react';
import { Upload, Music, FileJson } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (audio: File, script: File) => void;
}

export default function FileUploader({ onFilesSelected }: FileUploaderProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const scriptInputRef = useRef<HTMLInputElement>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      if (scriptFile) {
        onFilesSelected(file, scriptFile);
      }
    }
  };

  const handleScriptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScriptFile(file);
      if (audioFile) {
        onFilesSelected(audioFile, file);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h3>

      {/* Audio Upload */}
      <div className="mb-4">
        <button
          onClick={() => audioInputRef.current?.click()}
          className="w-full border-2 border-dashed border-blue-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center gap-2 cursor-pointer"
        >
          <Music className="h-6 w-6 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">
            {audioFile ? audioFile.name : 'Select Audio (MP3/WAV)'}
          </span>
        </button>
        <input
          ref={audioInputRef}
          type="file"
          accept=".mp3,.wav"
          onChange={handleAudioChange}
          className="hidden"
        />
      </div>

      {/* Script Upload */}
      <div className="mb-4">
        <button
          onClick={() => scriptInputRef.current?.click()}
          className="w-full border-2 border-dashed border-green-300 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition flex flex-col items-center gap-2 cursor-pointer"
        >
          <FileJson className="h-6 w-6 text-green-500" />
          <span className="text-sm font-medium text-gray-700">
            {scriptFile ? scriptFile.name : 'Select Script (JSON)'}
          </span>
        </button>
        <input
          ref={scriptInputRef}
          type="file"
          accept=".json"
          onChange={handleScriptChange}
          className="hidden"
        />
      </div>

      {/* Status */}
      {audioFile && scriptFile && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
          ✓ Both files ready
        </div>
      )}
    </div>
  );
}
