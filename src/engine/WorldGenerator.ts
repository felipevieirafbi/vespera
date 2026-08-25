import { WorldObstacle, BiomeType, RealityAnchor, NPC, Enemy, BossEnemy, EchoAltar } from '../types/game';

interface BiomeZone {
  type: BiomeType;
  name: string;
  colors: string[];
  borderColors: string[];
  glowColors: string[];
  centerX: number;
  centerY: number;
  radius: number;
  shapes: ('rect_tall' | 'square' | 'rect_small' | 'pillar')[];
}

export class WorldGenerator {
  /**
   * Generates exactly ONE Boss (O Senhor do Fragmento) per cycle, positioned far from the world center (>1300px)
   */
  public static generateBoss(existingAnchors: RealityAnchor[] = []): BossEnemy {
    // Choose an angle in a far sector of the world
    const angle = Math.random() * Math.PI * 2;
    const dist = 1350 + Math.random() * 350; // 1350px - 1700px away from (0,0)
    const x = Math.round(Math.cos(angle) * dist);
    const y = Math.round(Math.sin(angle) * dist);

    return {
      id: 9999,
      x,
      y,
      size: 56, // Large imposing geometric boss
      speed: 95, // Heavy, deliberate stalking speed
      hp: 500, // Boss total HP
      maxHp: 500,
      color: '#3b0764', // Deep abyssal violet
      borderColor: '#d946ef', // Neon magenta border
      glowColor: '#f43f5e', // Pulsing crimson glow
      aggroRadius: 650, // Large detection aura
      isAggro: false,
      vx: 0,
      vy: 0,
      facingAngle: angle + Math.PI,
      shootTimer: 0,
      ringRotation: 0,
      isDefeated: false,
      flashTimer: 0,
    };
  }

  /**
   * Phase 9: Generates 4 to 6 Echo Altars (Altares de Eco) spread across the open world biomes
   */
  public static generateEchoAltars(count: number = 5, existingAnchors: RealityAnchor[] = []): EchoAltar[] {
    const altars: EchoAltar[] = [];
    const targetBiomeSectors: { angleMin: number; angleMax: number; distMin: number; distMax: number }[] = [
      { angleMin: 3.5, angleMax: 4.5, distMin: 550, distMax: 1100 }, // Quartz Forest sector
      { angleMin: 5.0, angleMax: 6.0, distMin: 550, distMax: 1100 }, // Chrono sector
      { angleMin: 0.8, angleMax: 2.3, distMin: 550, distMax: 1200 }, // Crimson Desert sector
      { angleMin: 2.5, angleMax: 3.4, distMin: 700, distMax: 1300 }, // West fringe
      { angleMin: 0.1, angleMax: 0.7, distMin: 700, distMax: 1300 }, // East fringe
    ];

    for (let i = 0; i < count; i++) {
      const sector = targetBiomeSectors[i % targetBiomeSectors.length];
      const angle = sector.angleMin + Math.random() * (sector.angleMax - sector.angleMin);
      const dist = sector.distMin + Math.random() * (sector.distMax - sector.distMin);
      const x = Math.round(Math.cos(angle) * dist);
      const y = Math.round(Math.sin(angle) * dist);
      const biomeInfo = this.getBiomeAt(x, y);

      altars.push({
        id: 3000 + i,
        x,
        y,
        radius: 24,
        isActive: true,
        pulsePhase: Math.random() * Math.PI * 2,
        biome: biomeInfo.type,
      });
    }

    return altars;
  }

