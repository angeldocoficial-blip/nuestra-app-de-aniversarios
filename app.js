const SUPABASE_URL = "https://alxqaefujyzovvfijryr.supabase.co";
const SUPABASE_KEY = "sb_publishable_lh54bgHoeSEwxCq8H12fHA_AiQY-ybg";
const API_URL = `${SUPABASE_URL}/rest/v1/app_data`;

const defaults = {
  name1: "Angel",
  name2: "Ashley",
  anniversary: "2026-04-03",
  quote: "“Dos personas, una historia y muchos recuerdos por crear.” ❤️",
  cover: "",
  photos: [],
  letters: [],
  song: {
    name: "Perfecta",
    artist: "Miranda!",
    url: ""
  }
};

let appData = null;
let syncing = false;

function localGet() {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem("loveApp") || "{}")
    };
  } catch {
    return { ...defaults };
  }
}

function localSet(data) {
  localStorage.setItem("loveApp", JSON.stringify(data));
}

function mergeDefaults(data) {
  return {
    ...defaults,
    ...(data || {}),
    photos: Array.isArray(data?.photos) ? data.photos : [],
    letters: Array.isArray(data?.letters) ? data.letters : [],
    song: {
      ...defaults.song,
      ...(data?.song || {})
    }
  };
}

function get() {
  return appData ? mergeDefaults(appData) : localGet();
}

function set(d) {
  appData = mergeDefaults(d);
  localSet(appData);
  saveCloud(appData);
}

/* =========================
   SUPABASE
========================= */

async function cloudGet() {
  try {
    const response = await fetch(`${API_URL}?id=eq.1&select=data`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) throw new Error("No se pudo leer Supabase");

    const rows = await response.json();

    if (!rows.length) return null;

    return rows[0].data || {};
  } catch (error) {
    console.error("Error leyendo Supabase:", error);
    return null;
  }
}

async function saveCloud(data) {
  if (syncing) return;

  syncing = true;

  try {
    const response = await fetch(`${API_URL}?id=eq.1`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        data: data,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error("Error guardando en Supabase:", await response.text());
    }
  } catch (error) {
    console.error("Error de conexión:", error);
  } finally {
    syncing = false;
  }
}

async function initializeCloud() {
  const cloudData = await cloudGet();

  if (cloudData && Object.keys(cloudData).length > 0) {
    appData = mergeDefaults(cloudData);
    localSet(appData);
  } else {
    /*
      Si Supabase está vacío, conservamos los datos
      que ya estaban guardados en este dispositivo.
    */
    appData = localGet();
    await saveCloud(appData);
  }

  update();
  renderPhotos();
  renderLetters();
  renderSong();
}

/*
  Revisamos la nube periódicamente para que los cambios
  hechos desde el otro celular aparezcan automáticamente.
*/
async function syncFromCloud() {
  if (syncing) return;

  const cloudData = await cloudGet();

  if (!cloudData || Object.keys(cloudData).length === 0) return;

  const current = JSON.stringify(appData || {});
  const incoming = JSON.stringify(cloudData);

  if (current !== incoming) {
    appData = mergeDefaults(cloudData);
    localSet(appData);

    update();
    renderPhotos();
    renderLetters();
    renderSong();
  }
}

/* =========================
   ANIVERSARIO
========================= */

function monthsBetween(a, b) {
  let m =
    (b.getFullYear() - a.getFullYear()) * 12 +
    b.getMonth() -
    a.getMonth();

  if (b.getDate() < a.getDate()) m--;

  return Math.max(0, m);
}

function addMonthsClamped(date, months) {
  const day = date.getDate();
  const r = new Date(date);

  r.setDate(1);
  r.setMonth(date.getMonth() + months);

  const last = new Date(
    r.getFullYear(),
    r.getMonth() + 1,
    0
  ).getDate();

  r.setDate(Math.min(day, last));

  return r;
}

function nextDate(start, now) {
  return addMonthsClamped(
    start,
    monthsBetween(start, now) + 1
  );
}

