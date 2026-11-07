import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

export const AudioToggle: React.FC = () => {
  const { isMuted, toggleMute } = useAudio();

  return (
    <button
      onClick={toggleMute}
      title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
      className="p-2 rounded-lg text-slate-400 hover:text-gold-500 hover:bg-slate-100 transition-colors"
      aria-label="Toggle Sound Effects"
    >
      {isMuted ? (
        <VolumeX className="w-5 h-5 text-slate-400" />
      ) : (
        <Volume2 className="w-5 h-5 text-gold-500" />
      )}
    </button>
  );
};

