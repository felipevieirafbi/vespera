import { Vector2D } from '../types/game';

export class InputManager {
  private pressedKeys: Set<string> = new Set();
  private onKeyChangeCallback?: (keys: string[]) => void;
  private virtualVector: Vector2D = { x: 0, y: 0 };

  // Mouse & Combat State (Phase 6)
  public mouseScreenX: number = 0;
  public mouseScreenY: number = 0;
  private isMouseDown: boolean = false;
  private pendingAttack: boolean = false;
  private pendingDash: boolean = false;

  constructor(onKeyChange?: (keys: string[]) => void) {
    this.onKeyChangeCallback = onKeyChange;
  }

  public setVirtualVector(x: number, y: number): void {
    this.virtualVector.x = x;
    this.virtualVector.y = y;
  }

  public triggerDash(): void {
    this.pendingDash = true;
  }

  public triggerAttack(): void {
    this.pendingAttack = true;
  }

  public consumeDash(): boolean {
    if (this.pendingDash) {
      this.pendingDash = false;
      return true;
    }
    // Also check physical Space key
    if (this.consumeKey('Space') || this.consumeKey(' ')) {
      return true;
    }
    return false;
  }

  public consumeAttack(): boolean {
    if (this.pendingAttack) {
      this.pendingAttack = false;
      return true;
    }
    return false;
  }

  public attach(target: Window | HTMLElement = window, canvasElement?: HTMLCanvasElement): () => void {
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

    const handleMouseMove = (e: MouseEvent) => {
      if (canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        this.mouseScreenX = e.clientX - rect.left;
        this.mouseScreenY = e.clientY - rect.top;
      } else {
        this.mouseScreenX = e.clientX;
        this.mouseScreenY = e.clientY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        this.isMouseDown = true;
        this.pendingAttack = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    };

    const handleBlur = () => {
      this.pressedKeys.clear();
      this.isMouseDown = false;
      this.notifyChange();
    };

    target.addEventListener('keydown', handleKeyDown as EventListener);
    target.addEventListener('keyup', handleKeyUp as EventListener);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
      target.removeEventListener('keyup', handleKeyUp as EventListener);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleBlur);
      this.pressedKeys.clear();
    };
  }

  private notifyChange(): void {
    if (this.onKeyChangeCallback) {
      this.onKeyChangeCallback(Array.from(this.pressedKeys));
    }
  }

  public consumeKey(codeOrKey: string): boolean {
    const hasKey = this.pressedKeys.has(codeOrKey) || this.pressedKeys.has(codeOrKey.toLowerCase());
    if (hasKey) {
      this.pressedKeys.delete(codeOrKey);
      this.pressedKeys.delete(codeOrKey.toLowerCase());
      this.notifyChange();
      return true;
    }
    return false;
  }

  public isKeyPressed(codeOrKey: string): boolean {
    return this.pressedKeys.has(codeOrKey) || this.pressedKeys.has(codeOrKey.toLowerCase());
  }

  public getActiveKeysList(): string[] {
    const relevant = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'Space', 'KeyR', 'KeyF', 'KeyE'];
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
    this.pendingAttack = false;
    this.pendingDash = false;
    this.notifyChange();
  }
}
