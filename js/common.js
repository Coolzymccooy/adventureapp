// js/common.js

// ===============================
// 1. Simple in-page comments (optional)
// ===============================
// If you're fully using js/comments.js for parent comments,
// you can safely delete this whole block.
let comments = {};

function addComment(btn) {
  const tab = btn.closest(".tabcontent");
  if (!tab) return;

  const tabName = tab.id;
  comments[tabName] = comments[tabName] || [];

  const textarea = btn.parentElement.querySelector(".comment-input");
  if (!textarea) return;

  const text = textarea.value.trim();
  if (!text) return;

  comments[tabName].push(text);
  textarea.value = "";
  renderComments(tabName, btn.parentElement.querySelector(".comments-list"));
}

function renderComments(tabName, listEl) {
  if (!listEl) return;
  listEl.innerHTML = "";
  (comments[tabName] || []).forEach((c) => {
    const d = document.createElement("div");
    d.className = "comment";
    d.textContent = c;
    listEl.appendChild(d);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".tabcontent").forEach((tab) => {
    const section = tab.querySelector(".comments-section");
    if (section) {
      renderComments(tab.id, section.querySelector(".comments-list"));
    }
  });
});

// ===============================
// 2. Footer helpers
// ===============================
(function () {
  const yearSpan = document.getElementById("footerYear");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const funLines = [
    "If laughter had XP, your family would be level 99.",
    "Reminder: snacks are scientifically proven to improve game performance.",
    "Breaking news: your sofa is now officially a family HQ.",
    "Plot twist: the real treasure was the time you spent together.",
    "Warning: using this app may cause sudden bursts of joy.",
    "Pro tip: high-fives are 100% renewable energy.",
    "Fun fact: families who play together also argue over the remote together.",
    "Loading extra silliness… please do not turn off the children."
  ];

  const funEl = document.getElementById("footerFunLine");
  if (!funEl) return;

  function setRandomFooterLine() {
    const line = funLines[Math.floor(Math.random() * funLines.length)];
    funEl.textContent = line;
  }

  setRandomFooterLine();
  setInterval(setRandomFooterLine, 12000);
})();

// ===============================
// 3. Global family profile helpers
// ===============================
const FAMILY_CODE_KEY = "tiwaton_family_code";
const CHILD_NAME_KEY = "tiwaton_child_name";

// ---- storage: family code + child name ----
function setGlobalFamilyCode(code) {
  const clean = (code || "").trim().toUpperCase();
  if (!clean) return;
  localStorage.setItem(FAMILY_CODE_KEY, clean);
}

function getGlobalFamilyCode() {
  return (localStorage.getItem(FAMILY_CODE_KEY) || "").toUpperCase();
}

function setGlobalChildName(name) {
  const clean = (name || "").trim();
  if (!clean) return;
  localStorage.setItem(CHILD_NAME_KEY, clean);
}

function getGlobalChildName() {
  return (localStorage.getItem(CHILD_NAME_KEY) || "").trim();
}

// ---- bind inputs on any page ----
function bindFamilyInputs() {
  const familyInput = document.getElementById("familyCode");
  const childInput = document.getElementById("childName");

  const storedCode = getGlobalFamilyCode();
  if (familyInput) {
    if (!familyInput.value && storedCode) {
      familyInput.value = storedCode;
    }
    ["change", "blur", "keyup"].forEach((evt) => {
      familyInput.addEventListener(evt, () => {
        if (familyInput.value.trim()) {
          setGlobalFamilyCode(familyInput.value);
        }
      });
    });
  }

  const storedChild = getGlobalChildName();
  if (childInput) {
    if (!childInput.value && storedChild) {
      childInput.value = storedChild;
    }
    ["change", "blur", "keyup"].forEach((evt) => {
      childInput.addEventListener(evt, () => {
        if (childInput.value.trim()) {
          setGlobalChildName(childInput.value);
        }
      });
    });
  }
}

function getCurrentFamilyCode() {
  const input = document.getElementById("familyCode");
  const fromInput = input ? input.value.trim().toUpperCase() : "";
  const fromStorage = getGlobalFamilyCode();
  return fromInput || fromStorage || "GLOBAL";
}

function getCurrentChildName() {
  const input = document.getElementById("childName");
  const fromInput = input ? input.value.trim() : "";
  const fromStorage = getGlobalChildName();
  return fromInput || fromStorage || "Little Artist";
}

// ---- Firestore helpers ----
function getFirestore() {
  return typeof window !== "undefined" && window.db ? window.db : null;
}

function updateFamilyMetric(metricName, delta) {
  const db = getFirestore();
  if (!db) return;

  const familyCode = getCurrentFamilyCode();
  if (!familyCode) return;

  const docRef = db.collection("families").doc(familyCode);

  const update = {
    code: familyCode,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  update[metricName] = firebase.firestore.FieldValue.increment(delta);

  docRef.set(update, { merge: true });
}

function subscribeToFamilyMetrics(onChange) {
  const db = getFirestore();
  if (!db || typeof onChange !== "function") return null;

  const familyCode = getCurrentFamilyCode();
  if (!familyCode) return null;

  return db
    .collection("families")
    .doc(familyCode)
    .onSnapshot((doc) => {
      const data = doc.exists ? doc.data() : { code: familyCode };
      onChange(data);
    });
}

// ---- gate: require family code (except index + shared drawing links) ----
function enforceFamilyCodeGate() {
  const params = new URLSearchParams(window.location.search);
  const hasSharedDrawing = params.has("drawingId");
  const path = window.location.pathname.toLowerCase();

  if (path.endsWith("index.html") || path === "/" || hasSharedDrawing) return;

  const code = getGlobalFamilyCode();
  if (!code) {
    window.location.href = "index.html";
  }
}

// ---- index dashboard widget (if present) ----
function initFamilyDashboardWidget() {
  const codeEl = document.getElementById("fdFamilyCode");
  const storiesEl = document.getElementById("fdStories");
  const drawingsEl = document.getElementById("fdDrawings");
  const activitiesEl = document.getElementById("fdActivities");
  const gamesEl = document.getElementById("fdGames");
  const updatedEl = document.getElementById("fdLastUpdated");

  if (!codeEl || !storiesEl || !drawingsEl || !activitiesEl || !gamesEl || !updatedEl) {
    // Widget not on this page
    return;
  }

  if (typeof subscribeToFamilyMetrics !== "function") return;

  subscribeToFamilyMetrics((metrics) => {
    const code = metrics.code || getGlobalFamilyCode() || "—";
    codeEl.textContent = "Code: " + code;

    storiesEl.textContent = metrics.storiesCount || 0;
    drawingsEl.textContent = metrics.drawingsCount || 0;
    activitiesEl.textContent = metrics.activitiesCount || 0;
    gamesEl.textContent = metrics.gamesCount || 0;

    const ts = metrics.updatedAt && metrics.updatedAt.toDate
      ? metrics.updatedAt.toDate()
      : new Date();
    updatedEl.textContent = "Last updated: " + ts.toLocaleString();
  });
}

// ---- DOMContentLoaded hook ----
document.addEventListener("DOMContentLoaded", function () {
  bindFamilyInputs();
  // enforceFamilyCodeGate(); // 🔒 temporarily disabled so navigation works
  initFamilyDashboardWidget();
});

