(function () {
  const api = window.mediaRenamer;
  if (!api) return;

  const runManualBtn = document.getElementById('runManualActions');
  const runManualStatus = document.getElementById('runManualStatusActions');
  const runStructureBtn = document.getElementById('runStructureCheck');
  const runStructureStatus = document.getElementById('runStructureStatus');
  const consoleOut = document.getElementById('console-out');

  function setStatus(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.className = 'status' + (text ? (isError ? ' err' : ' ok') : '');
  }

  runManualBtn?.addEventListener('click', async () => {
    runManualBtn.disabled = true;
    setStatus(runManualStatus, 'Processing…');
    try {
      const result = await api.runManual();
      setStatus(
        runManualStatus,
        `Done: ${result.processed} processed, ${result.errors} error(s). Console shows details.`,
        result.errors > 0
      );
    } catch (e) {
      setStatus(runManualStatus, 'Error: ' + (e && e.message ? e.message : 'Unknown'), true);
    }
    runManualBtn.disabled = false;
    setTimeout(() => setStatus(runManualStatus, ''), 5000);
  });

  runStructureBtn?.addEventListener('click', async () => {
    runStructureBtn.disabled = true;
    setStatus(runStructureStatus, 'Checking…');
    try {
      await api.runStructureCheck();
      setStatus(runStructureStatus, 'Done. See Console for details.');
    } catch (e) {
      setStatus(runStructureStatus, 'Error: ' + (e && e.message ? e.message : 'Unknown'), true);
    }
    runStructureBtn.disabled = false;
    setTimeout(() => setStatus(runStructureStatus, ''), 5000);
  });

  // Embedded console: uses the same `log-init`/`log` IPC events as the separate Console window.
  if (consoleOut && api.onLogInit && api.onLog) {
    function addLine(entry) {
      const div = document.createElement('div');
      div.className = 'console-line ' + entry.level;
      div.innerHTML =
        '<span class="console-time">[' + entry.time + ']</span><span class="console-msg">' + escapeHtml(entry.message) + '</span>';
      consoleOut.appendChild(div);
      consoleOut.scrollTop = consoleOut.scrollHeight;
    }

    function escapeHtml(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    api.onLogInit((entries) => {
      consoleOut.innerHTML = '';
      if (!entries || entries.length === 0) {
        consoleOut.innerHTML = '<div class="console-empty">No log entries yet. Changes will appear here when you run.</div>';
      } else {
        entries.forEach(addLine);
      }
    });

    api.onLog(addLine);
    api.requestLogs();
  }
})();

