const EMOTIONS = {
    sadness:  { color: 'var(--c-sadness)',  hex: '#5b8def', emoji: '😢' },
    joy:      { color: 'var(--c-joy)',      hex: '#ffc93c', emoji: '😄' },
    love:     { color: 'var(--c-love)',     hex: '#ff6fa8', emoji: '❤️' },
    anger:    { color: 'var(--c-anger)',    hex: '#ff5a5a', emoji: '😠' },
    fear:     { color: 'var(--c-fear)',     hex: '#a66cff', emoji: '😨' },
    suprise:  { color: 'var(--c-surprise)', hex: '#33d9c1', emoji: '😲' },
    surprise: { color: 'var(--c-surprise)', hex: '#33d9c1', emoji: '😲' },
  };

  const root = document.documentElement;
  const textInput = document.getElementById('textInput');
  const charCount = document.getElementById('charCount');
  const readBtn = document.getElementById('readBtn');
  const errorMsg = document.getElementById('errorMsg');
  const result = document.getElementById('result');
  const orb = document.getElementById('orb');
  const orbEmoji = document.getElementById('orbEmoji');
  const resultEmotion = document.getElementById('resultEmotion');
  const resultConfidence = document.getElementById('resultConfidence');
  const bars = document.getElementById('bars');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const titleAccent = document.getElementById('titleAccent');

  textInput.addEventListener('input', () => {
    charCount.textContent = textInput.value.length;
  });

  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      readBtn.click();
    }
  });

  function setAccent(hexOrVar) {
    root.style.setProperty('--accent', hexOrVar);
  }

  function checkHealth() {
    fetch('/health')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        statusText.textContent = data.model_loaded ? 'model ready' : 'model loading';
      })
      .catch(() => { statusText.textContent = 'server unreachable'; });
  }
  checkHealth();

  readBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    errorMsg.style.display = 'none';

    if (!text) {
      errorMsg.textContent = "Type something first — even one sentence works.";
      errorMsg.style.display = 'block';
      return;
    }

    readBtn.classList.add('loading');
    readBtn.disabled = true;

    try {
      const res = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      renderResult(data);
    } catch (err) {
      errorMsg.textContent = err.message.includes('fetch')
        ? "Couldn't reach the model server. Make sure it's running."
        : err.message;
      errorMsg.style.display = 'block';
    } finally {
      readBtn.classList.remove('loading');
      readBtn.disabled = false;
    }
  });

  function renderResult(data) {
    const top = data.predicted_emotion;
    const info = EMOTIONS[top] || { color: 'var(--c-neutral)', hex: '#6f6a94', emoji: '🙂' };

    setAccent(info.hex);
    orbEmoji.textContent = info.emoji;
    resultEmotion.textContent = top;
    resultConfidence.textContent = (data.confidence * 100).toFixed(1) + '% confidence';
    titleAccent.textContent = top;

    const entries = Object.entries(data.all_probabilites || {}).sort((a, b) => b[1] - a[1]);
    bars.innerHTML = '';
    entries.forEach(([name, prob], i) => {
      const e = EMOTIONS[name] || { hex: '#6f6a94', emoji: '·' };
      const pct = (prob * 100).toFixed(1);
      const rowEl = document.createElement('div');
      rowEl.className = 'bar-row';
      rowEl.innerHTML = `
        <span class="bar-emoji">${e.emoji}</span>
        <span class="bar-name">${name}</span>
        <span class="bar-track"><span class="bar-fill" style="background:${e.hex}"></span></span>
        <span class="bar-pct">${pct}%</span>
      `;
      bars.appendChild(rowEl);
      requestAnimationFrame(() => {
        setTimeout(() => {
          rowEl.querySelector('.bar-fill').style.width = pct + '%';
        }, i * 60);
      });
    });

    result.style.display = 'block';
    requestAnimationFrame(() => {
      result.style.opacity = 0;
      result.style.transition = 'opacity 0.5s ease';
      requestAnimationFrame(() => { result.style.opacity = 1; });
    });
  }
