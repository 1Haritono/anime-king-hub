<script lang="ts">
  import type { UpdaterState } from '../types/anixapp';

  export let updaterState: UpdaterState = { status: 'idle' };

  function startDownload() {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('updater:download');
    }
  }

  function installUpdate() {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('updater:install');
    }
  }

  function minimizeWindow() {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('window:minimize');
    }
  }

  function maximizeWindow() {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('window:maximize');
    }
  }

  function closeWindow() {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('window:close');
    }
  }
</script>

<header className="titlebar-root">
  <div className="title-label">Anime King Hub — Desktop Application</div>

  <div className="controls-group">
    {#if updaterState.status === 'available'}
      <button class="pill-btn pill-available" on:click={startDownload} title="Доступна новая версия">
        <span>↓ Обновить до {updaterState.version || ''}</span>
        <span class="red-dot"></span>
      </button>
    {:else if updaterState.status === 'downloading'}
      <span class="pill-btn pill-downloading">
        <div class="progress-bar" style="width: {updaterState.percent || 0}%"></div>
        <span class="pill-text">↓ {updaterState.percent || 0}%</span>
      </span>
    {:else if updaterState.status === 'downloaded'}
      <button class="pill-btn pill-ready" on:click={installUpdate}>
        <span>↓ Установить</span>
      </button>
    {:else if updaterState.status === 'installing'}
      <span class="pill-btn pill-installing">
        <span>Установка…</span>
      </span>
    {/if}

    <div class="divider"></div>

    <button class="win-btn" on:click={minimizeWindow} title="Свернуть">−</button>
    <button class="win-btn" on:click={maximizeWindow} title="Развернуть">□</button>
    <button class="win-btn close" on:click={closeWindow} title="Закрыть">×</button>
  </div>
</header>

<style>
  .titlebar-root {
    height: 36px;
    background-color: var(--bg-surface, #0D0D0D);
    border-bottom: 1px solid var(--border-subtle, #222222);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    user-select: none;
    -webkit-app-region: drag;
  }

  .title-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted, #888888);
  }

  .controls-group {
    display: flex;
    align-items: center;
    gap: 10px;
    -webkit-app-region: no-drag;
  }

  .pill-btn {
    position: relative;
    border: none;
    border-radius: 16px;
    padding: 4px 12px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
  }

  .pill-available {
    background-color: rgba(244, 67, 54, 0.15);
    color: #FF5252;
    border: 1px solid rgba(244, 67, 54, 0.4);
  }

  .pill-downloading {
    background-color: rgba(30, 136, 229, 0.15);
    color: #64B5F6;
    border: 1px solid rgba(30, 136, 229, 0.4);
  }

  .pill-ready {
    background-color: rgba(76, 175, 80, 0.2);
    color: #4CAF50;
    border: 1px solid rgba(76, 175, 80, 0.4);
  }

  .pill-installing {
    background-color: rgba(76, 175, 80, 0.1);
    color: #81C784;
  }

  .red-dot {
    width: 6px;
    height: 6px;
    background-color: #FF5252;
    border-radius: 50%;
  }

  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    background-color: rgba(30, 136, 229, 0.35);
    transition: width 0.3s ease;
    z-index: 0;
  }

  .pill-text {
    position: relative;
    z-index: 1;
  }

  .divider {
    width: 1px;
    height: 16px;
    background-color: var(--border-subtle, #222222);
  }

  .win-btn {
    background: none;
    border: none;
    color: var(--text-secondary, #CCCCCC);
    font-size: 1rem;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
  }

  .win-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .win-btn.close:hover {
    background-color: #E53935;
    color: #FFFFFF;
  }
</style>
