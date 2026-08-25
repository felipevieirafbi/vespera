import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { EngineStats, GameState, NPC, PlayerUpgrades } from '../types/game';
import { TelemetryHUD } from './TelemetryHUD';
import { RadarMap } from './RadarMap';
import { GameControlsOverlay } from './GameControlsOverlay';
import { VirtualDPad } from './VirtualDPad';
import { DialogueBox } from './DialogueBox';
import { UpgradeForge } from './UpgradeForge';
import { Info, Sparkles, Sword, Shield, Zap, Skull, Home, Flame, Compass } from 'lucide-react';

interface GameCanvasProps {
  initialGameState?: GameState;
  memoryDust?: number;
  upgrades?: PlayerUpgrades;
  lyraRescued?: boolean;
  currentCycle?: number;
  onVictory: (finalStats: EngineStats) => void;
  onReturnToMenu?: () => void;
  onGameStateChange?: (newState: GameState) => void;
  onUpdateMetaProgress?: (
    memoryDust: number,
    upgrades: PlayerUpgrades,
    lyraRescued: boolean,
    currentCycle: number
  ) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  initialGameState = 'SANCTUARY' as GameState,
  memoryDust = 0,
  upgrades = { vitalityLevel: 0, damageLevel: 0, dashLevel: 0 },
  lyraRescued = false,
  currentCycle = 1,
  onVictory,
  onReturnToMenu,
  onGameStateChange,
  onUpdateMetaProgress,
}) => {
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
    currentBiome: initialGameState === 'SANCTUARY' ? 'Santuário do Vazio' : 'Floresta de Quartzo',
    currentCycle: currentCycle,
    prismsLeft: 3,
    anchorsCount: 0,
    preservedObstaclesCount: 0,
    obstaclesInView: 0,
    totalObstacles: 30,
    collidingX: false,
    collidingY: false,
    nearbyNPC: null,
    memoryTears: 1,
    awakenedNPCsCount: 0,
    memoryDust: memoryDust,
    gameState: initialGameState,
    upgrades: upgrades,
    lyraRescued: lyraRescued,
    inPortalZone: false,
    hp: 100 + (upgrades.vitalityLevel || 0) * 20,
    maxHp: 100 + (upgrades.vitalityLevel || 0) * 20,
    isDashing: false,
    dashCooldownProgress: 1,
    attackCooldownProgress: 1,
    enemiesAlive: 0,
    enemiesDefeated: 0,
    bossHp: 500,
    bossMaxHp: 500,
    bossAlive: false,
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
  const [isForgeOpen, setIsForgeOpen] = useState<boolean>(false);

  // Metaprogression & NPC dialogue state
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

    // Create Game Engine with dialogue, forge, portal, death and victory callbacks
    const engine = new GameEngine(
      canvas,
      initialGameState,
      memoryDust,
      upgrades,
      lyraRescued,
      currentCycle,
      (newStats) => {
        setStats(newStats);
        if (onUpdateMetaProgress) {
          onUpdateMetaProgress(
            newStats.memoryDust ?? engine.memoryDust,
            newStats.upgrades ?? engine.playerUpgrades,
            newStats.lyraRescued ?? engine.lyraRescued,
            newStats.currentCycle ?? engine.currentCycle
          );
        }
      },
      (npcToTalk) => {
        setActiveDialogueNPC(npcToTalk);
      },
      () => {
        // Open Soul Forge
        setIsForgeOpen(true);
      },
      () => {
        // Entered Portal -> Transition to PLAYING
        if (onGameStateChange) {
          onGameStateChange('PLAYING');
        }
      },
      () => {
        // Player Died -> Transition to SANCTUARY
        if (onGameStateChange) {
          onGameStateChange('SANCTUARY');
        }
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
  }, [initialGameState, onVictory, onGameStateChange, onUpdateMetaProgress]);

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

    if (npcId === 'npc_lyra' && engineRef.current) {
      engineRef.current.lyraRescued = true;
      if (onUpdateMetaProgress) {
        onUpdateMetaProgress(
          engineRef.current.memoryDust,
          engineRef.current.playerUpgrades,
          true,
          engineRef.current.currentCycle
        );
      }
    }
  }, [onUpdateMetaProgress]);

  // Forge actions
  const handleBuyUpgrade = useCallback((key: keyof PlayerUpgrades, cost: number) => {
    if (engineRef.current) {
      const success = engineRef.current.buyUpgrade(key, cost);
      if (success && onUpdateMetaProgress) {
        onUpdateMetaProgress(
          engineRef.current.memoryDust,
          engineRef.current.playerUpgrades,
          engineRef.current.lyraRescued,
          engineRef.current.currentCycle
        );
      }
    }
  }, [onUpdateMetaProgress]);

  // Navigation & Control actions
  const handleResetPosition = useCallback(() => {
    engineRef.current?.resetPlayerPosition();
  }, []);

  const handleTeleportBiome = useCallback((biome: 'quartz_forest' | 'chrono_ruins' | 'crimson_desert') => {
    // Only in PLAYING mode
    if (engineRef.current && engineRef.current.gameState === 'PLAYING') {
      const targetCoords = {
        quartz_forest: { x: -900, y: -900 },
        chrono_ruins: { x: 950, y: -850 },
        crimson_desert: { x: 0, y: 950 },
      };
      engineRef.current.player.x = targetCoords[biome].x;
      engineRef.current.player.y = targetCoords[biome].y;
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!engineRef.current) return;
    const newZoom = Math.min(2.5, engineRef.current.camera.zoom + 0.2);
    engineRef.current.camera.setZoom(newZoom);
    setZoom(newZoom);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!engineRef.current) return;
    const newZoom = Math.max(0.3, engineRef.current.camera.zoom - 0.2);
    engineRef.current.camera.setZoom(newZoom);
    setZoom(newZoom);
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.camera.setZoom(1.0);
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

  const currentDust = stats.memoryDust ?? memoryDust;
  const currentUpgrades = stats.upgrades ?? upgrades;

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

      {/* Top Right: Title Badge, Sanctuary Actions & Radar Map */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-slate-950/90 px-3 py-1.5 backdrop-blur-md shadow-xl shadow-purple-950/20">
          <Sparkles className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="text-right">
            <h1 className="text-xs font-bold tracking-wider text-purple-300 font-mono">
              VÉSPERA: FASE 8
            </h1>
            <p className="text-[9.5px] text-slate-400 font-mono">O Santuário do Vazio e a Forja da Alma</p>
          </div>

          {/* Quick button to open Soul Forge if in Sanctuary */}
          {stats.gameState === 'SANCTUARY' && (
            <button
              onClick={() => setIsForgeOpen(true)}
              className="flex items-center gap-1 ml-1 rounded-lg border border-rose-500/60 bg-rose-950/70 px-2 py-1 text-xs font-mono font-bold text-rose-300 hover:bg-rose-900 transition shadow-[0_0_10px_rgba(244,63,94,0.3)] cursor-pointer"
              title="Abrir Forja da Alma"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>FORJA</span>
            </button>
          )}

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
            title="Especificações da Fase 8"
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

      {/* Upgrade Forge Overlay (Phase 8) */}
      {isForgeOpen && (
        <UpgradeForge
          memoryDust={currentDust}
          upgrades={currentUpgrades}
          onBuyUpgrade={handleBuyUpgrade}
          onClose={() => setIsForgeOpen(false)}
        />
      )}

      {/* JRPG Dialogue Box Overlay (Phase 5 & 8) */}
      {activeDialogueNPC && (
        <DialogueBox
          npc={activeDialogueNPC}
          isAwakened={awakenedNPCs.has(activeDialogueNPC.id) || (activeDialogueNPC.id === 'npc_lyra' && stats.lyraRescued)}
          currentCycle={stats.currentCycle}
          memoryTears={memoryTears}
          onGiveTear={handleGiveMemoryTear}
          onClose={handleCloseDialogue}
        />
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="max-w-lg w-full rounded-2xl border border-purple-500/40 bg-slate-950 p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-bold text-purple-300 font-mono uppercase tracking-wider">
                VÉSPERA: Especificações da Fase 8 (A Forja da Alma)
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
                <h4 className="text-indigo-400 font-bold mb-0.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  1. O Santuário do Vazio (Hub World Permanente):
                </h4>
                <p className="text-[11px] text-slate-400">
                  Um refúgio celestial seguro desenhado no Canvas com limites fechados e sem perigos. Ao morrer no mundo aberto, sua alma reencarna imediatamente aqui com 100% de HP e todo o Pó de Memória preservado!
                </p>
              </div>

              <div>
                <h4 className="text-rose-400 font-bold mb-0.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  2. A Forja da Alma & Meta-Progresso:
                </h4>
                <p className="text-[11px] text-slate-400">
                  Fale com <strong className="text-rose-300">Kael, o Forjador</strong> para aprimorar permanentemente seus atributos vitais:
                  <br />• <strong>Vitalidade Titânica:</strong> +20 HP Máximo permanente.
                  <br />• <strong>Fio da Realidade:</strong> +15 de dano de ataque permanente.
                  <br />• <strong>Passos Fantasmas:</strong> Reduz a recarga do Dash.
                </p>
              </div>

              <div>
                <h4 className="text-purple-300 font-bold mb-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  3. Economia de Pó de Memória:
                </h4>
                <p className="text-[11px] text-slate-400">
                  Derrote aberrações no labirinto (+10 Dust) e Senhores do Fragmento (+100 Dust) para acumular recursos eternos.
                </p>
              </div>

              <div>
                <h4 className="text-cyan-300 font-bold mb-0.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  4. Portal da Ruptura:
                </h4>
                <p className="text-[11px] text-slate-400">
                  Atravesse o vórtice estelar ao norte do Santuário para adentrar o próximo Ciclo de Combate procedural.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full rounded-xl bg-purple-500/20 border border-purple-400/40 py-2.5 text-xs font-mono text-purple-200 hover:bg-purple-500/30 transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
