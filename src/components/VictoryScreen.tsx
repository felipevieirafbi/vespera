import React from 'react';
import { Sparkles, Trophy, RotateCcw, Shield, Heart, Skull, Users, Gem } from 'lucide-react';
import { EngineStats } from '../types/game';

interface VictoryScreenProps {
  stats: EngineStats;
  onPlayAgain: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ stats, onPlayAgain }) => {
  return (
    <div
      id="victory-screen-root"
      className="relative w-screen h-screen overflow-hidden bg-[#050510] flex items-center justify-center select-none text-slate-100"
    >
      {/* Prismatic radial burst */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/30 via-purple-950/20 to-[#050510]" />
      
      {/* Prismatic Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-cyan-500/20 blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-fuchsia-500/20 blur-[130px] pointer-events-none animate-pulse" />

      {/* Main Victory Card */}
      <div className="relative z-20 max-w-xl w-full mx-4 flex flex-col items-center text-center p-8 md:p-10 rounded-3xl border border-cyan-400/50 bg-slate-950/90 backdrop-blur-2xl shadow-[0_0_90px_rgba(0,255,255,0.25)]">
        
        {/* Prismatic Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-amber-300 flex items-center justify-center p-3 mb-4 shadow-[0_0_30px_rgba(0,255,255,0.6)] animate-bounce" style={{ animationDuration: '3s' }}>
          <Trophy className="w-10 h-10 text-slate-950" />
        </div>

        {/* Victory Header */}
        <h1 className="text-4xl md:text-5xl font-black font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-amber-200 drop-shadow-[0_0_25px_rgba(0,255,255,0.5)] mb-2">
          VITÓRIA ABSOLUTA
        </h1>

        <p className="text-sm md:text-base font-mono text-cyan-200/90 mb-6 italic">
          &ldquo;O Caleidoscópio repousa. O ciclo foi quebrado.&rdquo;
        </p>

        {/* Narrative Description */}
        <p className="text-xs font-mono text-slate-300 mb-6 max-w-md leading-relaxed">
          Você derrotou <strong className="text-rose-400">O Senhor do Fragmento</strong> e unificou o <strong className="text-cyan-300">Coração do Caleidoscópio</strong>. A realidade finalmente estabilizou e a tempestade de vidro cessou.
        </p>

        {/* Run Telemetry Summary */}
        <div className="grid grid-cols-2 gap-3 w-full mb-8 font-mono text-xs text-left">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Ciclos Percorridos</span>
              <span className="text-sm font-bold text-cyan-200">{stats.currentCycle}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-950 border border-rose-500/30 text-rose-400">
              <Skull className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Inimigos Derrotados</span>
              <span className="text-sm font-bold text-rose-200">{stats.enemiesDefeated}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950 border border-amber-500/30 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Almas Despertadas</span>
              <span className="text-sm font-bold text-amber-200">{stats.awakenedNPCsCount || 0} / 3</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400">
              <Gem className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Âncoras Cravadas</span>
              <span className="text-sm font-bold text-emerald-200">{stats.anchorsCount}</span>
            </div>
          </div>
        </div>

        {/* Restart / Play Again Button */}
        <button
          id="btn-play-again"
          onClick={onPlayAgain}
          className="group relative w-full sm:w-80 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 text-slate-950 font-bold font-mono text-sm tracking-widest uppercase cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,255,255,0.6)]"
        >
          <div className="flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>DESPERTAR NOVAMENTE (NOVO CICLO)</span>
          </div>
        </button>

      </div>
    </div>
  );
};
