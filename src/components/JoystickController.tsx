import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Compass,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Target,
  Save,
} from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { SavedAnglePreset } from '../types/camera';

interface JoystickControllerProps {
  pan: number; // 0 to 180, default 90
  tilt: number; // 0 to 180, default 90
  onPanTiltChange: (pan: number, tilt: number) => void;
  savedAngle?: SavedAnglePreset | null;
  onSaveAngle?: (name?: string, pan?: number, tilt?: number) => void;
  className?: string;
}

export const JoystickController: React.FC<JoystickControllerProps> = ({
  pan,
  tilt,
  onPanTiltChange,
  savedAngle,
  onSaveAngle,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 }); // -1 to 1 normalized
  const [returnToCenter, setReturnToCenter] = useState(false); // default: Position Hold for security cameras
  const stepSize = 5;

  const baseRef = useRef<HTMLDivElement | null>(null);
  const lastDispatchRef = useRef<number>(0);

  // Calculate knob position from pan and tilt (pan: 0 to 180 -> -1 to 1; tilt: 0 to 180 -> 1 to -1)
  useEffect(() => {
    if (!isDragging) {
      const nx = ((pan - 90) / 90);
      const ny = -((tilt - 90) / 90); // inverted for natural screen coords (up = tilt up)
      setKnobPos({ x: Math.max(-1, Math.min(1, nx)), y: Math.max(-1, Math.min(1, ny)) });
    }
  }, [pan, tilt, isDragging]);

  // Throttled angle emitter
  const emitAngles = useCallback(
    (newPan: number, newTilt: number, force = false) => {
      const now = performance.now();
      if (force || now - lastDispatchRef.current >= 60) {
        lastDispatchRef.current = now;
        onPanTiltChange(
          Math.max(0, Math.min(180, Math.round(newPan))),
          Math.max(0, Math.min(180, Math.round(newTilt)))
        );
      }
    },
    [onPanTiltChange]
  );

  // Pointer event handlers for the virtual joystick
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!baseRef.current || (!isDragging && e.type !== 'pointerdown')) return;

    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2 - 16;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let normX = dx / maxRadius;
    let normY = dy / maxRadius;

    // Clamp inside circular boundary
    if (dist > maxRadius) {
      normX = (dx / dist);
      normY = (dy / dist);
    }

    setKnobPos({ x: normX, y: normY });

    // Map normX (-1 to 1) to pan (0 to 180)
    // Map normY (-1 to 1) to tilt (180 to 0)
    const newPan = 90 + normX * 90;
    const newTilt = 90 - normY * 90;

    emitAngles(newPan, newTilt);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    if (returnToCenter) {
      setKnobPos({ x: 0, y: 0 });
      emitAngles(90, 90, true);
      sounds.playBeep(520, 0.04);
    } else {
      // Send final position firmly
      const newPan = 90 + knobPos.x * 90;
      const newTilt = 90 - knobPos.y * 90;
      emitAngles(newPan, newTilt, true);
    }
  };

  // Step directional nudges
  const nudge = (dPan: number, dTilt: number) => {
    const nextPan = Math.max(0, Math.min(180, pan + dPan));
    const nextTilt = Math.max(0, Math.min(180, tilt + dTilt));
    sounds.playBeep(650, 0.03);
    emitAngles(nextPan, nextTilt, true);
  };

  // Preset jump
  const setPreset = (targetPan: number, targetTilt: number) => {
    sounds.playBeep(580, 0.04);
    emitAngles(targetPan, targetTilt, true);
  };

  return (
    <div
      className={`w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col ${
        className || ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <span>Pan & Tilt Servo Control</span>
            </h3>
          </div>
        </div>

        {/* Action Buttons: Saved Angle & Center / Home */}
        <div className="flex items-center gap-1.5">
          {savedAngle ? (
            <button
              type="button"
              onClick={() => setPreset(savedAngle.pan, savedAngle.tilt)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all border border-emerald-500 shadow-md shadow-emerald-600/30 cursor-pointer font-medium active:scale-95 shrink-0"
              title={`Automatically move servo to saved angle: Pan ${savedAngle.pan}°, Tilt ${savedAngle.tilt}°`}
              aria-label={`Saved angle: Pan ${savedAngle.pan}°, Tilt ${savedAngle.tilt}°`}
            >
              <Target className="w-4 h-4 text-white" />
              <span>Angle</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSaveAngle?.('Saved Angle', pan, tilt)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all border border-emerald-500 shadow-md shadow-emerald-600/30 cursor-pointer font-medium active:scale-95 shrink-0"
              title="Save current angle position as preset"
              aria-label="Save current angle position"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Angle</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPreset(90, 90)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all border border-emerald-500 shadow-md shadow-emerald-600/30 cursor-pointer font-medium active:scale-95"
            title="Reset Servos to Center (Pan: 90°, Tilt: 90°)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
            <span>Center</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 bg-zinc-900">
        {/* Angle Telemetry Readout */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center shadow-sm">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-0.5">
              Pan Angle (X)
            </div>
            <div className="text-xl font-bold font-mono text-teal-400 tabular-nums">
              {pan}°
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {pan < 80 ? 'LEFT' : pan > 100 ? 'RIGHT' : 'CENTER'}
            </div>
          </div>

          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center shadow-sm">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-0.5">
              Tilt Angle (Y)
            </div>
            <div className="text-xl font-bold font-mono text-teal-400 tabular-nums">
              {tilt}°
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {tilt < 80 ? 'DOWN' : tilt > 100 ? 'UP' : 'LEVEL'}
            </div>
          </div>
        </div>

        {/* The Virtual Joystick Disc */}
        <div className="flex flex-col items-center justify-center py-2 select-none">
          <div
            ref={baseRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-48 h-48 rounded-full bg-zinc-950 border-2 border-zinc-800 shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing touch-none group"
            style={{
              background: 'radial-gradient(circle, #27272a 0%, #18181b 80%)',
            }}
          >
            {/* Gradation markings & crosshair */}
            <div className="absolute inset-0 rounded-full border border-teal-500/20 pointer-events-none" />
            <div className="absolute inset-4 rounded-full border border-dashed border-zinc-700/60 pointer-events-none" />

            {/* Crosshair lines */}
            <div className="absolute w-full h-[1px] bg-zinc-700/60 pointer-events-none" />
            <div className="absolute h-full w-[1px] bg-zinc-700/60 pointer-events-none" />

            {/* Cardinal direction labels */}
            <span className="absolute top-2 text-[10px] font-mono text-zinc-400 pointer-events-none font-semibold">
              TILT UP
            </span>
            <span className="absolute bottom-2 text-[10px] font-mono text-zinc-400 pointer-events-none font-semibold">
              TILT DOWN
            </span>
            <span className="absolute left-2.5 text-[10px] font-mono text-zinc-400 pointer-events-none font-semibold">
              LEFT
            </span>
            <span className="absolute right-2.5 text-[10px] font-mono text-zinc-400 pointer-events-none font-semibold">
              RIGHT
            </span>

            {/* Target Reticle in Center */}
            <div className="absolute w-6 h-6 rounded-full border border-teal-500/30 pointer-events-none" />

            {/* The Draggable Joystick Knob */}
            <div
              className={`absolute w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
                isDragging
                  ? 'bg-teal-500 text-white scale-105 shadow-teal-500/30'
                  : 'bg-zinc-800 text-teal-400 hover:bg-zinc-700 shadow-md'
              } border-2 border-teal-500/50`}
              style={{
                transform: `translate(${knobPos.x * 64}px, ${knobPos.y * 64}px)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              <Crosshair className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* D-Pad Directional Step Controls */}
        <div className="space-y-3">
          <div className="flex justify-center items-center gap-2">
            <button
              type="button"
              onClick={() => nudge(-stepSize, 0)}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
              title={`Pan Left -${stepSize}°`}
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => nudge(0, stepSize)}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                title={`Tilt Up +${stepSize}°`}
              >
                <ArrowUp className="w-4 h-4 text-white" />
              </button>

              <button
                type="button"
                onClick={() => nudge(0, -stepSize)}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                title={`Tilt Down -${stepSize}°`}
              >
                <ArrowDown className="w-4 h-4 text-white" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => nudge(stepSize, 0)}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
              title={`Pan Right +${stepSize}°`}
            >
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>


      </div>
    </div>
  );
};


