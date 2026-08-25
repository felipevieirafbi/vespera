import React, { useRef, useState, useEffect } from 'react';

interface VirtualDPadProps {
  onDirectionChange: (dx: number, dy: number) => void;
}

export const VirtualDPad: React.FC<VirtualDPadProps> = ({ onDirectionChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const maxRadius = 38;

  const handleStart = (clientX: number, clientY: number, touchId?: number) => {
    setActive(true);
    if (touchId !== undefined) {
      touchIdRef.current = touchId;
    }
    handleMove(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const clampedDist = Math.min(distance, maxRadius);
      const angle = Math.atan2(dy, dx);
      const knX = Math.cos(angle) * clampedDist;
      const knY = Math.sin(angle) * clampedDist;

      setKnobPos({ x: knX, y: knY });

      // Normalized direction vector (-1 to +1)
      const normX = knX / maxRadius;
      const normY = knY / maxRadius;
      onDirectionChange(normX, normY);
    }
  };

  const handleEnd = () => {
    setActive(false);
    touchIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    onDirectionChange(0, 0);
  };

  useEffect(() => {
    const onWindowTouchMove = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    };

    const onWindowTouchEnd = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          handleEnd();
          break;
        }
      }
    };

    const onWindowMouseMove = (e: MouseEvent) => {
      if (active && touchIdRef.current === null) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const onWindowMouseUp = () => {
      if (active && touchIdRef.current === null) {
        handleEnd();
      }
    };

    window.addEventListener('touchmove', onWindowTouchMove, { passive: true });
    window.addEventListener('touchend', onWindowTouchEnd);
    window.addEventListener('touchcancel', onWindowTouchEnd);
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchend', onWindowTouchEnd);
      window.removeEventListener('touchcancel', onWindowTouchEnd);
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [active]);

  return (
    <div
      id="virtual-dpad-container"
      ref={containerRef}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const t = e.changedTouches[0];
        handleStart(t.clientX, t.clientY, t.identifier);
      }}
      className={`relative w-28 h-28 rounded-full border border-cyan-500/30 bg-slate-950/70 backdrop-blur-md flex items-center justify-center select-none touch-none cursor-pointer transition-colors ${
        active ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : ''
      }`}
    >
      {/* Direction Crosshairs */}
      <div className="absolute w-full h-[1px] bg-slate-800 pointer-events-none" />
      <div className="absolute h-full w-[1px] bg-slate-800 pointer-events-none" />

      {/* Center knob */}
      <div
        className="absolute w-10 h-10 rounded-full border border-cyan-400 bg-cyan-500/50 backdrop-blur-sm shadow-[0_0_10px_#00FFFF] pointer-events-none transition-transform duration-75"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
};
