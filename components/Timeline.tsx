import React from 'react';
import { Issue } from '../types';

interface TimelineProps {
  duration: number;
  issues: Issue[];
  currentTime: number;
  onSeek: (time: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ duration, issues, currentTime, onSeek }) => {
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-black/20 p-4 rounded-xl h-full flex items-center border border-lime-400/20 backdrop-blur-sm shadow-[0_0_15px_rgba(163,230,53,0.1)]">
      <div className="relative w-full h-1.5 bg-zinc-700 rounded-full cursor-pointer group" onClick={(e) => {
        if (duration > 0) {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const percentage = clickX / rect.width;
          onSeek(duration * percentage);
        }
      }}>
        <div
          className="absolute top-0 left-0 h-full bg-lime-400 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
        <div
          className="absolute top-1/2 -mt-2 w-4 h-4 bg-white rounded-full border-2 border-lime-400 transition-transform group-hover:scale-110"
          style={{ left: `calc(${progressPercentage}% - 8px)` }}
        />
        {issues.map((issue, index) => {
          if (duration === 0) return null;
          const issuePosition = (issue.timestamp / duration) * 100;
          return (
            <div
              key={`${issue.timestamp}-${index}`}
              className="absolute top-1/2 -mt-1.5 w-3 h-3 bg-fuchsia-400 rounded-full border-2 border-white cursor-pointer hover:scale-125 transition-transform"
              style={{ left: `${issuePosition}%` }}
              title={`問題点 (${issue.timestamp.toFixed(1)}s): ${issue.originalText}`}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(issue.timestamp);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;