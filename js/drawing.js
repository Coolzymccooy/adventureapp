// js/drawing.js

// Simple badge levels based on number of saved drawings
const BADGE_LEVELS = [
  { count: 1,  id: "first",   label: "First Sketch",          icon: "🖍️" },
  { count: 5,  id: "starter", label: "Creative Starter",      icon: "⭐" },
  { count: 10, id: "artist",  label: "Growing Artist",        icon: "🎨" },
  { count: 20, id: "gallery", label: "Mini Gallery Owner",    icon: "🖼️" },
  { count: 30, id: "legend",  label: "Art Legend of Tiwaton", icon: "👑" }
];

// Global drawing & Firestore-related state
let canvas, ctx;
let isDrawing = false,
  eraserMode = false,
  stickerMode = false,
  currentSticker = "";
let drawHistory = [],
  redoStack = [];
let backgroundColor = "#1a1a2e";
let mirrorMode = false;
let shapeMode = "free";
let startX = 0;
let startY = 0;

let panMode = false;
let panStartX = 0;
let panStartY = 0;
let viewOffsetX = 0;
let viewOffsetY = 0;

// Real-time counters from Firestore
let globalDrawingsCount = 0;
let lastBadgeLevelSeen = parseInt(
  localStorage.getItem("badgeLevelSeen") || "0",
  10
);

// Firestore doc ref (if db exists)
let metaDocRef = null;

function initDrawing() {
  canvas = document.getElementById("drawingBoard");
  if (!canvas) return; // not on this page
  ctx = canvas.getContext("2d");

  clearCanvas();

  // Mouse events
  canvas.addEventListener("mousedown", startPosition);
  canvas.addEventListener("mouseup", finishedPosition);
  canvas.addEventListener("mouseout", finishedPosition);
  canvas.addEventListener("mousemove", draw);

  // Touch events
  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      startPosition(e);
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", finishedPosition);
  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      draw(e);
    },
    { passive: false }
  );

  // Sticker select
  const stickerSelect = document.getElementById("stickerSelect");
  if (stickerSelect) {
    stickerSelect.addEventListener("change", function () {
      stickerMode = !!this.value;
      currentSticker = this.value;
    });
  }

  // Pan button
  const panBtn = document.getElementById("panBtn");
  if (panBtn) {
    panBtn.addEventListener("click", togglePanMode);
  }

  // Mirror checkbox
  const mirrorCheckbox = document.getElementById("mirrorMode");
  if (mirrorCheckbox) {
    mirrorCheckbox.addEventListener("change", () => {
      mirrorMode = mirrorCheckbox.checked;
    });
  }

  // Shape select
  const shapeSelect = document.getElementById("shapeMode");
  if (shapeSelect) {
    shapeSelect.addEventListener("change", () => {
      shapeMode = shapeSelect.value;
    });
  }

  // Badge popup close button
  const badgePopupClose = document.getElementById("badgePopupClose");
  if (badgePopupClose) {
    badgePopupClose.addEventListener("click", hideBadgePopup);
  }

  // Initialise UI
  renderDrawingProgress();
  initChallenges();
  initRealtimeMeta();
  renderBadges(globalDrawingsCount);
}

// Real-time Firestore subscription for global drawings + current challenge
function initRealtimeMeta() {
  if (typeof db === "undefined") return;

  metaDocRef = db.collection("artMeta").doc("global");

  metaDocRef.onSnapshot((doc) => {
    const data = doc.exists ? doc.data() : {};
    globalDrawingsCount = data.totalDrawings || 0;

    // Update challenge text from Firestore if available
    const activeText = document.getElementById("currentChallenge");
    if (activeText && data.currentChallenge) {
      activeText.textContent = data.currentChallenge;
    }

    // Update progress + badges
    renderDrawingProgress();
    renderBadges(globalDrawingsCount);
    checkForNewBadgePopup(globalDrawingsCount);
  });
}

