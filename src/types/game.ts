export type BiomeType = 'quartz_forest' | 'chrono_ruins' | 'crimson_desert';
export type GameState = 'MENU' | 'HUB' | 'SANCTUARY' | 'PLAYING' | 'VICTORY';

// Phase 9: Boons (Bênçãos Temporárias)
export type BoonId = 'colossal_blade' | 'shattering_dash' | 'blood_siphon' | 'frenzy';

export interface BoonInfo {
  id: BoonId;
  name: string;
  subtitle: string;
  description: string;
  iconName: string;
  color: string;
  borderColor: string;
  badge: string;
}

export interface EchoAltar {
  id: number;
  x: number;
  y: number;
  radius: number; // 24px
  isActive: boolean;
  pulsePhase: number;
  biome: BiomeType;
}

export interface PlayerUpgrades {
  vitalityLevel: number; // +20 HP per level (cost: 50)
  damageLevel: number;   // +10 Damage per level (cost: 75)
  dashLevel: number;     // -20% cooldown per level (cost: 60)
}

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
  color?: string;
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
  // Combat & Survivability (Phase 6 & 9)
  hp: number;
  maxHp: number;
  isDashing: boolean;
  dashTimer: number; // in seconds (e.g. 0.2s)
  dashCooldown: number; // in seconds (e.g. 1.0s max)
  attackCooldown: number; // in seconds (e.g. 0.3s max)
  invulnerabilityTimer: number; // in seconds (e.g. 0.5s after damage)
  flashTimer: number; // Hit flash (white frame)
  activeBoons: BoonId[];
}

export type EnemyType = 'hunter' | 'brute' | 'gunner';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  size: number;
  speed: number;
  hp: number;
  maxHp: number;
  color: string;
  borderColor: string;
  glowColor: string;
  aggroRadius: number; // 300-420px
  isAggro: boolean;
  vx: number;
  vy: number;
  facingAngle: number;
  contactDamage: number;
  isImmuneKnockback?: boolean;
  shootTimer?: number;
  flashTimer?: number;
}

// Phase 7: Boss - O Senhor do Fragmento
export interface BossEnemy {
  id: number;
  x: number;
  y: number;
  size: number; // 52px
  speed: number; // 95 px/s
  hp: number; // 500
  maxHp: number; // 500
  color: string; // '#4c0519'
  borderColor: string; // '#f43f5e'
  glowColor: string; // '#e11d48'
  aggroRadius: number; // 650px
  isAggro: boolean;
  vx: number;
  vy: number;
  facingAngle: number;
  shootTimer: number; // Fires every 2.0s
  ringRotation: number;
  isDefeated: boolean;
  flashTimer?: number;
}

// Phase 7 & 9: Projectiles (Boss & Gunner)
export interface BossProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number; // 6-7px
  color: string;
  life: number;
  maxLife: number; // 4.0s
  damage?: number;
  source?: 'boss' | 'gunner';
}

// Phase 7: Victory Item - Coração do Caleidoscópio
export interface VictoryItem {
  active: boolean;
  x: number;
  y: number;
  radius: number; // 24px
  pulse: number;
}

// Phase 7: Floating Damage Numbers (Juice)
export interface FloatingDamageNumber {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
  scale: number;
  timer: number;
  duration: number; // 1.0s
}

export interface SlashAttack {
  active: boolean;
  startX: number;
  startY: number;
  angle: number;
  radius: number; // 75-120px sweep reach
  arcAngle: number; // e.g. 2.4 - 3.8 radians
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
  nearbyAltar: EchoAltar | null;
  memoryTears: number;
  awakenedNPCsCount: number;
  // Phase 8 Meta-Progression & Sanctuary Hub
  memoryDust: number;
  gameState: GameState;
  upgrades: PlayerUpgrades;
  lyraRescued: boolean;
  inPortalZone: boolean;
  // Phase 6 Combat Stats
  hp: number;
  maxHp: number;
  isDashing: boolean;
  dashCooldownProgress: number; // 0 to 1 (1 = ready)
  attackCooldownProgress: number; // 0 to 1 (1 = ready)
  enemiesAlive: number;
  enemiesDefeated: number;
  // Phase 7 Boss Stats
  bossHp: number;
  bossMaxHp: number;
  bossAlive: boolean;
  bossDistance: number;
  bossAggro: boolean;
  victoryItemSpawned: boolean;
  // Phase 9 Boons (Bênçãos Ativas)
  activeBoons: BoonId[];
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

