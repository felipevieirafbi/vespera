import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { EngineStats } from '../types/game';
import { TelemetryHUD } from './TelemetryHUD';
import { RadarMap } from './RadarMap';
import { GameControlsOverlay } from './GameControlsOverlay';
import { VirtualDPad } from './VirtualDPad';
import { Info, Sparkles } from 'lucide-react';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [stats, setStats] = useState<EngineStats>({
    fps: 60,
    deltaTime: 0,
    worldX: 0,
    worldY: 0,
    speed: 0,
    isMoving: false,
    activeKeys: [],
    currentBiome: 'Floresta de Quartzo',
    currentCycle: 1,
    prismsLeft: 3,
    anchorsCount: 0,
    preservedObstaclesCount: 0,
    obstaclesInView: 0,
    totalObstacles: 300,
    collidingX: false,
    collidingY: false,
  });

  const [zoom, setZoom] = useState<number>(1.0);
  const [enableGlow, setEnableGlow] = useState<boolean>(true);
  const [enableTrail, setEnableTrail] = useState<boolean>(true);
  const [enableParticles, setEnableParticles] = useState<boolean>(true);
  const [enableVignette, setEnableVignette] = useState<boolean>(true);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Initialize engine and attach game loop + listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create Game Engine
    const engine = new GameEngine(canvas, (newStats) => {
      setStats(newStats);
    });
    engineRef.current = engine;

    // Attach input listeners
    const detachInputs = engine.inputManager.attach(window);

    // Resize handling
    const handleResize = () => {
      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : window.innerWidth;
      const height = parent ? parent.clientHeight : window.innerHeight;
      engine.resize(width, height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Start engine loop
    engine.start();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      detachInputs();
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  // Actions
  const handleResetPosition = useCallback(() => {
    engineRef.current?.resetPlayerPosition();
  }, []);

  const handleTeleportBiome = useCallback((biome: 'quartz_forest' | 'chrono_ruins' | 'crimson_desert') => {
    engineRef.current?.teleportToBiome(biome);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!engineRef.current) return;
    const newZoom = Math.min(2.5, engineRef.current.getZoom() + 0.2);
    engineRef.current.setZoom(newZoom);
    setZoom(newZoom);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!engineRef.current) return;
    const newZoom = Math.max(0.3, engineRef.current.getZoom() - 0.2);
    engineRef.current.setZoom(newZoom);
    setZoom(newZoom);
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.setZoom(1.0);
    setZoom(1.0);
  }, []);

  const handleToggleGlow = useCallback(() => {
    if (!engineRef.current) return;
    const next = !enableGlow;
    engineRef.current.config.enableGlow = next;
    setEnableGlow(next);
  }, [enableGlow]);

  const handleToggleTrail = useCallback(() => {
    if (!engineRef.current) return;
    const next = !enableTrail;
    engineRef.current.config.enableTrail = next;
    setEnableTrail(next);
  }, [enableTrail]);

  const handleToggleParticles = useCallback(() => {
    if (!engineRef.current) return;
    const next = !enableParticles;
    engineRef.current.config.enableParticles = next;
    setEnableParticles(next);
  }, [enableParticles]);

  const handleToggleVignette = useCallback(() => {
    if (!engineRef.current) return;
    const next = !enableVignette;
    engineRef.current.config.enableVignette = next;
    setEnableVignette(next);
  }, [enableVignette]);

  const handleForceRupture = useCallback(() => {
    engineRef.current?.forceRupture();
  }, []);

  const handlePlantAnchor = useCallback(() => {
    engineRef.current?.plantAnchor();
  }, []);

  const handleDirectionChange = useCallback((dx: number, dy: number) => {
    engineRef.current?.inputManager.setVirtualVector(dx, dy);
  }, []);

  return (
    <div
      id="game-viewport-container"
      className="relative w-screen h-screen overflow-hidden bg-[#050510] select-none"
    >
      {/* 2D Mechanical Rendering Canvas */}
      <canvas
        id="vespera-main-canvas"
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full cursor-crosshair"
      />

      {/* Top Left: Telemetry and Key HUD */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <TelemetryHUD stats={stats} zoom={zoom} />
      </div>

      {/* Top Right: Title Badge & Radar Map */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-slate-950/85 px-3 py-1.5 backdrop-blur-md shadow-xl shadow-cyan-950/20">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div className="text-right">
            <h1 className="text-xs font-bold tracking-wider text-cyan-300 font-mono">
              VÉSPERA: FASE 4
            </h1>
            <p className="text-[9.5px] text-slate-400 font-mono">As Âncoras de Realidade (Prismas)</p>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="ml-1 p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
            title="Especificações da Fase 4"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {engineRef.current && (
          <RadarMap
            playerX={stats.worldX}
            playerY={stats.worldY}
            obstacles={engineRef.current.obstacles}
            anchors={engineRef.current.anchors}
            worldBounds={engineRef.current.config.worldBounds}
          />
        )}
      </div>

      {/* Bottom Center: Game Controls Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <GameControlsOverlay
          onResetPosition={handleResetPosition}
          onTeleportBiome={handleTeleportBiome}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onToggleGlow={handleToggleGlow}
          onToggleTrail={handleToggleTrail}
          onToggleParticles={handleToggleParticles}
          onToggleVignette={handleToggleVignette}
          onForceRupture={handleForceRupture}
          onPlantAnchor={handlePlantAnchor}
          prismsLeft={stats.prismsLeft ?? 3}
          enableGlow={enableGlow}
          enableTrail={enableTrail}
          enableParticles={enableParticles}
          enableVignette={enableVignette}
          currentZoom={zoom}
        />
      </div>

      {/* Bottom Left: Touch / Mouse D-Pad for testing */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto hidden md:block">
        <div className="flex flex-col items-center gap-1">
          <VirtualDPad onDirectionChange={handleDirectionChange} />
          <span className="text-[8.5px] font-mono text-slate-400">Joystick Analógico</span>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="max-w-lg w-full rounded-2xl border border-cyan-500/30 bg-slate-950 p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-bold text-cyan-400 font-mono uppercase tracking-wider">
                VÉSPERA: Especificações da Fase 4
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ FECHAR
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <h4 className="text-cyan-300 font-bold mb-0.5">1. Âncoras de Realidade (Prismas de Estabilidade):</h4>
                <p className="text-[11px] text-slate-400">
                  O jogador carrega inicialmente <strong className="text-cyan-200">3 Prismas</strong>. Pressione a tecla <strong className="text-cyan-200">F</strong> ou clique em <strong className="text-cyan-200">FINCAR PRISMA (F)</strong> para fixar uma âncora nas suas coordenadas globais.
                </p>
              </div>

              <div>
                <h4 className="text-amber-300 font-bold mb-0.5">2. Campo de Estabilidade (Raio 450px):</h4>
                <p className="text-[11px] text-slate-400">
                  Cada âncora fincada cria um campo de força de 450px de raio e é marcada por um diamante celestial ultra-brilhante no mapa.
                </p>
              </div>

              <div>
                <h4 className="text-emerald-300 font-bold mb-0.5">3. A Regra de Ouro da Persistência:</h4>
                <p className="text-[11px] text-slate-400">
                  Ao forçar uma <strong className="text-rose-300">Ruptura (R)</strong>, todo o universo do Caleidoscópio entra em colapso e se regenera, <strong className="text-emerald-300">EXCETO</strong> as Âncoras e todas as estruturas dentro de seus Campos de Estabilidade (450px), que permanecem intactas no próximo ciclo!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full rounded-xl bg-cyan-500/20 border border-cyan-400/40 py-2.5 text-xs font-mono text-cyan-200 hover:bg-cyan-500/30 transition"
            >
              Compreendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
