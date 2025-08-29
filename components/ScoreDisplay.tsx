import React from 'react';

interface ScoreDisplayProps {
  score: number | null;
  isLoading: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, isLoading }) => {
  const getScoreColor = (s: number | null) => {
    if (s === null) return 'border-zinc-600';
    if (s >= 85) return 'border-green-500';
    if (s >= 60) return 'border-yellow-500';
    return 'border-red-500';
  };

  const getScoreTextColor = (s: number | null) => {
    if (s === null) return 'text-zinc-400';
    if (s >= 85) return 'text-green-400';
    if (s >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = score !== null ? circumference - (score / 100) * circumference : circumference;

  return (
    <div className="bg-zinc-900 p-4 rounded-xl h-full flex flex-col items-center justify-center border border-zinc-800">
       <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            className="text-zinc-700"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
          <circle
            className={`transition-all duration-1000 ease-in-out ${getScoreTextColor(score)}`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={isLoading ? circumference : offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold ${getScoreTextColor(score)}`}>
              {isLoading ? '...' : (score !== null ? score : 'N/A')}
            </span>
        </div>
      </div>
      <p className="mt-3 text-zinc-400 text-sm">コンプライアンススコア</p>
    </div>
  );
};

export default ScoreDisplay;