function anniversaryLabel(months) {
  if (months % 12 === 0) {
    const y = months / 12;
    return `${y} año${y === 1 ? "" : "s"}`;
  }

  return `${months} meses`;
}

function update() {
  const d = get();

  const now = new Date();
  const start = new Date(d.anniversary + "T00:00:00");

  document.getElementById("displayName1").textContent =
    d.name1 || "Angel";

  document.getElementById("displayName2").textContent =
    d.name2 || "Ashley";

  const m = monthsBetween(start, now);
  const base = addMonthsClamped(start, m);

  const days = Math.max(
    0,
    Math.floor((now - base) / 86400000)
  );

  document.getElementById("months").textContent = m;
  document.getElementById("days").textContent = days;

  document.getElementById("sinceText").textContent =
    "Desde el " +
    start.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  const n = nextDate(start, now);

  const diff = Math.max(
    0,
    Math.ceil((n - now) / 86400000)
  );

  const nm = m + 1;

  document.getElementById("nextText").textContent =
    n.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long"
    });

  document.getElementById("countdown").textContent =
    `Su aniversario de ${anniversaryLabel(nm)} • faltan ${diff} día${diff === 1 ? "" : "s"} ❤️`;

  document.querySelector(".quote").textContent =
    d.quote || defaults.quote;

  renderCover(d.cover);

  const todayAnniversary = addMonthsClamped(start, m);

  const sameDay =
    now.getFullYear() === todayAnniversary.getFullYear() &&
    now.getMonth() === todayAnniversary.getMonth() &&
    now.getDate() === todayAnniversary.getDate() &&
    m > 0;

  const banner =
    document.getElementById("anniversaryBanner");

  banner.classList.toggle("hidden", !sameDay);

  if (sameDay) {
    document.getElementById("specialText").textContent =
      `Hoy ${d.name1} y ${d.name2} cumplen ${anniversaryLabel(m)} juntos. Gracias por seguir escribiendo esta historia. ❤️`;

    if (!sessionStorage.getItem("heartsToday")) {
      sessionStorage.setItem("heartsToday", "1");
      hearts();
    }
  }
}

function renderCover(src) {
  const el = document.getElementById("coverPhoto");

  el.innerHTML = src
    ? `<img src="${src}" alt="Foto de nosotros">`
    : "<span>♥</span>";
}

/* =========================
   NAVEGACIÓN
========================= */

function show(id) {
  document
    .querySelectorAll(".screen")
    .forEach(x => x.classList.remove("active"));

  document.getElementById(id).classList.add("active");

  window.scrollTo(0, 0);
}

function showHome() {
  update();
  show("home");
}

function showSettings() {
  const d = get();

  name1.value = d.name1;
  name2.value = d.name2;
  anniversary.value = d.anniversary;

  coupleQuote.value =
    d.quote?.replace(/^“|” ❤️$/g, "") || "";

  show("settings");
}

function saveSettings() {
  const d = get();

  d.name1 = name1.value.trim() || "Angel";
  d.name2 = name2.value.trim() || "Ashley";
  d.anniversary =
    anniversary.value || defaults.anniversary;

  d.quote = coupleQuote.value.trim()
    ? `“${coupleQuote.value.trim()}” ❤️`
    : defaults.quote;

  set(d);
  showHome();
}

function showSection(id) {
  show(id);

  if (id === "memories") renderPhotos();
  if (id === "letters") renderLetters();
  if (id === "music") renderSong();
}

/* =========================
   FOTOS
========================= */

photoInput.addEventListener(
  "change",
  async e => {
    const d = get();

    for (const file of [...e.target.files]) {
      const r = new FileReader();

      await new Promise(resolve => {
        r.onload = () => {
          d.photos.push(r.result);
          resolve();
        };

        r.readAsDataURL(file);
      });
    }

    set(d);
    renderPhotos();
    photoInput.value = "";
  }
);

