import {
  Player,
  WorldObstacle,
  DustParticle,
  PlayerTrailPoint,
  EngineStats,
  EngineConfig,
  RealityAnchor,
  NPC,
  Enemy,
  BossEnemy,
  BossProjectile,
  VictoryItem,
  FloatingDamageNumber,
  SlashAttack,
  CombatParticle,
  GameState,
  PlayerUpgrades,
  BoonId,
  EchoAltar,
} from '../types/game';
import { VirtualCamera } from './Camera';
import { InputManager } from './InputManager';
import { WorldGenerator } from './WorldGenerator';
import { CollisionSystem } from './CollisionSystem';
import { AudioManager } from './AudioManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  public camera: VirtualCamera;
  public inputManager: InputManager;
  public audioManager: AudioManager;

  public player: Player;
  public obstacles: WorldObstacle[] = [];
  public particles: DustParticle[] = [];
  public playerTrail: PlayerTrailPoint[] = [];

  // Phase 9: Active Boons & Echo Altars
  public activeBoons: BoonId[] = [];
  public altars: EchoAltar[] = [];
  public nearbyAltar: EchoAltar | null = null;
  public isBoonMenuOpen: boolean = false;
  public hitEnemiesInCurrentDash: Set<number> = new Set();
  public enemyProjectiles: BossProjectile[] = [];

  // Meta-progression and Sanctuary Hub (Phase 8)
  public gameState: GameState = 'SANCTUARY';
  public memoryDust: number = 0;
  public playerUpgrades: PlayerUpgrades = {
    vitalityLevel: 0,
    damageLevel: 0,
    dashLevel: 0,
  };
  public lyraRescued: boolean = false;
  public currentCycle: number = 1;
  public portalRotation: number = 0;

  // Aberration Enemies & Boss (Phase 6 & 7)
  public enemies: Enemy[] = [];
  public boss: BossEnemy | null = null;
  public bossProjectiles: BossProjectile[] = [];
  public victoryItem: VictoryItem | null = null;
  public activeSlash: SlashAttack | null = null;
  public combatParticles: CombatParticle[] = [];
  public floatingDamageNumbers: FloatingDamageNumber[] = [];
  public damageVignetteAlpha: number = 0;
  public enemiesDefeatedCount: number = 0;
  private hitStopTimer: number = 0; // 40ms micro-pause on attack hit

  // Living Entities (Phase 5 - NPCs)
  public npcs: NPC[] = [];
  public nearbyNPC: NPC | null = null;
  public isDialogueOpen: boolean = false;
  public onOpenDialogue?: (npc: NPC) => void;
  public onOpenForge?: () => void;
  public onOpenBoonSelect?: (altar: EchoAltar) => void;
  public onEnterPortal?: () => void;
  public onPlayerDeath?: () => void;
  public onVictory?: () => void;

  // Reality Anchors (Phase 4)
  public anchors: RealityAnchor[] = [];
  public availablePrisms: number = 3;
  public preservedObstaclesCount: number = 0;

  // Soul Metaprogress
  public memoryTears: number = 1;
  public awakenedNPCsCount: number = 0;

  public config: EngineConfig = {
    gridSize: 80,
    worldBounds: {
      minX: -450,
      maxX: 450,
      minY: -450,
      maxY: 450,
    },
    baseSpeed: 280,
    sprintMultiplier: 1.6,
    enableGlow: true,
    enableTrail: true,
    enableParticles: true,
    enableVignette: true,
    cameraSmoothing: 1.0, // 1.0 = strict centered camera
  };

  // Rupture State (Glass Storm / Death Rebirth)
  private ruptureState: 'idle' | 'collapsing' | 'regenerating' | 'awakening' = 'idle';
  private ruptureAlpha: number = 0;
  private shakeX: number = 0;
  private shakeY: number = 0;

  private stats: EngineStats = {
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
    nearbyAltar: null,
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
    dashCooldownProgress: 1.0,
    attackCooldownProgress: 1.0,
    enemiesAlive: 0,
    enemiesDefeated: 0,
    bossHp: 0,
    bossMaxHp: 500,
    bossAlive: false,
    bossDistance: 9999,
    bossAggro: false,
    victoryItemSpawned: false,
    activeBoons: [],
  };

  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private trailTimer: number = 0;
  private onStatsUpdate?: (stats: EngineStats) => void;

  constructor(
    canvas: HTMLCanvasElement,
    initialState: GameState = 'SANCTUARY',
    initialMemoryDust: number = 0,
    initialUpgrades: PlayerUpgrades = { vitalityLevel: 0, damageLevel: 0, dashLevel: 0 },
    initialLyraRescued: boolean = false,
    initialCycle: number = 1,
    onStatsUpdate?: (stats: EngineStats) => void,
    onOpenDialogue?: (npc: NPC) => void,
    onOpenForge?: () => void,
    onOpenBoonSelect?: (altar: EchoAltar) => void,
    onEnterPortal?: () => void,
    onPlayerDeath?: () => void,
    onVictory?: () => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to obtain 2D rendering context');
    }
    this.ctx = context;
    this.gameState = initialState;
    this.memoryDust = initialMemoryDust;
    this.playerUpgrades = { ...initialUpgrades };
    this.lyraRescued = initialLyraRescued;
    this.currentCycle = initialCycle;

    this.onStatsUpdate = onStatsUpdate;
    this.onOpenDialogue = onOpenDialogue;
    this.onOpenForge = onOpenForge;
    this.onOpenBoonSelect = onOpenBoonSelect;
    this.onEnterPortal = onEnterPortal;
    this.onPlayerDeath = onPlayerDeath;
    this.onVictory = onVictory;

    this.audioManager = new AudioManager();
    this.camera = new VirtualCamera(0, 0);
    this.inputManager = new InputManager();

    const maxHp = this.calculateMaxHp();

    // Player: 30x30 Glowing Cyan (#00FFFF) square with Combat attributes
    this.player = {
      x: 0,
      y: 40,
      size: 30,
      speed: this.config.baseSpeed,
      color: '#00FFFF',
      vx: 0,
      vy: 0,
      facingAngle: 0,
      hp: maxHp,
      maxHp: maxHp,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      attackCooldown: 0,
      invulnerabilityTimer: 0,
      flashTimer: 0,
      activeBoons: [],
    };

    if (this.gameState === 'SANCTUARY') {
      this.initSanctuary();
    } else {
      this.initOpenWorld(false);
    }

    this.initDustParticles(150);
  }

  public calculateMaxHp(): number {
    return 100 + (this.playerUpgrades.vitalityLevel || 0) * 20;
  }

  public calculateAttackDamage(): number {
    return 50 + (this.playerUpgrades.damageLevel || 0) * 10;
  }

  public calculateAttackCooldown(): number {
    // Phase 9 Frenzy Boon: 50% cooldown reduction (0.3s -> 0.15s)
    return this.activeBoons.includes('frenzy') ? 0.15 : 0.3;
  }

  public calculateSlashDimensions(): { radius: number; arcAngle: number } {
    // Phase 9 Colossal Blade Boon: +50% hitbox size and visual arc
    if (this.activeBoons.includes('colossal_blade')) {
      return { radius: 120, arcAngle: Math.PI * 1.15 };
    }
    return { radius: 80, arcAngle: Math.PI * 0.85 };
  }

  public calculateDashCooldown(): number {
    return Math.max(0.3, 1.0 * Math.pow(0.8, this.playerUpgrades.dashLevel || 0));
  }

  /**
   * Phase 9: Applies a chosen Boon from an Echo Altar during the current run
   */
  public applyBoon(boonId: BoonId, altarId?: number): void {
    if (!this.activeBoons.includes(boonId)) {
      this.activeBoons.push(boonId);
      this.player.activeBoons = [...this.activeBoons];
    }

    if (altarId !== undefined) {
      const altar = this.altars.find((a) => a.id === altarId);
      if (altar) {
        altar.isActive = false;
      }
    } else if (this.nearbyAltar) {
      this.nearbyAltar.isActive = false;
    }

    this.audioManager.playBoonSelect();
    this.addFloatingDamage(this.player.x, this.player.y - 25, 'BÊNÇÃO ABSORVIDA!', '#00FFFF');
    this.stats.activeBoons = [...this.activeBoons];

    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
  }

  /**
   * Initializes the peaceful Sanctuary Hub world (Phase 8 & 9)
   * CRITICAL ROGUELIKE RULE: activeBoons are always reset to empty on death / return to Sanctuary!
   */
  public initSanctuary(): void {
    this.gameState = 'SANCTUARY';
    this.config.worldBounds = {
      minX: -450,
      maxX: 450,
      minY: -450,
      maxY: 450,
    };

    // Phase 9 Rule: Clear active temporary boons on death/sanctuary return
    this.activeBoons = [];
    this.player.activeBoons = [];
    this.altars = [];
    this.nearbyAltar = null;
    this.enemyProjectiles = [];
    this.hitEnemiesInCurrentDash.clear();

    this.obstacles = WorldGenerator.generateSanctuaryObstacles();
    this.npcs = WorldGenerator.generateSanctuaryNPCs(this.lyraRescued);
    this.enemies = [];
    this.boss = null;
    this.bossProjectiles = [];
    this.victoryItem = null;
    this.activeSlash = null;
    this.combatParticles = [];
    this.floatingDamageNumbers = [];

    // Reset player to central awakening altar in sanctuary
    this.player.x = 0;
    this.player.y = 40;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.maxHp = this.calculateMaxHp();
    this.player.hp = this.player.maxHp;
    this.player.isDashing = false;
    this.player.dashCooldown = 0;
    this.player.attackCooldown = 0;
    this.player.invulnerabilityTimer = 0;
    this.player.flashTimer = 0;

    this.stats.gameState = 'SANCTUARY';
    this.stats.currentBiome = 'Santuário do Vazio';
    this.stats.totalObstacles = this.obstacles.length;
    this.stats.enemiesAlive = 0;
    this.stats.bossAlive = false;
    this.stats.bossHp = 0;
    this.stats.bossMaxHp = 0;
    this.stats.memoryDust = this.memoryDust;
    this.stats.upgrades = { ...this.playerUpgrades };
    this.stats.lyraRescued = this.lyraRescued;
    this.stats.inPortalZone = false;
    this.stats.hp = this.player.hp;
    this.stats.maxHp = this.player.maxHp;
    this.stats.activeBoons = [];
    this.stats.nearbyAltar = null;
  }

  /**
   * Initializes the dangerous procedural open world with Aberrations, Boss, and Echo Altars
   */
  public initOpenWorld(incrementCycle: boolean = true): void {
    this.gameState = 'PLAYING';
    this.config.worldBounds = {
      minX: -2000,
      maxX: 2000,
      minY: -2000,
      maxY: 2000,
    };

    if (incrementCycle) {
      this.currentCycle++;
      this.stats.currentCycle = this.currentCycle;
    }

    this.obstacles = WorldGenerator.generateBiomesAndObstacles(300, this.anchors);
    this.npcs = WorldGenerator.generateNPCs(this.anchors, this.lyraRescued);
    this.enemies = WorldGenerator.generateEnemies(32, this.anchors);
    this.altars = WorldGenerator.generateEchoAltars(5, this.anchors);
    this.boss = WorldGenerator.generateBoss(this.anchors);
    this.bossProjectiles = [];
    this.enemyProjectiles = [];
    this.hitEnemiesInCurrentDash.clear();
    this.victoryItem = null;
    this.activeSlash = null;
    this.combatParticles = [];
    this.floatingDamageNumbers = [];

    // Reset player to origin in open world
    this.player.x = 0;
    this.player.y = 0;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.maxHp = this.calculateMaxHp();
    this.player.hp = this.player.maxHp;
    this.player.isDashing = false;
    this.player.dashCooldown = 0;
    this.player.attackCooldown = 0;
    this.player.invulnerabilityTimer = 0;
    this.player.flashTimer = 0;

    this.stats.gameState = 'PLAYING';
    this.stats.totalObstacles = this.obstacles.length;
    this.stats.enemiesAlive = this.enemies.length;
    this.stats.enemiesDefeated = this.enemiesDefeatedCount;
    this.stats.bossHp = this.boss.hp;
    this.stats.bossMaxHp = this.boss.maxHp;
    this.stats.bossAlive = true;
    this.stats.bossDistance = Math.round(Math.hypot(this.player.x - this.boss.x, this.player.y - this.boss.y));
    this.stats.bossAggro = false;
    this.stats.victoryItemSpawned = false;
    this.stats.memoryDust = this.memoryDust;
    this.stats.upgrades = { ...this.playerUpgrades };
    this.stats.lyraRescued = this.lyraRescued;
    this.stats.inPortalZone = false;
    this.stats.hp = this.player.hp;
    this.stats.maxHp = this.player.maxHp;
    this.stats.activeBoons = [...this.activeBoons];
    this.stats.nearbyAltar = null;
  }

  /**
   * Entering the Portal in Sanctuary triggers transition to PLAYING
   */
  public enterPortal(): void {
    if (this.gameState !== 'SANCTUARY') return;
    this.audioManager.playPortalWarp();
    this.initOpenWorld(true);
    if (this.onEnterPortal) {
      this.onEnterPortal();
    }
  }

  /**
   * Purchases a permanent upgrade with Memory Dust
   */
  public buyUpgrade(key: keyof PlayerUpgrades, cost: number): boolean {
    if (this.memoryDust < cost) return false;

    this.memoryDust -= cost;
    this.playerUpgrades[key] = (this.playerUpgrades[key] || 0) + 1;
    this.audioManager.playUpgradeBuy();

    if (key === 'vitalityLevel') {
      const newMaxHp = this.calculateMaxHp();
      const diff = newMaxHp - this.player.maxHp;
      this.player.maxHp = newMaxHp;
      this.player.hp += diff;
    }

    this.stats.memoryDust = this.memoryDust;
    this.stats.upgrades = { ...this.playerUpgrades };
    this.stats.maxHp = this.player.maxHp;
    this.stats.hp = this.player.hp;

    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
    return true;
  }

  /**
   * Death transition: collapse & return to Sanctuary
   */
  public forceRupture(): void {
    if (this.ruptureState === 'idle') {
      this.ruptureState = 'collapsing';
      this.setDialogueOpen(false);
      this.activeSlash = null;
      this.audioManager.playRupture();
    }
  }

  public triggerDash(): void {
    const dashCd = this.calculateDashCooldown();
    if (this.player.dashCooldown <= 0 && !this.player.isDashing && this.ruptureState === 'idle' && !this.isDialogueOpen) {
      this.audioManager.playDash();
    }
    this.inputManager.triggerDash();
  }

  public triggerAttack(customAngle?: number): void {
    if (customAngle !== undefined) {
      this.player.facingAngle = customAngle;
    }
    if (this.player.attackCooldown <= 0 && this.ruptureState === 'idle' && !this.isDialogueOpen) {
      this.audioManager.playAttack();
    }
    this.inputManager.triggerAttack();
  }

  public setDialogueOpen(isOpen: boolean): void {
    this.isDialogueOpen = isOpen;
  }

  public openDialogueForNearbyNPC(): void {
    if (this.nearbyNPC && !this.isDialogueOpen && this.ruptureState === 'idle') {
      if (this.gameState === 'SANCTUARY' && this.nearbyNPC.id === 'npc_kael') {
        // In Sanctuary, talking to Kael opens Soul Forge!
        this.audioManager.playInteraction();
        if (this.onOpenForge) {
          this.onOpenForge();
        }
        return;
      }

      this.isDialogueOpen = true;
      this.audioManager.playInteraction();
      if (this.onOpenDialogue) {
        this.onOpenDialogue(this.nearbyNPC);
      }
    }
  }

  public updateNarrativeState(memoryTears: number, awakenedCount: number): void {
    this.memoryTears = memoryTears;
    this.awakenedNPCsCount = awakenedCount;
    this.stats.memoryTears = memoryTears;
    this.stats.awakenedNPCsCount = awakenedCount;
  }

  public plantAnchor(): boolean {
    if (this.gameState === 'SANCTUARY') return false;
    if (this.availablePrisms <= 0 || this.ruptureState !== 'idle' || this.isDialogueOpen) {
      return false;
    }

    this.availablePrisms--;
    const newAnchor: RealityAnchor = {
      id: this.anchors.length + 1,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      radius: 450,
      placedAtCycle: this.currentCycle,
      color: '#FFFFFF',
    };

    this.anchors.push(newAnchor);
    this.stats.prismsLeft = this.availablePrisms;
    this.stats.anchorsCount = this.anchors.length;
    this.audioManager.playInteraction();
    return true;
  }

  public spawnCrimsonExplosion(x: number, y: number, count: number = 18): void {
    const colors = ['#f43f5e', '#fb7185', '#e11d48', '#ffffff', '#fda4af', '#9f1239', '#d946ef'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 280 + 80;
      this.combatParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        size: Math.random() * 4 + 1.5,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.25,
      });
    }
  }

  public addFloatingDamage(x: number, y: number, amount: number | string, color: string = '#f43f5e'): void {
    const text = typeof amount === 'number' ? `-${amount}` : amount;
    this.floatingDamageNumbers.push({
      id: Math.random(),
      text,
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      vy: -40,
      color,
      alpha: 1.0,
      scale: typeof amount === 'number' && amount >= 50 ? 1.35 : 1.0,
      timer: 0,
      duration: 1.0,
    });
  }

  private initDustParticles(count: number = 150): void {
    this.particles = [];
    const colors = ['#ffffff', '#fef08a', '#fbbf24', '#67e8f9', '#e0e7ff', '#c084fc'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        baseX: (Math.random() - 0.5) * 2000,
        baseY: (Math.random() - 0.5) * 2000,
        size: Math.random() * 2.2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.25,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        parallaxDepth: Math.random() * 0.6 + 0.15,
        pulseSpeed: Math.random() * 2 + 1,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.fpsTimer = performance.now();
    this.frameCount = 0;
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.camera.resize(width, height);
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (dt > 0.1) dt = 0.1;

    this.frameCount++;
    if (currentTime - this.fpsTimer >= 500) {
      this.stats.fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = currentTime;
    }

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return;
    }

    // Portal rotation in Sanctuary
    this.portalRotation += dt * 1.5;

    // Rupture Trigger (Key R)
    if ((this.inputManager.isKeyPressed('KeyR') || this.inputManager.isKeyPressed('r')) && this.ruptureState === 'idle') {
      this.forceRupture();
    }

    // Plant Anchor Trigger (F key)
    if ((this.inputManager.consumeKey('KeyF') || this.inputManager.consumeKey('f')) && this.ruptureState === 'idle') {
      this.plantAnchor();
    }

    // Process Rupture / Death State Machine
    if (this.ruptureState === 'collapsing') {
      this.ruptureAlpha += dt * 1.5;
      this.shakeX = (Math.random() - 0.5) * 30;
      this.shakeY = (Math.random() - 0.5) * 30;

      if (this.ruptureAlpha >= 1.0) {
        this.ruptureAlpha = 1.0;
        this.ruptureState = 'regenerating';
      }
    } else if (this.ruptureState === 'regenerating') {
      // Transition immediately to SANCTUARY on death / rupture!
      this.initSanctuary();
      if (this.onPlayerDeath) {
        this.onPlayerDeath();
      }
      this.ruptureState = 'awakening';
    } else if (this.ruptureState === 'awakening') {
      this.ruptureAlpha -= dt * 1.5;
      this.shakeX = 0;
      this.shakeY = 0;
      if (this.ruptureAlpha <= 0) {
        this.ruptureAlpha = 0;
        this.ruptureState = 'idle';
      }
    }

    // Damage screen vignette fade
    if (this.damageVignetteAlpha > 0) {
      this.damageVignetteAlpha = Math.max(0, this.damageVignetteAlpha - dt * 2.5);
    }

    // Camera shake decay
    if (this.shakeX !== 0 || this.shakeY !== 0) {
      this.shakeX *= 0.85;
      this.shakeY *= 0.85;
      if (Math.abs(this.shakeX) < 0.1) this.shakeX = 0;
      if (Math.abs(this.shakeY) < 0.1) this.shakeY = 0;
    }

    // Proximity detection for NPCs (80px radius)
    let closestNPC: NPC | null = null;
    let closestDist = Infinity;

    for (const npc of this.npcs) {
      const dist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
      if (dist <= 80 && dist < closestDist) {
        closestDist = dist;
        closestNPC = npc;
      }
    }

    this.nearbyNPC = closestNPC;
    this.stats.nearbyNPC = closestNPC;

    // Phase 9: Proximity detection for Echo Altars (70px radius)
    let closestAltar: EchoAltar | null = null;
    let closestAltarDist = Infinity;

    if (this.gameState === 'PLAYING') {
      for (const altar of this.altars) {
        altar.pulsePhase += dt * 2.0;
        if (altar.isActive) {
          const dist = Math.hypot(this.player.x - altar.x, this.player.y - altar.y);
          if (dist <= 75 && dist < closestAltarDist) {
            closestAltarDist = dist;
            closestAltar = altar;
          }
        }
      }
    }

    this.nearbyAltar = closestAltar;
    this.stats.nearbyAltar = closestAltar;

    // Interaction Trigger (E key or Enter key)
    if (
      (this.inputManager.consumeKey('KeyE') ||
        this.inputManager.consumeKey('e') ||
        this.inputManager.consumeKey('Enter')) &&
      this.ruptureState === 'idle'
    ) {
      // 1. Altar interaction takes priority if near an active Altar
      if (this.nearbyAltar && this.nearbyAltar.isActive && !this.isDialogueOpen && !this.isBoonMenuOpen) {
        if (this.onOpenBoonSelect) {
          this.onOpenBoonSelect(this.nearbyAltar);
        }
      } else if (this.nearbyNPC) {
        this.openDialogueForNearbyNPC();
      }
    }

    // Sanctuary Portal Area Detection (at x: 0, y: -250)
    if (this.gameState === 'SANCTUARY' && this.ruptureState === 'idle') {
      const distToPortal = Math.hypot(this.player.x - 0, this.player.y - (-250));
      this.stats.inPortalZone = distToPortal <= 65;

      if (distToPortal <= 48) {
        this.enterPortal();
        return;
      }
    }

    // Hit flash decay for entities (White Impact Frame)
    if (this.player.flashTimer > 0) {
      this.player.flashTimer = Math.max(0, this.player.flashTimer - dt);
    }
    if (this.boss && this.boss.flashTimer && this.boss.flashTimer > 0) {
      this.boss.flashTimer = Math.max(0, this.boss.flashTimer - dt);
    }
    for (const e of this.enemies) {
      if (e.flashTimer && e.flashTimer > 0) {
        e.flashTimer = Math.max(0, e.flashTimer - dt);
      }
    }

    // Combat timers
    const dashCooldownMax = this.calculateDashCooldown();
    if (this.player.dashCooldown > 0) {
      this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    }
    if (this.player.attackCooldown > 0) {
      this.player.attackCooldown = Math.max(0, this.player.attackCooldown - dt);
    }
    if (this.player.invulnerabilityTimer > 0) {
      this.player.invulnerabilityTimer = Math.max(0, this.player.invulnerabilityTimer - dt);
    }

    // Dash Execution
    const isDashRequested = this.inputManager.consumeDash();
    if (isDashRequested && this.player.dashCooldown <= 0 && !this.player.isDashing && this.ruptureState === 'idle' && !this.isDialogueOpen && !this.isBoonMenuOpen) {
      this.player.isDashing = true;
      this.player.dashTimer = 0.2; // 200ms duration
      this.player.dashCooldown = dashCooldownMax;
      this.player.invulnerabilityTimer = 0.2; // I-frames during dash
      this.hitEnemiesInCurrentDash.clear();
      this.audioManager.playDash();
    }

    if (this.player.isDashing) {
      this.player.dashTimer -= dt;
      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
        this.hitEnemiesInCurrentDash.clear();
      }

      // Phase 9: Shattering Dash Boon Mechanics (Dash deals 40 instant damage!)
      if (this.activeBoons.includes('shattering_dash') && this.gameState === 'PLAYING') {
        // 1. Dash hit against Boss
        if (this.boss && !this.boss.isDefeated && !this.hitEnemiesInCurrentDash.has(9999)) {
          const distToBoss = Math.hypot(this.player.x - this.boss.x, this.player.y - this.boss.y);
          if (distToBoss <= 30 + this.boss.size / 2) {
            this.hitEnemiesInCurrentDash.add(9999);
            this.boss.hp = Math.max(0, this.boss.hp - 40);
            this.boss.flashTimer = 0.06;
            this.audioManager.playShatterDash();
            this.addFloatingDamage(this.boss.x, this.boss.y, 40, '#fbbf24');
            this.spawnCrimsonExplosion(this.boss.x, this.boss.y, 22);
            this.shakeX = (Math.random() - 0.5) * 14;
            this.shakeY = (Math.random() - 0.5) * 14;

            if (this.boss.hp <= 0) {
              this.boss.isDefeated = true;
              this.memoryDust += 100;
              this.stats.memoryDust = this.memoryDust;
              this.audioManager.playDustCollect();
              this.addFloatingDamage(this.boss.x, this.boss.y - 30, '+100 Dust', '#e879f9');
              this.spawnCrimsonExplosion(this.boss.x, this.boss.y, 120);
              this.victoryItem = { active: true, x: this.boss.x, y: this.boss.y, radius: 26, pulse: 0 };
              this.audioManager.playVictory();
            }
          }
        }

        // 2. Dash hit against Normal Enemies
        for (const enemy of this.enemies) {
          if (!this.hitEnemiesInCurrentDash.has(enemy.id)) {
            const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
            if (dist <= 26 + enemy.size / 2) {
              this.hitEnemiesInCurrentDash.add(enemy.id);
              enemy.hp -= 40;
              enemy.flashTimer = 0.06;
              this.audioManager.playShatterDash();
              this.addFloatingDamage(enemy.x, enemy.y, 40, '#fbbf24');
              this.spawnCrimsonExplosion(enemy.x, enemy.y, 16);

              // Knockback if not immune
              if (!enemy.isImmuneKnockback) {
                const kAngle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
                enemy.x += Math.cos(kAngle) * 55;
                enemy.y += Math.sin(kAngle) * 55;
              }
            }
          }
        }

        // Filter and reward killed enemies from dash
        const survivingEnemies: Enemy[] = [];
        for (const enemy of this.enemies) {
          if (enemy.hp <= 0) {
            this.enemiesDefeatedCount++;
            this.memoryDust += 5;
            this.stats.memoryDust = this.memoryDust;
            this.audioManager.playDustCollect();
            this.addFloatingDamage(enemy.x, enemy.y - 20, '+5 Dust', '#c084fc');

            // Phase 9 Blood Siphon Boon: +2 HP on kill
            if (this.activeBoons.includes('blood_siphon')) {
              this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
              this.addFloatingDamage(this.player.x, this.player.y - 25, '+2 HP', '#34d399');
            }
          } else {
            survivingEnemies.push(enemy);
          }
        }
        this.enemies = survivingEnemies;
        this.stats.enemiesAlive = this.enemies.length;
        this.stats.enemiesDefeated = this.enemiesDefeatedCount;
      }
    }

    // Attack Execution (Slash with Frenzy & Colossal Blade modifiers)
    const isAttackRequested = this.inputManager.consumeAttack();
    if (isAttackRequested && this.player.attackCooldown <= 0 && this.ruptureState === 'idle' && !this.isDialogueOpen && !this.isBoonMenuOpen) {
      this.player.attackCooldown = this.calculateAttackCooldown();
      this.audioManager.playAttack();

      const attackAngle = this.player.facingAngle;
      const attackDamage = this.calculateAttackDamage();
      const slashDims = this.calculateSlashDimensions();

      this.activeSlash = {
        active: true,
        startX: this.player.x,
        startY: this.player.y,
        angle: attackAngle,
        radius: slashDims.radius,
        arcAngle: slashDims.arcAngle,
        timer: 0,
        duration: 0.15,
      };

      // 1. Slash Hitbox Detection against Boss
      let hitBoss = false;
      if (this.boss && !this.boss.isDefeated) {
        const dist = Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y);
        if (dist <= slashDims.radius + this.boss.size / 2) {
          const angleToBoss = Math.atan2(this.boss.y - this.player.y, this.boss.x - this.player.x);
          let diffAngle = angleToBoss - attackAngle;
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;

          if (Math.abs(diffAngle) <= slashDims.arcAngle / 2 + 0.35) {
            hitBoss = true;
            this.boss.hp = Math.max(0, this.boss.hp - attackDamage);
            this.boss.flashTimer = 0.06; // White hit flash!
            this.hitStopTimer = 0.04;
            this.audioManager.playHit();
            this.addFloatingDamage(this.boss.x, this.boss.y, attackDamage, '#f43f5e');
            this.spawnCrimsonExplosion(this.boss.x, this.boss.y, 24);
            this.shakeX = (Math.random() - 0.5) * 16;
            this.shakeY = (Math.random() - 0.5) * 16;

            if (this.boss.hp <= 0) {
              this.boss.isDefeated = true;
              this.memoryDust += 100;
              this.stats.memoryDust = this.memoryDust;
              this.audioManager.playDustCollect();
              this.addFloatingDamage(this.boss.x, this.boss.y - 30, '+100 Dust', '#e879f9');
              this.spawnCrimsonExplosion(this.boss.x, this.boss.y, 120);
              this.victoryItem = {
                active: true,
                x: this.boss.x,
                y: this.boss.y,
                radius: 26,
                pulse: 0,
              };
              this.audioManager.playVictory();
            }
          }
        }
      }

      // 2. Slash Hitbox Detection against Normal Enemies
      const remainingEnemies: Enemy[] = [];
      let anyEnemyHit = false;

      for (const enemy of this.enemies) {
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        let hit = false;

        if (dist <= slashDims.radius + enemy.size / 2) {
          const angleToEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
          let diffAngle = angleToEnemy - attackAngle;
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;

          if (Math.abs(diffAngle) <= slashDims.arcAngle / 2 + 0.3) {
            hit = true;
          }
        }

        if (hit) {
          anyEnemyHit = true;
          enemy.hp -= attackDamage;
          enemy.flashTimer = 0.06; // White hit flash!
          this.hitStopTimer = 0.04;
          this.audioManager.playHit();
          this.addFloatingDamage(enemy.x, enemy.y, attackDamage, '#f43f5e');
          this.spawnCrimsonExplosion(enemy.x, enemy.y, 18);

          // Knockback (Repulsão) on sword hit (unless immune like Brute)
          if (!enemy.isImmuneKnockback) {
            const knockAngle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
            enemy.x += Math.cos(knockAngle) * 55;
            enemy.y += Math.sin(knockAngle) * 55;
          }

          if (enemy.hp <= 0) {
            this.enemiesDefeatedCount++;
            // Meta-progression reward: +5 Dust
            this.memoryDust += 5;
            this.stats.memoryDust = this.memoryDust;
            this.audioManager.playDustCollect();
            this.addFloatingDamage(enemy.x, enemy.y - 20, '+5 Dust', '#c084fc');

            // Phase 9 Blood Siphon Boon: +2 HP on kill
            if (this.activeBoons.includes('blood_siphon')) {
              this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
              this.addFloatingDamage(this.player.x, this.player.y - 25, '+2 HP', '#34d399');
            }
          } else {
            remainingEnemies.push(enemy);
          }
        } else {
          remainingEnemies.push(enemy);
        }
      }

      this.enemies = remainingEnemies;
      this.stats.enemiesAlive = this.enemies.length;
      this.stats.enemiesDefeated = this.enemiesDefeatedCount;

      if (anyEnemyHit || hitBoss) {
        this.shakeX = (Math.random() - 0.5) * 10;
        this.shakeY = (Math.random() - 0.5) * 10;
      }
    }

    // Update Slash VFX timer
    if (this.activeSlash) {
      this.activeSlash.timer += dt;
      this.activeSlash.startX = this.player.x;
      this.activeSlash.startY = this.player.y;
      if (this.activeSlash.timer >= this.activeSlash.duration) {
        this.activeSlash = null;
      }
    }

    // Update Combat Particles
    for (const cp of this.combatParticles) {
      cp.x += cp.vx * dt;
      cp.y += cp.vy * dt;
      cp.life += dt;
      cp.alpha = Math.max(0, 1.0 - cp.life / cp.maxLife);
    }
    this.combatParticles = this.combatParticles.filter((cp) => cp.life < cp.maxLife);

    // Update Floating Damage Numbers
    for (const fdn of this.floatingDamageNumbers) {
      fdn.y += fdn.vy * dt;
      fdn.timer += dt;
      fdn.alpha = Math.max(0, 1.0 - fdn.timer / fdn.duration);
    }
    this.floatingDamageNumbers = this.floatingDamageNumbers.filter((fdn) => fdn.timer < fdn.duration);

    // Movement & Velocity
    const moveVector = this.ruptureState === 'idle' && !this.isDialogueOpen && !this.isBoonMenuOpen ? this.inputManager.getMovementVector() : { x: 0, y: 0 };
    const isSprint = this.inputManager.isSprinting();
    let currentSpeed = this.player.speed * (isSprint ? this.config.sprintMultiplier : 1.0);

    if (this.player.isDashing) {
      currentSpeed *= 2.8;
    }

    this.player.vx = moveVector.x * currentSpeed;
    this.player.vy = moveVector.y * currentSpeed;

    const isMoving = moveVector.x !== 0 || moveVector.y !== 0;

    if (isMoving && !this.player.isDashing) {
      this.player.facingAngle = Math.atan2(moveVector.y, moveVector.x);
    }

    // AABB SLIDING COLLISION RESOLUTION
    const collision = CollisionSystem.resolveMovement(
      this.player,
      dt,
      this.obstacles,
      this.config.worldBounds,
      this.npcs
    );

    this.player.x = collision.x;
    this.player.y = collision.y;
    this.stats.collidingX = collision.collidedX;
    this.stats.collidingY = collision.collidedY;

    // Boss AI & Projectiles (Only in PLAYING mode)
    if (this.gameState === 'PLAYING' && this.ruptureState === 'idle' && this.boss && !this.boss.isDefeated) {
      const distToPlayer = Math.hypot(this.player.x - this.boss.x, this.player.y - this.boss.y);
      this.boss.ringRotation += dt * 1.8;

      if (distToPlayer <= this.boss.aggroRadius) {
        this.boss.isAggro = true;
        const dirX = (this.player.x - this.boss.x) / (distToPlayer || 1);
        const dirY = (this.player.y - this.boss.y) / (distToPlayer || 1);
        this.boss.vx = dirX * this.boss.speed;
        this.boss.vy = dirY * this.boss.speed;
        this.boss.facingAngle = Math.atan2(dirY, dirX);

        this.boss.shootTimer += dt;
        if (this.boss.shootTimer >= 2.0) {
          this.boss.shootTimer = 0;
          this.audioManager.playBossShoot();
          const baseAngle = Math.atan2(this.player.y - this.boss.y, this.player.x - this.boss.x);
          const spreadAngles = [baseAngle - 0.28, baseAngle, baseAngle + 0.28];
          const projSpeed = 220;

          for (const angle of spreadAngles) {
            this.bossProjectiles.push({
              id: Math.random(),
              x: this.boss.x,
              y: this.boss.y,
              vx: Math.cos(angle) * projSpeed,
              vy: Math.sin(angle) * projSpeed,
              radius: 7,
              color: '#f43f5e',
              life: 0,
              maxLife: 4.0,
            });
          }
        }
      } else {
        this.boss.isAggro = false;
        this.boss.vx = 0;
        this.boss.vy = 0;
      }

      const bCollision = CollisionSystem.resolveEntityMovement(
        this.boss,
        dt,
        this.obstacles,
        this.config.worldBounds
      );
      this.boss.x = bCollision.x;
      this.boss.y = bCollision.y;

      const contactDist = Math.hypot(this.player.x - this.boss.x, this.player.y - this.boss.y);
      const contactRadius = (this.player.size + this.boss.size) / 2;

      if (contactDist < contactRadius) {
        if (!this.player.isDashing && this.player.invulnerabilityTimer <= 0) {
          this.player.hp = Math.max(0, this.player.hp - 25);
          this.player.invulnerabilityTimer = 0.5;
          this.player.flashTimer = 0.06; // White hit flash on player
          this.damageVignetteAlpha = 0.8;
          this.shakeX = (Math.random() - 0.5) * 18;
          this.shakeY = (Math.random() - 0.5) * 18;
          this.audioManager.playHit();
          this.addFloatingDamage(this.player.x, this.player.y, 25, '#fb7185');

          const knockAngle = Math.atan2(this.player.y - this.boss.y, this.player.x - this.boss.x);
          this.player.x += Math.cos(knockAngle) * 45;
          this.player.y += Math.sin(knockAngle) * 45;

          if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.forceRupture();
          }
        }
      }
    }

    // Boss Projectiles Update
    const activeProjectiles: BossProjectile[] = [];
    for (const proj of this.bossProjectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life += dt;

      const pDist = Math.hypot(this.player.x - proj.x, this.player.y - proj.y);
      if (pDist <= proj.radius + this.player.size / 2) {
        if (!this.player.isDashing && this.player.invulnerabilityTimer <= 0) {
          this.player.hp = Math.max(0, this.player.hp - 15);
          this.player.invulnerabilityTimer = 0.5;
          this.player.flashTimer = 0.06;
          this.damageVignetteAlpha = 0.65;
          this.shakeX = (Math.random() - 0.5) * 14;
          this.shakeY = (Math.random() - 0.5) * 14;
          this.audioManager.playHit();
          this.addFloatingDamage(this.player.x, this.player.y, 15, '#fb7185');
          this.spawnCrimsonExplosion(proj.x, proj.y, 8);

          if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.forceRupture();
          }
        }
        continue;
      }

      if (proj.life < proj.maxLife) {
        activeProjectiles.push(proj);
      }
    }
    this.bossProjectiles = activeProjectiles;

    // Phase 9: Gunner Enemy Projectiles Update
    const activeEnemyProjectiles: BossProjectile[] = [];
    for (const proj of this.enemyProjectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life += dt;

      const pDist = Math.hypot(this.player.x - proj.x, this.player.y - proj.y);
      if (pDist <= proj.radius + this.player.size / 2) {
        if (!this.player.isDashing && this.player.invulnerabilityTimer <= 0) {
          const dmg = proj.damage || 15;
          this.player.hp = Math.max(0, this.player.hp - dmg);
          this.player.invulnerabilityTimer = 0.5;
          this.player.flashTimer = 0.06;
          this.damageVignetteAlpha = 0.6;
          this.shakeX = (Math.random() - 0.5) * 12;
          this.shakeY = (Math.random() - 0.5) * 12;
          this.audioManager.playHit();
          this.addFloatingDamage(this.player.x, this.player.y, dmg, '#f97316');
          this.spawnCrimsonExplosion(proj.x, proj.y, 8);

          if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.forceRupture();
          }
        }
        continue;
      }

      if (proj.life < proj.maxLife) {
        activeEnemyProjectiles.push(proj);
      }
    }
    this.enemyProjectiles = activeEnemyProjectiles;

    // Victory Item Collision
    if (this.victoryItem && this.victoryItem.active) {
      this.victoryItem.pulse += dt * 3.5;
      const vDist = Math.hypot(this.player.x - this.victoryItem.x, this.player.y - this.victoryItem.y);
      if (vDist <= this.victoryItem.radius + this.player.size / 2) {
        this.victoryItem.active = false;
        this.audioManager.playVictory();
        if (this.onVictory) {
          this.onVictory();
        }
      }
    }

    // Phase 9: Enemy AI Variants (Hunter, Brute, Gunner)
    if (this.gameState === 'PLAYING' && this.ruptureState === 'idle') {
      for (const enemy of this.enemies) {
        const distToPlayer = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);

        if (enemy.type === 'gunner') {
          // GUNNER AI: Survival kiting (<250px flees, fires every 2.5s)
          if (distToPlayer < 250) {
            enemy.isAggro = true;
            // Flee away from player
            const fleeX = (enemy.x - this.player.x) / (distToPlayer || 1);
            const fleeY = (enemy.y - this.player.y) / (distToPlayer || 1);
            enemy.vx = fleeX * enemy.speed * 1.1;
            enemy.vy = fleeY * enemy.speed * 1.1;
            enemy.facingAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
          } else if (distToPlayer <= enemy.aggroRadius) {
            enemy.isAggro = true;
            enemy.facingAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
            // Slight strafing
            enemy.vx = 0;
            enemy.vy = 0;
          } else {
            enemy.isAggro = false;
            enemy.vx = 0;
            enemy.vy = 0;
          }

          // Gunner Shooting logic
          if (distToPlayer <= enemy.aggroRadius) {
            enemy.shootTimer = (enemy.shootTimer || 0) + dt;
            if (enemy.shootTimer >= 2.5) {
              enemy.shootTimer = 0;
              this.audioManager.playGunnerShoot();
              const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
              this.enemyProjectiles.push({
                id: Math.random(),
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * 230,
                vy: Math.sin(angle) * 230,
                radius: 6,
                color: '#f97316',
                life: 0,
                maxLife: 3.5,
                damage: 15,
                source: 'gunner',
              });
            }
          }
        } else {
          // HUNTER & BRUTE: Direct Pursuit AI
          if (distToPlayer <= enemy.aggroRadius) {
            enemy.isAggro = true;
            const dirX = (this.player.x - enemy.x) / (distToPlayer || 1);
            const dirY = (this.player.y - enemy.y) / (distToPlayer || 1);

            enemy.vx = dirX * enemy.speed;
            enemy.vy = dirY * enemy.speed;
            enemy.facingAngle = Math.atan2(dirY, dirX);
          } else {
            enemy.isAggro = false;
            enemy.vx = 0;
            enemy.vy = 0;
          }
        }

        const eCollision = CollisionSystem.resolveEntityMovement(
          enemy,
          dt,
          this.obstacles,
          this.config.worldBounds
        );
        enemy.x = eCollision.x;
        enemy.y = eCollision.y;

        const contactDist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
        const contactRadius = (this.player.size + enemy.size) / 2;

        if (contactDist < contactRadius) {
          if (!this.player.isDashing && this.player.invulnerabilityTimer <= 0) {
            const dmg = enemy.contactDamage || 20;
            this.player.hp = Math.max(0, this.player.hp - dmg);
            this.player.invulnerabilityTimer = 0.5;
            this.player.flashTimer = 0.06;
            this.damageVignetteAlpha = 0.7;
            this.shakeX = (Math.random() - 0.5) * 16;
            this.shakeY = (Math.random() - 0.5) * 16;
            this.audioManager.playHit();
            this.addFloatingDamage(this.player.x, this.player.y, dmg, '#fb7185');

            const knockAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
            this.player.x += Math.cos(knockAngle) * 35;
            this.player.y += Math.sin(knockAngle) * 35;

            if (this.player.hp <= 0) {
              this.player.hp = 0;
              this.forceRupture();
              break;
            }
          }
        }
      }
    }

    // Record Player Light Trail
    if (this.config.enableTrail) {
      this.trailTimer += dt;
      const trailInterval = this.player.isDashing ? 0.015 : 0.035;
      if (this.trailTimer >= trailInterval) {
        this.trailTimer = 0;
        this.playerTrail.unshift({
          x: this.player.x,
          y: this.player.y,
          size: this.player.size * (this.player.isDashing ? 1.15 : 1.0),
          alpha: this.player.isDashing ? 0.85 : 0.5,
          angle: this.player.facingAngle,
          isDash: this.player.isDashing,
        });

        if (this.playerTrail.length > 18) {
          this.playerTrail.pop();
        }
      }
    }

    // Update ambient particles
    if (this.config.enableParticles) {
      for (const p of this.particles) {
        p.baseX += p.vx * dt;
        p.baseY += p.vy * dt;
        p.pulsePhase += dt * p.pulseSpeed;

        if (p.baseX < this.config.worldBounds.minX - 200) p.baseX = this.config.worldBounds.maxX + 200;
        if (p.baseX > this.config.worldBounds.maxX + 200) p.baseX = this.config.worldBounds.minX - 200;
        if (p.baseY < this.config.worldBounds.minY - 200) p.baseY = this.config.worldBounds.maxY + 200;
        if (p.baseY > this.config.worldBounds.minY - 200) p.baseY = this.config.worldBounds.minX - 200;
      }
    }

    this.camera.follow(this.player.x, this.player.y, dt);

    const currentBiomeInfo =
      this.gameState === 'SANCTUARY'
        ? { name: 'Santuário do Vazio (Área Segura)' }
        : WorldGenerator.getBiomeAt(this.player.x, this.player.y);

    this.stats.deltaTime = dt;
    this.stats.worldX = Math.round(this.player.x);
    this.stats.worldY = Math.round(this.player.y);
    this.stats.speed = Math.round(Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy));
    this.stats.isMoving = isMoving;
    this.stats.activeKeys = this.inputManager.getActiveKeysList();
    this.stats.currentBiome = currentBiomeInfo.name;
    this.stats.hp = this.player.hp;
    this.stats.maxHp = this.player.maxHp;
    this.stats.isDashing = this.player.isDashing;
    this.stats.dashCooldownProgress = Math.max(0, Math.min(1, 1 - this.player.dashCooldown / dashCooldownMax));
    this.stats.attackCooldownProgress = Math.max(0, Math.min(1, 1 - this.player.attackCooldown / 0.3));
    this.stats.enemiesAlive = this.enemies.length;
    this.stats.enemiesDefeated = this.enemiesDefeatedCount;
    this.stats.bossHp = this.boss ? this.boss.hp : 0;
    this.stats.bossMaxHp = this.boss ? this.boss.maxHp : 500;
    this.stats.bossAlive = this.boss ? !this.boss.isDefeated : false;
    this.stats.bossDistance = this.boss ? Math.round(Math.hypot(this.player.x - this.boss.x, this.player.y - this.boss.y)) : 9999;
    this.stats.bossAggro = this.boss ? this.boss.isAggro : false;
    this.stats.victoryItemSpawned = this.victoryItem ? this.victoryItem.active : false;
    this.stats.memoryDust = this.memoryDust;
    this.stats.gameState = this.gameState;
    this.stats.upgrades = { ...this.playerUpgrades };
    this.stats.lyraRescued = this.lyraRescued;
    this.stats.nearbyNPC = this.nearbyNPC;
    this.stats.nearbyAltar = this.nearbyAltar;
    this.stats.activeBoons = [...this.activeBoons];

    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const width = this.camera.viewportWidth;
    const height = this.camera.viewportHeight;

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, width, height);

    this.camera.applyTransform(ctx);

    if (this.shakeX !== 0 || this.shakeY !== 0) {
      ctx.translate(this.shakeX, this.shakeY);
    }

    this.renderInfiniteGrid(ctx);
    this.renderWorldBounds(ctx);

    if (this.gameState === 'SANCTUARY') {
      this.renderSanctuaryFloor(ctx);
      this.renderSanctuaryPortal(ctx);
    }

    if (this.config.enableParticles) {
      this.renderParallaxDust(ctx, 0.4);
    }

    if (this.gameState === 'PLAYING') {
      this.renderAnchors(ctx);
      this.renderAltars(ctx);
    }

    let visibleObstacles = 0;
    for (const obs of this.obstacles) {
      if (this.camera.isVisible(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height, 120)) {
        this.renderObstacle(ctx, obs);
        visibleObstacles++;
      }
    }
    this.stats.obstaclesInView = visibleObstacles;

    this.renderNPCs(ctx);

    if (this.gameState === 'PLAYING') {
      this.renderEnemies(ctx);
      this.renderBoss(ctx);
      this.renderBossProjectiles(ctx);
      this.renderEnemyProjectiles(ctx);
      this.renderVictoryItem(ctx);
    }

    this.renderCombatParticles(ctx);
    this.renderFloatingDamageNumbers(ctx);

    if (this.config.enableParticles) {
      this.renderParallaxDust(ctx, 1.0);
    }

    if (this.config.enableTrail) {
      this.renderPlayerTrail(ctx);
    }

    this.renderPlayer(ctx);

    if (this.activeSlash) {
      this.renderSlash(ctx, this.activeSlash);
    }

    this.camera.restoreTransform(ctx);

    if (this.config.enableVignette) {
      this.renderVignette(ctx, width, height);
    }

    if (this.damageVignetteAlpha > 0) {
      this.renderDamageOverlay(ctx, width, height, this.damageVignetteAlpha);
    }

    if (this.ruptureAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.ruptureAlpha})`;
      ctx.fillRect(0, 0, width, height);

      if (this.ruptureState === 'awakening') {
        const textAlpha = Math.min(1.0, this.ruptureAlpha * 1.5);
        ctx.fillStyle = `rgba(5, 5, 16, ${textAlpha})`;
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Você Despertou no Santuário do Vazio...', width / 2, height / 2);
      }
    }
  }

  /**
   * Renders Sanctuary Hub floor decorations (cosmic runes & awakening altar)
   */
  private renderSanctuaryFloor(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Central Altar of Awakening (0, 40)
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 40, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 40, 80, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Altar Label
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = 'rgba(165, 180, 252, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('✦ ALTAR DO DESPERTAR ✦', 0, 44);

    // Constellation lines connecting Altar to Kael (-180, -40), Orion (180, -40), and Portal (0, -250)
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(-180, -40);
    ctx.moveTo(0, 40);
    ctx.lineTo(180, -40);
    ctx.moveTo(0, 40);
    ctx.lineTo(0, -250);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Renders the glowing Portal of Rupture in Sanctuary Hub
   */
  private renderSanctuaryPortal(ctx: CanvasRenderingContext2D): void {
    const px = 0;
    const py = -250;
    const pRadius = 45;

    ctx.save();

    // Swirling Portal Rings
    const ringCount = 4;
    for (let i = 0; i < ringCount; i++) {
      const angle = this.portalRotation * (i % 2 === 0 ? 1 : -1) + (i * Math.PI) / 2;
      const ringRad = pRadius * (0.4 + (i * 0.6) / ringCount);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);

      ctx.strokeStyle = i === 0 ? '#38bdf8' : i === 1 ? '#c084fc' : '#818cf8';
      ctx.lineWidth = 2.5 - i * 0.4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.ellipse(0, 0, ringRad, ringRad * 0.75, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Portal Core Vortex
    const gradient = ctx.createRadialGradient(px, py, 5, px, py, pRadius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#38bdf8');
    gradient.addColorStop(0.7, '#8b5cf6');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, pRadius, 0, Math.PI * 2);
    ctx.fill();

    // Floating text above Portal
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 12;
    ctx.fillText('✦ PORTAL DA RUPTURA ✦', px, py - pRadius - 16);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#e0e7ff';
    ctx.shadowBlur = 0;
    ctx.fillText(`[ Adentrar o Labirinto • Ciclo ${this.currentCycle} ]`, px, py - pRadius - 4);

    ctx.restore();
  }

  private renderInfiniteGrid(ctx: CanvasRenderingContext2D): void {
    const gridSize = this.config.gridSize;
    const bounds = this.camera.getWorldBounds(gridSize);

    const startX = Math.floor(bounds.minX / gridSize) * gridSize;
    const endX = Math.ceil(bounds.maxX / gridSize) * gridSize;
    const startY = Math.floor(bounds.minY / gridSize) * gridSize;
    const endY = Math.ceil(bounds.maxY / gridSize) * gridSize;

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      if (x % (gridSize * 5) !== 0 && x !== 0) {
        ctx.moveTo(x, bounds.minY);
        ctx.lineTo(x, bounds.maxY);
      }
    }
    for (let y = startY; y <= endY; y += gridSize) {
      if (y % (gridSize * 5) !== 0 && y !== 0) {
        ctx.moveTo(bounds.minX, y);
        ctx.lineTo(bounds.maxX, y);
      }
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize * 5) {
      if (x !== 0) {
        ctx.moveTo(x, bounds.minY);
        ctx.lineTo(x, bounds.maxY);
      }
    }
    for (let y = startY; y <= endY; y += gridSize * 5) {
      if (y !== 0) {
        ctx.moveTo(bounds.minX, y);
        ctx.lineTo(bounds.maxX, y);
      }
    }
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, bounds.minY);
    ctx.lineTo(0, bounds.maxY);
    ctx.moveTo(bounds.minX, 0);
    ctx.lineTo(bounds.maxX, 0);
    ctx.stroke();
  }

  private renderWorldBounds(ctx: CanvasRenderingContext2D): void {
    const { minX, maxX, minY, maxY } = this.config.worldBounds;
    const width = maxX - minX;
    const height = maxY - minY;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.gameState === 'SANCTUARY' ? '#818cf8' : '#FF0055';

    if (this.config.enableGlow) {
      ctx.shadowColor = this.gameState === 'SANCTUARY' ? '#6366f1' : '#FF0055';
      ctx.shadowBlur = 20;
    }

    ctx.strokeRect(minX, minY, width, height);

    ctx.setLineDash([12, 8]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.gameState === 'SANCTUARY' ? 'rgba(129, 140, 248, 0.5)' : 'rgba(255, 0, 85, 0.5)';
    ctx.strokeRect(minX - 15, minY - 15, width + 30, height + 30);
    ctx.restore();
  }

  private renderParallaxDust(ctx: CanvasRenderingContext2D, maxDepth: number): void {
    for (const p of this.particles) {
      if (p.parallaxDepth > maxDepth) continue;

      const px = p.baseX + (this.player.x - p.baseX) * p.parallaxDepth * 0.15;
      const py = p.baseY + (this.player.y - p.baseY) * p.parallaxDepth * 0.15;

      if (!this.camera.isVisible(px, py, p.size * 2, p.size * 2, 40)) {
        continue;
      }

      const pulse = Math.sin(p.pulsePhase) * 0.25 + 0.75;
      const currentAlpha = p.alpha * pulse;

      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = currentAlpha;

      if (this.config.enableGlow && p.parallaxDepth > 0.4) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.arc(px, py, p.size * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderAnchors(ctx: CanvasRenderingContext2D): void {
    if (this.anchors.length === 0) return;

    for (const anchor of this.anchors) {
      ctx.save();

      const pulse = Math.sin(performance.now() * 0.003 + anchor.id) * 0.08 + 0.92;
      const currentRadius = anchor.radius * pulse;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);

      if (this.config.enableGlow) {
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 25;
      }

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const grad = ctx.createRadialGradient(anchor.x, anchor.y, 0, anchor.x, anchor.y, currentRadius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      grad.addColorStop(0.7, 'rgba(0, 255, 255, 0.03)');
      grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y - 16);
      ctx.lineTo(anchor.x + 14, anchor.y);
      ctx.lineTo(anchor.x, anchor.y + 16);
      ctx.lineTo(anchor.x - 14, anchor.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#00FFFF';
      ctx.textAlign = 'center';
      ctx.fillText(`ÂNCO. #${anchor.id}`, anchor.x, anchor.y - 24);

      ctx.restore();
    }
  }

  private renderNPCs(ctx: CanvasRenderingContext2D): void {
    for (const npc of this.npcs) {
      if (!this.camera.isVisible(npc.x - 80, npc.y - 80, 160, 160, 80)) {
        continue;
      }

      const isNearby = this.nearbyNPC?.id === npc.id;

      ctx.save();

      if (isNearby) {
        ctx.strokeStyle = npc.color || '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(npc.x, npc.y, 80, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (this.config.enableGlow) {
        ctx.shadowColor = npc.color || '#FFD700';
        ctx.shadowBlur = isNearby ? 30 : 20;
      }

      ctx.fillStyle = npc.color || '#FFD700';
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FFFBEB';
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';

      if (isNearby) {
        ctx.fillStyle = npc.color || '#FFD700';
        const actionText = this.gameState === 'SANCTUARY' && npc.id === 'npc_kael' ? '[E] Forja da Alma' : `[E] ${npc.name}`;
        ctx.fillText(actionText, npc.x, npc.y - npc.radius - 12);

        ctx.font = '9px monospace';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(`"${npc.title}"`, npc.x, npc.y - npc.radius - 24);
      } else {
        ctx.fillStyle = npc.color || 'rgba(255, 215, 0, 0.85)';
        ctx.fillText(npc.name, npc.x, npc.y - npc.radius - 10);
      }
      ctx.restore();
    }
  }

  private renderObstacle(ctx: CanvasRenderingContext2D, obs: WorldObstacle): void {
    const rx = obs.x - obs.width / 2;
    const ry = obs.y - obs.height / 2;

    ctx.fillStyle = obs.color;
    ctx.fillRect(rx, ry, obs.width, obs.height);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = obs.borderColor;
    ctx.strokeRect(rx, ry, obs.width, obs.height);

    ctx.lineWidth = 1;
    if (obs.biome === 'quartz_forest') {
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
      ctx.beginPath();
      ctx.moveTo(rx + obs.width / 2, ry + 4);
      ctx.lineTo(rx + 4, ry + obs.height / 2);
      ctx.lineTo(rx + obs.width / 2, ry + obs.height - 4);
      ctx.lineTo(rx + obs.width - 4, ry + obs.height / 2);
      ctx.closePath();
      ctx.stroke();
    } else if (obs.biome === 'chrono_ruins') {
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.3)';
      ctx.beginPath();
      ctx.moveTo(rx + obs.width / 2, ry + 4);
      ctx.lineTo(rx + obs.width / 2, ry + obs.height - 4);
      ctx.moveTo(rx + 4, ry + obs.height / 2);
      ctx.lineTo(rx + obs.width - 4, ry + obs.height / 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.3)';
      ctx.beginPath();
      ctx.moveTo(rx + 4, ry + 4);
      ctx.lineTo(rx + obs.width - 4, ry + obs.height - 4);
      ctx.moveTo(rx + obs.width - 4, ry + 4);
      ctx.lineTo(rx + 4, ry + obs.height - 4);
      ctx.stroke();
    }
  }

  private renderAltars(ctx: CanvasRenderingContext2D): void {
    if (this.altars.length === 0) return;

    for (const altar of this.altars) {
      if (!this.camera.isVisible(altar.x - 70, altar.y - 70, 140, 140, 70)) {
        continue;
      }

      ctx.save();
      const isNearby = this.nearbyAltar?.id === altar.id;
      const pulse = Math.sin(altar.pulsePhase) * 0.12 + 0.88;

      if (altar.isActive) {
        // Active Pulsating Altar of Echoes
        if (this.config.enableGlow) {
          ctx.shadowColor = '#00FFFF';
          ctx.shadowBlur = isNearby ? 35 : 22;
        }

        // Circular magic seal on ground
        ctx.strokeStyle = isNearby ? '#38bdf8' : 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = isNearby ? 2 : 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(altar.x, altar.y, (altar.radius + 14) * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Central Obelisk / Pillar base
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(altar.x, altar.y - altar.radius * 1.3 * pulse);
        ctx.lineTo(altar.x + altar.radius * 0.8, altar.y + altar.radius * 0.9);
        ctx.lineTo(altar.x - altar.radius * 0.8, altar.y + altar.radius * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing core & floating rune
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(altar.x, altar.y - 2, 7 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(altar.x, altar.y - 2, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Altar Label & Interaction Prompt
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        if (isNearby) {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.fillText('[E] Altar de Eco', altar.x, altar.y - altar.radius - 18);
          ctx.font = '9px monospace';
          ctx.fillStyle = '#e0f2fe';
          ctx.fillText('Absorver Bênção', altar.x, altar.y - altar.radius - 6);
        } else {
          ctx.fillStyle = 'rgba(0, 255, 255, 0.85)';
          ctx.fillText('Altar de Eco', altar.x, altar.y - altar.radius - 10);
        }
      } else {
        // Depleted / Inactive Altar
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(altar.x, altar.y - altar.radius * 1.1);
        ctx.lineTo(altar.x + altar.radius * 0.8, altar.y + altar.radius * 0.9);
        ctx.lineTo(altar.x - altar.radius * 0.8, altar.y + altar.radius * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.font = '9px monospace';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('[Exaurido]', altar.x, altar.y - altar.radius - 6);
      }

      ctx.restore();
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D): void {
    if (this.enemies.length === 0) return;

    for (const enemy of this.enemies) {
      if (!this.camera.isVisible(enemy.x - 40, enemy.y - 40, 80, 80, 80)) {
        continue;
      }

      const isFlash = (enemy.flashTimer || 0) > 0;

      ctx.save();

      if (enemy.isAggro) {
        ctx.strokeStyle = enemy.type === 'gunner' ? 'rgba(249, 115, 22, 0.4)' : enemy.type === 'brute' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.aggroRadius * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (this.config.enableGlow) {
        ctx.shadowColor = isFlash ? '#FFFFFF' : enemy.color;
        ctx.shadowBlur = enemy.isAggro ? 25 : 15;
      }

      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.facingAngle);

      // Flash of Impact: 100% white during damage frame
      ctx.fillStyle = isFlash ? '#FFFFFF' : enemy.color;

      if (enemy.type === 'brute') {
        // Brute: Heavy armored square with reinforced corners
        const sz = enemy.size;
        ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
        ctx.strokeStyle = isFlash ? '#FFFFFF' : '#fbcfe8';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-sz / 2, -sz / 2, sz, sz);

        // Core
        ctx.fillStyle = isFlash ? '#FFFFFF' : '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (enemy.type === 'gunner') {
        // Gunner: Agile diamond with amber targeting iris
        const sz = enemy.size;
        ctx.beginPath();
        ctx.moveTo(sz * 0.9, 0);
        ctx.lineTo(0, -sz * 0.7);
        ctx.lineTo(-sz * 0.7, 0);
        ctx.lineTo(0, sz * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isFlash ? '#FFFFFF' : '#fed7aa';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = isFlash ? '#FFFFFF' : '#ffffff';
        ctx.beginPath();
        ctx.arc(sz * 0.25, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Hunter: Classic razor-sharp triangle
        ctx.beginPath();
        ctx.moveTo(enemy.size * 0.8, 0);
        ctx.lineTo(-enemy.size * 0.6, -enemy.size * 0.6);
        ctx.lineTo(-enemy.size * 0.3, 0);
        ctx.lineTo(-enemy.size * 0.6, enemy.size * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isFlash ? '#FFFFFF' : '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = isFlash ? '#FFFFFF' : '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // For Brutes or damaged enemies, render mini HP gauge
      const enemyMaxHp = enemy.maxHp || 30;
      if (enemy.hp < enemyMaxHp || enemy.type === 'brute') {
        ctx.save();
        const hpRatio = Math.max(0, enemy.hp / enemyMaxHp);
        const barW = enemy.size + 10;
        const barH = 3;
        ctx.fillStyle = '#050510';
        ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.size / 2 - 8, barW, barH);
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.size / 2 - 8, barW * hpRatio, barH);
        ctx.restore();
      }
    }
  }

  private renderBoss(ctx: CanvasRenderingContext2D): void {
    if (!this.boss || this.boss.isDefeated) return;

    if (!this.camera.isVisible(this.boss.x - 120, this.boss.y - 120, 240, 240, 120)) {
      return;
    }

    const isFlash = (this.boss.flashTimer || 0) > 0;

    ctx.save();

    if (this.config.enableGlow) {
      ctx.shadowColor = isFlash ? '#FFFFFF' : '#f43f5e';
      ctx.shadowBlur = this.boss.isAggro ? 40 : 25;
    }

    ctx.save();
    ctx.translate(this.boss.x, this.boss.y);
    ctx.rotate(this.boss.ringRotation);

    ctx.strokeStyle = isFlash ? '#FFFFFF' : 'rgba(244, 63, 94, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 28, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isFlash ? '#FFFFFF' : 'rgba(251, 113, 133, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 52, Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(this.boss.x, this.boss.y);
    ctx.rotate(this.boss.facingAngle);

    ctx.fillStyle = isFlash ? '#FFFFFF' : this.boss.color;
    ctx.beginPath();
    ctx.moveTo(this.boss.size / 2, 0);
    ctx.lineTo(0, -this.boss.size / 2);
    ctx.lineTo(-this.boss.size / 2, 0);
    ctx.lineTo(0, this.boss.size / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Boss Name & HP Bar
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'center';
    ctx.fillText('O SENHOR DO FRAGMENTO', this.boss.x, this.boss.y - 48);

    const barW = 70;
    const barH = 5;
    const hpRatio = Math.max(0, this.boss.hp / this.boss.maxHp);
    ctx.fillStyle = '#050510';
    ctx.fillRect(this.boss.x - barW / 2, this.boss.y - 42, barW, barH);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(this.boss.x - barW / 2, this.boss.y - 42, barW * hpRatio, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.boss.x - barW / 2, this.boss.y - 42, barW, barH);
    ctx.restore();
  }

  private renderBossProjectiles(ctx: CanvasRenderingContext2D): void {
    if (this.bossProjectiles.length === 0) return;

    for (const proj of this.bossProjectiles) {
      if (!this.camera.isVisible(proj.x - 20, proj.y - 20, 40, 40, 20)) {
        continue;
      }

      ctx.save();
      ctx.fillStyle = proj.color;

      if (this.config.enableGlow) {
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 16;
      }

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderEnemyProjectiles(ctx: CanvasRenderingContext2D): void {
    if (this.enemyProjectiles.length === 0) return;

    for (const proj of this.enemyProjectiles) {
      if (!this.camera.isVisible(proj.x - 20, proj.y - 20, 40, 40, 20)) {
        continue;
      }

      ctx.save();
      ctx.fillStyle = proj.color;

      if (this.config.enableGlow) {
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 16;
      }

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderVictoryItem(ctx: CanvasRenderingContext2D): void {
    if (!this.victoryItem || !this.victoryItem.active) return;

    const v = this.victoryItem;
    ctx.save();

    const p = Math.sin(v.pulse) * 0.15 + 0.85;

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(v.x, v.y, v.radius * 1.6 * p, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (this.config.enableGlow) {
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 35;
    }

    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.moveTo(v.x, v.y - v.radius * p);
    ctx.lineTo(v.x + v.radius * p, v.y);
    ctx.lineTo(v.x, v.y + v.radius * p);
    ctx.lineTo(v.x - v.radius * p, v.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(v.x, v.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#00FFFF';
    ctx.textAlign = 'center';
    ctx.fillText('✦ CORAÇÃO DO CALEIDOSCÓPIO ✦', v.x, v.y - v.radius - 18);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('[ Colete para Libertar a Realidade ]', v.x, v.y - v.radius - 6);

    ctx.restore();
  }

  private renderCombatParticles(ctx: CanvasRenderingContext2D): void {
    for (const cp of this.combatParticles) {
      ctx.save();
      ctx.fillStyle = cp.color;
      ctx.globalAlpha = cp.alpha;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, cp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderFloatingDamageNumbers(ctx: CanvasRenderingContext2D): void {
    for (const fdn of this.floatingDamageNumbers) {
      ctx.save();
      ctx.font = `bold ${Math.round(14 * fdn.scale)}px monospace`;
      ctx.fillStyle = fdn.color;
      ctx.globalAlpha = fdn.alpha;
      ctx.textAlign = 'center';
      ctx.shadowColor = fdn.color;
      ctx.shadowBlur = 8;
      ctx.fillText(fdn.text, fdn.x, fdn.y);
      ctx.restore();
    }
  }

  private renderPlayerTrail(ctx: CanvasRenderingContext2D): void {
    const hasShatterDash = this.activeBoons.includes('shattering_dash');

    for (let i = this.playerTrail.length - 1; i >= 0; i--) {
      const pt = this.playerTrail[i];
      const decay = 1 - i / this.playerTrail.length;
      const alpha = pt.alpha * decay;

      ctx.save();
      if (pt.isDash) {
        ctx.fillStyle = hasShatterDash ? '#fbbf24' : '#67e8f9';
      } else {
        ctx.fillStyle = '#00FFFF';
      }
      ctx.globalAlpha = alpha * 0.55;

      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.angle);

      ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size);
      ctx.restore();
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (this.player.invulnerabilityTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) {
      ctx.restore();
      return;
    }

    const isFlash = (this.player.flashTimer || 0) > 0;
    const hasShatterDash = this.activeBoons.includes('shattering_dash');

    if (this.config.enableGlow) {
      ctx.shadowColor = isFlash
        ? '#FFFFFF'
        : this.player.isDashing
        ? (hasShatterDash ? '#f59e0b' : '#ffffff')
        : this.player.color;
      ctx.shadowBlur = this.player.isDashing ? 35 : 22;
    }

    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.facingAngle);

    ctx.fillStyle = isFlash
      ? '#FFFFFF'
      : this.player.isDashing
      ? (hasShatterDash ? '#fbbf24' : '#ffffff')
      : this.player.color;
    ctx.fillRect(-this.player.size / 2, -this.player.size / 2, this.player.size, this.player.size);

    ctx.lineWidth = 2;
    ctx.strokeStyle = isFlash ? '#FFFFFF' : '#FFFFFF';
    ctx.strokeRect(-this.player.size / 2, -this.player.size / 2, this.player.size, this.player.size);

    ctx.fillStyle = isFlash ? '#FFFFFF' : '#050510';
    ctx.beginPath();
    ctx.arc(this.player.size * 0.2, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderSlash(ctx: CanvasRenderingContext2D, slash: SlashAttack): void {
    const progress = slash.timer / slash.duration;
    const alpha = Math.max(0, 1 - progress);

    ctx.save();
    ctx.translate(slash.startX, slash.startY);
    ctx.rotate(slash.angle);

    const sweepStart = -slash.arcAngle / 2;
    const sweepEnd = sweepStart + slash.arcAngle * Math.min(1, progress * 1.5);

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 6 * (1 - progress * 0.5);
    ctx.globalAlpha = alpha;

    if (this.config.enableGlow) {
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 25;
    }

    ctx.beginPath();
    ctx.arc(0, 0, slash.radius, sweepStart, sweepEnd);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  private renderVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const radius = Math.max(width, height) * 0.65;
    const grad = ctx.createRadialGradient(width / 2, height / 2, radius * 0.45, width / 2, height / 2, radius);
    grad.addColorStop(0, 'rgba(5, 5, 16, 0)');
    grad.addColorStop(1, 'rgba(5, 5, 16, 0.7)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  private renderDamageOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, alpha: number): void {
    const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.7);
    grad.addColorStop(0, 'rgba(244, 63, 94, 0)');
    grad.addColorStop(1, `rgba(244, 63, 94, ${alpha * 0.5})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  public getStats(): EngineStats {
    return { ...this.stats };
  }

  public resetPlayerPosition(): void {
    this.player.x = 0;
    this.player.y = this.gameState === 'SANCTUARY' ? 40 : 0;
    this.player.vx = 0;
    this.player.vy = 0;
  }
}
