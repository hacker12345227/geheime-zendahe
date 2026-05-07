// =============================
// RADIO ACHTERHUUS - JS ENGINE
// =============================

// STREAM URL (verander deze!)
const streamUrl = "https://stream-url-hier.nl/stream";

// DOM ELEMENTS
const audio = document.querySelector("audio");
const trackEl = document.getElementById("track");
const onAirEl = document.querySelector(".onair");

// Zet stream in audio element
if (audio) {
  audio.src = streamUrl;
}

// =============================
// LIVE STATUS DETECTIE
// =============================

function setLiveStatus(isLive) {
  if (!onAirEl) return;

  if (isLive) {
    onAirEl.style.color = "red";
    onAirEl.innerText = "🔴 ON AIR";
  } else {
    onAirEl.style.color = "gray";
    onAirEl.innerText = "⚫ OFF AIR";
  }
}

// =============================
// STREAM CHECK (simpel)
// =============================

function checkStream() {
  if (!audio) return;

  // als stream speelt = live
  if (!audio.paused && !audio.ended && audio.currentTime > 0) {
    setLiveStatus(true);
  } else {
    setLiveStatus(false);
  }
}

// check elke 2 sec
setInterval(checkStream, 2000);

// =============================
// PLAY EVENT
// =============================

if (audio) {
  audio.addEventListener("play", () => {
    setLiveStatus(true);
  });

  audio.addEventListener("pause", () => {
    setLiveStatus(false);
  });
}

// =============================
// NOW PLAYING SIMULATIE
// (later kun je dit vervangen door echte API)
// =============================

const tracks = [
  "DJ Achterhuus - Nacht in de Schuur",
  "Piraten Hitmix 2026",
  "Achterhuus Vinyl Session",
  "Live From The Barn Studio"
];

function updateTrack() {
  if (!trackEl) return;

  const random = tracks[Math.floor(Math.random() * tracks.length)];
  trackEl.innerText = random;
}

// elke 8 sec andere track
setInterval(updateTrack, 8000);

// eerste init
updateTrack();

// =============================
// START STATUS
// =============================
setLiveStatus(false);
