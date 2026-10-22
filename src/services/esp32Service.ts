import { CameraConfig } from '../types/camera';

/**
 * Normalizes an IP or URL string to a valid http URL
 */
export function normalizeBaseUrl(rawInput: string): string {
  let trimmed = rawInput.trim();
  if (!trimmed) return 'http://192.168.1.15';

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }

  // Remove trailing slashes
  return trimmed.replace(/\/+$/, '');
}

/**
 * Builds the stream endpoint URL (e.g. http://192.168.1.15/stream)
 */
export function getStreamUrl(config: CameraConfig, addCacheBuster = false): string {
  const base = normalizeBaseUrl(config.ip);
  let finalBase = base;

  // If a distinct stream port was configured (like 81)
  if (config.streamPort && config.streamPort !== 80) {
    try {
      const url = new URL(base);
      url.port = config.streamPort.toString();
      finalBase = url.origin;
    } catch {
      // Fallback
    }
  }

  const path = config.streamPath.startsWith('/') ? config.streamPath : `/${config.streamPath}`;
  const url = `${finalBase}${path}`;
  return addCacheBuster ? `${url}?t=${Date.now()}` : url;
}

/**
 * Builds the capture snapshot endpoint URL (e.g. http://192.168.1.15/capture)
 */
export function getCaptureUrl(config: CameraConfig): string {
  const base = normalizeBaseUrl(config.ip);
  const path = config.capturePath.startsWith('/') ? config.capturePath : `/${config.capturePath}`;
  return `${base}${path}?_cb=${Date.now()}`;
}

/**
 * Dispatches an ESP32 CameraWebServer control command:
 * GET /control?var={variable}&val={value}
 */
export async function sendControlCommand(
  config: CameraConfig,
  variable: string,
  value: number | string
): Promise<{ success: boolean; url: string; error?: string }> {
  const base = normalizeBaseUrl(config.ip);
  const path = config.controlPath.startsWith('/') ? config.controlPath : `/${config.controlPath}`;
  const url = `${base}${path}?var=${encodeURIComponent(variable)}&val=${encodeURIComponent(value)}`;

  if (config.isSimulated) {
    // Simulated delay
    await new Promise((r) => setTimeout(r, 60));
    return { success: true, url };
  }

  try {
    // Attempt standard fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const resp = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return { success: resp.ok || resp.status === 0, url };
    } catch {
      clearTimeout(timeoutId);
      // Many ESP32 sketches do not set Access-Control-Allow-Origin headers.
      // Retrying with mode: 'no-cors' allows the browser to issue the HTTP request to the device.
      await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
      });
      return { success: true, url };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, url, error: message };
  }
}

/**
 * Dispatches Pan & Tilt servo angle commands to the ESP32
 */
export async function sendServoCommand(
  config: CameraConfig,
  panAngle: number,
  tiltAngle: number
): Promise<{ success: boolean; url: string; error?: string }> {
  if (config.isSimulated) {
    return { success: true, url: `simulated://servo?pan=${panAngle}&tilt=${tiltAngle}` };
  }

  const base = normalizeBaseUrl(config.ip);

  // If custom query format /servo?pan=90&tilt=90
  if (config.servoEndpointType === 'servo_query') {
    const endpoint = config.servoEndpoint || '/servo';
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${base}${path}?pan=${panAngle}&tilt=${tiltAngle}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      try {
        await fetch(url, { method: 'GET', signal: controller.signal });
      } catch {
        await fetch(url, { method: 'GET', mode: 'no-cors' });
      }
      clearTimeout(timeoutId);
      return { success: true, url };
    } catch (err: unknown) {
      return { success: false, url, error: String(err) };
    }
  }

  // Standard CameraWebServer format:
  // /control?var=pan&val=90 & /control?var=tilt&val=90
  const panVar = config.servoPanVar || 'pan';
  const tiltVar = config.servoTiltVar || 'tilt';

  const [panRes, tiltRes] = await Promise.all([
    sendControlCommand(config, panVar, panAngle),
    sendControlCommand(config, tiltVar, tiltAngle),
  ]);

  return {
    success: panRes.success && tiltRes.success,
    url: `${panRes.url} & ${tiltRes.url}`,
    error: panRes.error || tiltRes.error,
  };
}

/**
 * Probes the ESP32 status endpoint to verify connectivity
 */
export async function checkEsp32Connectivity(config: CameraConfig): Promise<boolean> {
  if (config.isSimulated) return true;

  const base = normalizeBaseUrl(config.ip);
  const statusUrl = `${base}${config.statusPath.startsWith('/') ? config.statusPath : `/${config.statusPath}`}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    // Try status endpoint or capture endpoint probe
    await fetch(statusUrl, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Grabs a single frame from an HTMLImageElement or Canvas as a high quality JPEG DataURL
 */
export function captureFrameToDataUrl(
  element: HTMLImageElement | HTMLCanvasElement,
  fallbackWidth = 640,
  fallbackHeight = 480
): string {
  const canvas = document.createElement('canvas');
  const width = 'naturalWidth' in element ? element.naturalWidth || fallbackWidth : element.width || fallbackWidth;
  const height = 'naturalHeight' in element ? element.naturalHeight || fallbackHeight : element.height || fallbackHeight;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  try {
    ctx.drawImage(element, 0, 0, width, height);

    // Draw OSD stamp onto the saved snapshot
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, height - 36, 320, 26);
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00ffcc';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    ctx.fillText(`ESP32-CAM [REC] ${now}`, 16, height - 19);

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch {
    // If CORS tainted, generate a placeholder capture with details
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#14b8a6';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText('ESP32-CAM SNAPSHOT CAPTURE', 24, 60);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText(`Timestamp: ${new Date().toISOString()}`, 24, 96);
    ctx.fillText(`Source: ${element.tagName}`, 24, 120);
    return canvas.toDataURL('image/jpeg', 0.92);
  }
}
