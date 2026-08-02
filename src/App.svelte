<script lang="ts">
  import { onMount } from 'svelte';
  import Titlebar from './components/Titlebar.svelte';
  import type { UpdaterState } from './types/anixapp';

  let updaterState: UpdaterState = { status: 'idle' };

  onMount(() => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.on('updater-status', (_event: any, data: UpdaterState) => {
        updaterState = data;
      });
    }
  });
</script>

<div class="app-container">
  <Titlebar {updaterState} />

  <main class="app-body">
    <div class="welcome-card">
      <h1 class="gold-title">👑 Anime King Hub — Desktop Application</h1>
      <p class="sub-text">AnixApp Core Base + Anime King Hub AMOLED Visuals & Yummy Catalog</p>
      
      <div class="badge-row">
        <span class="badge badge-gold">Svelte 5 + TS</span>
        <span class="badge badge-burgundy">Yummy Catalog</span>
        <span class="badge badge-green">Anixart Auth & Sync</span>
        <span class="badge badge-blue">Skip OP/ED Player</span>
      </div>
    </div>
  </main>
</div>

<style>
  :global(@import './styles/theme.css');

  .app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-amoled);
  }

  .app-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .welcome-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-burgundy);
    border-radius: 16px;
    padding: 36px;
    text-align: center;
    max-width: 600px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
  }

  .gold-title {
    color: var(--accent-gold);
    font-size: 1.6rem;
    font-weight: 900;
    margin-bottom: 12px;
  }

  .sub-text {
    color: var(--text-secondary);
    font-size: 0.92rem;
    line-height: 1.5;
    margin-bottom: 24px;
  }

  .badge-row {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .badge-gold {
    background-color: var(--accent-gold-muted);
    color: var(--accent-gold);
    border: 1px solid var(--border-gold);
  }

  .badge-burgundy {
    background-color: rgba(92, 6, 28, 0.3);
    color: var(--accent-pink);
    border: 1px solid var(--border-burgundy);
  }

  .badge-green {
    background-color: rgba(76, 175, 80, 0.15);
    color: #4CAF50;
    border: 1px solid rgba(76, 175, 80, 0.4);
  }

  .badge-blue {
    background-color: rgba(100, 181, 246, 0.15);
    color: #64B5F6;
    border: 1px solid rgba(100, 181, 246, 0.4);
  }
</style>
