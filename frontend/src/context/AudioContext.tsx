import React, { createContext, useContext, useState } from 'react';
import { soundService } from '../services/soundService';

interface AudioContextType {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  playCoinChime: () => void;
  playCardFlip: () => void;
  playSuccess: () => void;
  playAlert: () => void;
  playStamp: () => void;
  playClick: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundService.getMuted());
  const [volume, setVolumeState] = useState<number>(soundService.getVolume());

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundService.setMuted(next);
    if (!next) {
      soundService.playClick();
    }
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    soundService.setVolume(v);
  };

  return (
    <AudioContext.Provider value={{
      isMuted,
      volume,
      toggleMute,
      setVolume,
      playCoinChime: () => soundService.playCoinChime(),
      playCardFlip: () => soundService.playCardFlip(),
      playSuccess: () => soundService.playSuccess(),
      playAlert: () => soundService.playAlert(),
      playStamp: () => soundService.playStamp(),
      playClick: () => soundService.playClick(),
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within an AudioProvider');
  return ctx;
};

