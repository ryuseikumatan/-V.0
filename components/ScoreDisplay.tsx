import React from 'react';

interface ScoreDisplayProps {
  score: number | null;
  isLoading: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, isLoading }) => {
  const getScoreColor = (s: number | null) => {
    if (s === null) return 'text-zinc-600';
    if (s >= 85) return 'text-lime-400';
    if (s >= 60) return 'text-yellow-400';
    return 'text-fuchsia-400';
  };
  
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = score !== null ? circumference - (score / 100) * circumference : circumference;

  const scoreColor = getScoreColor(score);
  const scoreGlowColor = score === null ? 'transparent' : score >= 85 ? 'rgba(163,230,53,0.7)' : 'rgba(212,59,221,0.6)';

  return (
    <div className="bg-black/20 p-4 rounded-xl h-full flex flex-col items-center justify-center border border-lime-400/20 backdrop-blur-sm shadow-[0_0_15px_rgba(163,230,53,0.1)]">
       <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 120 120" style={{ filter: `drop-shadow(0 0 6px ${isLoading ? 'transparent' : scoreGlowColor})`}}>
          <circle
            className="text-zinc-800"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
          <circle
            className={`transition-all duration-1000 ease-in-out ${scoreColor}`}
            strokeWidth="8"
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
            <span className={`text-3xl font-bold transition-colors ${scoreColor}`}>
              {isLoading ? '...' : (score !== null ? score : 'N/A')}
            </span>
        </div>
      </div>
      <p className="mt-3 text-zinc-400 text-sm">コンプライアンススコア</p>
    </div>
  );
};

export default ScoreDisplay;