// Update challenge for everyone
function setCurrentChallengeGlobally(text) {
  const activeText = document.getElementById("currentChallenge");
  if (activeText) {
    activeText.textContent = text;
    activeText.classList.add("challenge-pulse");
    setTimeout(() => activeText.classList.remove("challenge-pulse"), 400);
  }

  if (metaDocRef) {
    metaDocRef.set(
      {
        currentChallenge: text
      },
      { merge: true }
    );
  }
}

// Background selector
function setBackground() {
  const select = document.getElementById("bgSelect");
  if (!select || !canvas) return;
  const val = select.value;
  if (val === "sky") backgroundColor = "#7ec0ee";
  else if (val === "grass") backgroundColor = "#74d874";
  else if (val === "underwater") backgroundColor = "#1090e0";
  else backgroundColor = "#1a1a2e";
  clearCanvas();
}

// Clear canvas + record history
function clearCanvas() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  saveHistory();
}

function startPosition(e) {
  if (!ctx || !canvas) return;

  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  // Pan mode: start dragging the image, don’t draw
  if (panMode) {
    panStartX = x;
    panStartY = y;
    isDrawing = true;
    return;
  }

  isDrawing = true;
  saveHistory();

  startX = x;
  startY = y;

  // set opacity from slider on every stroke
  const opacityEl = document.getElementById("brushOpacity");
  const opacity = opacityEl ? parseFloat(opacityEl.value) : 1;
  ctx.globalAlpha = opacity;

  if (shapeMode === "free") {
    draw(e); // start freehand immediately
  }
}

function finishedPosition() {
  if (!ctx) return;

  // If we were panning, just stop here
  if (panMode) {
    isDrawing = false;
    return;
  }

  // Shape tools: keep the last preview as final and store it
  if (shapeMode !== "free" && isDrawing) {
    saveHistory();
  }

  isDrawing = false;
  ctx.beginPath();
  ctx.globalAlpha = 1;
}

function draw(e) {
  if (!ctx || !canvas) return;

  const brushTypeEl = document.getElementById("brushType");
  const colorEl = document.getElementById("brushColor");
  const sizeEl = document.getElementById("brushSize");
  const opacityEl = document.getElementById("brushOpacity");

  if (!brushTypeEl || !colorEl || !sizeEl) return;

  const brushType = brushTypeEl.value;
  const baseColor = eraserMode ? backgroundColor : colorEl.value;
  const size = parseInt(sizeEl.value, 10);
  const opacity = opacityEl ? parseFloat(opacityEl.value) : 1;

  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  // Pan mode: drag the current image
  if (panMode && isDrawing) {
    const dx = x - panStartX;
    const dy = y - panStartY;
    panStartX = x;
    panStartY = y;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      viewOffsetX += dx;
      viewOffsetY += dy;
      ctx.drawImage(img, viewOffsetX, viewOffsetY);
    };
    img.src = canvas.toDataURL();
    return;
  }

  // Stickers
  if (stickerMode && currentSticker) {
    ctx.font = `${size * 5}px serif`;
    ctx.textAlign = "center";
    ctx.globalAlpha = opacity;
    ctx.fillText(currentSticker, x, y);
    ctx.globalAlpha = 1;
    stickerMode = false;
    const stickerSelect = document.getElementById("stickerSelect");
    if (stickerSelect) stickerSelect.value = "";
    return;
  }

  if (!isDrawing) return;

  // Shape tools: re-draw from last saved image and preview
  if (shapeMode !== "free") {
    if (drawHistory.length) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        previewShape(x, y, baseColor, size, opacity);
      };
      img.src = drawHistory[drawHistory.length - 1];
    } else {
      clearCanvas();
      previewShape(x, y, baseColor, size, opacity);
    }
    return;
  }

  // Freehand drawing
  ctx.globalAlpha = opacity;

  if (brushType === "normal" || brushType === "chalk" || brushType === "rainbow") {
    ctx.lineWidth = size;
    ctx.lineCap = "round";
  }

  const doStroke = (sx, sy, color) => {
    if (brushType === "normal" || brushType === "chalk") {
      ctx.strokeStyle = color;
      if (brushType === "chalk") ctx.globalAlpha = opacity * 0.5;
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx, sy);
    } else if (brushType === "rainbow") {
      ctx.strokeStyle =
        "hsl(" + Math.floor(Math.random() * 360) + ",90%,70%)";
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx, sy);
    } else if (brushType === "spray") {
      for (let i = 0; i < 12; i++) {
        const ang = Math.random() * 2 * Math.PI;
        const rad = Math.random() * size;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity * 0.33;
        ctx.beginPath();
        ctx.arc(
          sx + Math.cos(ang) * rad,
          sy + Math.sin(ang) * rad,
          size / 4,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    } else if (brushType === "stars") {
      drawStar(ctx, sx, sy, 8, size * 2, size, color);
    }
  };

  // main stroke
  doStroke(x, y, baseColor);

  // mirror stroke (horizontally mirrored across vertical center)
  if (mirrorMode) {
    const mirrorX = canvas.width - x;
    doStroke(mirrorX, y, baseColor);
  }

  ctx.globalAlpha = 1;
}

