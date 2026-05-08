/* =========================
   RADIO ACHTERHUUS - APP.JS
========================= */

const STREAM_URL = 'https://misty-cloud-488a.jarno-eulen12.workers.dev/';
const STATS_URL  = 'https://misty-cloud-488a.jarno-eulen12.workers.dev/stats';

/* -- State -- */
let isPlaying = false;
let isLive = false;
let barAnimFrame = null;
let barPos = 0;

/* -- Elements -- */
const audio        = document.getElementById('audio');
const playBtn      = document.getElementById('play-btn');
const playIcon     = document.getElementById('play-icon');
const playLabel    = document.getElementById('play-label');
const playerDot    = document.getElementById('player-dot');
const playerStatus = document.getElementById('player-status-text');
const playerTrack  = document.getElementById('player-track');
const playerMeta   = document.getElementById('player-meta');
const playerFill   = document.getElementById('player-bar-fill');
const topTrack     = document.getElementById('track');
const topBadge     = document.getElementById('onair-badge');
const listenerEl   = document.getElementById('listener-count');
const volumeSlider = document.getElementById('volume');

/* =========================
   PLAYER
========================= */

function togglePlay() {
  if (isPlaying) {
    pauseStream();
  } else {
    playStream();
  }
}

function playStream() {
  audio.src = STREAM_URL;
  audio.volume = parseFloat(volumeSlider.value);
  audio.load();

  setBuffering();

  audio.play().then(() => {
    setPlaying();
  }).catch(() => {
    setOffline();
  });
}

function pauseStream() {
  audio.pause();
  audio.src = '';
  setStopped();
}

function setVolume(val) {
  audio.volume = parseFloat(val);
}

/* -- Audio event listeners -- */

audio.addEventListener('playing', setPlaying);
audio.addEventListener('waiting', setBuffering);
audio.addEventListener('stalled', setBuffering);
audio.addEventListener('error',   setOffline);
audio.addEventListener('ended',   setStopped);

audio.addEventListener('pause', () => {
  if (isPlaying) setStopped();
});

/* -- State setters -- */

function setPlaying() {
  isPlaying = true;
  isLive = true;
  playBtn.classList.add('playing');
  playIcon.textContent = '■';
  playLabel.textContent = 'STOP';
  playerDot.className = 'player-live-dot';
  playerStatus.textContent = 'LIVE';
  playerMeta.textContent = 'Verbonden · Live stream';
  topBadge.className = 'onair';
  topBadge.textContent = '● LIVE';
  startBarAnimation();
}

function setBuffering() {
  playerDot.className = 'player-live-dot buffering';
  playerStatus.textContent = 'VERBINDEN...';
  playerMeta.textContent = 'Stream laden...';
  playBtn.classList.remove('playing');
  playIcon.textContent = '◌';
  playLabel.textContent = 'LADEN';
}

function setStopped() {
  isPlaying = false;
  playBtn.classList.remove('playing');
  playIcon.textContent = '▶';
  playLabel.textContent = 'AFSPELEN';
  playerDot.className = 'player-live-dot offline';
  playerStatus.textContent = 'GESTOPT';
  playerMeta.textContent = 'Klik op afspelen om te luisteren';
  stopBarAnimation();
}

function setOffline() {
  isPlaying = false;
  isLive = false;
  playBtn.classList.remove('playing');
  playIcon.textContent = '▶';
  playLabel.textContent = 'OPNIEUW';
  playerDot.className = 'player-live-dot offline';
  playerStatus.textContent = 'OFFLINE';
  playerMeta.textContent = 'Kan geen verbinding maken met de stream';
  topBadge.className = 'onair offline';
  topBadge.textContent = '○ OFFLINE';
  stopBarAnimation();
}

/* =========================
   VU BAR ANIMATION
========================= */

function startBarAnimation() {
  if (barAnimFrame) return;
  animateBar();
}

function stopBarAnimation() {
  if (barAnimFrame) {
    cancelAnimationFrame(barAnimFrame);
    barAnimFrame = null;
  }
  playerFill.style.width = '0%';
}

function animateBar() {
  barPos += 0.04;
  const wave = Math.sin(barPos) * 30 + Math.sin(barPos * 2.3) * 15 + Math.sin(barPos * 0.7) * 20;
  const pct = Math.max(5, Math.min(95, 50 + wave));
  playerFill.style.width = pct.toFixed(1) + '%';
  barAnimFrame = requestAnimationFrame(animateBar);
}

/* =========================
   NOW PLAYING — REAL ICECAST DATA
========================= */

function updateNowPlaying(title) {
  const display = title || 'Radio Achterhuus Live';
  topTrack.textContent = display;
  playerTrack.textContent = display;
}

function updateListeners(count) {
  if (count !== undefined && count !== null) {
    listenerEl.textContent = count + ' LUISTERAARS';
  }
}

async function fetchStreamMeta() {
  try {
    // Timestamp prevents browser and Worker caching
    const res = await fetch(STATS_URL + '?_=' + Date.now(), { cache: 'no-store' });

    if (!res.ok) throw new Error('Stats fetch failed: ' + res.status);

    const data = await res.json();

    const source = data?.icestats?.source;

    if (!source) {
      updateNowPlaying('Radio Achterhuus Live');
      updateListeners(0);
      return;
    }

    // If multiple mountpoints, source is an array — use the first one
    const s = Array.isArray(source) ? source[0] : source;

    // x_icy_title is where BUTT sends the track name in Icecast 2.5
    updateNowPlaying(s.metadata?.x_icy_title || s.title || s.server_name || 'Radio Achterhuus Live');

    // Listener count
    updateListeners(s.listeners ?? s.listeners_current ?? null);

  } catch (e) {
    console.warn('fetchStreamMeta error:', e);
  }
}

/* =========================
   REQUEST FORM
========================= */

function sendRequest(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const song = document.getElementById('song').value.trim();
  const msg  = document.getElementById('msg');

  msg.style.color = '#5cffaa';
  msg.textContent = '✓ BEDANKT ' + name.toUpperCase() + ' — "' + song + '" IS ONTVANGEN!';

  document.getElementById('name').value = '';
  document.getElementById('song').value = '';

  setTimeout(() => { msg.textContent = ''; }, 6000);
}

/* =========================
   INIT
========================= */

setStopped();
updateNowPlaying('Radio Achterhuus Live');

// Fetch immediately, then every 5 seconds
fetchStreamMeta();
setInterval(fetchStreamMeta, 5000);

// Expose globals used by inline HTML handlers
window.togglePlay   = togglePlay;
window.setVolume    = setVolume;
window.sendRequest  = sendRequest;
