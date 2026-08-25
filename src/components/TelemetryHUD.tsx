import React from 'react';
import { EngineStats } from '../types/game';
import { Activity, Compass, Cpu, Gauge, Zap, Shield, Sparkles, SlidersHorizontal } from 'lucide-react';

interface TelemetryHUDProps {
  stats: EngineStats;
  zoom: number;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ stats, zoom }) => {
  const isKeyActive = (key: string) => {
    return stats.activeKeys.some(k => k.toLowerCase() === key.toLowerCase() || k === `Key${key.toUpperCase()}`);
  };

  const getBiomeBadgeColor = (biome: string) => {
    if (biome.includes('Quartzo')) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
    if (biome.includes('Tempo')) return 'text-purple-400 border-purple-500/30 bg-purple-950/40';
    return 'text-orange-400 border-orange-500/30 bg-orange-950/40';
  };

  const isSliding = (stats.collidingX || stats.collidingY) && stats.isMoving;

  return (
    <div
      id="telemetry-hud-root"
      className="flex flex-col gap-2 max-w-sm pointer-events-none select-none"
    >
      {/* Realidade Cycle Indicator */}
      <div className="flex items-center justify-center rounded-xl border border-cyan-500/50 bg-cyan-950/80 p-2 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.3)]">
        <h1 className="text-sm font-bold uppercase tracking-widest text-cyan-300 font-mono flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          CICLO DE REALIDADE: <span className="text-white text-base ml-1">{stats.currentCycle}</span>
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </h1>
      </div>

      {/* Primary Metrics Card */}
      <div className="rounded-xl border border-cyan-500/25 bg-slate-950/85 p-3 backdrop-blur-md shadow-2xl shadow-cyan-950/20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00FFFF]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              VÉSPERA • FASE 2
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-200 font-bold">{stats.fps}</span> FPS
          </div>
        </div>

        {/* Biome Indicator Banner */}
        <div className="mb-2 flex items-center justify-between rounded-md border p-1.5 px-2.5 font-mono text-[11px] transition-colors duration-300 ${getBiomeBadgeColor(stats.currentBiome)}">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold">{stats.currentBiome}</span>
          </div>
          <span className="text-[9.5px] uppercase opacity-75">Bioma Atual</span>
        </div>

        {/* Coordinates and Speed Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
          <div className="rounded border border-slate-800 bg-slate-900/80 p-2">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>Posição Virtual</span>
            </div>
            <div className="mt-1 font-bold text-slate-100 flex items-center justify-between text-[11.5px]">
              <span>X: <span className="text-cyan-300">{stats.worldX}</span></span>
              <span>Y: <span className="text-cyan-300">{stats.worldY}</span></span>
            </div>
          </div>

          <div className="rounded border border-slate-800 bg-slate-900/80 p-2">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase">
              <Gauge className="w-3 h-3 text-emerald-400" />
              <span>Velocidade Vetorial</span>
            </div>
            <div className="mt-1 font-bold text-slate-100 flex items-center justify-between text-[11.5px]">
              <span>{stats.speed} <span className="text-[9.5px] font-normal text-slate-400">px/s</span></span>
              <span className={`text-[9.5px] px-1 rounded font-normal ${stats.isMoving ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {stats.isMoving ? 'NORMAL' : 'PARADO'}
              </span>
            </div>
          </div>
        </div>

        {/* Critical AABB Sliding Collision Telemetry */}
        <div className="rounded border border-slate-800/90 bg-slate-900/90 p-2 text-xs font-mono mb-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase mb-1">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>Física & Colisão Deslizante (AABB)</span>
            </div>
            {isSliding && (
              <span className="text-[9px] text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1 rounded animate-pulse">
                SLIDING ATIVO
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Eixo X:</span>
              <span className={`font-semibold px-1 rounded ${stats.collidingX ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-300'}`}>
                {stats.collidingX ? 'BLOQUEADO' : 'LIVRE'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Eixo Y:</span>
              <span className={`font-semibold px-1 rounded ${stats.collidingY ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-300'}`}>
                {stats.collidingY ? 'BLOQUEADO' : 'LIVRE'}
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Details & Frustum Culling */}
        <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-500" />
            <span>dt: <span className="text-slate-200 font-semibold">{(stats.deltaTime * 1000).toFixed(1)}ms</span></span>
          </div>
          <div>
            <span>Zoom: <span className="text-cyan-400 font-semibold">{Math.round(zoom * 100)}%</span></span>
          </div>
          <div>
            <span>Culling: <span className="text-cyan-300 font-semibold">{stats.obstaclesInView}</span>/{stats.totalObstacles}</span>
          </div>
        </div>
      </div>

      {/* Real-time Keyboard Visualizer */}
      <div className="rounded-xl border border-slate-800/90 bg-slate-950/75 p-2 backdrop-blur-md">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9.5px] font-mono uppercase text-slate-400">Entrada Vetorial</span>
          <span className="text-[9.5px] font-mono text-cyan-400/80">WASD / Setas</span>
        </div>

        <div className="flex justify-center gap-1 font-mono text-xs select-none">
          {/* A Key */}
          <div className={`w-8 h-8 flex items-center justify-center rounded border transition-all ${
            isKeyActive('a') || isKeyActive('arrowleft')
              ? 'border-cyan-400 bg-cyan-500/30 text-cyan-200 shadow-[0_0_8px_#00FFFF]'
              : 'border-slate-800 bg-slate-900/60 text-slate-500'
          }`}>
            A
          </div>

          <div className="flex flex-col gap-1">
            {/* W Key */}
            <div className={`w-8 h-8 flex items-center justify-center rounded border transition-all ${
              isKeyActive('w') || isKeyActive('arrowup')
                ? 'border-cyan-400 bg-cyan-500/30 text-cyan-200 shadow-[0_0_8px_#00FFFF]'
                : 'border-slate-800 bg-slate-900/60 text-slate-500'
            }`}>
              W
            </div>
            {/* S Key */}
            <div className={`w-8 h-8 flex items-center justify-center rounded border transition-all ${
              isKeyActive('s') || isKeyActive('arrowdown')
                ? 'border-cyan-400 bg-cyan-500/30 text-cyan-200 shadow-[0_0_8px_#00FFFF]'
                : 'border-slate-800 bg-slate-900/60 text-slate-500'
            }`}>
              S
            </div>
          </div>

          {/* D Key */}
          <div className={`w-8 h-8 flex items-center justify-center rounded border transition-all ${
            isKeyActive('d') || isKeyActive('arrowright')
              ? 'border-cyan-400 bg-cyan-500/30 text-cyan-200 shadow-[0_0_8px_#00FFFF]'
              : 'border-slate-800 bg-slate-900/60 text-slate-500'
          }`}>
            D
          </div>

          {/* Shift Sprint key */}
          <div className={`ml-2 px-2 h-8 flex items-center justify-center rounded border self-end text-[10px] transition-all ${
            isKeyActive('shiftleft') || isKeyActive('shiftright') || isKeyActive('shift')
              ? 'border-amber-400 bg-amber-500/30 text-amber-200 shadow-[0_0_8px_#f59e0b]'
              : 'border-slate-800 bg-slate-900/60 text-slate-500'
          }`}>
            <Zap className="w-3 h-3 mr-1" />
            SHIFT
          </div>

          {/* R Rupture key */}
          <div className={`ml-1 w-8 h-8 flex items-center justify-center rounded border self-end font-bold transition-all ${
            isKeyActive('r')
              ? 'border-rose-400 bg-rose-500/40 text-rose-200 shadow-[0_0_12px_#f43f5e]'
              : 'border-slate-800 bg-slate-900/60 text-slate-500'
          }`}>
            R
          </div>
        </div>
      </div>
    </div>
  );
};