  /**
   * Phase 9: A Trindade de Inimigos (IA Híbrida e Tática)
   * Spawns a balanced mix of 3 enemy variants:
   * 1. Caçador (Hunter - Fast Melee Triangle)
   * 2. Brutamontes (Brute - Giant Heavy Purple Square, 3x HP, Knockback Immune, Double Contact DMG)
   * 3. Artilheiro (Gunner - Orange Diamond, Survival Kiting AI, Ranged Plasma Projectiles)
   */
  public static generateEnemies(count: number = 32, existingAnchors: RealityAnchor[] = []): Enemy[] {
    const enemies: Enemy[] = [];
    let attempts = 0;

    // Distribution: ~45% Hunters, ~28% Brutes, ~27% Gunners
    while (enemies.length < count && attempts < 600) {
      attempts++;
      const x = Math.round((Math.random() - 0.5) * 3600); // -1800 to +1800
      const y = Math.round((Math.random() - 0.5) * 3600);

      // Must be at least 380px away from the center (safe awaken spawn area)
      const distFromCenter = Math.hypot(x, y);
      if (distFromCenter < 380) {
        continue;
      }

      // Avoid placing right on top of another enemy
      const tooCloseToOtherEnemy = enemies.some(
        (e) => Math.hypot(e.x - x, e.y - y) < 90
      );
      if (tooCloseToOtherEnemy) {
        continue;
      }

      // Pick enemy type
      const rand = Math.random();
      if (rand < 0.45) {
        // 1. CAÇADOR (Melee Hunter)
        enemies.push({
          id: 2000 + enemies.length,
          type: 'hunter',
          x,
          y,
          size: 22,
          speed: 145 + Math.random() * 30, // 145 - 175 px/s
          hp: 45,
          maxHp: 45,
          color: '#4c0519',
          borderColor: '#f43f5e',
          glowColor: '#e11d48',
          aggroRadius: 320,
          isAggro: false,
          vx: 0,
          vy: 0,
          facingAngle: Math.random() * Math.PI * 2,
          contactDamage: 20,
          isImmuneKnockback: false,
          flashTimer: 0,
        });
      } else if (rand < 0.73) {
        // 2. BRUTAMONTES (Tank Brute)
        enemies.push({
          id: 2000 + enemies.length,
          type: 'brute',
          x,
          y,
          size: 44, // Giant purple square
          speed: 60 + Math.random() * 15, // 60 - 75 px/s (slow)
          hp: 150, // 3x health!
          maxHp: 150,
          color: '#3b0764',
          borderColor: '#a855f7',
          glowColor: '#7e22ce',
          aggroRadius: 280,
          isAggro: false,
          vx: 0,
          vy: 0,
          facingAngle: Math.random() * Math.PI * 2,
          contactDamage: 40, // Double contact damage!
          isImmuneKnockback: true, // Immune to knockback!
          flashTimer: 0,
        });
      } else {
        // 3. ARTILHEIRO (Ranged Gunner)
        enemies.push({
          id: 2000 + enemies.length,
          type: 'gunner',
          x,
          y,
          size: 24, // Diamond
          speed: 115 + Math.random() * 20, // 115 - 135 px/s
          hp: 40,
          maxHp: 40,
          color: '#7c2d12',
          borderColor: '#fb923c',
          glowColor: '#f97316',
          aggroRadius: 420,
          isAggro: false,
          vx: 0,
          vy: 0,
          facingAngle: Math.random() * Math.PI * 2,
          contactDamage: 15,
          isImmuneKnockback: false,
          shootTimer: Math.random() * 2.0, // Staggered initial shot timing
          flashTimer: 0,
        });
      }
    }

    return enemies;
  }

