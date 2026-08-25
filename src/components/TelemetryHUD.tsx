import React from 'react';
import { EngineStats } from '../types/game';
import {
  Activity,
  Compass,
  Cpu,
  Gauge,
  Zap,
  Shield,
  Sparkles,
  Gem,
  Anchor,
  Droplets,
  Users,
  MessageSquare,
  Heart,
  Sword,
  Skull,
  Crosshair,
} from 'lucide-react';

interface TelemetryHUDProps {
  stats: EngineStats;
  zoom: number;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ stats, zoom }) => {
  const isKeyActive = (key: string) => {
    return stats.activeKeys.some(
      (k) => k.toLowerCase() === key.toLowerCase() || k === `Key${key.toUpperCase()}`
    );
  };

  const getBiomeBadgeColor = (biome: string) => {
    if (biome.includes('Quartzo')) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
    if (biome.includes('Tempo')) return 'text-purple-400 border-purple-500/30 bg-purple-950/40';
    return 'text-orange-400 border-orange-500/30 bg-orange-950/40';
  };

  const isSliding = (stats.collidingX || stats.collidingY) && stats.isMoving;

  const currentHp = stats.hp ?? 100;
  const maxHp = stats.maxHp ?? 100;
  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  // Determine HP bar styling based on remaining health
  const getHpColor = () => {
    if (hpPercent > 50) return 'bg-emerald-400 shadow-[0_0_12px_#34d399]';
    if (hpPercent > 25) return 'bg-amber-400 shadow-[0_0_12px_#fbbf24]';
    return 'bg-rose-500 shadow-[0_0_15px_#f43f5e] animate-pulse';
  };

  return (
    <div
      id="telemetry-hud-root"
      className="flex flex-col gap-2 max-w-sm pointer-events-none select-none"
    >
      {/* Reality Cycle & Prisms Inventory Banner */}
      <div className="flex flex-col gap-1.5 rounded-xl border border-cyan-500/50 bg-slate-950/90 p-2.5 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.25)]">
        <div className="flex items-center justify-between">
          <h1 className="text-xs font-bold uppercase tracking-widest text-cyan-300 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            CICLO DE REALIDADE: <span className="text-white text-sm ml-0.5">{stats.currentCycle}</span>
          </h1>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(6,182,212,0.3)] font-bold">
            FASE 7: O ENCANTO FINAL
          </span>
        </div>

        {/* Phase 7: BOSS HEALTH & RADAR TRACKER */}
        {stats.bossAlive && (
          <div className={`rounded-lg border p-2 font-mono transition-all ${
            stats.bossAggro
              ? 'border-rose-500 bg-rose-950/80 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
              : 'border-rose-900/80 bg-slate-900/90'
          }`}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <div className="flex items-center gap-1.5">
                <Skull className={`w-3.5 h-3.5 ${stats.bossAggro ? 'text-rose-400 animate-bounce' : 'text-rose-500'}`} />
                <span className="font-bold text-rose-300">O SENHOR DO FRAGMENTO</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-400 font-mono">
                  {stats.bossDistance}u dist
                </span>
                <span className="font-bold text-xs text-rose-200">
                  {stats.bossHp} <span className="text-slate-500 font-normal">/ {stats.bossMaxHp}</span>
                </span>
              </div>
            </div>

            {/* Boss HP Bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-950 border border-rose-900">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 shadow-[0_0_10px_#f43f5e] transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, ((stats.bossHp ?? 0) / (stats.bossMaxHp ?? 500)) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Phase 7: Sacred Victory Item Beacon Alert */}
        {stats.victoryItemSpawned && (
          <div className="rounded-lg border border-cyan-400 bg-cyan-950/90 p-2 font-mono text-[11px] text-cyan-200 shadow-[0_0_20px_rgba(0,255,255,0.4)] animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
              <span className="font-bold">✦ CORAÇÃO DO CALEIDOSCÓPIO SPAWNOU!</span>
            </div>
            <span className="text-[10px] bg-cyan-400 text-slate-950 font-bold px-2 py-0.5 rounded">
              COLETE-O!
            </span>
          </div>
        )}

        {/* Phase 6: NEON PLAYER HEALTH BAR */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2 font-mono">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <div className="flex items-center gap-1.5">
              <Heart className={`w-3.5 h-3.5 ${hpPercent <= 25 ? 'text-rose-500 animate-bounce' : 'text-emerald-400'}`} />
              <span className="font-bold text-slate-200">VITALIDADE (HP)</span>
            </div>
            <span className="font-bold text-xs">
              <span className={hpPercent <= 25 ? 'text-rose-400' : 'text-emerald-300'}>{currentHp}</span>
              <span className="text-slate-500 font-normal"> / {maxHp}</span>
            </span>
          </div>

          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800">
            <div
              className={`h-full transition-all duration-150 ease-out ${getHpColor()}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          {/* Combat Status Grid (Dash Cooldown, Attack Readiness & Enemies) */}
          <div className="grid grid-cols-3 gap-1 mt-1.5 pt-1.5 border-t border-slate-800/80 text-[10px]">
            {/* Dash Cooldown */}
            <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded px-1.5 py-0.5">
              <span className="text-slate-400">DASH:</span>
              <span className={`font-bold ${(stats.dashCooldownProgress ?? 1) >= 1 ? 'text-cyan-300' : 'text-amber-400'}`}>
                {(stats.dashCooldownProgress ?? 1) >= 1 ? 'PRONTO' : `${Math.round((stats.dashCooldownProgress ?? 0) * 100)}%`}
              </span>
            </div>

            {/* Attack Readiness */}
            <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded px-1.5 py-0.5">
              <span className="text-slate-400">GOLPE:</span>
              <span className={`font-bold ${(stats.attackCooldownProgress ?? 1) >= 1 ? 'text-cyan-300' : 'text-amber-400'}`}>
                {(stats.attackCooldownProgress ?? 1) >= 1 ? 'PRONTO' : 'RECARGA'}
              </span>
            </div>

            {/* Aberrations Slain */}
            <div className="flex items-center justify-between bg-rose-950/40 border border-rose-900/60 rounded px-1.5 py-0.5">
              <span className="text-rose-400 flex items-center gap-0.5">
                <Skull className="w-2.5 h-2.5" />
                <span>INIM:</span>
              </span>
              <span className="font-bold text-rose-300">
                {stats.enemiesAlive ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Metaprogress Bar (Prisms, Anchors, Memory Tears, Awakened Souls) */}
        <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-800 text-[10.5px] font-mono">
          {/* Prisms Left */}
          <div className="flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/30 rounded p-1 justify-center">
            <Gem className={`w-3 h-3 ${stats.prismsLeft > 0 ? 'text-cyan-300 animate-pulse' : 'text-slate-600'}`} />
            <span className="text-slate-400 text-[9px]">PRISMA:</span>
            <span className={`font-bold ${stats.prismsLeft > 0 ? 'text-cyan-200' : 'text-slate-500'}`}>
              {stats.prismsLeft}
            </span>
          </div>

          {/* Placed Anchors */}
          <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded p-1 justify-center">
            <Anchor className="w-3 h-3 text-cyan-300" />
            <span className="text-slate-400 text-[9px]">ÂNCO.:</span>
            <span className="font-bold text-cyan-200">{stats.anchorsCount}</span>
          </div>

          {/* Memory Tears */}
          <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 rounded p-1 justify-center">
            <Droplets className={`w-3 h-3 ${(stats.memoryTears || 0) > 0 ? 'text-cyan-300 fill-cyan-400 animate-pulse' : 'text-slate-600'}`} />
            <span className="text-slate-400 text-[9px]">LÁGR.:</span>
            <span className={`font-bold ${(stats.memoryTears || 0) > 0 ? 'text-cyan-200' : 'text-slate-500'}`}>
              {stats.memoryTears || 0}
            </span>
          </div>

          {/* Awakened NPCs */}
          <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 rounded p-1 justify-center">
            <Users className="w-3 h-3 text-amber-400" />
            <span className="text-slate-400 text-[9px]">ALMAS:</span>
            <span className="font-bold text-amber-300">
              {stats.awakenedNPCsCount || 0}/3
            </span>
          </div>
        </div>

        {/* Proximity Alert if near an NPC */}
        {stats.nearbyNPC && (
          <div className="mt-1 flex items-center justify-between rounded-lg border border-amber-400/70 bg-amber-950/80 px-2 py-1 font-mono text-[11px] text-amber-200 shadow-[0_0_12px_rgba(255,215,0,0.3)] animate-pulse">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-amber-300" />
              <span className="font-bold">NPC: {stats.nearbyNPC.name}</span>
            </div>
            <span className="rounded bg-amber-400 px-1.5 py-0.2 text-[9.5px] font-bold text-slate-950">
              PRESSIONE E
            </span>
          </div>
        )}
      </div>

      {/* Primary Metrics Card */}
      <div className="rounded-xl border border-cyan-500/25 bg-slate-950/85 p-3 backdrop-blur-md shadow-2xl shadow-cyan-950/20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00FFFF]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              VÉSPERA • TELEMETRIA
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-200 font-bold">{stats.fps}</span> FPS
          </div>
        </div>

        {/* Biome Indicator Banner */}
        <div className={`mb-2 flex items-center justify-between rounded-md border p-1.5 px-2.5 font-mono text-[11px] transition-colors duration-300 ${getBiomeBadgeColor(stats.currentBiome)}`}>
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
              <span className={`text-[9.5px] px-1 rounded font-normal ${stats.isDashing ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50' : stats.isMoving ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {stats.isDashing ? 'DASH' : stats.isMoving ? 'NORMAL' : 'PARADO'}
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
          <span className="text-[9.5px] font-mono uppercase text-slate-400">Controles de Ação & Combate</span>
          <span className="text-[9.5px] font-mono text-cyan-400/80">WASD / SPACE (Dash) / CLIQUE (Atacar)</span>
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

          {/* Space Dash key */}
          <div className={`px-2 h-8 flex items-center justify-center rounded border self-end text-[10.5px] font-bold transition-all ${
            isKeyActive(' ') || isKeyActive('space')
              ? 'border-cyan-300 bg-cyan-500/40 text-white shadow-[0_0_12px_#00FFFF]'
              : 'border-cyan-900/80 bg-cyan-950/40 text-cyan-400'
          }`} title="Esquiva / Dash Rápido (Space)">
            <Zap className="w-3 h-3 mr-0.5" />
            DASH
          </div>

          {/* E Talk Key */}
          <div className={`w-8 h-8 flex items-center justify-center rounded border self-end font-bold transition-all ${
            isKeyActive('e')
              ? 'border-amber-300 bg-amber-500/50 text-white shadow-[0_0_12px_#FFD700]'
              : 'border-amber-900/80 bg-amber-950/40 text-amber-400'
          }`} title="Falar com NPC (Interagir)">
            E
          </div>

          {/* F Plant Anchor key */}
          <div className={`w-8 h-8 flex items-center justify-center rounded border self-end font-bold transition-all ${
            isKeyActive('f')
              ? 'border-cyan-300 bg-cyan-500/50 text-white shadow-[0_0_12px_#00FFFF]'
              : 'border-cyan-900/80 bg-cyan-950/40 text-cyan-400'
          }`} title="Fincar Prisma de Estabilidade">
            F
          </div>

          {/* R Rupture key */}
          <div className={`w-8 h-8 flex items-center justify-center rounded border self-end font-bold transition-all ${
            isKeyActive('r')
              ? 'border-rose-400 bg-rose-500/40 text-rose-200 shadow-[0_0_12px_#f43f5e]'
              : 'border-slate-800 bg-slate-900/60 text-slate-500'
          }`} title="Forçar Ruptura Temporal">
            R
          </div>
        </div>
      </div>
    </div>
  );
};

