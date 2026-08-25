import { Player, WorldObstacle, NPC } from '../types/game';

export interface CollisionResult {
  x: number;
  y: number;
  collidedX: boolean;
  collidedY: boolean;
  hitObstacle?: WorldObstacle;
}

export class CollisionSystem {
  /**
   * Performs separate X and Y Axis-Aligned Bounding Box (AABB) continuous resolution.
   * This guarantees frictionless diagonal sliding when colliding with surfaces.
   */
  public static resolveMovement(
    player: Player,
    dt: number,
    obstacles: WorldObstacle[],
    worldBounds: { minX: number; maxX: number; minY: number; maxY: number },
    npcs: NPC[] = []
  ): CollisionResult {
    const halfSize = player.size / 2;
    let newX = player.x;
    let newY = player.y;
    let collidedX = false;
    let collidedY = false;
    let hitObs: WorldObstacle | undefined = undefined;

    // Convert npcs to collidable obstacles format
    const npcColliders: WorldObstacle[] = npcs.map((npc, idx) => ({
      id: 90000 + idx,
      x: npc.x,
      y: npc.y,
      width: npc.radius * 2,
      height: npc.radius * 2,
      biome: npc.biome,
      color: '#FFD700',
      borderColor: '#FFFBEB',
      glowColor: '#FFD700',
      name: npc.name,
    }));

    const allColliders = [...obstacles, ...npcColliders];

    // Filter nearby obstacles only (broadphase optimization within 300px)
    const checkRadius = 300;
    const nearbyObstacles = allColliders.filter(
      (obs) => Math.hypot(obs.x - player.x, obs.y - player.y) < checkRadius + Math.max(obs.width, obs.height)
    );

    // ==========================================
    // 1. RESOLVE X-AXIS MOVEMENT
    // ==========================================
    if (player.vx !== 0) {
      const targetX = player.x + player.vx * dt;
      let safeX = targetX;

      // Check map world boundary in X
      if (safeX - halfSize < worldBounds.minX) {
        safeX = worldBounds.minX + halfSize;
        collidedX = true;
      } else if (safeX + halfSize > worldBounds.maxX) {
        safeX = worldBounds.maxX - halfSize;
        collidedX = true;
      }

      // Check AABB collisions against nearby obstacles
      const pYmin = player.y - halfSize + 0.1;
      const pYmax = player.y + halfSize - 0.1;

      for (const obs of nearbyObstacles) {
        const obsXmin = obs.x - obs.width / 2;
        const obsXmax = obs.x + obs.width / 2;
        const obsYmin = obs.y - obs.height / 2;
        const obsYmax = obs.y + obs.height / 2;

        // Check vertical overlap with current player Y
        if (pYmax > obsYmin && pYmin < obsYmax) {
          const targetXmin = safeX - halfSize;
          const targetXmax = safeX + halfSize;

          // Check if moving to targetX causes an overlap in X
          if (targetXmax > obsXmin && targetXmin < obsXmax) {
            collidedX = true;
            hitObs = obs;

            // Moving Right -> snap to left edge of obstacle
            if (player.vx > 0) {
              safeX = Math.min(safeX, obsXmin - halfSize);
            }
            // Moving Left -> snap to right edge of obstacle
            else if (player.vx < 0) {
              safeX = Math.max(safeX, obsXmax + halfSize);
            }
          }
        }
      }

      newX = safeX;
    }

    // ==========================================
    // 2. RESOLVE Y-AXIS MOVEMENT (with new resolved X)
    // ==========================================
    if (player.vy !== 0) {
      const targetY = player.y + player.vy * dt;
      let safeY = targetY;

      // Check map world boundary in Y
      if (safeY - halfSize < worldBounds.minY) {
        safeY = worldBounds.minY + halfSize;
        collidedY = true;
      } else if (safeY + halfSize > worldBounds.maxY) {
        safeY = worldBounds.maxY - halfSize;
        collidedY = true;
      }

      // Check AABB collisions against nearby obstacles using resolved newX
      const pXmin = newX - halfSize + 0.1;
      const pXmax = newX + halfSize - 0.1;

      for (const obs of nearbyObstacles) {
        const obsXmin = obs.x - obs.width / 2;
        const obsXmax = obs.x + obs.width / 2;
        const obsYmin = obs.y - obs.height / 2;
        const obsYmax = obs.y + obs.height / 2;

        // Check horizontal overlap with updated player X
        if (pXmax > obsXmin && pXmin < obsXmax) {
          const targetYmin = safeY - halfSize;
          const targetYmax = safeY + halfSize;

          // Check if moving to targetY causes an overlap in Y
          if (targetYmax > obsYmin && targetYmin < obsYmax) {
            collidedY = true;
            hitObs = obs;

            // Moving Down -> snap to top edge of obstacle
            if (player.vy > 0) {
              safeY = Math.min(safeY, obsYmin - halfSize);
            }
            // Moving Up -> snap to bottom edge of obstacle
            else if (player.vy < 0) {
              safeY = Math.max(safeY, obsYmax + halfSize);
            }
          }
        }
      }

      newY = safeY;
    }

    return {
      x: newX,
      y: newY,
      collidedX,
      collidedY,
      hitObstacle: hitObs,
    };
  }

