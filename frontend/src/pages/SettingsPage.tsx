import React from 'react';
import { Volume2, VolumeX, ShieldCheck, Server, Database, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { isMuted, volume, toggleMute, setVolume, playCoinChime, playSuccess, playStamp } = useAudio();
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-navy-950 font-sans tracking-tight">
          System Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Configure audio soundscapes, interface accessibility, and inspect environment telemetry
        </p>
      </div>

      {/* Audio Soundscape Settings */}
      <Card variant="white" className="p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-navy-950 font-sans">
            Payment-Inspired Sound Effects
          </h2>
          <p className="text-xs text-slate-500">
            Synthesized Web Audio oscillators simulating coin chimes, document folds, and resolution stamps.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {/* Mute Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-3">
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-slate-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-gold-500" />
              )}
              <div>
                <p className="text-xs font-bold text-navy-950">Audio Sound Effects</p>
                <p className="text-[11px] text-slate-500">Enable or silence interactive financial audio feedback</p>
              </div>
            </div>
            <Button
              variant={isMuted ? 'outline-gold' : 'secondary-navy'}
              size="sm"
              onClick={toggleMute}
            >
              {isMuted ? 'Unmute Audio' : 'Mute Audio'}
            </Button>
          </div>

          {/* Volume Slider */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex justify-between text-xs font-bold text-navy-950">
              <span>Master Sound Volume</span>
              <span className="font-mono text-gold-600">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              disabled={isMuted}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-gold-500 disabled:opacity-40"
            />
          </div>

          {/* Sound Testing Station */}
          <div className="pt-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
              Sound Effect Test Station
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline-gold"
                size="sm"
                onClick={playCoinChime}
                disabled={isMuted}
              >
                Coin Chime
              </Button>
              <Button
                variant="outline-gold"
                size="sm"
                onClick={playSuccess}
                disabled={isMuted}
              >
                Reconciliation Balanced Chord
              </Button>
              <Button
                variant="outline-gold"
                size="sm"
                onClick={playStamp}
                disabled={isMuted}
              >
                Resolution Rubber Stamp
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Backend & Environment Telemetry */}
      <Card variant="white" className="p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-navy-950 font-sans">
            Architecture & Integration Status
          </h2>
          <p className="text-xs text-slate-500">
            Real-time status of the decoupled backend layers and algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2 text-navy-950 font-bold">
              <Server className="w-4 h-4 text-gold-500" />
              <span>SPRING BOOT 3.x</span>
            </div>
            <p className="text-slate-500 text-[11px] font-sans">Java 21 LTS Execution Engine</p>
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> READY
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2 text-navy-950 font-bold">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>MYSQL 8.x DB</span>
            </div>
            <p className="text-slate-500 text-[11px] font-sans">InnoDB • Decimal(15,2)</p>
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> CONNECTED
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2 text-navy-950 font-bold">
              <Sparkles className="w-4 h-4 text-lavender-500" />
              <span>MOCK ENGINE</span>
            </div>
            <p className="text-slate-500 text-[11px] font-sans">Stateful Synthetic Fixtures</p>
            <div className="flex items-center gap-1.5 text-gold-600 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE (DEMO MODE)
            </div>
          </div>
        </div>
      </Card>

      {/* User Information */}
      <Card variant="white" className="p-6 space-y-4">
        <h2 className="text-base font-bold text-navy-950 font-sans">
          Signed In Analyst Identity
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-navy-800 text-gold-500 text-lg font-bold flex items-center justify-center border-2 border-gold-500/40">
            {user?.fullName ? user.fullName[0] : 'U'}
          </div>
          <div>
            <p className="text-sm font-bold text-navy-950">{user?.fullName || 'Analyst'}</p>
            <p className="text-xs text-slate-500 font-mono">{user?.email || 'analyst@paytrace.dev'}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-navy-100 text-navy-800">
              {user?.role || 'ROLE_ANALYST'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