function toggleEraser() {
  eraserMode = !eraserMode;
  const btn = document.getElementById("eraserBtn");
  if (btn) btn.textContent = eraserMode ? "Eraser ON" : "✏️ Eraser OFF";
  if (canvas) canvas.classList.toggle("eraser-cursor", eraserMode);
}

function togglePanMode() {
  panMode = !panMode;
  const panBtn = document.getElementById("panBtn");
  if (panBtn) panBtn.textContent = panMode ? "🤚 Pan ON" : "🤚 Pan OFF";

  // turn off drawing when panning
  if (panMode) {
    eraserMode = false;
    const eraserBtn = document.getElementById("eraserBtn");
    if (eraserBtn) eraserBtn.textContent = "✏️ Eraser OFF";
    if (canvas) {
      canvas.classList.remove("eraser-cursor");
      canvas.classList.add("hand-cursor");
    }
  } else if (canvas) {
    canvas.classList.remove("hand-cursor");
  }
}

function fillCanvas() {
  if (!ctx || !canvas) return;
  const colorEl = document.getElementById("brushColor");
  if (!colorEl) return;
  ctx.fillStyle = colorEl.value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  saveHistory();
}

// Surprise colour button
function randomColor() {
  const colorEl = document.getElementById("brushColor");
  if (!colorEl) return;
  const random =
    "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  colorEl.value = random;
}