  /**
   * Continuous AABB sliding collision for general entities (e.g. Aberration enemies)
   */
  public static resolveEntityMovement(
    entity: { x: number; y: number; size: number; vx: number; vy: number },
    dt: number,
    obstacles: WorldObstacle[],
    worldBounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): { x: number; y: number; collidedX: boolean; collidedY: boolean } {
    const halfSize = entity.size / 2;
    let newX = entity.x;
    let newY = entity.y;
    let collidedX = false;
    let collidedY = false;

    // Filter nearby obstacles only
    const checkRadius = 150;
    const nearbyObstacles = obstacles.filter(
      (obs) => Math.hypot(obs.x - entity.x, obs.y - entity.y) < checkRadius + Math.max(obs.width, obs.height)
    );

    // Resolve X
    if (entity.vx !== 0) {
      let safeX = entity.x + entity.vx * dt;
      if (safeX - halfSize < worldBounds.minX) {
        safeX = worldBounds.minX + halfSize;
        collidedX = true;
      } else if (safeX + halfSize > worldBounds.maxX) {
        safeX = worldBounds.maxX - halfSize;
        collidedX = true;
      }

      const pYmin = entity.y - halfSize + 0.1;
      const pYmax = entity.y + halfSize - 0.1;

      for (const obs of nearbyObstacles) {
        const obsXmin = obs.x - obs.width / 2;
        const obsXmax = obs.x + obs.width / 2;
        const obsYmin = obs.y - obs.height / 2;
        const obsYmax = obs.y + obs.height / 2;

        if (pYmax > obsYmin && pYmin < obsYmax) {
          const targetXmin = safeX - halfSize;
          const targetXmax = safeX + halfSize;

          if (targetXmax > obsXmin && targetXmin < obsXmax) {
            collidedX = true;
            if (entity.vx > 0) {
              safeX = Math.min(safeX, obsXmin - halfSize);
            } else if (entity.vx < 0) {
              safeX = Math.max(safeX, obsXmax + halfSize);
            }
          }
        }
      }
      newX = safeX;
    }

    // Resolve Y
    if (entity.vy !== 0) {
      let safeY = entity.y + entity.vy * dt;
      if (safeY - halfSize < worldBounds.minY) {
        safeY = worldBounds.minY + halfSize;
        collidedY = true;
      } else if (safeY + halfSize > worldBounds.maxY) {
        safeY = worldBounds.maxY - halfSize;
        collidedY = true;
      }

      const pXmin = newX - halfSize + 0.1;
      const pXmax = newX + halfSize - 0.1;

      for (const obs of nearbyObstacles) {
        const obsXmin = obs.x - obs.width / 2;
        const obsXmax = obs.x + obs.width / 2;
        const obsYmin = obs.y - obs.height / 2;
        const obsYmax = obs.y + obs.height / 2;

        if (pXmax > obsXmin && pXmin < obsXmax) {
          const targetYmin = safeY - halfSize;
          const targetYmax = safeY + halfSize;

          if (targetYmax > obsYmin && targetYmin < obsYmax) {
            collidedY = true;
            if (entity.vy > 0) {
              safeY = Math.min(safeY, obsYmin - halfSize);
            } else if (entity.vy < 0) {
              safeY = Math.max(safeY, obsYmax + halfSize);
            }
          }
        }
      }
      newY = safeY;
    }

    return { x: newX, y: newY, collidedX, collidedY };
  }
}
