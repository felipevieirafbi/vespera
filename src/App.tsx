/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { StartMenu } from './components/StartMenu';
import { VictoryScreen } from './components/VictoryScreen';
import { EngineStats, GameState, PlayerUpgrades } from './types/game';

const STORAGE_KEYS = {
  DUST: 'vespera_meta_dust',
  UPGRADES: 'vespera_meta_upgrades',
  LYRA: 'vespera_meta_lyra_rescued',
  CYCLE: 'vespera_meta_cycle',
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');

  // Meta-progression State (Persisted across deaths & sessions)
  const [memoryDust, setMemoryDust] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DUST);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [playerUpgrades, setPlayerUpgrades] = useState<PlayerUpgrades>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UPGRADES);
      return saved
        ? JSON.parse(saved)
        : { vitalityLevel: 0, damageLevel: 0, dashLevel: 0 };
    } catch {
      return { vitalityLevel: 0, damageLevel: 0, dashLevel: 0 };
    }
  });

  const [lyraRescued, setLyraRescued] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LYRA);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [currentCycle, setCurrentCycle] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CYCLE);
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const [lastStats, setLastStats] = useState<EngineStats>({
    fps: 60,
    deltaTime: 0,
    worldX: 0,
    worldY: 0,
    speed: 0,
    isMoving: false,
    activeKeys: [],
    currentBiome: 'Santuário do Vazio',
    currentCycle: 1,
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
    memoryDust: 0,
    gameState: 'SANCTUARY',
    upgrades: { vitalityLevel: 0, damageLevel: 0, dashLevel: 0 },
    lyraRescued: false,
    inPortalZone: false,
    hp: 100,
    maxHp: 100,
    isDashing: false,
    dashCooldownProgress: 1,
    attackCooldownProgress: 1,
    enemiesAlive: 0,
    enemiesDefeated: 0,
  });

  // Save meta-progression to localStorage
  const handleUpdateMetaProgress = useCallback(
    (
      newDust: number,
      newUpgrades: PlayerUpgrades,
      newLyraRescued: boolean,
      newCycle: number
    ) => {
      setMemoryDust(newDust);
      setPlayerUpgrades({ ...newUpgrades });
      setLyraRescued(newLyraRescued);
      setCurrentCycle(newCycle);

      try {
        localStorage.setItem(STORAGE_KEYS.DUST, newDust.toString());
        localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(newUpgrades));
        localStorage.setItem(STORAGE_KEYS.LYRA, newLyraRescued ? 'true' : 'false');
        localStorage.setItem(STORAGE_KEYS.CYCLE, newCycle.toString());
      } catch {
        // Safe fallback if localStorage is disabled in sandboxed iframe
      }
    },
    []
  );

  const handleStartGame = useCallback(() => {
    // Awaken starts directly in the peaceful Refúgio (HUB)
    setGameState('HUB');
  }, []);

  const handleVictory = useCallback((finalStats: EngineStats) => {
    setLastStats(finalStats);
    setGameState('VICTORY');
  }, []);

  const handlePlayAgain = useCallback(() => {
    // Return to HUB with rewards preserved
    setGameState('HUB');
  }, []);

  const handleReturnToMenu = useCallback(() => {
    setGameState('MENU');
  }, []);

  const handleGameStateChange = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  return (
    <main id="app-root" className="w-screen h-screen overflow-hidden bg-[#050510] select-none">
      {gameState === 'MENU' && (
        <StartMenu
          onStartGame={handleStartGame}
          savedDust={memoryDust}
          currentCycle={currentCycle}
        />
      )}

      {(gameState === 'HUB' || gameState === 'SANCTUARY' || gameState === 'PLAYING') && (
        <GameCanvas
          key={gameState === 'PLAYING' ? 'open-world' : 'hub-refugio'}
          initialGameState={gameState}
          memoryDust={memoryDust}
          upgrades={playerUpgrades}
          lyraRescued={lyraRescued}
          currentCycle={currentCycle}
          onVictory={handleVictory}
          onReturnToMenu={handleReturnToMenu}
          onGameStateChange={handleGameStateChange}
          onUpdateMetaProgress={handleUpdateMetaProgress}
        />
      )}

      {gameState === 'VICTORY' && (
        <VictoryScreen
          stats={lastStats}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </main>
  );
}