  /**
   * Generates Sanctuary Hub static architecture obstacles (Celestial pillars, altar perimeter, braziers)
   */
  public static generateSanctuaryObstacles(): WorldObstacle[] {
    const obstacles: WorldObstacle[] = [];
    let idCounter = 1;

    // Outer Sanctuary Boundary Wall Pillars (-420 to +420)
    const perimeterPillars = [
      // Top Wall (Leaving opening for Portal at x: -60 to 60, y: -250)
      { x: -360, y: -340, w: 40, h: 40 },
      { x: -260, y: -340, w: 40, h: 40 },
      { x: -160, y: -340, w: 40, h: 40 },
      { x: 160, y: -340, w: 40, h: 40 },
      { x: 260, y: -340, w: 40, h: 40 },
      { x: 360, y: -340, w: 40, h: 40 },

      // Bottom Wall
      { x: -360, y: 340, w: 40, h: 40 },
      { x: -240, y: 340, w: 40, h: 40 },
      { x: -120, y: 340, w: 40, h: 40 },
      { x: 0, y: 340, w: 40, h: 40 },
      { x: 120, y: 340, w: 40, h: 40 },
      { x: 240, y: 340, w: 40, h: 40 },
      { x: 360, y: 340, w: 40, h: 40 },

      // Left Wall
      { x: -380, y: -240, w: 40, h: 40 },
      { x: -380, y: -120, w: 40, h: 40 },
      { x: -380, y: 0, w: 40, h: 40 },
      { x: -380, y: 120, w: 40, h: 40 },
      { x: -380, y: 240, w: 40, h: 40 },

      // Right Wall
      { x: 380, y: -240, w: 40, h: 40 },
      { x: 380, y: -120, w: 40, h: 40 },
      { x: 380, y: 0, w: 40, h: 40 },
      { x: 380, y: 120, w: 40, h: 40 },
      { x: 380, y: 240, w: 40, h: 40 },

      // Decorative Inner Pillars framing Portal & Altars
      { x: -90, y: -260, w: 32, h: 32 },
      { x: 90, y: -260, w: 32, h: 32 },
      { x: -220, y: -80, w: 32, h: 32 },
      { x: 220, y: -80, w: 32, h: 32 },
      { x: -140, y: 120, w: 28, h: 28 },
      { x: 140, y: 120, w: 28, h: 28 },
    ];

    for (const p of perimeterPillars) {
      obstacles.push({
        id: idCounter++,
        x: p.x,
        y: p.y,
        width: p.w,
        height: p.h,
        biome: 'chrono_ruins',
        color: '#1e1b4b',
        borderColor: '#818cf8',
        glowColor: '#6366f1',
        name: 'Pilar do Santuário',
      });
    }

    return obstacles;
  }

  /**
   * Generates NPCs inside the Sanctuary Hub
   */
  public static generateSanctuaryNPCs(lyraRescued: boolean = false): NPC[] {
    const npcs: NPC[] = [
      {
        id: 'npc_kael',
        name: 'Kael, o Forjador',
        title: 'Forjador de Almas',
        x: -180,
        y: -40,
        radius: 18,
        color: '#fb7185', // Warm crimson forge master
        biome: 'crimson_desert',
      },
      {
        id: 'npc_orion',
        name: 'Orion, o Sábio',
        title: 'Astrônomo do Vazio',
        x: 180,
        y: -40,
        radius: 18,
        color: '#38bdf8', // Starlight celestial blue
        biome: 'quartz_forest',
      },
    ];

    // If Lyra has been rescued from the dangerous temporal ruins, she resides in the sanctuary!
    if (lyraRescued) {
      npcs.push({
        id: 'npc_lyra',
        name: 'Lyra, a Maga',
        title: 'Guardiã Resgatada',
        x: 0,
        y: 150,
        radius: 18,
        color: '#c084fc', // Radiant purple starlight
        biome: 'chrono_ruins',
      });
    }

    return npcs;
  }

