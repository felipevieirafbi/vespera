import { WorldObstacle, BiomeType, RealityAnchor } from '../types/game';

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
