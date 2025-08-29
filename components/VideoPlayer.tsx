import React, { forwardRef } from 'react';
import { PlayIcon } from './icons';

interface VideoPlayerProps {
  src: string | null;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, onTimeUpdate, onDurationChange }, ref) => {
    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      onTimeUpdate(e.currentTarget.currentTime);
    };

    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      onDurationChange(e.currentTarget.duration);
    };

    if (!src) {
      return (
        <div className="aspect-video w-full bg-black/20 border-2 border-dashed border-lime-400/20 rounded-xl flex flex-col justify-center items-center text-lime-400/40 backdrop-blur-sm">
          <PlayIcon className="w-16 h-16 mb-4" />
          <p>ここに動画プレビューが表示されます</p>
        </div>
      );
    }

    return (
      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
        <video
          ref={ref}
          src={src}
          controls
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;