function renderPhotos() {
  const g = document.getElementById("gallery");
  const d = get();

  g.innerHTML = d.photos.length
    ? d.photos
        .map(
          (p, i) =>
            `<div class="photo">
              <img src="${p}">
              <button onclick="removePhoto(${i})">×</button>
            </div>`
        )
        .join("")
    : `<div class="info" style="grid-column:1/-1;text-align:center">
        Aún no hay fotos. Agrega sus primeros recuerdos ❤️
       </div>`;
}

function removePhoto(i) {
  const d = get();

  d.photos.splice(i, 1);

  set(d);
  renderPhotos();
}

function clearPhotos() {
  if (confirm("¿Eliminar todas las fotos?")) {
    const d = get();

    d.photos = [];

    set(d);
    renderPhotos();
  }
}

/* =========================
   CARTAS
========================= */

function saveLetter() {
  const title = letterTitle.value.trim();
  const text = letterText.value.trim();

  if (!text) return;

  const d = get();

  d.letters.unshift({
    title: title || "Para ti ❤️",
    text,
    date: new Date().toLocaleDateString("es-MX")
  });

  set(d);

  letterTitle.value = "";
  letterText.value = "";

  renderLetters();
}

function renderLetters() {
  const d = get();

  document.getElementById("lettersList").innerHTML =
    d.letters.length
      ? d.letters
          .map(
            (x, i) =>
              `<article class="letter">
                <h3>${escapeHtml(x.title)}</h3>
                <p>${escapeHtml(x.text)}</p>
                <div class="date">
                  ${x.date} ·
                  <button
                    onclick="removeLetter(${i})"
                    style="border:0;background:none;color:#b64f73">
                    Eliminar
                  </button>
                </div>
              </article>`
          )
          .join("")
      : `<div class="info">
          Todavía no han escrito cartas aquí. 💌
         </div>`;
}

function removeLetter(i) {
  const d = get();

  d.letters.splice(i, 1);

  set(d);
  renderLetters();
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    m =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[m]
  );
}

/* =========================
   CANCIÓN
========================= */

function saveSong() {
  const d = get();

  d.song = {
    name: songName.value.trim(),
    artist: songArtist.value.trim(),
    url: songUrl.value.trim()
  };

  set(d);
  renderSong();
}

function renderSong() {
  const d = get();

  songName.value = d.song.name;
  songArtist.value = d.song.artist;
  songUrl.value = d.song.url;

  document.getElementById("songCard").innerHTML =
    d.song.name
      ? `<h3>🎵 ${escapeHtml(d.song.name)}</h3>
         <p class="small">
           ${escapeHtml(d.song.artist || "Nuestra canción")}
         </p>
         ${
           d.song.url
             ? `<a href="${encodeURI(
                 d.song.url
               )}" target="_blank" rel="noopener">
                  Abrir canción ♥
                </a>`
             : ""
         }`
      : `<p class="small">
           Todavía no han elegido una canción.
         </p>`;
}

/* =========================
   PORTADA
========================= */

coverInput.addEventListener("change", e => {
  const f = e.target.files[0];

  if (!f) return;

  const r = new FileReader();

  r.onload = () => {
    const d = get();

    d.cover = r.result;

    set(d);
    update();
  };

  r.readAsDataURL(f);
});

/* =========================
   CORAZONES
========================= */

function hearts() {
  for (let i = 0; i < 28; i++) {
    const h = document.createElement("span");

    h.className = "falling-heart";
    h.textContent =
      Math.random() > 0.25 ? "♥" : "♡";

    h.style.left =
      Math.random() * 100 + "%";

    h.style.animationDuration =
      3 + Math.random() * 4 + "s";

    h.style.animationDelay =
      Math.random() * 2 + "s";

    document
      .getElementById("hearts")
      .appendChild(h);

    setTimeout(
      () => h.remove(),
      7500
    );
  }
}

/* =========================
   INICIO
========================= */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .catch(() => {});
  });
}

initializeCloud();

setInterval(update, 60000);

/*
  Sincronización automática cada 5 segundos.
  Así los cambios del otro teléfono aparecen
  sin tener que cerrar la aplicación.
*/
setInterval(syncFromCloud, 5000);
