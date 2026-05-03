const btnRecord = document.getElementById('btnRecord') as HTMLButtonElement;
const btnStop = document.getElementById('btnStop') as HTMLButtonElement;
const btnReplay = document.getElementById('btnReplay') as HTMLButtonElement;
const statusEl = document.getElementById('status')!;
const statusDot = document.getElementById('statusDot')!;
const sessionList = document.getElementById('sessionList')!;

let isRecording = false;
let timer: ReturnType<typeof setInterval> | null = null;
let recordStartTime = 0;

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateStatus() {
  chrome.runtime.sendMessage({ type: 'RECORDING_STATUS' }, (res) => {
    isRecording = res?.isRecording ?? false;
    statusDot.className = isRecording ? 'dot recording' : 'dot';
    btnRecord.disabled = isRecording;
    btnStop.disabled = !isRecording;

    if (isRecording) {
      statusEl.className = 'status active';
      if (res?.session) {
        recordStartTime = res.session.startTime;
        statusEl.innerHTML = `<div>录制中</div><div class="timer">${formatDuration(Date.now() - recordStartTime)}</div>`;
        startTimer();
      }
    } else {
      statusEl.className = 'status';
      statusEl.innerHTML = '<div>就绪</div>';
      stopTimer();
    }
  });
}

function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    const timerEl = statusEl.querySelector('.timer');
    if (timerEl) {
      timerEl.textContent = formatDuration(Date.now() - recordStartTime);
    }
  }, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function loadSessions() {
  chrome.runtime.sendMessage({ type: 'GET_SESSIONS' }, (res) => {
    const sessions = res?.sessions || [];
    btnReplay.disabled = sessions.length === 0;
    sessionList.replaceChildren();

    if (sessions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = '暂无录制记录';
      sessionList.appendChild(empty);
      return;
    }

    const nodes = [...sessions]
      .reverse()
      .slice(0, 5)
      .map((s: any) => {
        const date = new Date(s.startTime).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        const duration = formatDuration(s.endTime - s.startTime);
        const errorCount = s.errors?.length || 0;
        const item = document.createElement('div');
        item.className = 'session-item';
        item.dataset.id = String(s.id || '');

        const info = document.createElement('div');
        info.className = 'info';
        info.dataset.action = 'replay';

        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = s.title || s.url || '';

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `${date} · ${duration}${errorCount > 0 ? ` · ${errorCount} 个错误` : ''}`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.dataset.action = 'delete';
        deleteBtn.dataset.id = String(s.id || '');
        deleteBtn.textContent = '×';

        info.append(title, meta);
        item.append(info, deleteBtn);
        return item;
      });

    sessionList.replaceChildren(...nodes);
  });
}

// 事件绑定
btnRecord.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'START_RECORDING' }, () => {
    updateStatus();
  });
});

btnStop.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }, () => {
    updateStatus();
    loadSessions();
  });
});

btnReplay.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_REPLAY' });
});

sessionList.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const actionEl = target.closest('[data-action]') as HTMLElement | null;
  const action = actionEl?.getAttribute('data-action');
  const sessionItem = target.closest('.session-item') as HTMLElement | null;
  const sessionId = sessionItem?.dataset.id;

  if (action === 'delete') {
    const id = (target as any).dataset.id || sessionId;
    chrome.runtime.sendMessage({ type: 'DELETE_SESSION', payload: id }, () => {
      loadSessions();
    });
  } else if (action === 'replay' && sessionId) {
    chrome.runtime.sendMessage({ type: 'OPEN_REPLAY', payload: sessionId });
  }
});

// 初始化
updateStatus();
loadSessions();
