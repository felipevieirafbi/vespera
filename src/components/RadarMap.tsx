import React from 'react';
import { WorldObstacle, RealityAnchor, NPC, Enemy } from '../types/game';

interface RadarMapProps {
  playerX: number;
  playerY: number;
  obstacles: WorldObstacle[];
  anchors?: RealityAnchor[];
  npcs?: NPC[];
  enemies?: Enemy[];
  worldBounds: { minX: number; maxX: number; minY: number; maxY: number };
}

export const RadarMap: React.FC<RadarMapProps> = ({
  playerX,
  playerY,
  obstacles,
  anchors = [],
  npcs = [],
  enemies = [],
  worldBounds,
}) => {
  const mapSize = 140;
  const worldWidth = worldBounds.maxX - worldBounds.minX;
  const worldHeight = worldBounds.maxY - worldBounds.minY;

  // Convert world coordinate to radar pixel coordinate (0 to mapSize)
  const toRadar = (wx: number, wy: number) => {
    const rx = ((wx - worldBounds.minX) / worldWidth) * mapSize;
    const ry = ((wy - worldBounds.minY) / worldHeight) * mapSize;
    return { x: rx, y: ry };
  };

  const pPos = toRadar(playerX, playerY);
  const oPos = toRadar(0, 0);

  const getObstacleColor = (biome: string) => {
    if (biome === 'quartz_forest') return 'bg-emerald-400';
    if (biome === 'chrono_ruins') return 'bg-purple-400';
    return 'bg-orange-400';
  };

  return (
    <div
      id="radar-map-container"
      className="relative rounded-lg border border-cyan-500/30 bg-slate-950/85 p-2.5 backdrop-blur-md shadow-xl shadow-cyan-950/20"
    >
      <div className="flex items-center justify-between pb-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400">
        <span>Radar de Biomas</span>
        <span className="text-slate-400">±2000u</span>
      </div>

      <div
        className="relative overflow-hidden rounded border border-slate-800 bg-[#050510]"
        style={{ width: `${mapSize}px`, height: `${mapSize}px` }}
      >
        {/* Biome Ambient Background Tints on Radar */}
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-emerald-950/20 border-r border-b border-slate-800/40" title="Floresta de Quartzo" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-950/20 border-b border-slate-800/40" title="Ruínas do Tempo" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-orange-950/20" title="Deserto Carmesim" />

        {/* Radar concentric sweep rings */}
        <div className="absolute inset-0 border border-slate-800/60 rounded-full scale-75 pointer-events-none" />
        <div className="absolute inset-0 border border-slate-800/40 rounded-full scale-50 pointer-events-none" />

        {/* Center Axes */}
        <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-slate-800/80 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-[1px] -translate-y-1/2 bg-slate-800/80 pointer-events-none" />

        {/* Reality Anchors & Stability Field Circles on Radar */}
        {anchors.map((anchor) => {
          const aPos = toRadar(anchor.x, anchor.y);
          const radarRadius = (anchor.radius / worldWidth) * mapSize;
          return (
            <React.Fragment key={`radar-anchor-${anchor.id}`}>
              {/* Field of Stability */}
              <div
                className="absolute rounded-full border border-cyan-400/40 bg-cyan-400/10 pointer-events-none"
                style={{
                  width: `${radarRadius * 2}px`,
                  height: `${radarRadius * 2}px`,
                  left: `${aPos.x - radarRadius}px`,
                  top: `${aPos.y - radarRadius}px`,
                }}
              />
              {/* Anchor Prism Marker */}
              <div
                className="absolute w-2 h-2 -ml-1 -mt-1 rotate-45 border border-white bg-cyan-200 shadow-[0_0_6px_#00FFFF] pointer-events-none z-10"
                style={{ left: `${aPos.x}px`, top: `${aPos.y}px` }}
                title={`Âncora #${anchor.id}`}
              />
            </React.Fragment>
          );
        })}

        {/* Origin (0,0) marker */}
        <div
          className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full border border-sky-400 bg-sky-400/30 pointer-events-none"
          style={{ left: `${oPos.x}px`, top: `${oPos.y}px` }}
          title="Origem (0, 0)"
        />

        {/* Procedural Obstacle dots colored by biome */}
        {obstacles.map((obs, idx) => {
          const pos = toRadar(obs.x, obs.y);
          return (
            <div
              key={`radar-obs-${obs.id}-${idx}`}
              className={`absolute w-1 h-1 -ml-[2px] -mt-[2px] rounded-[0.5px] opacity-80 ${getObstacleColor(obs.biome)}`}
              style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            />
          );
        })}

        {/* Living NPCs on Radar (Radiant Gold #FFD700) */}
        {npcs.map((npc) => {
          const nPos = toRadar(npc.x, npc.y);
          return (
            <div
              key={`radar-npc-${npc.id}`}
              className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full border border-white bg-amber-400 shadow-[0_0_8px_#FFD700] z-15 animate-pulse"
              style={{ left: `${nPos.x}px`, top: `${nPos.y}px` }}
              title={`NPC: ${npc.name}`}
            />
          );
        })}

        {/* Phase 6: Living Enemies (Aberrações) on Radar (Aggressive Crimson) */}
        {enemies.map((enemy) => {
          const ePos = toRadar(enemy.x, enemy.y);
          return (
            <div
              key={`radar-enemy-${enemy.id}`}
              className={`absolute w-1.5 h-1.5 -ml-[3px] -mt-[3px] rotate-45 border border-rose-300 ${
                enemy.isAggro ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e] z-15' : 'bg-rose-700/80 z-10'
              }`}
              style={{ left: `${ePos.x}px`, top: `${ePos.y}px` }}
              title={`Aberração (${enemy.hp} HP)`}
            />
          );
        })}

        {/* Player Blip */}
        <div
          className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-sm bg-cyan-400 shadow-[0_0_8px_#00FFFF] border border-white transition-all duration-75 z-20"
          style={{ left: `${pPos.x}px`, top: `${pPos.y}px` }}
        />
      </div>

      {/* Biome Legend */}
      <div className="mt-2 flex items-center justify-between text-[8.5px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Quartzo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>Tempo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <span>Carmesim</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rotate-45 bg-rose-500" />
          <span className="text-rose-300">Inimigo</span>
        </div>
      </div>
    </div>
  );
};

