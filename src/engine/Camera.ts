import { Vector2D } from '../types/game';

export class VirtualCamera {
  public x: number = 0;
  public y: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;
  public viewportWidth: number = 800;
  public viewportHeight: number = 600;
  public zoom: number = 1.0;
  public smoothing: number = 1.0; // 1.0 = instant lock, < 1.0 = lerp smoothing

  constructor(initialX: number = 0, initialY: number = 0) {
    this.x = initialX;
    this.y = initialY;
    this.targetX = initialX;
    this.targetY = initialY;
  }

  public resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  public follow(targetX: number, targetY: number, dt: number): void {
    this.targetX = targetX;
    this.targetY = targetY;

    if (this.smoothing >= 1.0) {
      this.x = this.targetX;
      this.y = this.targetY;
    } else {
      // Frame-rate independent lerp
      const factor = 1 - Math.pow(1 - this.smoothing, dt * 60);
      this.x += (this.targetX - this.x) * factor;
      this.y += (this.targetY - this.y) * factor;
    }
  }

  /**
   * Applies the virtual camera matrix to canvas context.
   * Player will be placed exactly at viewport center (width/2, height/2).
   */
  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  public worldToScreen(worldX: number, worldY: number): Vector2D {
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    return {
      x: cx + (worldX - this.x) * this.zoom,
      y: cy + (worldY - this.y) * this.zoom,
    };
  }

  public screenToWorld(screenX: number, screenY: number): Vector2D {
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    return {
      x: this.x + (screenX - cx) / this.zoom,
      y: this.y + (screenY - cy) / this.zoom,
    };
  }

  /**
   * Fast AABB frustum check to cull objects outside screen
   */
  public isVisible(worldX: number, worldY: number, width: number, height: number, margin: number = 50): boolean {
    const halfW = (this.viewportWidth / 2) / this.zoom + margin;
    const halfH = (this.viewportHeight / 2) / this.zoom + margin;

    return (
      worldX + width >= this.x - halfW &&
      worldX <= this.x + halfW &&
      worldY + height >= this.y - halfH &&
      worldY <= this.y + halfH
    );
  }

  /**
   * Get visible world bounds
   */
  public getWorldBounds(margin: number = 0) {
    const halfW = (this.viewportWidth / 2) / this.zoom + margin;
    const halfH = (this.viewportHeight / 2) / this.zoom + margin;
    return {
      minX: this.x - halfW,
      maxX: this.x + halfW,
      minY: this.y - halfH,
      maxY: this.y + halfH,
    };
  }
}
