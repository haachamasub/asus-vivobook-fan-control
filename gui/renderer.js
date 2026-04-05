const logEl = document.getElementById('log');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');

function appendLog(text, cls) {
  const line = document.createElement('div');
  line.className = cls ? `line ${cls}` : 'line';
  line.textContent = text;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function selectedMode() {
  const r = document.querySelector('input[name="mode"]:checked');
  return r ? Number(r.value) : 0;
}

function setRunning(running) {
  startBtn.disabled = running;
  stopBtn.disabled = !running;
  document.querySelectorAll('input[name="mode"]').forEach((el) => {
    el.disabled = running;
  });
}

startBtn.addEventListener('click', async () => {
  const mode = selectedMode();
  const res = await window.fanGui.start(mode);
  if (!res.ok) {
    if (res.error === 'admin_or_device') {
      appendLog('Could not open \\\\.\\ATKACPI — run as Administrator.', 'err');
    } else if (res.error === 'already_running') {
      appendLog('Already running.', 'err');
    } else {
      appendLog('Start failed.', 'err');
    }
    return;
  }
  setRunning(true);
  appendLog(`Started (mode ${mode}). Re-applying every 10s.`, 'ok');
});

stopBtn.addEventListener('click', async () => {
  await window.fanGui.stop();
  setRunning(false);
  appendLog('Stopped. Handle released; BIOS may return to auto.', 'ok');
});

window.fanGui.onTick(({ ok, time }) => {
  if (ok) {
    appendLog(`[${time}] Performance mode forced.`, 'ok');
  } else {
    appendLog(`[${time}] IOCTL returned 0 (unexpected).`, 'err');
  }
});

appendLog('Idle. Choose a mode and press Start.');
