export type BiomeType = 'quartz_forest' | 'chrono_ruins' | 'crimson_desert';

export interface Vector2D {
  x: number;
  y: number;
}

export interface PlayerTrailPoint {
  x: number;
  y: number;
  size: number;
  alpha: number;
  angle: number;
}

export interface Player {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  vx: number;
  vy: number;
  facingAngle: number;
}

export interface WorldObstacle {
  id: number;
  x: number; // Center X
  y: number; // Center Y
  width: number;
  height: number;
  biome: BiomeType;
  color: string;
  borderColor: string;
  glowColor: string;
  name: string;
}

export interface DustParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  color: string;
  alpha: number;
  vx: number;
  vy: number;
  parallaxDepth: number; // 0.1 to 0.7 for multi-layer 3D effect
  pulseSpeed: number;
  pulsePhase: number;
}

export interface EngineStats {
  fps: number;
  deltaTime: number;
  worldX: number;
  worldY: number;
  speed: number;
  isMoving: boolean;
  activeKeys: string[];
  currentBiome: string;
  currentCycle: number;
  obstaclesInView: number;
  totalObstacles: number;
  collidingX: boolean;
  collidingY: boolean;
}

export interface EngineConfig {
  gridSize: number;
  worldBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  baseSpeed: number;
  sprintMultiplier: number;
  enableGlow: boolean;
  enableTrail: boolean;
  enableParticles: boolean;
  enableVignette: boolean;
  cameraSmoothing: number;
}

