import React from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Sparkles, Wind, Eye, SunDim } from 'lucide-react';

interface GameControlsOverlayProps {
  onResetPosition: () => void;
  onTeleportBiome: (biome: 'quartz_forest' | 'chrono_ruins' | 'crimson_desert') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleGlow: () => void;
  onToggleTrail: () => void;
  onToggleParticles: () => void;
  onToggleVignette: () => void;
  enableGlow: boolean;
  enableTrail: boolean;
  enableParticles: boolean;
  enableVignette: boolean;
  currentZoom: number;
}

export const GameControlsOverlay: React.FC<GameControlsOverlayProps> = ({
  onResetPosition,
  onTeleportBiome,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleGlow,
  onToggleTrail,
  onToggleParticles,
  onToggleVignette,
  enableGlow,
  enableTrail,
  enableParticles,
  enableVignette,
  currentZoom,
}) => {
  return (
    <div
      id="game-controls-toolbar"
      className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-cyan-500/20 bg-slate-950/85 p-2 backdrop-blur-md shadow-2xl shadow-cyan-950/30"
    >
      {/* Reset Position Origin */}
      <button
        id="btn-reset-origin"
        onClick={onResetPosition}
        className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1.5 text-xs font-mono text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 active:scale-95 transition"
        title="Reposicionar jogador em (0, 0)"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Origem (0, 0)</span>
      </button>

      <div className="h-5 w-[1px] bg-slate-800 mx-0.5" />

      {/* Biome Teleport Buttons */}
      <div className="flex items-center gap-1">
        <button
          id="btn-tp-quartz"
          onClick={() => onTeleportBiome('quartz_forest')}
          className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/40 px-2 py-1 text-[11px] font-mono text-emerald-300 hover:bg-emerald-900/60 transition"
          title="Teleportar para Floresta de Quartzo (Esmeralda)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Quartzo</span>
        </button>

        <button
          id="btn-tp-chrono"
          onClick={() => onTeleportBiome('chrono_ruins')}
          className="flex items-center gap-1 rounded-md border border-purple-500/40 bg-purple-950/40 px-2 py-1 text-[11px] font-mono text-purple-300 hover:bg-purple-900/60 transition"
          title="Teleportar para Ruínas do Tempo (Roxo)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>Ruínas</span>
        </button>

        <button
          id="btn-tp-crimson"
          onClick={() => onTeleportBiome('crimson_desert')}
          className="flex items-center gap-1 rounded-md border border-orange-500/40 bg-orange-950/40 px-2 py-1 text-[11px] font-mono text-orange-300 hover:bg-orange-900/60 transition"
          title="Teleportar para Deserto Carmesim (Laranja)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <span>Carmesim</span>
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-800 mx-0.5" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          id="btn-zoom-out"
          onClick={onZoomOut}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white active:scale-95 transition"
          title="Diminuir Zoom"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-zoom-reset"
          onClick={onResetZoom}
          className="h-7 px-2 flex items-center justify-center rounded-md border border-slate-800 bg-slate-900/80 font-mono text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white active:scale-95 transition"
          title="Resetar Zoom para 100%"
        >
          {Math.round(currentZoom * 100)}%
        </button>

        <button
          id="btn-zoom-in"
          onClick={onZoomIn}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white active:scale-95 transition"
          title="Aumentar Zoom"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-800 mx-0.5" />

      {/* VFX Switches */}
      <div className="flex items-center gap-1">
        <button
          id="btn-toggle-glow"
          onClick={onToggleGlow}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-mono transition ${
            enableGlow
              ? 'border-cyan-500/40 bg-cyan-950/50 text-cyan-300'
              : 'border-slate-800 bg-slate-900/40 text-slate-500 line-through'
          }`}
          title="Bloom/Glow do Jogador"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Glow</span>
        </button>

        <button
          id="btn-toggle-trail"
          onClick={onToggleTrail}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-mono transition ${
            enableTrail
              ? 'border-cyan-500/40 bg-cyan-950/50 text-cyan-300'
              : 'border-slate-800 bg-slate-900/40 text-slate-500 line-through'
          }`}
          title="Rastro de Luz do Jogador"
        >
          <Wind className="w-3 h-3 text-cyan-300" />
          <span>Trail</span>
        </button>

        <button
          id="btn-toggle-particles"
          onClick={onToggleParticles}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-mono transition ${
            enableParticles
              ? 'border-indigo-500/40 bg-indigo-950/50 text-indigo-300'
              : 'border-slate-800 bg-slate-900/40 text-slate-500 line-through'
          }`}
          title="Poeira Mágica e Parallax 3D"
        >
          <Eye className="w-3 h-3 text-indigo-400" />
          <span>Poeira</span>
        </button>

        <button
          id="btn-toggle-vignette"
          onClick={onToggleVignette}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-mono transition ${
            enableVignette
              ? 'border-slate-700 bg-slate-900/80 text-slate-200'
              : 'border-slate-800 bg-slate-900/40 text-slate-500 line-through'
          }`}
          title="Vinheta Cinematográfica"
        >
          <SunDim className="w-3 h-3 text-amber-300" />
          <span>Vinheta</span>
        </button>
      </div>
    </div>
  );
};
