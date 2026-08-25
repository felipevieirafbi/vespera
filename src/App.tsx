/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { StartMenu } from './components/StartMenu';
import { VictoryScreen } from './components/VictoryScreen';
import { EngineStats } from './types/game';

export type GameState = 'MENU' | 'PLAYING' | 'VICTORY';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [lastStats, setLastStats] = useState<EngineStats>({
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
  });

  const handleStartGame = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleVictory = useCallback((finalStats: EngineStats) => {
    setLastStats(finalStats);
    setGameState('VICTORY');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleReturnToMenu = useCallback(() => {
    setGameState('MENU');
  }, []);

  return (
    <main id="app-root" className="w-screen h-screen overflow-hidden bg-[#050510] select-none">
      {gameState === 'MENU' && (
        <StartMenu onStartGame={handleStartGame} />
      )}

      {gameState === 'PLAYING' && (
        <GameCanvas
          key={gameState}
          onVictory={handleVictory}
          onReturnToMenu={handleReturnToMenu}
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
