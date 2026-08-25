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
  SlashAttack,
  CombatParticle,
} from '../types/game';
import { VirtualCamera } from './Camera';
import { InputManager } from './InputManager';
import { WorldGenerator } from './WorldGenerator';
import { CollisionSystem } from './CollisionSystem';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  public camera: VirtualCamera;
  public inputManager: InputManager;

  public player: Player;
  public obstacles: WorldObstacle[] = [];
  public particles: DustParticle[] = [];
  public playerTrail: PlayerTrailPoint[] = [];

  // Aberration Enemies (Phase 6)
  public enemies: Enemy[] = [];
  public activeSlash: SlashAttack | null = null;
  public combatParticles: CombatParticle[] = [];
  public damageVignetteAlpha: number = 0;
  public enemiesDefeatedCount: number = 0;

  // Living Entities (Phase 5 - NPCs)
  public npcs: NPC[] = [];
  public nearbyNPC: NPC | null = null;
  public isDialogueOpen: boolean = false;
  public onOpenDialogue?: (npc: NPC) => void;

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
      minX: -2000,
      maxX: 2000,
      minY: -2000,
      maxY: 2000,
    },
    baseSpeed: 280,
    sprintMultiplier: 1.6,
    enableGlow: true,
    enableTrail: true,
    enableParticles: true,
    enableVignette: true,
    cameraSmoothing: 1.0, // 1.0 = strict centered camera
  };

  // Rupture State (Glass Storm)
  private ruptureState: 'idle' | 'collapsing' | 'regenerating' | 'awakening' = 'idle';
  private ruptureAlpha: number = 0;
  private shakeX: number = 0;
  private shakeY: number = 0;
  private currentCycle: number = 1;

  private stats: EngineStats = {
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
    dashCooldownProgress: 1.0,
    attackCooldownProgress: 1.0,
    enemiesAlive: 30,
    enemiesDefeated: 0,
  };

  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private trailTimer: number = 0;
  private onStatsUpdate?: (stats: EngineStats) => void;

  constructor(
    canvas: HTMLCanvasElement,
    onStatsUpdate?: (stats: EngineStats) => void,
    onOpenDialogue?: (npc: NPC) => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to obtain 2D rendering context');
    }
    this.ctx = context;
    this.onStatsUpdate = onStatsUpdate;
    this.onOpenDialogue = onOpenDialogue;

    this.camera = new VirtualCamera(0, 0);
    this.inputManager = new InputManager();

    // Player: 30x30 Glowing Cyan (#00FFFF) square with Combat attributes
    this.player = {
      x: 0,
      y: 0,
      size: 30,
      speed: this.config.baseSpeed,
      color: '#00FFFF',
      vx: 0,
      vy: 0,
      facingAngle: 0,
      hp: 100,
      maxHp: 100,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      attackCooldown: 0,
      invulnerabilityTimer: 0,
    };

    this.initWorld();
    this.initDustParticles(150);
  }

  public forceRupture(): void {
    if (this.ruptureState === 'idle') {
      this.ruptureState = 'collapsing';
      this.setDialogueOpen(false);
      this.activeSlash = null;
    }
  }

  public triggerDash(): void {
    this.inputManager.triggerDash();
  }

  public triggerAttack(customAngle?: number): void {
    if (customAngle !== undefined) {
      this.player.facingAngle = customAngle;
    }
    this.inputManager.triggerAttack();
  }

  public setDialogueOpen(isOpen: boolean): void {
    this.isDialogueOpen = isOpen;
  }

  public openDialogueForNearbyNPC(): void {
    if (this.nearbyNPC && !this.isDialogueOpen && this.ruptureState === 'idle') {
      this.isDialogueOpen = true;
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

  /**
   * Plants a Reality Anchor at player's current world position
   * Radius: strict 450px Stability Field
   */
  public plantAnchor(): boolean {
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
    return true;
  }

  /**
   * Initializes 300 procedural cluster obstacles, 3 Living NPCs and 30 Aberration enemies
   */
  public initWorld(): void {
    this.obstacles = WorldGenerator.generateBiomesAndObstacles(300, this.anchors);
    this.npcs = WorldGenerator.generateNPCs(this.anchors);
    this.enemies = WorldGenerator.generateEnemies(30, this.anchors);
    this.stats.totalObstacles = this.obstacles.length;
    this.stats.enemiesAlive = this.enemies.length;
  }

  /**
   * Spawns radiant crimson explosion particles when an enemy is slain
   */
  public spawnCrimsonExplosion(x: number, y: number): void {
    const colors = ['#f43f5e', '#fb7185', '#e11d48', '#ffffff', '#fda4af', '#9f1239'];
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 260 + 80;
      this.combatParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        size: Math.random() * 4 + 1.5,
        life: 0,
        maxLife: Math.random() * 0.35 + 0.25, // 250 - 600ms
      });
    }
  }

  /**
   * Initializes ~150 ambient magical dust particles with multi-layer 3D parallax
   */
  private initDustParticles(count: number = 150): void {
    this.particles = [];
    const colors = [
      '#ffffff', // pure celestial white
      '#fef08a', // luminous pale gold
      '#fbbf24', // deep gold
      '#67e8f9', // pale cyan
      '#e0e7ff', // starlight violet
    ];

    for (let i = 0; i < count; i++) {
      const baseX = Math.random() * 4400 - 2200;
      const baseY = Math.random() * 4400 - 2200;
      this.particles.push({
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        size: Math.random() * 2.8 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.25,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        parallaxDepth: Math.random() * 0.6 + 0.15, // 0.15 to 0.75 depth layers
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

    // Safety clamp dt to prevent teleportation on tab background throttles
    if (dt > 0.1) dt = 0.1;

    // FPS Meter
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
    // Rupture Trigger (Key R)
    if ((this.inputManager.isKeyPressed('KeyR') || this.inputManager.isKeyPressed('r')) && this.ruptureState === 'idle') {
      this.forceRupture();
    }

    // Plant Anchor Trigger (F key)
    if ((this.inputManager.consumeKey('KeyF') || this.inputManager.consumeKey('f')) && this.ruptureState === 'idle') {
      this.plantAnchor();
    }

    // Process Rupture State Machine
    if (this.ruptureState === 'collapsing') {
      this.ruptureAlpha += dt * 1.5;
      this.shakeX = (Math.random() - 0.5) * 30; // -15 to +15
      this.shakeY = (Math.random() - 0.5) * 30; // -15 to +15
      
      if (this.ruptureAlpha >= 1.0) {
        this.ruptureAlpha = 1.0;
        this.ruptureState = 'regenerating';
      }
    } else if (this.ruptureState === 'regenerating') {
      this.currentCycle++;
      this.stats.currentCycle = this.currentCycle;
      this.resetPlayerPosition();
      
      // Restore Player HP and reset combat status on rebirth
      this.player.hp = this.player.maxHp;
      this.player.isDashing = false;
      this.player.dashTimer = 0;
      this.player.dashCooldown = 0;
      this.player.attackCooldown = 0;
      this.player.invulnerabilityTimer = 0;
      this.activeSlash = null;
      this.combatParticles = [];
      this.damageVignetteAlpha = 0;

      // ==========================================================
      // FASE 4: A PERSISTÊNCIA NO CALEIDOSCÓPIO (Âncoras de Realidade)
      // ==========================================================
      // 1. Salvar (Backup): Obstáculos cujo centro está <= 450px de QUALQUER âncora
      const preservedObstacles: WorldObstacle[] = this.obstacles.filter((obs) => {
        return this.anchors.some((anchor) => {
          const dist = Math.hypot(obs.x - anchor.x, obs.y - anchor.y);
          return dist <= anchor.radius;
        });
      });
      this.preservedObstaclesCount = preservedObstacles.length;

      // 2. Regerar com Restrição: Não spawnar novos cristais dentro do raio de 450px das âncoras
      const targetNewObstacles = Math.max(60, 300 - preservedObstacles.length);
      const newObstacles = WorldGenerator.generateBiomesAndObstacles(targetNewObstacles, this.anchors);

      // 3. Mesclar: Juntar obstáculos preservados das âncoras com os novos biomas
      const mergedObstacles = [...preservedObstacles, ...newObstacles];
      mergedObstacles.forEach((obs, idx) => {
        obs.id = idx + 1;
      });
      this.obstacles = mergedObstacles;
      this.stats.totalObstacles = this.obstacles.length;
      this.stats.preservedObstaclesCount = this.preservedObstaclesCount;

      // FASE 5 & 6: Re-spawn de NPCs e Aberrações em novas posições aleatórias
      this.npcs = WorldGenerator.generateNPCs(this.anchors);
      this.enemies = WorldGenerator.generateEnemies(30, this.anchors);
      this.stats.enemiesAlive = this.enemies.length;

      this.ruptureState = 'awakening';
    } else if (this.ruptureState === 'awakening') {
      this.shakeX = 0;
      this.shakeY = 0;
      this.ruptureAlpha -= dt * 0.8;
      
      if (this.ruptureAlpha <= 0) {
        this.ruptureAlpha = 0;
        this.ruptureState = 'idle';
      }
    }

    // Timers & Cooldown updates
    this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    this.player.attackCooldown = Math.max(0, this.player.attackCooldown - dt);
    this.player.invulnerabilityTimer = Math.max(0, this.player.invulnerabilityTimer - dt);
    this.damageVignetteAlpha = Math.max(0, this.damageVignetteAlpha - dt * 2.8);

    // ==========================================================
    // FASE 6: MOVIMENTO TÁTICO (DASH / ESQUIVA - SPACEBAR)
    // ==========================================================
    const wantsDash = this.inputManager.consumeDash();
    if (
      wantsDash &&
      this.player.dashCooldown <= 0 &&
      !this.player.isDashing &&
      this.ruptureState === 'idle' &&
      !this.isDialogueOpen
    ) {
      this.player.isDashing = true;
      this.player.dashTimer = 0.15; // 150ms duration
      this.player.dashCooldown = 1.0; // 1.0s cooldown
    }

    if (this.player.isDashing) {
      this.player.dashTimer -= dt;
      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
      }
    }

    // ==========================================================
    // FASE 6: AÇÃO DE ATAQUE (A LÂMINA - LEFT CLICK / MOUSE)
    // ==========================================================
    const wantsAttack = this.inputManager.consumeAttack();
    if (
      wantsAttack &&
      this.player.attackCooldown <= 0 &&
      this.ruptureState === 'idle' &&
      !this.isDialogueOpen
    ) {
      // Calculate attack direction towards mouse in world coordinates
      let attackAngle = this.player.facingAngle;
      if (this.inputManager.mouseScreenX !== 0 || this.inputManager.mouseScreenY !== 0) {
        const mouseWorld = this.camera.screenToWorld(
          this.inputManager.mouseScreenX,
          this.inputManager.mouseScreenY
        );
        attackAngle = Math.atan2(mouseWorld.y - this.player.y, mouseWorld.x - this.player.x);
      }

      this.player.facingAngle = attackAngle;
      this.player.attackCooldown = 0.3; // 300ms cooldown

      this.activeSlash = {
        active: true,
        startX: this.player.x,
        startY: this.player.y,
        angle: attackAngle,
        radius: 80,
        arcAngle: Math.PI * 0.85, // ~150 degrees crescent arc
        timer: 0,
        duration: 0.15, // 150ms
      };

      // Slash Hitbox Detection against Enemies
      const remainingEnemies: Enemy[] = [];
      let anyEnemyKilled = false;

      for (const enemy of this.enemies) {
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        let hit = false;

        // Check if within slash reach radius
        if (dist <= 80 + enemy.size / 2) {
          const angleToEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
          let diffAngle = angleToEnemy - attackAngle;
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;

          if (Math.abs(diffAngle) <= (Math.PI * 0.85) / 2 + 0.25) {
            hit = true;
          }
        }

        if (hit) {
          anyEnemyKilled = true;
          this.enemiesDefeatedCount++;
          this.spawnCrimsonExplosion(enemy.x, enemy.y);
        } else {
          remainingEnemies.push(enemy);
        }
      }

      this.enemies = remainingEnemies;
      this.stats.enemiesAlive = this.enemies.length;
      this.stats.enemiesDefeated = this.enemiesDefeatedCount;

      if (anyEnemyKilled) {
        // Impact hitstop camera shake
        this.shakeX = (Math.random() - 0.5) * 8;
        this.shakeY = (Math.random() - 0.5) * 8;
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
      cp.vx *= 0.94; // slight air friction
      cp.vy *= 0.94;
      cp.life += dt;
      cp.alpha = Math.max(0, 1 - cp.life / cp.maxLife);
    }
    this.combatParticles = this.combatParticles.filter((cp) => cp.life < cp.maxLife);

    // Check proximity to all NPCs (< 80px distance)
    let closestNPC: NPC | null = null;
    let minNPCDist = 80;
    for (const npc of this.npcs) {
      const dist = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
      if (dist < minNPCDist) {
        minNPCDist = dist;
        closestNPC = npc;
      }
    }
    this.nearbyNPC = closestNPC;
    this.stats.nearbyNPC = closestNPC;

    // Trigger dialogue interaction on Key E
    if (
      (this.inputManager.consumeKey('KeyE') || this.inputManager.consumeKey('e')) &&
      this.nearbyNPC &&
      !this.isDialogueOpen &&
      this.ruptureState === 'idle'
    ) {
      this.openDialogueForNearbyNPC();
    }

    let moveVector = this.inputManager.getMovementVector();
    
    // Lock controls during rupture or active dialogue
    if (this.ruptureState !== 'idle' || this.isDialogueOpen) {
      moveVector = { x: 0, y: 0 };
    }

    const isSprinting = this.inputManager.isSprinting();
    let currentSpeed = this.player.speed * (isSprinting ? this.config.sprintMultiplier : 1.0);
    if (this.player.isDashing) {
      currentSpeed = this.config.baseSpeed * 3.6; // Sharp 3.6x burst during Dash
    }

    // If dashing with no active input keys, dash in current facing angle
    if (this.player.isDashing && moveVector.x === 0 && moveVector.y === 0) {
      moveVector = {
        x: Math.cos(this.player.facingAngle),
        y: Math.sin(this.player.facingAngle),
      };
    }

    // Vector-based velocity with strict diagonal normalization
    this.player.vx = moveVector.x * currentSpeed;
    this.player.vy = moveVector.y * currentSpeed;

    const isMoving = moveVector.x !== 0 || moveVector.y !== 0;

    if (isMoving && !this.player.isDashing) {
      this.player.facingAngle = Math.atan2(moveVector.y, moveVector.x);
    }

    // ==========================================================
    // CRITICAL: AABB SLIDING COLLISION RESOLUTION (Separate X & Y)
    // Supports solid obstacles + solid living NPCs
    // ==========================================================
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

    // ==========================================================
    // FASE 6: ENEMY AI (AGGRO, PERSEGUIÇÃO & COLISÃO COM JOGADOR)
    // ==========================================================
    if (this.ruptureState === 'idle') {
      for (const enemy of this.enemies) {
        const distToPlayer = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);

        // Aggro Detection (Radius: 300px)
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

        // Resolve Enemy movement with sliding collision
        const eCollision = CollisionSystem.resolveEntityMovement(
          enemy,
          dt,
          this.obstacles,
          this.config.worldBounds
        );
        enemy.x = eCollision.x;
        enemy.y = eCollision.y;

        // Check Enemy Contact Collision with Player
        const contactDist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
        const contactRadius = (this.player.size + enemy.size) / 2;

        if (contactDist < contactRadius) {
          // If player is not dashing and has no i-frames: Take 20 Damage!
          if (!this.player.isDashing && this.player.invulnerabilityTimer <= 0) {
            this.player.hp = Math.max(0, this.player.hp - 20);
            this.player.invulnerabilityTimer = 0.5; // 0.5s I-Frames
            this.damageVignetteAlpha = 0.7; // Red Screen Flash
            this.shakeX = (Math.random() - 0.5) * 16;
            this.shakeY = (Math.random() - 0.5) * 16;

            // Knockback repulsion away from enemy
            const knockAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
            this.player.x += Math.cos(knockAngle) * 35;
            this.player.y += Math.sin(knockAngle) * 35;

            // CANONICAL DEATH: If HP <= 0, trigger Rupture directly!
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

        // Limit to max 18 historical trail echoes
        if (this.playerTrail.length > 18) {
          this.playerTrail.pop();
        }
      }
    }

    // Update ambient dust particles
    if (this.config.enableParticles) {
      for (const p of this.particles) {
        p.baseX += p.vx * dt;
        p.baseY += p.vy * dt;
        p.pulsePhase += dt * p.pulseSpeed;

        // Wrap around bounds
        if (p.baseX < this.config.worldBounds.minX - 200) p.baseX = this.config.worldBounds.maxX + 200;
        if (p.baseX > this.config.worldBounds.maxX + 200) p.baseX = this.config.worldBounds.minX - 200;
        if (p.baseY < this.config.worldBounds.minY - 200) p.baseY = this.config.worldBounds.maxY + 200;
        if (p.baseY > this.config.worldBounds.maxY + 200) p.baseY = this.config.worldBounds.minY - 200;
      }
    }

    // Virtual Camera locks centered on player
    this.camera.follow(this.player.x, this.player.y, dt);

    // Current Biome determination
    const currentBiomeInfo = WorldGenerator.getBiomeAt(this.player.x, this.player.y);

    // Update telemetry stats
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
    this.stats.dashCooldownProgress = Math.max(0, Math.min(1, 1 - this.player.dashCooldown / 1.0));
    this.stats.attackCooldownProgress = Math.max(0, Math.min(1, 1 - this.player.attackCooldown / 0.3));
    this.stats.enemiesAlive = this.enemies.length;
    this.stats.enemiesDefeated = this.enemiesDefeatedCount;

    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const width = this.camera.viewportWidth;
    const height = this.camera.viewportHeight;

    // 1. Fundo Abissal (#050510)
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, width, height);

    // Apply Virtual Camera matrix
    this.camera.applyTransform(ctx);

    // Apply camera shake if rupturing or taking damage/combat hit
    if (this.shakeX !== 0 || this.shakeY !== 0) {
      ctx.translate(this.shakeX, this.shakeY);
    }

    // 2. Infinite Subtle Grid
    this.renderInfiniteGrid(ctx);

    // 3. Neon Red Map Boundaries
    this.renderWorldBounds(ctx);

    // 4. Parallax Magical Dust Particles (Deep & Mid layers)
    if (this.config.enableParticles) {
      this.renderParallaxDust(ctx, 0.4);
    }

    // 4.5 Reality Anchors and Stability Fields (Phase 4)
    this.renderAnchors(ctx);

    // 5. Procedural Biome Obstacles (with strict Frustum Culling)
    let visibleObstacles = 0;
    for (const obs of this.obstacles) {
      if (this.camera.isVisible(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height, 120)) {
        this.renderObstacle(ctx, obs);
        visibleObstacles++;
      }
    }
    this.stats.obstaclesInView = visibleObstacles;

    // 5.5 Living Entities (Phase 5 - NPCs)
    this.renderNPCs(ctx);

    // 5.8 Aberration Enemies (Phase 6)
    this.renderEnemies(ctx);

    // 5.9 Combat Explosion Particles
    this.renderCombatParticles(ctx);

    // 6. Foreground Parallax Dust
    if (this.config.enableParticles) {
      this.renderParallaxDust(ctx, 1.0);
    }

    // 7. Player Light Trail
    if (this.config.enableTrail) {
      this.renderPlayerTrail(ctx);
    }

    // 8. Player: Glowing Cyan Anomaly with Dash / Invulnerability flicker
    this.renderPlayer(ctx);

    // 8.5 Crescent Slash VFX (Phase 6)
    if (this.activeSlash) {
      this.renderSlash(ctx, this.activeSlash);
    }

    // Restore Camera context to screen-space
    this.camera.restoreTransform(ctx);

    // 9. Cinematographic Vignette
    if (this.config.enableVignette) {
      this.renderVignette(ctx, width, height);
    }

    // 9.5 Red Damage Screen Flash
    if (this.damageVignetteAlpha > 0) {
      this.renderDamageOverlay(ctx, width, height, this.damageVignetteAlpha);
    }

    // 10. Rupture Flash & Text Overlay
    if (this.ruptureAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.ruptureAlpha})`;
      ctx.fillRect(0, 0, width, height);

      if (this.ruptureState === 'awakening') {
        const textAlpha = Math.min(1.0, this.ruptureAlpha * 1.5);
        ctx.fillStyle = `rgba(5, 5, 16, ${textAlpha})`;
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('O Caleidoscópio Gira... A Lâmina Renasce', width / 2, height / 2);
      }
    }
  }

  private renderInfiniteGrid(ctx: CanvasRenderingContext2D): void {
    const gridSize = this.config.gridSize;
    const bounds = this.camera.getWorldBounds(gridSize);

    const startX = Math.floor(bounds.minX / gridSize) * gridSize;
    const endX = Math.ceil(bounds.maxX / gridSize) * gridSize;
    const startY = Math.floor(bounds.minY / gridSize) * gridSize;
    const endY = Math.ceil(bounds.maxY / gridSize) * gridSize;

    // Minor faint grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)'; // faint slate-800

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

    // Major grid lines (every 400u)
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.55)'; // slate-700

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

    // World Axes (X=0, Y=0) with subtle cyan gradient
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';

    ctx.beginPath();
    if (bounds.minX <= 0 && bounds.maxX >= 0) {
      ctx.moveTo(0, bounds.minY);
      ctx.lineTo(0, bounds.maxY);
    }
    if (bounds.minY <= 0 && bounds.maxY >= 0) {
      ctx.moveTo(bounds.minX, 0);
      ctx.lineTo(bounds.maxX, 0);
    }
    ctx.stroke();
  }

  private renderWorldBounds(ctx: CanvasRenderingContext2D): void {
    const { minX, maxX, minY, maxY } = this.config.worldBounds;
    const width = maxX - minX;
    const height = maxY - minY;

    ctx.save();
    // Glowing red border
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.strokeRect(minX, minY, width, height);
    ctx.restore();

    // Danger perimeter hashes
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 2;
    const cornerSize = 50;

    // Corner marks
    ctx.beginPath();
    ctx.moveTo(minX, minY + cornerSize); ctx.lineTo(minX, minY); ctx.lineTo(minX + cornerSize, minY);
    ctx.moveTo(maxX - cornerSize, minY); ctx.lineTo(maxX, minY); ctx.lineTo(maxX, minY + cornerSize);
    ctx.moveTo(minX, maxY - cornerSize); ctx.lineTo(minX, maxY); ctx.lineTo(minX + cornerSize, maxY);
    ctx.moveTo(maxX - cornerSize, maxY); ctx.lineTo(maxX, maxY); ctx.lineTo(maxX, maxY - cornerSize);
    ctx.stroke();

    // Biome boundary zone tags
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.fillText('LIMITE DO CALEIDOSCÓPIO [-2000, -2000]', minX + 20, minY + 25);
    ctx.fillText('LIMITE DO CALEIDOSCÓPIO [+2000, +2000]', maxX - 280, maxY - 15);
  }

  /**
   * Renders Reality Anchors and their 450px Stability Fields
   */
  private renderAnchors(ctx: CanvasRenderingContext2D): void {
    if (this.anchors.length === 0) return;

    for (const anchor of this.anchors) {
      // 1. Campo de Estabilidade (Raio Estrito de 450px)
      ctx.save();
      
      // Sutil preenchimento de campo de força
      ctx.fillStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, anchor.radius, 0, Math.PI * 2);
      ctx.fill();

      // Círculo perimetral perfeito (linha fina, ciano sutil com opacidade 0.18)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, anchor.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Anel harmônico pontilhado interno
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.18)'; // ouro sutil
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, anchor.radius * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rótulo da Zona de Estabilidade
      ctx.font = 'bold 9.5px monospace';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.75)';
      ctx.textAlign = 'center';
      ctx.fillText(
        `CAMPO DE ESTABILIDADE #${anchor.id} • RAIO 450px (FIXADO NO CICLO ${anchor.placedAtCycle})`,
        anchor.x,
        anchor.y - anchor.radius - 8
      );

      ctx.restore();

      // 2. Visual do Prisma / Âncora (Diamante / Losango Branco Ultra Brilhante)
      ctx.save();
      if (this.config.enableGlow) {
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 24;
      }

      const dSize = 20;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y - dSize);
      ctx.lineTo(anchor.x + dSize * 0.75, anchor.y);
      ctx.lineTo(anchor.x, anchor.y + dSize);
      ctx.lineTo(anchor.x - dSize * 0.75, anchor.y);
      ctx.closePath();
      ctx.fill();

      // Núcleo cristalino com reflexo ciano/dourado
      ctx.fillStyle = '#67e8f9';
      const innerSize = 8;
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y - innerSize);
      ctx.lineTo(anchor.x + innerSize * 0.75, anchor.y);
      ctx.lineTo(anchor.x, anchor.y + innerSize);
      ctx.lineTo(anchor.x - innerSize * 0.75, anchor.y);
      ctx.closePath();
      ctx.fill();

      // Eixo de estabilização
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y - dSize);
      ctx.lineTo(anchor.x, anchor.y + dSize);
      ctx.moveTo(anchor.x - dSize * 0.75, anchor.y);
      ctx.lineTo(anchor.x + dSize * 0.75, anchor.y);
      ctx.stroke();

      ctx.restore();
    }
  }

  /**
   * Renders living NPCs as radiant Golden/Yellow circles (#FFD700) with strong glow
   * and proximity interaction badges
   */
  private renderNPCs(ctx: CanvasRenderingContext2D): void {
    if (this.npcs.length === 0) return;

    for (const npc of this.npcs) {
      if (!this.camera.isVisible(npc.x - 50, npc.y - 50, 100, 100, 100)) {
        continue;
      }

      const dist = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
      const isNearby = dist < 80;

      ctx.save();

      // Ambient outer interaction halo
      if (dist < 140) {
        ctx.strokeStyle = isNearby ? 'rgba(255, 215, 0, 0.45)' : 'rgba(255, 215, 0, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(npc.x, npc.y, 80, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Strong Golden Glow (#FFD700)
      if (this.config.enableGlow) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = isNearby ? 30 : 20;
      }

      // Outer Golden Body
      ctx.fillStyle = npc.color || '#FFD700';
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.radius, 0, Math.PI * 2);
      ctx.fill();

      // Sharp white halo border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner starlight white/gold core
      ctx.fillStyle = '#FFFBEB';
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Text and Interaction Prompt above NPC
      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';

      if (isNearby) {
        // Active interactive badge
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`[E] ${npc.name}`, npc.x, npc.y - npc.radius - 12);

        ctx.font = '9px monospace';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(`"${npc.title}"`, npc.x, npc.y - npc.radius - 24);
      } else {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
        ctx.fillText(npc.name, npc.x, npc.y - npc.radius - 10);
      }
      ctx.restore();
    }
  }

  private renderObstacle(ctx: CanvasRenderingContext2D, obs: WorldObstacle): void {
    const rx = obs.x - obs.width / 2;
    const ry = obs.y - obs.height / 2;

    // Fill base
    ctx.fillStyle = obs.color;
    ctx.fillRect(rx, ry, obs.width, obs.height);

    // Neon crisp border
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = obs.borderColor;
    ctx.strokeRect(rx, ry, obs.width, obs.height);

    // Biome-specific internal geometric ornament
    ctx.lineWidth = 1;
    if (obs.biome === 'quartz_forest') {
      // Quartz Prism facets (emerald)
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
      ctx.beginPath();
      ctx.moveTo(rx + obs.width / 2, ry + 4);
      ctx.lineTo(rx + 4, ry + obs.height / 2);
      ctx.lineTo(rx + obs.width / 2, ry + obs.height - 4);
      ctx.lineTo(rx + obs.width - 4, ry + obs.height / 2);
      ctx.closePath();
      ctx.stroke();
    } else if (obs.biome === 'chrono_ruins') {
      // Chrono Rune Cross (violet/magenta)
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.3)';
      ctx.beginPath();
      ctx.moveTo(rx + obs.width / 2, ry + 4);
      ctx.lineTo(rx + obs.width / 2, ry + obs.height - 4);
      ctx.moveTo(rx + 4, ry + obs.height / 2);
      ctx.lineTo(rx + obs.width - 4, ry + obs.height / 2);
      ctx.stroke();
    } else {
      // Crimson Shard diagonal cuts (amber/orange)
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.3)';
      ctx.beginPath();
      ctx.moveTo(rx + 4, ry + 4);
      ctx.lineTo(rx + obs.width - 4, ry + obs.height - 4);
      ctx.moveTo(rx + obs.width - 4, ry + 4);
      ctx.lineTo(rx + 4, ry + obs.height - 4);
      ctx.stroke();
    }
  }

  /**
   * Renders living Enemies (Phase 6 - Aberrações) as aggressive geometric red shapes
   * with glowing crimson aura and aggro alerts
   */
  private renderEnemies(ctx: CanvasRenderingContext2D): void {
    if (this.enemies.length === 0) return;

    for (const enemy of this.enemies) {
      if (!this.camera.isVisible(enemy.x - 40, enemy.y - 40, 80, 80, 80)) {
        continue;
      }

      ctx.save();

      // Aggro Pulsing Aura
      if (enemy.isAggro) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.aggroRadius * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Crimson Glow Blur
      if (this.config.enableGlow) {
        ctx.shadowColor = enemy.isAggro ? '#f43f5e' : '#e11d48';
        ctx.shadowBlur = enemy.isAggro ? 22 : 14;
      }

      const half = enemy.size / 2;

      // Draw Aberration shape (Diamond with sharp red edges)
      ctx.fillStyle = enemy.isAggro ? '#881337' : enemy.color;
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - half);
      ctx.lineTo(enemy.x + half, enemy.y);
      ctx.lineTo(enemy.x, enemy.y + half);
      ctx.lineTo(enemy.x - half, enemy.y);
      ctx.closePath();
      ctx.fill();

      // Sharp glowing border
      ctx.strokeStyle = enemy.isAggro ? '#fda4af' : '#fb7185';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner pulsating red eye / core
      ctx.fillStyle = enemy.isAggro ? '#ffe4e6' : '#fda4af';
      const eyeSize = 6;
      ctx.fillRect(enemy.x - eyeSize / 2, enemy.y - eyeSize / 2, eyeSize, eyeSize);

      ctx.restore();

      // Aggro Alert Icon
      if (enemy.isAggro) {
        ctx.save();
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('!', enemy.x, enemy.y - half - 6);
        ctx.restore();
      }
    }
  }

  /**
   * Renders Combat Spark and Shard explosion particles
   */
  private renderCombatParticles(ctx: CanvasRenderingContext2D): void {
    if (this.combatParticles.length === 0) return;

    for (const cp of this.combatParticles) {
      if (!this.camera.isVisible(cp.x - 10, cp.y - 10, 20, 20, 40)) {
        continue;
      }

      ctx.save();
      ctx.globalAlpha = cp.alpha;
      ctx.fillStyle = cp.color;
      if (this.config.enableGlow) {
        ctx.shadowColor = cp.color;
        ctx.shadowBlur = 10;
      }
      ctx.fillRect(cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size);
      ctx.restore();
    }
  }

  /**
   * Renders radiant crescent Slash Attack VFX
   */
  private renderSlash(ctx: CanvasRenderingContext2D, slash: SlashAttack): void {
    const progress = slash.timer / slash.duration; // 0 to 1
    const alpha = Math.max(0, 1 - progress);

    ctx.save();
    ctx.translate(slash.startX, slash.startY);
    ctx.rotate(slash.angle);

    // Outer bright cyan bloom
    if (this.config.enableGlow) {
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 25;
    }

    const startArc = -slash.arcAngle / 2;
    const endArc = slash.arcAngle / 2;

    // Glowing crescent blade body
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.9})`;
    ctx.lineWidth = 14 * (1 - progress * 0.5);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, slash.radius, startArc, endArc);
    ctx.stroke();

    // Sharp white cutting edge
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, slash.radius + 2, startArc, endArc);
    ctx.stroke();

    // Inner flare sparks
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    const tipX = Math.cos(endArc) * slash.radius;
    const tipY = Math.sin(endArc) * slash.radius;
    ctx.fillRect(tipX - 3, tipY - 3, 6, 6);

    ctx.restore();
  }

  /**
   * Renders Screen-Space Red Damage Overlay Vignette when player takes damage
   */
  private renderDamageOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, alpha: number): void {
    ctx.save();
    const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.7);
    grad.addColorStop(0, 'rgba(225, 29, 72, 0)');
    grad.addColorStop(0.7, `rgba(225, 29, 72, ${alpha * 0.4})`);
    grad.addColorStop(1, `rgba(225, 29, 72, ${alpha * 0.85})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  /**
   * Renders ~150 Ambient Magic Dust particles with real 3D Parallax offset
   */
  private renderParallaxDust(ctx: CanvasRenderingContext2D, maxDepthThreshold: number): void {
    const camX = this.camera.x;
    const camY = this.camera.y;

    for (const p of this.particles) {
      if (maxDepthThreshold === 0.4 && p.parallaxDepth > 0.4) continue;
      if (maxDepthThreshold === 1.0 && p.parallaxDepth <= 0.4) continue;

      // Parallax mathematics: deeper particles move slower relative to camera
      const parallaxFactor = p.parallaxDepth; // e.g. 0.2 moves with 20% camera offset
      const renderX = p.baseX + (camX * (1 - parallaxFactor));
      const renderY = p.baseY + (camY * (1 - parallaxFactor));

      if (!this.camera.isVisible(renderX - 10, renderY - 10, 20, 20, 50)) {
        continue;
      }

      const pulse = 0.6 + 0.4 * Math.sin(p.pulsePhase);
      const effectiveAlpha = p.alpha * pulse * (0.4 + parallaxFactor * 0.6);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, effectiveAlpha));

      const pSize = p.size * (0.8 + parallaxFactor * 0.4);
      // Soft diamond particle
      ctx.fillRect(renderX - pSize / 2, renderY - pSize / 2, pSize, pSize);
    }
    ctx.globalAlpha = 1.0;
  }

  /**
   * Renders light trail echoes decreasing smoothly in size and opacity
   */
  private renderPlayerTrail(ctx: CanvasRenderingContext2D): void {
    const total = this.playerTrail.length;
    if (total === 0) return;

    for (let i = 0; i < total; i++) {
      const echo = this.playerTrail[i];
      // Progress from newest (0.0) to oldest (1.0)
      const factor = (i + 1) / (total + 1);
      
      // Progressive scale down
      const currentSize = echo.size * (1 - factor * 0.65);
      const baseAlpha = echo.isDash ? 0.75 : 0.42;
      const currentAlpha = baseAlpha * (1 - factor);

      ctx.fillStyle = echo.isDash
        ? `rgba(255, 255, 255, ${currentAlpha})`
        : `rgba(0, 255, 255, ${currentAlpha})`;

      ctx.fillRect(
        echo.x - currentSize / 2,
        echo.y - currentSize / 2,
        currentSize,
        currentSize
      );

      // Central spark
      ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.9})`;
      const sparkSize = Math.max(2, currentSize * (echo.isDash ? 0.45 : 0.25));
      ctx.fillRect(echo.x - sparkSize / 2, echo.y - sparkSize / 2, sparkSize, sparkSize);
    }
  }

  /**
   * Renders the Player: 30x30 Glowing Cyan square with Dash effects & I-frame blinking
   */
  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    // I-Frames blinking effect
    if (this.player.invulnerabilityTimer > 0 && !this.player.isDashing) {
      if (Math.floor(Date.now() / 60) % 2 === 0) {
        return; // Blink hide
      }
    }

    const px = this.player.x;
    const py = this.player.y;
    const half = this.player.size / 2;

    ctx.save();

    // Dash Shockwave Flare
    if (this.player.isDashing) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(px - half - 6, py - half - 6, this.player.size + 12, this.player.size + 12);
    }

    if (this.config.enableGlow) {
      ctx.shadowColor = this.player.isDashing ? '#FFFFFF' : '#00FFFF';
      ctx.shadowBlur = this.player.isDashing ? 32 : 20;
    }

    // Outer Neon Cyan / White Body
    ctx.fillStyle = this.player.isDashing ? '#E0F2FE' : this.player.color;
    ctx.fillRect(px - half, py - half, this.player.size, this.player.size);
    ctx.restore();

    // Inner pure crystal white core
    ctx.fillStyle = '#FFFFFF';
    const coreSize = this.player.isDashing ? 14 : 10;
    ctx.fillRect(px - coreSize / 2, py - coreSize / 2, coreSize, coreSize);

    // Directional vector indicator (facing angle)
    const arrowDist = 20;
    const ax = px + Math.cos(this.player.facingAngle) * arrowDist;
    const ay = py + Math.sin(this.player.facingAngle) * arrowDist;

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(ax - 2, ay - 2, 4, 4);
  }

  /**
   * Renders the Cinematographic Vignette (Radial gradient at viewport edges)
   */
  private renderVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const radius = Math.hypot(width, height) / 2;
    const cx = width / 2;
    const cy = height / 2;

    const grad = ctx.createRadialGradient(cx, cy, radius * 0.42, cx, cy, radius);
    grad.addColorStop(0, 'rgba(5, 5, 16, 0)');
    grad.addColorStop(0.65, 'rgba(5, 5, 16, 0.45)');
    grad.addColorStop(1, 'rgba(5, 5, 16, 0.92)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  public resetPlayerPosition(): void {
    this.player.x = 0;
    this.player.y = 0;
    this.player.vx = 0;
    this.player.vy = 0;
    this.camera.x = 0;
    this.camera.y = 0;
    this.playerTrail = [];
  }

  public teleportToBiome(biome: 'quartz_forest' | 'chrono_ruins' | 'crimson_desert'): void {
    const targets = {
      quartz_forest: { x: -900, y: -900 },
      chrono_ruins: { x: 950, y: -850 },
      crimson_desert: { x: 0, y: 950 },
    };
    const target = targets[biome];
    this.player.x = target.x;
    this.player.y = target.y;
    this.camera.x = target.x;
    this.camera.y = target.y;
    this.playerTrail = [];
  }

  public setZoom(zoom: number): void {
    this.camera.zoom = Math.max(0.25, Math.min(2.5, zoom));
  }

  public getZoom(): number {
    return this.camera.zoom;
  }
}
