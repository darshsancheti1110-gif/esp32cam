import React, { useState } from 'react';
import {
  Sliders,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Sun,
  Contrast as ContrastIcon,
  Layers,
  Activity,
  X,
  Compass,
  Target,
  Trash2,
  Save,
  Check,
} from 'lucide-react';
import {
  CameraSettings,
  FRAMESIZES,
  SPECIAL_EFFECTS,
  SavedAnglePreset,
} from '../types/camera';
import { sounds } from '../services/soundEffects';

interface CameraControlsProps {
  settings: CameraSettings;
  lastCommand?: { url: string; success: boolean; time: string } | null;
  onUpdateSetting: <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => void;
  onResetSettings: () => void;
  onClose?: () => void;
  isSimulated?: boolean;
  onPanTiltChange?: (pan: number, tilt: number) => void;
  savedAngles?: SavedAnglePreset[];
  onSaveAngle?: (name?: string, pan?: number, tilt?: number) => void;
  onDeleteAngle?: (id?: string) => void;
  onResetServoAngle?: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  settings,
  onUpdateSetting,
  onResetSettings,
  onClose,
  onPanTiltChange,
  savedAngles = [],
  onSaveAngle,
  onDeleteAngle,
  onResetServoAngle,
}) => {
  const [openSection, setOpenSection] = useState<'stream' | 'sensor' | 'advanced' | 'servo' | 'all'>('all');

  const toggleSection = (section: 'stream' | 'sensor' | 'advanced' | 'servo') => {
    setOpenSection((prev) => (prev === section ? 'all' : section));
  };

  const primarySaved = savedAngles.length > 0 ? savedAngles[0] : null;
  const isAtSavedAngle =
    primarySaved !== null &&
    settings.pan === primarySaved.pan &&
    settings.tilt === primarySaved.tilt;

  const handleMoveToSaved = () => {
    if (!primarySaved || !onPanTiltChange) return;
    sounds.playBeep(620, 0.05);
    onPanTiltChange(primarySaved.pan, primarySaved.tilt);
  };

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 tracking-tight">Camera Settings</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white bg-red-600 hover:bg-red-500 active:scale-98 rounded-lg transition-all border border-red-500 shadow-md shadow-red-600/30 cursor-pointer"
              title="Close Settings Panel"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Camera Controls Content */}
      <div className="p-5 space-y-5">
        {/* Section: Pan & Tilt Servo Angle Presets */}
        <div className="space-y-4">
          <div
            onClick={() => toggleSection('servo')}
            className="flex items-center justify-between cursor-pointer pb-1 border-b border-zinc-800/80 group"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Servo Angle & Presets
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-teal-400 border border-zinc-800">
                P: {settings.pan}° / T: {settings.tilt}°
              </span>
              <ChevronDown
                className={`w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform ${
                  openSection === 'servo' || openSection === 'all' ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {(openSection === 'servo' || openSection === 'all') && (
            <div className="space-y-4 text-xs">
              {/* Sliders for Pan and Tilt adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                {/* Pan Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-zinc-200">Pan Angle (X)</span>
                    <span className="font-mono text-teal-400 font-bold tabular-nums">{settings.pan}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="1"
                    value={settings.pan}
                    onChange={(e) => onPanTiltChange?.(parseInt(e.target.value, 10), settings.tilt)}
                    className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
                    <span>0° Left</span>
                    <span>90° Center</span>
                    <span>180° Right</span>
                  </div>
                </div>

                {/* Tilt Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-zinc-200">Tilt Angle (Y)</span>
                    <span className="font-mono text-teal-400 font-bold tabular-nums">{settings.tilt}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="1"
                    value={settings.tilt}
                    onChange={(e) => onPanTiltChange?.(settings.pan, parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
                    <span>0° Down</span>
                    <span>90° Level</span>
                    <span>180° Up</span>
                  </div>
                </div>
              </div>

              {/* Saved Angle Memory & Automatic Recall Box */}
              <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-teal-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                    <Target className="w-4 h-4 text-teal-400" />
                    <span>Saved Angle Preset</span>
                  </div>
                  {primarySaved && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-500/40">
                      Saved Slot
                    </span>
                  )}
                </div>

                {primarySaved ? (
                  <div className="space-y-2.5">
                    {/* Primary Button to Move to Saved Angle */}
                    <button
                      type="button"
                      onClick={handleMoveToSaved}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        isAtSavedAngle
                          ? 'bg-teal-500/15 border-teal-500/50 text-teal-200 shadow-md shadow-teal-500/10'
                          : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-700/80 hover:border-teal-400/60 text-zinc-100 group'
                      }`}
                      title="Click to automatically move servo to this saved angle"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-lg ${
                            isAtSavedAngle
                              ? 'bg-teal-500/30 text-teal-300'
                              : 'bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform'
                          }`}
                        >
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-2">
                            <span>Move to Saved Angle</span>
                            {isAtSavedAngle && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/25 text-teal-300 border border-teal-500/40 flex items-center gap-1">
                                <Check className="w-3 h-3" /> AT ANGLE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                            Pan: <span className="text-teal-400 font-bold">{primarySaved.pan}°</span> · Tilt:{' '}
                            <span className="text-teal-400 font-bold">{primarySaved.tilt}°</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-400 group-hover:text-teal-300 px-2.5 py-1 rounded-lg bg-teal-950/60 border border-teal-500/30 shrink-0">
                        <span>{isAtSavedAngle ? 'Active' : 'Recall Angle'}</span>
                      </div>
                    </button>

                    {/* Action buttons: Overwrite with current and Delete/Reset setting */}
                    <div className="flex items-center gap-2 pt-1">
                      {/* Save Current Angle / Overwrite */}
                      <button
                        type="button"
                        onClick={() => onSaveAngle?.('Saved Angle', settings.pan, settings.tilt)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors text-[11px]"
                        title="Update saved setting with current Pan and Tilt coordinates"
                      >
                        <Save className="w-3.5 h-3.5 text-teal-400" />
                        <span>Update ({settings.pan}°, {settings.tilt}°)</span>
                      </button>

                      {/* Delete Saved Angle button */}
                      <button
                        type="button"
                        onClick={() => onDeleteAngle?.(primarySaved.id)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-950/30 hover:bg-red-950/60 text-red-400 hover:text-red-300 border border-red-800/40 hover:border-red-700/60 transition-colors text-[11px]"
                        title="Delete this saved angle and reset setting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Setting</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* When not saved yet: button to save current angle */
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => onSaveAngle?.('Saved Angle', settings.pan, settings.tilt)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 border border-teal-500/30 hover:border-teal-500/50 transition-all font-semibold text-xs cursor-pointer group shadow-sm"
                    >
                      <Save className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                      <span>Save Current Angle (Pan: {settings.pan}°, Tilt: {settings.tilt}°)</span>
                    </button>
                    <p className="text-[11px] text-zinc-400 leading-relaxed text-center">
                      Set desired angle using joystick or sliders above, then save it. Clicking it later will automatically steer the servos back to this position.
                    </p>
                  </div>
                )}

                {/* Reset to Default Center Button */}
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Default Servo Position</span>
                  <button
                    type="button"
                    onClick={() => (onResetServoAngle ? onResetServoAngle() : onPanTiltChange?.(90, 90))}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
                    title="Center Servos to 90°, 90°"
                  >
                    <RotateCcw className="w-3 h-3 text-teal-400" />
                    <span>Reset to Center (90°, 90°)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 1: Resolution & Quality */}
        <div className="space-y-4">
          <div
            onClick={() => toggleSection('stream')}
            className="flex items-center justify-between cursor-pointer pb-1 border-b border-zinc-800/80 group"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Stream & Resolution
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform ${
                openSection === 'stream' || openSection === 'all' ? 'rotate-180' : ''
              }`}
            />
          </div>

          {(openSection === 'stream' || openSection === 'all') && (
            <div className="space-y-4 text-xs">
              {/* Resolution Selector Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="framesize-select" className="font-medium text-zinc-200">
                    Resolution (framesize)
                  </label>
                  <span className="text-[11px] font-mono text-teal-400">
                    val={settings.framesize}
                  </span>
                </div>
                <select
                  id="framesize-select"
                  value={settings.framesize}
                  onChange={(e) => onUpdateSetting('framesize', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-lg text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                >
                  {FRAMESIZES.map((f) => (
                    <option key={f.value} value={f.value} className="bg-zinc-900 text-zinc-100">
                      {f.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Higher resolution drops FPS. VGA (640x480) offers optimal speed and fidelity.
                </p>
              </div>

              {/* JPEG Quality Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="quality-slider" className="font-medium text-zinc-200">
                    JPEG Compression Quality
                  </label>
                  <span className="font-mono text-zinc-300 font-bold">
                    {settings.quality}
                  </span>
                </div>
                <input
                  id="quality-slider"
                  type="range"
                  min="10"
                  max="63"
                  step="1"
                  value={settings.quality}
                  onChange={(e) => onUpdateSetting('quality', parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>10 (High Quality)</span>
                  <span>36 (Balanced)</span>
                  <span>63 (High FPS)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Image Sensor Adjustments (Brightness, Contrast, Saturation) */}
        <div className="space-y-4">
          <div
            onClick={() => toggleSection('sensor')}
            className="flex items-center justify-between cursor-pointer pb-1 border-b border-zinc-800/80 group"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              Sensor Adjustments
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform ${
                openSection === 'sensor' || openSection === 'all' ? 'rotate-180' : ''
              }`}
            />
          </div>

          {(openSection === 'sensor' || openSection === 'all') && (
            <div className="space-y-4 text-xs">
              {/* Brightness Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-zinc-400" />
                    Brightness
                  </span>
                  <span className="font-mono text-zinc-300 font-bold tabular-nums">
                    {settings.brightness > 0 ? `+${settings.brightness}` : settings.brightness}
                  </span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="1"
                  value={settings.brightness}
                  onChange={(e) => onUpdateSetting('brightness', parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>-2 Dark</span>
                  <span>0 Normal</span>
                  <span>+2 Bright</span>
                </div>
              </div>

              {/* Contrast Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                    <ContrastIcon className="w-3.5 h-3.5 text-zinc-400" />
                    Contrast
                  </span>
                  <span className="font-mono text-zinc-300 font-bold tabular-nums">
                    {settings.contrast > 0 ? `+${settings.contrast}` : settings.contrast}
                  </span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="1"
                  value={settings.contrast}
                  onChange={(e) => onUpdateSetting('contrast', parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>-2 Soft</span>
                  <span>0 Normal</span>
                  <span>+2 Vivid</span>
                </div>
              </div>

              {/* Saturation Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-zinc-200">Saturation</span>
                  <span className="font-mono text-zinc-300 font-bold tabular-nums">
                    {settings.saturation > 0 ? `+${settings.saturation}` : settings.saturation}
                  </span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="1"
                  value={settings.saturation}
                  onChange={(e) => onUpdateSetting('saturation', parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>-2 Muted</span>
                  <span>0 Balanced</span>
                  <span>+2 Saturated</span>
                </div>
              </div>

              {/* Special Effects Dropdown */}
              <div>
                <label htmlFor="effect-select" className="font-medium text-zinc-200 block mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  Special Effect (special_effect)
                </label>
                <select
                  id="effect-select"
                  value={settings.special_effect}
                  onChange={(e) => onUpdateSetting('special_effect', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-lg text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                >
                  {SPECIAL_EFFECTS.map((eff) => (
                    <option key={eff.id} value={eff.id} className="bg-zinc-900 text-zinc-100">
                      {eff.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Exposure & Hardware Toggles */}
        <div className="space-y-4">
          <div
            onClick={() => toggleSection('advanced')}
            className="flex items-center justify-between cursor-pointer pb-1 border-b border-zinc-800/80 group"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Advanced Sensor Features
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform ${
                openSection === 'advanced' || openSection === 'all' ? 'rotate-180' : ''
              }`}
            />
          </div>

          {(openSection === 'advanced' || openSection === 'all') && (
            <div className="space-y-3 text-xs">
              {/* Auto Exposure (AEC) */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-800">
                <div>
                  <div className="font-medium text-zinc-200">Auto Exposure (AEC)</div>
                  <div className="text-[11px] text-zinc-500">Automatic sensor shutter adaptation</div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSetting('aec', settings.aec === 1 ? 0 : 1)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.aec === 1 ? 'bg-teal-500 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Auto Gain (AGC) */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-800">
                <div>
                  <div className="font-medium text-zinc-200">Auto Gain Control (AGC)</div>
                  <div className="text-[11px] text-zinc-500">Dynamic ISO boost for dark scenes</div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSetting('agc', settings.agc === 1 ? 0 : 1)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.agc === 1 ? 'bg-teal-500 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Flash Intensity Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-zinc-200">Flash PWM Intensity</span>
                  <span className="font-mono text-zinc-300 font-bold tabular-nums">
                    {Math.round((settings.flash_intensity / 255) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="255"
                  step="5"
                  value={settings.flash_intensity}
                  onChange={(e) => onUpdateSetting('flash_intensity', parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
