import { Vector2D } from '../types/game';

export class InputManager {
  private pressedKeys: Set<string> = new Set();
  private onKeyChangeCallback?: (keys: string[]) => void;
  private virtualVector: Vector2D = { x: 0, y: 0 };

  constructor(onKeyChange?: (keys: string[]) => void) {
    this.onKeyChangeCallback = onKeyChange;
  }

  public setVirtualVector(x: number, y: number): void {
    this.virtualVector.x = x;
    this.virtualVector.y = y;
  }

  public attach(target: Window | HTMLElement = window): () => void {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for game controls
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this.pressedKeys.add(e.code);
      this.pressedKeys.add(e.key.toLowerCase());
      this.notifyChange();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.pressedKeys.delete(e.code);
      this.pressedKeys.delete(e.key.toLowerCase());
      this.notifyChange();
    };

    const handleBlur = () => {
      this.pressedKeys.clear();
      this.notifyChange();
    };

    target.addEventListener('keydown', handleKeyDown as EventListener);
    target.addEventListener('keyup', handleKeyUp as EventListener);
    window.addEventListener('blur', handleBlur);

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
      target.removeEventListener('keyup', handleKeyUp as EventListener);
      window.removeEventListener('blur', handleBlur);
      this.pressedKeys.clear();
    };
  }

  private notifyChange(): void {
    if (this.onKeyChangeCallback) {
      this.onKeyChangeCallback(Array.from(this.pressedKeys));
    }
  }

  public isKeyPressed(codeOrKey: string): boolean {
    return this.pressedKeys.has(codeOrKey) || this.pressedKeys.has(codeOrKey.toLowerCase());
  }

  public getActiveKeysList(): string[] {
    const relevant = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'Space', 'KeyR'];
    return relevant.filter(k => this.pressedKeys.has(k) || this.pressedKeys.has(k.toLowerCase()));
  }

  /**
   * Calculates the directional input vector and normalizes it.
   * Critical Rule: Diagonal movement MUST be normalized so length is at most 1.0.
   */
  public getMovementVector(): Vector2D {
    let dx = 0;
    let dy = 0;

    // Keyboard Up
    if (this.isKeyPressed('KeyW') || this.isKeyPressed('w') || this.isKeyPressed('ArrowUp')) {
      dy -= 1;
    }
    // Keyboard Down
    if (this.isKeyPressed('KeyS') || this.isKeyPressed('s') || this.isKeyPressed('ArrowDown')) {
      dy += 1;
    }
    // Keyboard Left
    if (this.isKeyPressed('KeyA') || this.isKeyPressed('a') || this.isKeyPressed('ArrowLeft')) {
      dx -= 1;
    }
    // Keyboard Right
    if (this.isKeyPressed('KeyD') || this.isKeyPressed('d') || this.isKeyPressed('ArrowRight')) {
      dx += 1;
    }

    // Merge with virtual joystick vector if active
    if (this.virtualVector.x !== 0 || this.virtualVector.y !== 0) {
      dx += this.virtualVector.x;
      dy += this.virtualVector.y;
    }

    // Vector normalization: length is capped at 1.0
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 1.0) {
      dx /= length;
      dy /= length;
    }

    return { x: dx, y: dy };
  }

  public isSprinting(): boolean {
    return this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight') || this.isKeyPressed('shift');
  }

  public reset(): void {
    this.pressedKeys.clear();
    this.notifyChange();
  }
}
