<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Select from '../../../components/Select.svelte';
  import { API_ENDPOINT_OPTIONS, DEFAULT_API_ENDPOINT } from '../../../constants/apiEndpoints';
  import { getPairingCode, setPairingCode } from '../../../services/syncService';

  let currentEndpoint = $state('');
  let endpointLoaded = $state(false);
  let endpointLoadError = $state(false);
  type PingState = { ok: boolean; latencyMs: number | null };
  let pingState = $state<Record<string, PingState>>({});
  let pingInterval: ReturnType<typeof setInterval> | null = null;

  // Cloud Sync state
  let pairingCode = $state(getPairingCode());
  let inputCode = $state('');
  let copied = $state(false);
  let syncMsg = $state('');

  async function loadEndpoint() {
    if (!window.anixApi) return;
    try {
      const url = (await window.anixApi.client.getBaseUrl()) as string;
      currentEndpoint = url || DEFAULT_API_ENDPOINT;
      endpointLoaded = true;
      endpointLoadError = false;
      void pingOnce();
      pingInterval = setInterval(() => void pingOnce(), 1000);
    } catch {
      endpointLoaded = true;
      endpointLoadError = true;
    }
  }

  async function pingOnce() {
    if (!window.anixApi) return;
    const nextState: Record<string, PingState> = {};
    await Promise.all(
      API_ENDPOINT_OPTIONS.map(async (opt) => {
        try {
          const res = (await window.anixApi!.client.pingBaseUrl(opt.value)) as PingState;
          nextState[opt.value] = res;
        } catch {
          nextState[opt.value] = { ok: false, latencyMs: null };
        }
      })
    );
    pingState = nextState;
  }

  function setEndpoint(value: string) {
    currentEndpoint = value;
    window.anixApi?.client?.setBaseUrl(value);
    window.dispatchEvent(new CustomEvent('anix:offline'));
  }

  function pingLabel(map: Record<string, PingState>, key: string): string {
    const s = map[key];
    if (!s) return '';
    if (s.ok && typeof s.latencyMs === 'number') return `${s.latencyMs} мс`;
    if (!s.ok) return 'недоступен';
    return '';
  }

  function copyCode() {
    navigator.clipboard.writeText(pairingCode);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  function linkCode() {
    if (setPairingCode(inputCode)) {
      pairingCode = inputCode.trim();
      syncMsg = '✅ Устройство успешно привязано!';
      inputCode = '';
    } else {
      syncMsg = '❌ Введите 6-значный цифровой код';
    }
    setTimeout(() => syncMsg = '', 4000);
  }

  const endpointOptions = $derived(
    API_ENDPOINT_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
      desc: pingLabel(pingState, opt.value) || undefined,
    }))
  );

  onMount(() => void loadEndpoint());
  onDestroy(() => {
    if (pingInterval) clearInterval(pingInterval);
  });
</script>

<div class="settings-modal-content">
  <!-- Cloud Watch Progress Sync Section -->
  <div class="settings-section" style="background: rgba(124, 77, 255, 0.08); border: 1px solid rgba(124, 77, 255, 0.25); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <div>
        <p class="settings-section__label" style="margin: 0; color: #a78bfa; font-weight: bold; font-size: 1rem;">☁️ Синхронизация устройств (Cloud Sync)</p>
        <p class="settings-section__desc" style="margin: 4px 0 0 0;">Синхронизация прогресса просмотра между Android и ПК</p>
      </div>
      <span style="font-size: 0.75rem; background: rgba(0, 230, 118, 0.2); color: #00e676; padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(0, 230, 118, 0.4); font-weight: bold;">● Активно</span>
    </div>

    {#if syncMsg}
      <div style="font-size: 0.8rem; background: rgba(0,0,0,0.4); color: #fff; padding: 6px 10px; border-radius: 6px; margin-bottom: 10px;">
        {syncMsg}
      </div>
    {/if}

    <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px;">
      <div style="flex: 1; min-width: 200px; background: rgba(0,0,0,0.25); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
        <span style="font-size: 0.75rem; color: #a3a3a3; display: block; margin-bottom: 4px;">Ваш код связки:</span>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.4rem; font-weight: bold; letter-spacing: 2px; color: #a78bfa; font-family: monospace;">{pairingCode}</span>
          <button on:click={copyCode} style="background: rgba(167, 139, 250, 0.2); border: 1px solid rgba(167, 139, 250, 0.4); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
            {copied ? '✓ Скопировано' : 'Копировать'}
          </button>
        </div>
      </div>

      <div style="flex: 1; min-width: 200px; background: rgba(0,0,0,0.25); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
        <span style="font-size: 0.75rem; color: #a3a3a3; display: block; margin-bottom: 4px;">Привязать другое устройство:</span>
        <div style="display: flex; gap: 8px;">
          <input
            type="text"
            placeholder="6-значный код"
            maxlength="6"
            bind:value={inputCode}
            style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; padding: 4px 8px; font-size: 0.9rem; font-family: monospace; width: 100px; outline: none;"
          />
          <button on:click={linkCode} style="background: #7c4dff; border: none; color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; cursor: pointer;">
            Связать
          </button>
        </div>
      </div>
    </div>
  </div>

  {#if typeof window !== 'undefined' && typeof window.anixApi === 'undefined'}
    <p class="settings-account-coming-soon">API доступно только в приложении Electron.</p>
  {:else if !endpointLoaded}
    <div class="settings-section">
      <p class="settings-section__label">Эндпоинт API</p>
      <div style="font-size:0.875rem;color:#737373;">Загрузка…</div>
    </div>
  {:else if endpointLoadError}
    <div class="settings-section">
      <p class="settings-section__label">Эндпоинт API</p>
      <p style="font-size:0.875rem;color:#737373;">Не удалось загрузить текущий эндпоинт.</p>
    </div>
  {:else}
    <div class="settings-section">
      <p class="settings-section__label">Эндпоинт API</p>
      <p class="settings-section__desc">Anixart — основные запросы приложения.</p>
      <Select
        options={endpointOptions}
        value={currentEndpoint}
        onChange={setEndpoint}
        placeholder="Выберите эндпоинт"
      />
    </div>
  {/if}
</div>