  /**
   * Generates fixed named NPCs placed safely across each of the 3 biomes in open world.
   * If Lyra was already rescued, she no longer spawns in the procedural open world.
   */
  public static generateNPCs(existingAnchors: RealityAnchor[] = [], lyraRescued: boolean = false): NPC[] {
    // Generate safe positions near the heart of each biome with slight procedural offset
    const orionOffsetAngle = Math.random() * Math.PI * 2;
    const orionDist = Math.random() * 200 + 150;
    const orionX = Math.round(-900 + Math.cos(orionOffsetAngle) * orionDist);
    const orionY = Math.round(-900 + Math.sin(orionOffsetAngle) * orionDist);

    const kaelOffsetAngle = Math.random() * Math.PI * 2;
    const kaelDist = Math.random() * 200 + 150;
    const kaelX = Math.round(0 + Math.cos(kaelOffsetAngle) * kaelDist);
    const kaelY = Math.round(950 + Math.sin(kaelOffsetAngle) * kaelDist);

    const npcs: NPC[] = [
      {
        id: 'npc_orion',
        name: 'Orion, o Sábio',
        title: 'O Astrônomo do Quartzo',
        x: orionX,
        y: orionY,
        radius: 18,
        color: '#FFD700',
        biome: 'quartz_forest',
      },
      {
        id: 'npc_kael',
        name: 'Kael, o Ferreiro',
        title: 'Forjador Carmesim',
        x: kaelX,
        y: kaelY,
        radius: 18,
        color: '#FFD700',
        biome: 'crimson_desert',
      },
    ];

    // Only spawn Lyra in open world if she hasn't been rescued yet
    if (!lyraRescued) {
      const lyraOffsetAngle = Math.random() * Math.PI * 2;
      const lyraDist = Math.random() * 200 + 150;
      const lyraX = Math.round(950 + Math.cos(lyraOffsetAngle) * lyraDist);
      const lyraY = Math.round(-850 + Math.sin(lyraOffsetAngle) * lyraDist);

      npcs.push({
        id: 'npc_lyra',
        name: 'Lyra, a Maga',
        title: 'Guardiã do Tempo (Perdida)',
        x: lyraX,
        y: lyraY,
        radius: 18,
        color: '#FFD700',
        biome: 'chrono_ruins',
      });
    }

    return npcs;
  }
  /**
   * Helper to check if a coordinate falls inside any active Reality Anchor's 450px Stability Field
   */
  public static isInsideAnyAnchor(x: number, y: number, anchors: RealityAnchor[]): boolean {
    for (const anchor of anchors) {
      const dist = Math.hypot(x - anchor.x, y - anchor.y);
      if (dist <= anchor.radius + 30) {
        return true;
      }
    }
    return false;
  }

