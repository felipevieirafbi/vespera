export type BiomeType = 'quartz_forest' | 'chrono_ruins' | 'crimson_desert';

export interface Vector2D {
  x: number;
  y: number;
}

export interface RealityAnchor {
  id: number;
  x: number;
  y: number;
  radius: number; // Strict 450px
  placedAtCycle: number;
  color: string;
}

export interface NPC {
  id: string; // 'npc_orion' | 'npc_lyra' | 'npc_kael'
  name: string; // 'Orion, o Sábio' | 'Lyra, a Maga' | 'Kael, o Ferreiro'
  title: string;
  x: number;
  y: number;
  radius: number; // 18px
  color: string; // #FFD700
  biome: BiomeType;
}

export interface PlayerTrailPoint {
  x: number;
  y: number;
  size: number;
  alpha: number;
  angle: number;
  isDash?: boolean;
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
  // Combat & Survivability (Phase 6)
  hp: number;
  maxHp: number;
  isDashing: boolean;
  dashTimer: number; // in seconds (e.g. 0.15s)
  dashCooldown: number; // in seconds (e.g. 1.0s max)
  attackCooldown: number; // in seconds (e.g. 0.3s max)
  invulnerabilityTimer: number; // in seconds (e.g. 0.5s after damage)
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  hp: number;
  maxHp: number;
  color: string;
  borderColor: string;
  glowColor: string;
  aggroRadius: number; // 300px
  isAggro: boolean;
  vx: number;
  vy: number;
  facingAngle: number;
}

export interface SlashAttack {
  active: boolean;
  startX: number;
  startY: number;
  angle: number;
  radius: number; // 75px sweep reach
  arcAngle: number; // e.g. 2.4 radians (~140 deg)
  timer: number;
  duration: number; // 0.15s (150ms)
}

export interface CombatParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
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
  prismsLeft: number;
  anchorsCount: number;
  preservedObstaclesCount: number;
  obstaclesInView: number;
  totalObstacles: number;
  collidingX: boolean;
  collidingY: boolean;
  nearbyNPC: NPC | null;
  memoryTears: number;
  awakenedNPCsCount: number;
  // Phase 6 Combat Stats
  hp: number;
  maxHp: number;
  isDashing: boolean;
  dashCooldownProgress: number; // 0 to 1 (1 = ready)
  attackCooldownProgress: number; // 0 to 1 (1 = ready)
  enemiesAlive: number;
  enemiesDefeated: number;
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

