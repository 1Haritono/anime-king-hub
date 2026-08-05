<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Select from '../../../components/Select.svelte';
  import { API_ENDPOINT_OPTIONS, DEFAULT_API_ENDPOINT } from '../../../constants/apiEndpoints';
  import { getPairingCode, setPairingCode, checkLinkedPhoneCode } from '../../../services/syncService';

  let currentEndpoint = $state('');
  let endpointLoaded = $state(false);
  let endpointLoadError = $state(false);
  type PingState = { ok: boolean; latencyMs: number | null };
  let pingState = $state<Record<string, PingState>>({});
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let syncCheckInterval: ReturnType<typeof setInterval> | null = null;

  // Cloud Sync state
  let pairingCode = $state('');
  let inputCode = $state('');
  let copied = $state(false);
  let syncMsg = $state('');

  async function checkForPhoneLink() {
    const linked = await checkLinkedPhoneCode();
    if (linked) {
      pairingCode = linked;
      syncMsg = `📱 Телефон автоматически привязан! Код: ${linked}`;
      setTimeout(() => syncMsg = '', 6000);
    }
  }

  async function loadEndpoint() {
    pairingCode = getPairingCode();
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

  onMount(() => {
    pairingCode = getPairingCode();
    void loadEndpoint();
    void checkForPhoneLink();
    syncCheckInterval = setInterval(() => void checkForPhoneLink(), 5000);
  });

  onDestroy(() => {
    if (pingInterval) clearInterval(pingInterval);
    if (syncCheckInterval) clearInterval(syncCheckInterval);
  });
</script>

<div class="settings-modal-content">
  <!-- Cloud Watch Progress Sync Section (AnixApp Native Style) -->
  <div class="settings-section">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <p class="settings-section__label" style="margin: 0; color: #a78bfa; font-size: 0.95rem; font-weight: 600;">Синхронизация устройств (Cloud Sync)</p>
      <span style="font-size: 0.72rem; color: #00e676; background: rgba(0,230,118,0.12); border: 1px solid rgba(0,230,118,0.3); padding: 2px 8px; border-radius: 10px;">● Активно</span>
    </div>
    <p class="settings-section__desc" style="margin-bottom: 12px;">Синхронизация прогресса просмотра между Android и ПК версиями.</p>

    {#if syncMsg}
      <div style="font-size: 0.8rem; background: rgba(124, 77, 255, 0.2); color: #fff; padding: 6px 12px; border-radius: 6px; margin-bottom: 12px;">
        {syncMsg}
      </div>
    {/if}

    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <!-- Code Card -->
      <div style="flex: 1; min-width: 180px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 8px;">
        <span style="font-size: 0.75rem; color: #888; display: block; margin-bottom: 4px;">Ваш код связки:</span>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 1.3rem; font-weight: bold; letter-spacing: 2px; color: #a78bfa; font-family: monospace;">{pairingCode || '------'}</span>
          <button on:click={copyCode} style="background: rgba(167, 139, 250, 0.15); border: 1px solid rgba(167, 139, 250, 0.3); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
            {copied ? '✓ Скопировано' : 'Копировать'}
          </button>
        </div>
      </div>

      <!-- Link Input Card -->
      <div style="flex: 1; min-width: 180px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 8px;">
        <span style="font-size: 0.75rem; color: #888; display: block; margin-bottom: 4px;">Привязать другое устройство:</span>
        <div style="display: flex; gap: 6px;">
          <input
            type="text"
            placeholder="6-значный код"
            maxlength="6"
            bind:value={inputCode}
            style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; padding: 4px 8px; font-size: 0.85rem; font-family: monospace; width: 110px; outline: none;"
          />
          <button on:click={linkCode} style="background: #7c4dff; border: none; color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; cursor: pointer;">
            Связать
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="settings-section">
    <p class="settings-section__label">Эндпоинт API</p>
    <p class="settings-section__desc">Anixart — основные запросы приложения.</p>
    {#if typeof window !== 'undefined' && typeof window.anixApi === 'undefined'}
      <p class="settings-account-coming-soon">API доступно только в приложении Electron.</p>
    {:else if !endpointLoaded}
      <div style="font-size:0.875rem;color:#737373;">Загрузка…</div>
    {:else if endpointLoadError}
      <p style="font-size:0.875rem;color:#737373;">Не удалось загрузить текущий эндпоинт.</p>
    {:else}
      <Select
        options={endpointOptions}
        value={currentEndpoint}
        onChange={setEndpoint}
        placeholder="Выберите эндпоинт"
      />
    {/if}
  </div>
</div>
