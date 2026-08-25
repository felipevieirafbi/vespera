import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { EngineStats, NPC } from '../types/game';
import { TelemetryHUD } from './TelemetryHUD';
import { RadarMap } from './RadarMap';
import { GameControlsOverlay } from './GameControlsOverlay';
import { VirtualDPad } from './VirtualDPad';
import { DialogueBox } from './DialogueBox';
import { Info, Sparkles, Sword, Shield, Zap, Skull, Home, Trophy } from 'lucide-react';

interface GameCanvasProps {
  onVictory: (finalStats: EngineStats) => void;
  onReturnToMenu?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onVictory, onReturnToMenu }) => {
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
    nearbyNPC: null,
    memoryTears: 1,
    awakenedNPCsCount: 0,
    hp: 100,
    maxHp: 100,
    isDashing: false,
    dashCooldownProgress: 1,
    attackCooldownProgress: 1,
    enemiesAlive: 30,
    enemiesDefeated: 0,
    bossHp: 500,
    bossMaxHp: 500,
    bossAlive: true,
    bossDistance: 9999,
    bossAggro: false,
    victoryItemSpawned: false,
  });

  const [zoom, setZoom] = useState<number>(1.0);
  const [enableGlow, setEnableGlow] = useState<boolean>(true);
  const [enableTrail, setEnableTrail] = useState<boolean>(true);
  const [enableParticles, setEnableParticles] = useState<boolean>(true);
  const [enableVignette, setEnableVignette] = useState<boolean>(true);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Phase 5 Metaprogression state (Persists across cycles!)
  const [memoryTears, setMemoryTears] = useState<number>(1);
  const [awakenedNPCs, setAwakenedNPCs] = useState<Set<string>>(new Set());
  const [activeDialogueNPC, setActiveDialogueNPC] = useState<NPC | null>(null);

  // Sync narrative metaprogression to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateNarrativeState(memoryTears, awakenedNPCs.size);
    }
  }, [memoryTears, awakenedNPCs]);

  // Initialize engine and attach game loop + listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create Game Engine with dialogue & victory callbacks
    const engine = new GameEngine(
      canvas,
      (newStats) => {
        setStats(newStats);
      },
      (npcToTalk) => {
        setActiveDialogueNPC(npcToTalk);
      },
      () => {
        // Trigger Victory callback to React parent!
        onVictory(engine.getStats());
      }
    );
    engineRef.current = engine;
    engine.updateNarrativeState(memoryTears, awakenedNPCs.size);

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
  }, [onVictory]);

  // Combat actions
  const handleDash = useCallback(() => {
    engineRef.current?.triggerDash();
  }, []);

  const handleAttack = useCallback(() => {
    engineRef.current?.triggerAttack();
  }, []);

  // Dialogue actions
  const handleOpenTalk = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.openDialogueForNearbyNPC();
    }
  }, []);

  const handleCloseDialogue = useCallback(() => {
    setActiveDialogueNPC(null);
    if (engineRef.current) {
      engineRef.current.setDialogueOpen(false);
    }
  }, []);

  const handleGiveMemoryTear = useCallback((npcId: string) => {
    setMemoryTears((prevTears) => {
      const nextTears = Math.max(0, prevTears - 1);
      return nextTears;
    });

    setAwakenedNPCs((prevSet) => {
      const newSet = new Set(prevSet);
      newSet.add(npcId);
      return newSet;
    });
  }, []);

  // Navigation & Control actions
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
    handleCloseDialogue();
    engineRef.current?.forceRupture();
  }, [handleCloseDialogue]);

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
        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-slate-950/90 px-3 py-1.5 backdrop-blur-md shadow-xl shadow-cyan-950/20">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="text-right">
            <h1 className="text-xs font-bold tracking-wider text-cyan-300 font-mono">
              VÉSPERA: FASE 7
            </h1>
            <p className="text-[9.5px] text-slate-400 font-mono">O Encanto Final (Chefão & Áudio Procedural)</p>
          </div>
          {onReturnToMenu && (
            <button
              onClick={onReturnToMenu}
              className="ml-1 p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
              title="Voltar ao Menu Principal"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
            title="Especificações da Fase 7"
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
            npcs={engineRef.current.npcs}
            enemies={engineRef.current.enemies}
            boss={engineRef.current.boss}
            victoryItem={engineRef.current.victoryItem}
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
          onDash={handleDash}
          onAttack={handleAttack}
          onTalkNPC={handleOpenTalk}
          nearbyNPC={stats.nearbyNPC}
          prismsLeft={stats.prismsLeft ?? 3}
          enableGlow={enableGlow}
          enableTrail={enableTrail}
          enableParticles={enableParticles}
          enableVignette={enableVignette}
          currentZoom={zoom}
        />
      </div>

      {/* Bottom Left: Touch / Mouse D-Pad & Combat Actions */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto hidden md:block">
        <div className="flex flex-col items-center gap-1">
          <VirtualDPad
            onDirectionChange={handleDirectionChange}
            onDash={handleDash}
            onAttack={handleAttack}
          />
          <span className="text-[8.5px] font-mono text-slate-400">Controles Mobile (Analógico / Golpe / Dash)</span>
        </div>
      </div>

      {/* JRPG Dialogue Box Overlay (Phase 5) */}
      {activeDialogueNPC && (
        <DialogueBox
          npc={activeDialogueNPC}
          isAwakened={awakenedNPCs.has(activeDialogueNPC.id)}
          currentCycle={stats.currentCycle}
          memoryTears={memoryTears}
          onGiveTear={handleGiveMemoryTear}
          onClose={handleCloseDialogue}
        />
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="max-w-lg w-full rounded-2xl border border-cyan-500/40 bg-slate-950 p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-bold text-cyan-300 font-mono uppercase tracking-wider">
                VÉSPERA: Especificações da Fase 7 (O Encanto Final)
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
                <h4 className="text-rose-400 font-bold mb-0.5 flex items-center gap-1.5">
                  <Skull className="w-3.5 h-3.5" />
                  1. O Senhor do Fragmento (Chefão Epico):
                </h4>
                <p className="text-[11px] text-slate-400">
                  Um colosso geométrico de <strong className="text-rose-300">500 HP</strong> com anéis orbitais giratórios de obsidiana carmesim. Ao detectar o jogador a menos de <strong className="text-rose-300">600px</strong>, dispara rajadas em leque de 3 projéteis de energia destrutiva a cada 2 segundos.
                </p>
              </div>

              <div>
                <h4 className="text-cyan-300 font-bold mb-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  2. Condição de Vitória (Coração do Caleidoscópio):
                </h4>
                <p className="text-[11px] text-slate-400">
                  Ao derrotar o Senhor do Fragmento, o <strong className="text-cyan-200">Coração do Caleidoscópio</strong> cai no chão emitindo ondas prismáticas. Toque nele para quebrar o ciclo e alcançar a <strong className="text-cyan-300">Vitória Canônica</strong>!
                </p>
              </div>

              <div>
                <h4 className="text-amber-300 font-bold mb-0.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  3. Juice & Impacto Tátil (Hit Stop & Floating Numbers):
                </h4>
                <p className="text-[11px] text-slate-400">
                  Micro-pausa cinemática de <strong className="text-amber-200">40ms (Hit Stop)</strong> em cada acerto, números de dano flutuantes em arco e tremor de tela proporcional ao impacto.
                </p>
              </div>

              <div>
                <h4 className="text-emerald-300 font-bold mb-0.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  4. Áudio Procedural 100% Web Audio API:
                </h4>
                <p className="text-[11px] text-slate-400">
                  Osciladores senoidais, ruído branco filtrado para Dash, chiado cortante para ataques e sinos sagrados pentatônicos para a vitória — tudo gerado em tempo real sem arquivos externos!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full rounded-xl bg-cyan-500/20 border border-cyan-400/40 py-2.5 text-xs font-mono text-cyan-200 hover:bg-cyan-500/30 transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


