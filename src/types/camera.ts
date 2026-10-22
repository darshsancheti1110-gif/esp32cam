export interface CameraConfig {
  ip: string; // e.g. "http://192.168.1.15" or "192.168.1.15"
  port: number; // e.g. 80
  streamPort?: number; // e.g. 80 or 81
  streamPath: string; // e.g. "/stream"
  capturePath: string; // e.g. "/capture"
  controlPath: string; // e.g. "/control"
  statusPath: string; // e.g. "/status"
  servoEndpoint?: string; // e.g. "/servo" or "/control"
  servoEndpointType?: 'control_var' | 'servo_query';
  servoPanVar?: string;
  servoTiltVar?: string;
  autoReconnect: boolean;
  isSimulated: boolean;
}

export type FramesizeOption = {
  name: string;
  label: string;
  value: number; // ESP32 CameraWebServer value
  resolution: string;
};

export const FRAMESIZES: FramesizeOption[] = [
  { name: 'UXGA', label: 'UXGA (1600 × 1200)', value: 10, resolution: '1600x1200' },
  { name: 'SXGA', label: 'SXGA (1280 × 1024)', value: 9, resolution: '1280x1024' },
  { name: 'XGA', label: 'XGA (1024 × 768)', value: 8, resolution: '1024x768' },
  { name: 'SVGA', label: 'SVGA (800 × 600)', value: 7, resolution: '800x600' },
  { name: 'VGA', label: 'VGA (640 × 480)', value: 6, resolution: '640x480' },
  { name: 'CIF', label: 'CIF (400 × 296)', value: 5, resolution: '400x296' },
  { name: 'QVGA', label: 'QVGA (320 × 240)', value: 4, resolution: '320x240' },
  { name: 'HQVGA', label: 'HQVGA (240 × 176)', value: 3, resolution: '240x176' },
];

export const SPECIAL_EFFECTS = [
  { id: 0, label: 'No Effect (Normal)' },
  { id: 1, label: 'Negative' },
  { id: 2, label: 'Grayscale' },
  { id: 3, label: 'Red Tint' },
  { id: 4, label: 'Green Tint' },
  { id: 5, label: 'Blue Tint' },
  { id: 6, label: 'Sepia' },
];

export interface CameraSettings {
  framesize: number; // default: 6 (VGA)
  quality: number; // 10 - 63 (default: 12)
  brightness: number; // -2 to 2 (default: 0)
  contrast: number; // -2 to 2 (default: 0)
  saturation: number; // -2 to 2 (default: 0)
  special_effect: number; // 0 - 6 (default: 0)
  flash: number; // 0 or 1 (default: 0)
  flash_intensity: number; // 0 - 255 (default: 255)
  vflip: number; // 0 or 1
  hmirror: number; // 0 or 1
  aec: number; // 0 or 1 (Auto Exposure)
  agc: number; // 0 or 1 (Auto Gain)
  pan: number; // 0 - 180 degrees (default: 90)
  tilt: number; // 0 - 180 degrees (default: 90)
}

export interface Snapshot {
  id: string;
  timestamp: string; // ISO string
  formattedTime: string;
  dataUrl: string;
  resolution: string;
  source: 'live' | 'simulator';
  sizeBytes?: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'offline' | 'simulation';

export interface EventLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'command' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface SavedAnglePreset {
  id: string;
  name: string;
  pan: number;
  tilt: number;
  timestamp?: string;
}
