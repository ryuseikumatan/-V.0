import React, { useRef, useState } from 'react';
import { UploadIcon, AnalyzeIcon } from './icons';

interface VideoUploadProps {
  onFileChange: (file: File) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  hasVideo: boolean;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onFileChange, onAnalyze, isLoading, hasVideo }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileChange(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="video/*"
        className="hidden"
      />
      <button
        onClick={handleButtonClick}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors duration-200"
      >
        <UploadIcon className="w-5 h-5" />
        {fileName ? '別の動画を選択' : '動画を選択'}
      </button>
      {fileName && <p className="text-sm text-zinc-400 truncate max-w-xs">{fileName}</p>}
      <button
        onClick={onAnalyze}
        disabled={isLoading || !hasVideo}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors duration-200"
      >
        <AnalyzeIcon className="w-5 h-5" />
        {isLoading ? '分析中...' : '分析開始'}
      </button>
    </div>
  );
};

export default VideoUpload;