  public static generateBiomesAndObstacles(
    totalTarget: number = 300,
    existingAnchors: RealityAnchor[] = []
  ): WorldObstacle[] {
    const obstacles: WorldObstacle[] = [];
    let idCounter = 1;

    // Define 3 main thematic Biome Clusters across the world (-2000 to +2000)
    const zones: BiomeZone[] = [
      {
        type: 'quartz_forest',
        name: 'Floresta de Quartzo',
        colors: ['#064e3b', '#065f46', '#047857', '#059669', '#10b981'],
        borderColors: ['#34d399', '#6ee7b7', '#00ff9d', '#a7f3d0'],
        glowColors: ['#10b981', '#34d399', '#059669'],
        centerX: -900,
        centerY: -900,
        radius: 950,
        shapes: ['rect_tall', 'pillar'],
      },
      {
        type: 'chrono_ruins',
        name: 'Ruínas do Tempo',
        colors: ['#3b0764', '#4c1d95', '#581c87', '#6b21a8', '#7e22ce'],
        borderColors: ['#c084fc', '#d8b4fe', '#d946ef', '#e879f9'],
        glowColors: ['#a855f7', '#d946ef', '#8b5cf6'],
        centerX: 950,
        centerY: -850,
        radius: 950,
        shapes: ['square', 'pillar'],
      },
      {
        type: 'crimson_desert',
        name: 'Deserto Carmesim',
        colors: ['#7c2d12', '#9a3412', '#c2410c', '#ea580c', '#d97706'],
        borderColors: ['#fb923c', '#fdba74', '#f59e0b', '#fed7aa'],
        glowColors: ['#f97316', '#fb923c', '#ea580c'],
        centerX: 0,
        centerY: 950,
        radius: 1100,
        shapes: ['rect_small', 'square'],
      },
    ];

    // 1. Generate dense clusters around each biome center
    const clustersPerZone = 12;
    const obstaclesPerCluster = 7;

    zones.forEach((zone) => {
      for (let c = 0; c < clustersPerZone; c++) {
        // Cluster center positioned procedurally in zone
        const angle = (c / clustersPerZone) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const dist = Math.random() * (zone.radius * 0.75) + 120;
        const clusterCenterX = zone.centerX + Math.cos(angle) * dist;
        const clusterCenterY = zone.centerY + Math.sin(angle) * dist;

        for (let i = 0; i < obstaclesPerCluster; i++) {
          if (obstacles.length >= totalTarget) break;

          // Local scatter around cluster center
          const localAngle = Math.random() * Math.PI * 2;
          const localDist = Math.random() * 110 + 20;
          const x = Math.round(clusterCenterX + Math.cos(localAngle) * localDist);
          const y = Math.round(clusterCenterY + Math.sin(localAngle) * localDist);

          // Ensure safe spawn zone around origin (0, 0)
          if (Math.abs(x) < 140 && Math.abs(y) < 140) continue;

          // Clamp to world bounds
          if (x < -1880 || x > 1880 || y < -1880 || y > 1880) continue;

          // CRITICAL: Spatial Restriction - Do NOT spawn inside active Anchor stability zones
          if (this.isInsideAnyAnchor(x, y, existingAnchors)) continue;

          const shape = zone.shapes[Math.floor(Math.random() * zone.shapes.length)];
          let width = 40;
          let height = 40;

          if (shape === 'rect_tall') {
            width = Math.floor(Math.random() * 25) + 30; // 30-55
            height = Math.floor(Math.random() * 60) + 70; // 70-130
          } else if (shape === 'pillar') {
            const side = Math.floor(Math.random() * 30) + 40;
            width = side;
            height = side;
          } else if (shape === 'rect_small') {
            width = Math.floor(Math.random() * 35) + 25;
            height = Math.floor(Math.random() * 35) + 25;
          } else {
            width = Math.floor(Math.random() * 40) + 40;
            height = Math.floor(Math.random() * 40) + 40;
          }

          const color = zone.colors[Math.floor(Math.random() * zone.colors.length)];
          const borderColor = zone.borderColors[Math.floor(Math.random() * zone.borderColors.length)];
          const glowColor = zone.glowColors[Math.floor(Math.random() * zone.glowColors.length)];

          obstacles.push({
            id: idCounter++,
            x,
            y,
            width,
            height,
            biome: zone.type,
            color,
            borderColor,
            glowColor,
            name: `${zone.name} #${idCounter}`,
          });
        }
      }
    });

    // 2. Fill remaining spots with scattered transition fragments
    let attempts = 0;
    while (obstacles.length < totalTarget && attempts < 1500) {
      attempts++;
      const x = Math.floor(Math.random() * 3600) - 1800;
      const y = Math.floor(Math.random() * 3600) - 1800;

      // Safe zone at origin
      if (Math.abs(x) < 140 && Math.abs(y) < 140) continue;

      // CRITICAL: Spatial Restriction - Do NOT spawn inside active Anchor stability zones
      if (this.isInsideAnyAnchor(x, y, existingAnchors)) continue;

      // Determine closest biome
      let closestZone = zones[0];
      let minDistance = Number.MAX_VALUE;

      for (const z of zones) {
        const d = Math.hypot(x - z.centerX, y - z.centerY);
        if (d < minDistance) {
          minDistance = d;
          closestZone = z;
        }
      }

      const width = Math.floor(Math.random() * 45) + 30;
      const height = Math.floor(Math.random() * 45) + 30;
      const color = closestZone.colors[Math.floor(Math.random() * closestZone.colors.length)];
      const borderColor = closestZone.borderColors[Math.floor(Math.random() * closestZone.borderColors.length)];
      const glowColor = closestZone.glowColors[Math.floor(Math.random() * closestZone.glowColors.length)];

      obstacles.push({
        id: idCounter++,
        x,
        y,
        width,
        height,
        biome: closestZone.type,
        color,
        borderColor,
        glowColor,
        name: `Fragmento #${idCounter}`,
      });
    }

    return obstacles;
  }

  public static getBiomeAt(x: number, y: number): { name: string; type: BiomeType; color: string } {
    const distQuartz = Math.hypot(x - -900, y - -900);
    const distChrono = Math.hypot(x - 950, y - -850);
    const distCrimson = Math.hypot(x - 0, y - 950);

    if (distQuartz < distChrono && distQuartz < distCrimson) {
      return { name: 'Floresta de Quartzo', type: 'quartz_forest', color: '#10b981' };
    } else if (distChrono < distCrimson) {
      return { name: 'Ruínas do Tempo', type: 'chrono_ruins', color: '#a855f7' };
    } else {
      return { name: 'Deserto Carmesim', type: 'crimson_desert', color: '#f97316' };
    }
  }
}
