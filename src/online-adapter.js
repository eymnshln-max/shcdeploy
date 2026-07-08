(() => {
  'use strict';

  class OnlineOnlyError extends Error {
    constructor(message, details = {}) {
      super(message);
      this.name = 'OnlineOnlyError';
      this.code = details.code || 'ONLINE_TEST_FAILED';
      this.requestId = details.requestId || null;
      this.details = details;
    }
  }

  const state = {
    enabled: true,
    lastResult: null,
    lastError: null,
    requestCount: 0
  };

  async function complete({
    messages,
    system,
    maxTokens = 4096,
    temperature = 0.2,
    signal
  }) {
    state.requestCount += 1;

    let response;
    try {
      response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, system, maxTokens, temperature }),
        signal
      });
    } catch (cause) {
      const error = new OnlineOnlyError('Claude API bridge could not be reached. Offline fallback is forbidden.', {
        code: 'BRIDGE_UNREACHABLE',
        cause: String(cause)
      });
      failClosed(error);
    }

    const data = await readJsonSafely(response);
    if (!response.ok || !data?.ok || data.online !== true || data.fallbackUsed !== false) {
      const error = new OnlineOnlyError(
        data?.error?.message || `Online Claude request failed with HTTP ${response.status}.`,
        {
          code: data?.error?.code || `HTTP_${response.status}`,
          requestId: data?.error?.requestId || null,
          response: data
        }
      );
      failClosed(error);
    }

    state.lastResult = data;
    state.lastError = null;
    window.dispatchEvent(new CustomEvent('standard-health:online-success', { detail: data }));
    return data;
  }

  function assertOnline(result) {
    if (!result || result.online !== true || result.fallbackUsed !== false || typeof result.text !== 'string') {
      failClosed(new OnlineOnlyError('Invalid online result. Offline or unknown engine output was rejected.', {
        code: 'INVALID_ONLINE_RESULT',
        result
      }));
    }
    return result;
  }

  function rejectFallback(reason = 'The application attempted to enter offline fallback mode.') {
    failClosed(new OnlineOnlyError(`${reason} This test case is invalid and must stop.`, {
      code: 'OFFLINE_FALLBACK_BLOCKED'
    }));
  }

  function failClosed(error) {
    state.lastError = error;
    state.lastResult = null;
    window.dispatchEvent(new CustomEvent('standard-health:online-failure', {
      detail: {
        code: error.code,
        message: error.message,
        requestId: error.requestId
      }
    }));
    showBlockingFailure(error);
    throw error;
  }

  async function readJsonSafely(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  function showBlockingFailure(error) {
    let element = document.getElementById('__standard_health_online_failure__');
    if (!element) {
      element = document.createElement('div');
      element.id = '__standard_health_online_failure__';
      element.setAttribute('role', 'alert');
      Object.assign(element.style, {
        position: 'fixed', inset: '0', zIndex: '2147483647', display: 'grid',
        placeItems: 'center', padding: '24px', background: 'rgba(10,10,10,.96)',
        color: '#fff', fontFamily: 'system-ui, sans-serif', textAlign: 'center'
      });
      document.documentElement.appendChild(element);
    }
    element.innerHTML = `
      <div style="max-width:680px">
        <h1 style="font-size:24px;margin:0 0 12px">ONLINE TEST DURDURULDU</h1>
        <p style="font-size:16px;line-height:1.5;margin:0 0 10px">${escapeHtml(error.message)}</p>
        <p style="opacity:.7;margin:0">Kod: ${escapeHtml(error.code || 'ONLINE_TEST_FAILED')}</p>
      </div>`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }


  function addReportButton() {
    if (document.getElementById('__standard_health_report_button__')) return;
    const button = document.createElement('button');
    button.id = '__standard_health_report_button__';
    button.type = 'button';
    button.textContent = 'Vaka Raporu';
    button.setAttribute('aria-label', 'Vaka sonuç raporunu aç');
    Object.assign(button.style, {
      position: 'fixed', right: '12px', top: '12px', zIndex: '2147483000',
      border: '1px solid rgba(255,255,255,.22)', borderRadius: '999px',
      padding: '8px 12px', background: 'rgba(17,20,24,.88)', color: '#fff',
      font: '600 12px system-ui,sans-serif', backdropFilter: 'blur(8px)', cursor: 'pointer'
    });
    button.addEventListener('click', () => window.open('/__test/report.html', '_blank', 'noopener'));
    document.documentElement.appendChild(button);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addReportButton, { once: true });
  } else {
    addReportButton();
  }

  window.StandardHealthOnline = Object.freeze({
    complete,
    assertOnline,
    rejectFallback,
    OnlineOnlyError,
    state
  });

  window.addEventListener('error', (event) => {
    if (event.error instanceof OnlineOnlyError) {
      event.preventDefault();
    }
  });
})();
