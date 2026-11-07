import React, { useState } from 'react';
import { Scale, Lock, Mail, ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { playCardFlip, playSuccess, playAlert } = useAudio();

  const [email, setEmail] = useState('analyst@paytrace.dev');
  const [password, setPassword] = useState('Password123!');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login(email, password);
      playSuccess();
      onNavigate('/dashboard');
    } catch {
      playAlert();
      setErrorMessage('Invalid credentials. Please use demo accounts provided below.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string) => {
    playCardFlip();
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-navy-950 text-ivory-50 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gold-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <div 
          onClick={() => onNavigate('/')} 
          className="inline-flex items-center gap-3 cursor-pointer group mb-2"
        >
          <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 shadow-gold-glow group-hover:scale-105 transition-transform">
            <Scale className="w-7 h-7" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight font-sans">
          Sign In to <span className="text-gold-500">PayTrace</span>
        </h2>
        <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
          Payment Discrepancy Detection & Reconciliation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 space-y-6">
        {/* Interactive Payment Card Metaphor */}
        <div 
          className="perspective-1000 cursor-pointer"
          onClick={() => {
            setIsFlipped(!isFlipped);
            playCardFlip();
          }}
          title="Click to flip authentication card"
        >
          <div 
            className={`w-full h-52 rounded-2xl p-6 transition-all duration-700 transform-style-3d bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 border-2 border-gold-500/60 shadow-gold-glow flex flex-col justify-between ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {!isFlipped ? (
              // Card Front
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-gold-500" />
                    <span className="font-extrabold text-xs tracking-wider text-ivory-50">PAYTRACE ACCESS</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gold-500/20 text-gold-400 border border-gold-500/30">
                    {email.includes('admin') ? 'ADMIN CREDENTIAL' : 'ANALYST CREDENTIAL'}
                  </span>
                </div>

                {/* EMV Chip & Contactless wave */}
                <div className="flex items-center gap-4 my-2">
                  <div className="w-10 h-7 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                    <div className="w-5 h-4 border border-amber-400/60 rounded-sm" />
                  </div>
                  <span className="text-lg font-mono tracking-widest text-gold-400 font-bold">
                    •••• •••• •••• 2026
                  </span>
                </div>

                <div className="flex justify-between items-end text-xs">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest">Cardholder Identity</p>
                    <p className="font-bold text-ivory-100 truncate max-w-[200px]">
                      {email ? email : 'analyst@paytrace.dev'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest">Expires</p>
                    <p className="font-mono text-gold-400 font-bold">11/28</p>
                  </div>
                </div>
              </>
            ) : (
              // Card Back
              <div className="h-full flex flex-col justify-between">
                <div className="h-9 bg-navy-950 rounded -mx-6 mt-1" />
                <div className="bg-slate-200/90 h-8 rounded px-3 flex items-center justify-end">
                  <span className="font-mono text-xs text-navy-950 font-black tracking-widest">CVV: 884</span>
                </div>
                <p className="text-[9px] text-slate-400 text-center font-mono">
                  DEMO SECURITY TOKEN • CLICK TO FLIP FRONT
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-2xl text-slate-800 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-crimson-50 border border-crimson-200 text-xs text-crimson-700 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Analyst Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@paytrace.dev"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary-gold"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary-navy"
                size="sm"
                onClick={() => setDemoCredentials('analyst@paytrace.dev')}
                leftIcon={<UserIcon className="w-3.5 h-3.5 text-gold-500" />}
              >
                Lead Analyst
              </Button>
              <Button
                type="button"
                variant="secondary-navy"
                size="sm"
                onClick={() => setDemoCredentials('admin@paytrace.dev')}
                leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              >
                System Admin
              </Button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[11px] text-slate-400 font-mono max-w-sm mx-auto">
          ⚠️ Demonstration Environment. Never enter real banking credentials, PINs, or actual credit card numbers.
        </p>
      </div>
    </div>
  );
};

