// mpv IPC Bridge Service for Desktop (Electron / Node child_process)
// Dynamically imports Node modules in Electron environment, with web browser fallback mockup

export class MpvPlayerBridge {
  constructor(socketPath = '\\\\.\\pipe\\mpvserver') {
    this.socketPath = socketPath;
    this.mpvProcess = null;
    this.client = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // C14: Launch mpv child process with JSON IPC (Electron / Desktop)
  loadUrl(url) {
    if (!url) return;
    
    const isDirectMedia = (
      url.endsWith('.m3u8') || url.endsWith('.mp4') || url.endsWith('.mpd') || url.endsWith('.webm') ||
      url.includes('.m3u8?') || url.includes('.mp4?') || url.includes('type=direct')
    );

    if (!isDirectMedia) {
      console.warn('[mpvBridge] URL is HTML embed page, skipping MPV spawn:', url);
      return;
    }

    if (this.isConnected && this.client) {
      this.sendCommand('loadfile', [url]);
    } else {
      console.log('[MPV Bridge] Spawning MPV for direct media stream:', url);
      this.spawnMpv(url);
    }
  }

  spawnMpv(videoUrl, options = {}) {
    // Check if running in Node/Electron environment
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { spawn } = window.require('child_process');
        const net = window.require('net');

        const args = [
          videoUrl,
          `--input-ipc-server=${this.socketPath}`,
          '--idle=yes',
          '--force-window=immediate',
          '--keep-open=yes'
        ];

        if (options.anime4kPreset && options.anime4kPreset !== 'off') {
          const shaderFiles = this.getAnime4kShaders(options.anime4kPreset, options.anime4kQuality || 'HQ');
          if (shaderFiles.length > 0) {
            args.push(`--glsl-shaders=${shaderFiles.join(';')}`);
          }
        }

        this.mpvProcess = spawn('mpv', args);
        this.mpvProcess.on('error', (err) => {
          console.warn('mpv process spawn error:', err.message);
        });

        setTimeout(() => this.connectIpc(net), 800);
        return;
      } catch (e) {
        console.warn('Electron child_process spawn failed:', e);
      }
    }

    // Web Browser Mockup mode (for Vite Dev Server)
    console.log('[MPV Bridge Mock] Running in Browser environment. IPC simulated.');
    this.isConnected = true;
    this.emit('connected', true);
  }

  connectIpc(netModule) {
    if (!netModule) return;
    this.client = netModule.connect(this.socketPath, () => {
      this.isConnected = true;
      console.log('Successfully connected to mpv JSON IPC pipe');
      this.emit('connected', true);
    });

    this.client.on('error', (err) => {
      console.warn('IPC Pipe connection error:', err.message);
      this.isConnected = false;
      this.emit('connected', false);
    });

    this.client.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          this.emit('ipc_message', msg);
        } catch (e) {}
      }
    });
  }

  sendCommand(command, args = []) {
    if (!this.isConnected) return;
    console.log(`[MPV IPC Send] Command: ${command}`, args);
    if (this.client) {
      const req = JSON.stringify({ command: [command, ...args] }) + '\n';
      this.client.write(req);
    }
  }

  // C15: Quality Selection
  setQuality(quality) {
    console.log(`Setting MPV Stream Quality: ${quality}`);
    this.sendCommand('set_property', ['ytdl-format', quality === '1080p' ? 'bestvideo[height<=1080]+bestaudio/best' : 'bestvideo[height<=720]+bestaudio/best']);
  }

  // C16: Speed Control (High Multipliers up to 3.0x)
  setSpeed(speedRate) {
    console.log(`Setting MPV Playback Speed: ${speedRate}x`);
    this.sendCommand('set_property', ['speed', speedRate]);
  }

  // C17: Apply GLSL Anime4K Shader Preset
  applyAnime4kShaders(preset, quality = 'HQ') {
    if (preset === 'off') {
      this.sendCommand('change-list', ['glsl-shaders', 'clr', '']);
      console.log('Anime4K Shaders cleared (CTRL+0 equivalent)');
      return;
    }

    const shaders = this.getAnime4kShaders(preset, quality);
    const shaderString = shaders.join(';');
    this.sendCommand('change-list', ['glsl-shaders', 'set', shaderString]);
    console.log(`Applied Anime4K GLSL Shaders pipeline: ${preset} (${quality}): ${shaderString}`);
  }

  getAnime4kShaders(preset, quality) {
    const basePath = '~~/shaders/Anime4K_';
    const q = quality === 'Fast' ? 'Fast' : 'HQ';

    switch (preset) {
      case 'modeA':
        return [`${basePath}Restore_CNN_M.glsl`, `${basePath}Upscale_CNN_x2_${q}.glsl`];
      case 'modeB':
        return [`${basePath}Restore_CNN_Soft_M.glsl`, `${basePath}Upscale_CNN_x2_${q}.glsl`];
      case 'modeC':
        return [`${basePath}Denoise_Bilateral_Mode.glsl`, `${basePath}Upscale_CNN_x2_${q}.glsl`];
      case 'modeAA':
        return [`${basePath}Restore_CNN_M.glsl`, `${basePath}Upscale_CNN_x2_${q}.glsl`, `${basePath}AutoDownscalePre_x2_4K.glsl`, `${basePath}Restore_CNN_M.glsl`];
      case 'modeBB':
        return [`${basePath}Restore_CNN_Soft_M.glsl`, `${basePath}Upscale_CNN_x2_${q}.glsl`, `${basePath}AutoDownscalePre_x2_4K.glsl`, `${basePath}Restore_CNN_Soft_M.glsl`];
      case 'modeCA':
        return [`${basePath}Denoise_Bilateral_Mode.glsl`, `${basePath}Restore_CNN_M.glsl`, `${basePath}Upscale_CNN_x2_${q}.glsl`];
      default:
        return [];
    }
  }

  // C18: Subtitle & Audio Track Cycles
  cycleSubtitles() {
    this.sendCommand('cycle', ['sub']);
    console.log('Cycled Subtitle Track (Hotkey S)');
  }

  cycleAudio() {
    this.sendCommand('cycle', ['audio']);
    console.log('Cycled Audio Track (Hotkey A)');
  }

  togglePlayPause() {
    this.sendCommand('cycle', ['pause']);
  }

  seek(seconds) {
    this.sendCommand('seek', [seconds]);
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(fn => fn(data));
    }
  }

  destroy() {
    if (this.client) this.client.destroy();
    if (this.mpvProcess) this.mpvProcess.kill();
  }
}
