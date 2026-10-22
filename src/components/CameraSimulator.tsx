import React, { useEffect, useRef } from 'react';
import { CameraSettings } from '../types/camera';

interface CameraSimulatorProps {
  settings: CameraSettings;
  flashlightOn: boolean;
  onRefReady?: (canvas: HTMLCanvasElement) => void;
  className?: string;
}

export const CameraSimulator: React.FC<CameraSimulatorProps> = ({
  settings,
  flashlightOn,
  onRefReady,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (onRefReady) {
      onRefReady(canvas);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    // Simulated objects moving in surveillance frame (e.g. warehouse security camera)
    const objects = [
      { x: 120, y: 220, dx: 0.6, dy: 0, label: 'Patrol Drone A1' },
      { x: 420, y: 160, dx: -0.4, dy: 0, label: 'AGV Conveyor 04' },
    ];

    const render = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Base Security Room / Facility Scene
      // Sky/ceiling
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0a0d14');
      grad.addColorStop(0.4, '#121824');
      grad.addColorStop(0.8, '#1e2433');
      grad.addColorStop(1, '#0c1017');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Calculate pan & tilt perspective shifts (pan: 0-180, tilt: 0-180)
      const panOffset = ((settings.pan || 90) - 90) * 2.2;
      const tiltOffset = ((settings.tilt || 90) - 90) * 1.6;

      ctx.save();
      // Shift scene with servo movement
      ctx.translate(-panOffset, tiltOffset);

      // Perspective floor grid
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.12)';
      ctx.lineWidth = 1;

      // Vanishing point lines
      const vpX = w / 2;
      const vpY = h * 0.35;
      for (let x = -w * 1.2; x <= w * 2.2; x += 60) {
        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(x, h + 100);
        ctx.stroke();
      }

      // Horizontal depth lines
      for (let i = 1; i <= 8; i++) {
        const y = vpY + (h - vpY) * Math.pow(i / 8, 2);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Storage racks / Servers / Architectural structures
      // Left rack
      ctx.fillStyle = '#161e2e';
      ctx.fillRect(20, 110, 80, 220);
      ctx.strokeStyle = '#26344d';
      ctx.strokeRect(20, 110, 80, 220);

      // Blinking server LEDs
      for (let row = 0; row < 6; row++) {
        ctx.fillStyle = (tick + row * 15) % 40 < 20 ? '#10b981' : '#059669';
        ctx.fillRect(35, 130 + row * 30, 6, 6);
        ctx.fillStyle = (tick + row * 23) % 50 < 25 ? '#3b82f6' : '#1d4ed8';
        ctx.fillRect(48, 130 + row * 30, 6, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(61, 130 + row * 30, 6, 6);
      }

      // Right security gateway / Door
      ctx.fillStyle = '#111827';
      ctx.fillRect(w - 120, 90, 90, 240);
      ctx.strokeStyle = '#374151';
      ctx.strokeRect(w - 120, 90, 90, 240);

      // Access control light
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(w - 75, 140, 5, 0, Math.PI * 2);
      ctx.fill();

      // Industrial hazard yellow/black stripes floor border
      ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
      ctx.fillRect(0, h - 24, w, 24);

      // Draw moving security test subjects
      objects.forEach((obj, idx) => {
        obj.x += obj.dx;
        if (obj.x > w - 140) obj.dx = -Math.abs(obj.dx);
        if (obj.x < 120) obj.dx = Math.abs(obj.dx);

        // Target box
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.8)';
        ctx.lineWidth = 1.5;
        const bw = 48;
        const bh = 54;
        ctx.strokeRect(obj.x, obj.y, bw, bh);

        // Corner ticks
        ctx.fillStyle = '#14b8a6';
        ctx.fillRect(obj.x - 2, obj.y - 2, 8, 2);
        ctx.fillRect(obj.x - 2, obj.y - 2, 2, 8);
        ctx.fillRect(obj.x + bw - 6, obj.y - 2, 8, 2);
        ctx.fillRect(obj.x + bw, obj.y - 2, 2, 8);

        // Tracking label
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#2dd4bf';
        ctx.fillText(`TRK-0${idx + 1} 99.4%`, obj.x, obj.y - 6);
      });

      ctx.restore();

      // 2. Flashlight illumination effect if flash is active
      if (flashlightOn || settings.flash === 1) {
        const flashGrad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7);
        flashGrad.addColorStop(0, 'rgba(255, 255, 240, 0.45)');
        flashGrad.addColorStop(0.5, 'rgba(255, 250, 220, 0.2)');
        flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // 3. Sensor Noise & Grain (simulating OV2640 sensor at high ISO)
      const noiseIntensity = Math.max(8, settings.quality * 0.4);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 32) {
        const grain = (Math.random() - 0.5) * noiseIntensity;
        data[i] = Math.min(255, Math.max(0, data[i] + grain));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
      }
      ctx.putImageData(imgData, 0, 0);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [flashlightOn, settings.flash, settings.quality, settings.pan, settings.tilt, onRefReady]);

  // Compute CSS filter styling based on brightness, contrast, saturation, special_effect
  let filterString = `brightness(${100 + settings.brightness * 20}%) contrast(${100 + settings.contrast * 25}%) saturate(${100 + settings.saturation * 25}%)`;

  switch (settings.special_effect) {
    case 1: // Negative
      filterString += ' invert(100%)';
      break;
    case 2: // Grayscale
      filterString += ' grayscale(100%)';
      break;
    case 3: // Red Tint
      filterString += ' sepia(100%) hue-rotate(320deg) saturate(300%)';
      break;
    case 4: // Green Tint
      filterString += ' sepia(100%) hue-rotate(80deg) saturate(300%)';
      break;
    case 5: // Blue Tint
      filterString += ' sepia(100%) hue-rotate(180deg) saturate(300%)';
      break;
    case 6: // Sepia
      filterString += ' sepia(90%)';
      break;
    default:
      break;
  }

  // Transform flips
  const transformString = `${settings.vflip ? 'scaleY(-1)' : ''} ${settings.hmirror ? 'scaleX(-1)' : ''}`.trim();

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      style={{
        filter: filterString,
        transform: transformString || undefined,
      }}
      className={`w-full h-full object-contain ${className || ''}`}
    />
  );
};