function drawStar(ctx, x, y, points, outer, inner, color) {
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.moveTo(0, 0 - outer);
  for (let i = 0; i < points; i++) {
    ctx.rotate(Math.PI / points);
    ctx.lineTo(0, 0 - inner);
    ctx.rotate(Math.PI / points);
    ctx.lineTo(0, 0 - outer);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.92;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// History (undo / redo)
function saveHistory() {
  if (!canvas) return;
  drawHistory.push(canvas.toDataURL());
  if (drawHistory.length > 25) drawHistory.shift();
  redoStack = [];
}

function undoDrawing() {
  if (!ctx || !canvas) return;
  if (drawHistory.length > 1) {
    redoStack.push(drawHistory.pop());
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = drawHistory[drawHistory.length - 1];
  }
}

function redoDrawing() {
  if (!ctx || !canvas) return;
  if (redoStack.length) {
    const imgSrc = redoStack.pop();
    drawHistory.push(imgSrc);
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = imgSrc;
  }
}

// Saving + download
function saveDrawing() {
  if (!canvas) return;
  const dataURL = canvas.toDataURL();
  const nameInput = document.getElementById("drawingName");
  const container = document.getElementById("savedDrawings");
  if (!nameInput || !container) return;

  const name =
    nameInput.value.trim() || "Drawing " + (container.children.length + 1);

  const wrapper = document.createElement("div");
  wrapper.classList.add("saved-drawing");

  const img = document.createElement("img");
  img.src = dataURL;
  img.alt = name;

  const caption = document.createElement("div");
  caption.className = "saved-drawing-name";
  caption.textContent = name;

  wrapper.appendChild(img);
  wrapper.appendChild(caption);
  container.appendChild(wrapper);

  nameInput.value = "";
  clearCanvas();

  // Increment global drawing counter for everyone
  incrementDrawingCount();
}

function downloadDrawing() {
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "tiwaton_drawing.png";
  link.href = canvas.toDataURL();
  link.click();
}

// Increment global drawing count in Firestore
function incrementDrawingCount() {
  if (!metaDocRef) return;
  metaDocRef.set(
    {
      totalDrawings: firebase.firestore.FieldValue.increment(1)
    },
    { merge: true }
  );
}

// Progress + badges
function renderDrawingProgress() {
  const el = document.querySelector("#Drawing .progress-content");
  if (!el) return;
  const count = globalDrawingsCount || 0;
  let msg = `Total drawings saved (family): <b>${count}</b> <br>`;
  msg +=
    count >= 5
      ? "🟢 Goal reached: 5 drawings!"
      : "Draw 5 pictures to reach your goal!";
  el.innerHTML = msg;
}

function renderBadges(count) {
  const strip = document.getElementById("badgeStrip");
  if (!strip) return;
  strip.innerHTML = "";

  BADGE_LEVELS.forEach((level) => {
    const badge = document.createElement("div");
    const earned = count >= level.count;
    badge.className = "badge " + (earned ? "badge-earned" : "badge-locked");

    badge.innerHTML = `
      <div class="badge-icon">${level.icon}</div>
      <div class="badge-label">${level.label}</div>
      <div class="badge-count">${level.count} drawing${level.count === 1 ? "" : "s"}</div>
    `;

    strip.appendChild(badge);
  });
}

// Badge popup logic
function checkForNewBadgePopup(count) {
  // highest badge level that is now earned
  const earnedLevels = BADGE_LEVELS.filter((l) => l.count <= count);
  if (!earnedLevels.length) return;
  const highestEarned = earnedLevels[earnedLevels.length - 1];

  if (highestEarned.count > lastBadgeLevelSeen) {
    showBadgePopup(highestEarned);
    lastBadgeLevelSeen = highestEarned.count;
    localStorage.setItem("badgeLevelSeen", String(lastBadgeLevelSeen));
  }
}

function showBadgePopup(level) {
  const popup = document.getElementById("badgePopup");
  const labelEl = document.getElementById("badgePopupLabel");
  const iconEl = document.getElementById("badgePopupIcon");
  if (!popup || !labelEl || !iconEl) return;

  iconEl.textContent = level.icon;
  labelEl.textContent = `${level.label} — ${level.count} drawings!`;

  popup.classList.remove("hidden");
  popup.classList.add("show");
}

function hideBadgePopup() {
  const popup = document.getElementById("badgePopup");
  if (!popup) return;
  popup.classList.remove("show");
  popup.classList.add("hidden");
}

// Shape preview
function previewShape(x, y, color, size, opacity) {
  if (!ctx || !canvas) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.globalAlpha = opacity;
  ctx.beginPath();

  if (shapeMode === "line") {
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
  } else if (shapeMode === "rect") {
    const w = x - startX;
    const h = y - startY;
    ctx.rect(startX, startY, w, h);
  } else if (shapeMode === "circle") {
    const dx = x - startX;
    const dy = y - startY;
    const r = Math.sqrt(dx * dx + dy * dy);
    ctx.arc(startX, startY, r, 0, 2 * Math.PI);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Challenges: button -> global challenge text
function initChallenges() {
  const buttons = document.querySelectorAll(".challenge-btn");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-challenge") || btn.textContent;
      setCurrentChallengeGlobally(text);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initDrawing();
});
