import React, { useState } from 'react';
import { 
  Scale, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Coins, 
  FileCheck2, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAudio } from '../context/AudioContext';
import { ShinyText } from '../components/ui/ShinyText';
import { DotGrid } from '../components/ui/DotGrid';
import { CountUp } from '../components/ui/CountUp';
import { CardSpotlight } from '../components/ui/CardSpotlight';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { playCoinChime, playCardFlip } = useAudio();
  const [sliderPos, setSliderPos] = useState<number>(50);

  return (
    <div className="min-h-screen bg-navy-950 text-ivory-50 selection:bg-gold-500 selection:text-navy-950 overflow-x-hidden">
      {/* Top Navbar */}
      <header className="border-b border-navy-800/80 bg-navy-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 shadow-gold-glow">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-wider font-sans">
                PAY<span className="text-gold-500">TRACE</span>
              </span>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">FINTECH RECONCILIATION</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/dashboard')}
              className="text-xs font-semibold text-slate-300 hover:text-gold-400 transition-colors hidden sm:block"
            >
              Live Demo Preview
            </button>
            <Button
              variant="outline-gold"
              size="sm"
              onClick={() => {
                playCardFlip();
                onNavigate('/login');
              }}
            >
              Sign In
            </Button>
            <Button
              variant="primary-gold"
              size="sm"
              onClick={() => {
                playCoinChime();
                onNavigate('/login');
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Launch Platform
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 overflow-hidden">
        {/* React Bits Ambient Dot Grid */}
        <DotGrid dotSize={1.5} gap={28} dotColor="rgba(214, 182, 108, 0.12)" />

        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-lavender-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5 text-gold-500" />
              <span>Next-Gen Financial Reconciliation Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-sans leading-tight">
              Every Transaction. <br />
              Every Detail. <br />
              <ShinyText text="In Perfect Balance." speed={4.5} />
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
              Eliminate revenue leakage and hours of manual spreadsheet comparisons. PayTrace automatically matches orders, gateway transactions, and bank settlements—detecting shortfalls and duplicates with explainable algorithmic precision.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button
                variant="primary-gold"
                size="lg"
                onClick={() => {
                  playCoinChime();
                  onNavigate('/login');
                }}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Access Platform
              </Button>
              <Button
                variant="secondary-navy"
                size="lg"
                onClick={() => {
                  playCardFlip();
                  onNavigate('/dashboard');
                }}
                leftIcon={<Play className="w-4 h-4 text-gold-500" />}
              >
                Explore Live Demo
              </Button>
            </div>

            {/* Metric pill strip */}
            <div className="pt-8 grid grid-cols-3 gap-4 border-t border-navy-800/80 max-w-lg mx-auto lg:mx-0">
              <div>
                <p className="text-2xl font-extrabold text-gold-400 font-mono">
                  <CountUp to={100} duration={1.5} suffix="%" />
                </p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Zero Fund Custody</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-ivory-50 font-mono">
                  <CountUp to={3} duration={1.2} suffix="-Way" />
                </p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Automated Cross-Match</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-emerald-400 font-mono">O(N)</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Algorithmic Efficiency</p>
              </div>
            </div>
          </div>

          {/* 3D Payment Visual Centerpiece */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-80 sm:w-96 h-[440px]">
              {/* Back Card (Payments) */}
              <div 
                className="absolute inset-x-0 top-0 h-52 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 border border-navy-700/80 shadow-2xl p-5 -rotate-6 transform hover:rotate-0 transition-transform duration-500 cursor-pointer"
                onClick={playCardFlip}
              >
                <div className="flex justify-between items-start">
                  <div className="w-9 h-7 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <div className="w-4 h-3 border border-amber-400/60 rounded-sm" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">PAYMENT GATEWAY</span>
                </div>
                <div className="mt-8">
                  <p className="text-xs text-slate-400">Captured Volume</p>
                  <p className="text-xl font-bold font-mono text-ivory-100">$184,500.00</p>
                </div>
                <div className="mt-4 flex justify-between text-[11px] font-mono text-slate-400">
                  <span>REF: STRP-9021-TXN</span>
                  <span className="text-emerald-400 font-bold">SETTLED</span>
                </div>
              </div>

              {/* Front Card (Midnight Luxe Gold Master with CardSpotlight & Tilt) */}
              <CardSpotlight
                maxTilt={14}
                spotlightColor="rgba(214, 182, 108, 0.35)"
                className="absolute inset-x-0 top-24 h-56 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 border-2 border-gold-500/60 shadow-gold-glow p-6 rotate-3 transform hover:rotate-0 transition-transform duration-500 cursor-pointer"
                onClick={playCoinChime}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Scale className="w-6 h-6 text-gold-500" />
                    <span className="font-extrabold text-sm tracking-wider text-ivory-50">PAYTRACE</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold-500/20 text-gold-400 border border-gold-500/30">
                    BALANCED LEDGER
                  </span>
                </div>
                <div className="mt-6">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">Reconciled Accuracy</p>
                  <p className="text-2xl font-extrabold font-mono text-gold-400">
                    <CountUp to={98.24} decimals={2} suffix="%" duration={2.2} />
                  </p>
                </div>
                <div className="mt-5 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Analyst Assigned</p>
                    <p className="text-xs font-bold text-ivory-50">Sujith E — Lead</p>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-crimson-500/80 opacity-80" />
                    <div className="w-6 h-6 rounded-full bg-gold-500/80 -ml-3" />
                  </div>
                </div>
              </CardSpotlight>

              {/* Floating Golden Coin Badge */}
              <div 
                onClick={playCoinChime}
                className="absolute -bottom-4 right-4 w-20 h-20 rounded-full bg-gradient-to-tr from-gold-600 via-gold-400 to-gold-300 border-4 border-navy-950 shadow-2xl flex items-center justify-center text-navy-950 font-black cursor-pointer hover:scale-110 transition-transform duration-200 animate-bounce"
                title="Click to ring PayTrace Balance Coin"
              >
                <Coins className="w-10 h-10 text-navy-950" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Before & After Reconciliation Visualizer */}
      <section className="py-20 px-6 bg-navy-900/60 border-y border-navy-800">
        <div className="max-w-5xl mx-auto text-center space-y-4 mb-12">
          <h2 className="text-3xl font-extrabold font-sans">
            Transform Chaos into Mathematical Certainty
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Drag the slider to compare raw, mismatched CSV reports with PayTrace's automated, reconciled audit dossier.
          </p>

          <div className="pt-6 max-w-3xl mx-auto">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={sliderPos} 
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="w-full h-2 bg-navy-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
              <span>← Raw Unmatched CSVs ({100 - sliderPos}%)</span>
              <span className="text-gold-400 font-bold">Slide to Balance Ledger</span>
              <span>Reconciled State ({sliderPos}%) →</span>
            </div>

            {/* Split Screen Container */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="p-5 rounded-xl bg-navy-950 border border-crimson-500/30 space-y-3">
                <div className="flex items-center gap-2 text-crimson-400 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Unreconciled Source Data</span>
                </div>
                <div className="font-mono text-xs text-slate-400 space-y-1 bg-navy-900/80 p-3 rounded-lg border border-navy-800">
                  <p className="text-crimson-400">[ERR] ORD-9821: $250.00</p>
                  <p className="text-amber-400">[WARN] PAY-7712: $230.00 (-$20 shortfall)</p>
                  <p className="text-slate-500">[LOST] ORD-9844: No gateway record found</p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-navy-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PayTrace Reconciled Ledger</span>
                </div>
                <div className="font-mono text-xs text-slate-300 space-y-1 bg-navy-900/80 p-3 rounded-lg border border-navy-800">
                  <p className="text-emerald-400">[MATCH] 1,162 Clean 3-Way Matches</p>
                  <p className="text-gold-400">[CASE] INV-2026-001 opened for $20 variance</p>
                  <p className="text-ivory-50">[AUDIT] Complete signed audit trail recorded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs font-semibold text-gold-500 uppercase tracking-widest font-mono">Workflow Architecture</p>
          <h2 className="text-3xl font-extrabold font-sans">How PayTrace Balances Your Books</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-4 hover:border-gold-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 font-bold text-lg font-mono">
              01
            </div>
            <h3 className="text-lg font-bold text-ivory-50">Ingest Tri-Fold CSVs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload Order Management invoices, Payment Gateway transaction dumps, and Bank Settlement statements. Built-in pre-validators flag syntax and corrupted rows.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-4 hover:border-gold-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 font-bold text-lg font-mono">
              02
            </div>
            <h3 className="text-lg font-bold text-ivory-50">Execute Java Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our core algorithm performs 3-way hash matching in $O(N)$ time, calculating mathematical tolerances and categorizing missing records, shortfalls, and duplicates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-4 hover:border-gold-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 font-bold text-lg font-mono">
              03
            </div>
            <h3 className="text-lg font-bold text-ivory-50">Investigate & Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every flagged discrepancy spawns an actionable case file. Analysts assign categories, attach resolution notes, apply stamps, and export signed PDF balance summaries.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 p-10 rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 border border-gold-500/40 text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ivory-50">
            Ready to Audit Financial Records with Confidence?
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Experience the full student project demonstration with synthetic financial datasets.
          </p>
          <Button
            variant="primary-gold"
            size="lg"
            onClick={() => {
              playCoinChime();
              onNavigate('/login');
            }}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Launch PayTrace Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-800/80 py-8 px-6 text-center text-xs text-slate-500 font-mono">
        <p>PayTrace — Payment Discrepancy Detection & Reconciliation System</p>
        <p className="mt-1 text-slate-600">Built by Thurika G, Sujith E, Tharun J, Mithunasri J • Academic Project</p>
      </footer>
    </div>
  );
};

