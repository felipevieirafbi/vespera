import React from 'react';
import { Play, Sparkles, Sword, Zap, Shield, Skull, Heart, Radio, Volume2 } from 'lucide-react';

interface StartMenuProps {
  onStartGame: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onStartGame }) => {
  return (
    <div
      id="start-menu-root"
      className="relative w-screen h-screen overflow-hidden bg-[#050510] flex items-center justify-center select-none text-slate-100"
    >
      {/* CRT Scanline & Grid Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#050510]/80 to-[#050510] z-10" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 z-10 bg-repeat"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 3px, 6px 100%',
        }}
      />

      {/* Floating Prismatic Background Crystals */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-rose-600/15 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      {/* Main Menu Modal Card */}
      <div className="relative z-20 max-w-2xl w-full mx-4 flex flex-col items-center text-center p-8 md:p-10 rounded-3xl border border-cyan-500/40 bg-slate-950/85 backdrop-blur-2xl shadow-[0_0_80px_rgba(6,182,212,0.18)]">
        
        {/* Prismatic Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-cyan-400/40 bg-cyan-950/60 text-cyan-300 text-xs font-mono tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-300" style={{ animationDuration: '6s' }} />
          <span>ACTION ROGUELIKE PROCEDURAL</span>
        </div>

        {/* Title Neon Glow */}
        <h1 className="text-6xl md:text-7xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_35px_rgba(0,255,255,0.65)] mb-2">
          VÉSPERA
        </h1>
        
        <p className="text-sm md:text-base font-mono tracking-wider text-cyan-200/80 mb-8 max-w-md">
          O Caleidoscópio Fragmentado
        </p>

        {/* Core Game Loop Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full mb-8 text-left font-mono">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold mb-1">
              <Sword className="w-3.5 h-3.5 text-cyan-400" />
              <span>A LÂMINA</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">Cortes velozes em arco de 150° e Hit Stop.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>DASH I-FRAME</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">Esquiva rápida com invulnerabilidade tática.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold mb-1">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              <span>CHEFÃO</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">Derrote o Senhor do Fragmento para vencer.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold mb-1">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ÁUDIO 100%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">Síntese procedural Web Audio em tempo real.</p>
          </div>
        </div>

        {/* Start Game Action Button (Awaken) */}
        <button
          id="btn-awaken-start"
          onClick={onStartGame}
          className="group relative w-full sm:w-80 py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-400 text-slate-950 font-bold font-mono text-base tracking-widest uppercase cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_50px_rgba(6,182,212,0.9)]"
        >
          {/* Shimmer sweep effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
          
          <div className="flex items-center justify-center gap-2.5">
            <Play className="w-5 h-5 fill-slate-950" />
            <span>DESPERTAR</span>
          </div>
        </button>

        {/* Audio note & Controls overview */}
        <div className="mt-6 flex flex-col items-center gap-1 text-xs font-mono text-slate-400">
          <p className="flex items-center gap-1.5 text-[11px] text-cyan-300/90">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            O sintetizador de áudio procedural será ativado ao clicar em Despertar.
          </p>
          <span className="text-[10px] text-slate-500 mt-1">
            WASD: Mover • Botão Esquerdo: Atacar • Espaço: Dash • E: Falar • F: Âncora
          </span>
        </div>

      </div>
    </div>
  );
};
