/* =========================
   RADIO ACHTERHUUS - APP.JS
========================= */

const STREAM_URL = 'https://misty-cloud-488a.jarno-eulen12.workers.dev/';

// Replace with your actual Icecast/Shoutcast stats URL, e.g.:
// const STATS_URL = 'https://stream-url-hier.nl/status-json.xsl';
const STATS_URL = null;

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
  // Re-set src to force fresh connect
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
  // Simulate a VU-meter style pulsing bar
  barPos += 0.04;
  const wave = Math.sin(barPos) * 30 + Math.sin(barPos * 2.3) * 15 + Math.sin(barPos * 0.7) * 20;
  const pct = Math.max(5, Math.min(95, 50 + wave));
  playerFill.style.width = pct.toFixed(1) + '%';
  barAnimFrame = requestAnimationFrame(animateBar);
}

/* =========================
   NOW PLAYING SIMULATION
   Replace with real Icecast/Shoutcast metadata fetch
========================= */

const fakeTracks = [
  'DJ Achterhoek – Nacht in de Schuur',
  'Piraten Hitmix 2026',
  'Live Vinyl Session',
  'Achterhuus Classics',
  'Feestmix Drenthe',
  'Zondagochtend Session',
  'Achterhoek After Hours'
];

function updateNowPlaying(title) {
  const display = title || 'Radio Achterhuus Live';
  topTrack.textContent = display;
  playerTrack.textContent = display;
}

async function fetchStreamMeta() {
  if (!STATS_URL) {
    // Simulate rotation when no stats URL configured
    const track = fakeTracks[Math.floor(Math.random() * fakeTracks.length)];
    updateNowPlaying(track);
    return;
  }

  try {
    const res = await fetch(STATS_URL, { cache: 'no-store' });
    const data = await res.json();

    // Icecast JSON format
    const source = data?.icestats?.source;
    if (source) {
      const s = Array.isArray(source) ? source[0] : source;
      updateNowPlaying(s.title || s.stream_start || 'Live');
      if (s.listeners !== undefined) {
        listenerEl.textContent = s.listeners + ' LUISTERAARS';
      }
    }
  } catch (e) {
    // Silently fall back
    const track = fakeTracks[Math.floor(Math.random() * fakeTracks.length)];
    updateNowPlaying(track);
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

  // Optional: send to a backend endpoint
  // fetch('/request', { method: 'POST', body: JSON.stringify({ name, song }) });

  setTimeout(() => { msg.textContent = ''; }, 6000);
}

/* =========================
   INIT
========================= */

// Initial state
setStopped();
updateNowPlaying(fakeTracks[0]);

// Poll for now playing every 10s
fetchStreamMeta();
setInterval(fetchStreamMeta, 10000);

// Expose globals used by inline HTML handlers
window.togglePlay   = togglePlay;
window.setVolume    = setVolume;
window.sendRequest  = sendRequest;
