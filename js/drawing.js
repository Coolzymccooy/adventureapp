// js/drawing.js

// ------------------------------
// 0. Badge levels
// ------------------------------
const BADGE_LEVELS = [
  { count: 1,  id: "first",   label: "First Sketch",          icon: "🖍️" },
  { count: 5,  id: "starter", label: "Creative Starter",      icon: "⭐" },
  { count: 10, id: "artist",  label: "Growing Artist",        icon: "🎨" },
  { count: 20, id: "gallery", label: "Mini Gallery Owner",    icon: "🖼️" },
  { count: 30, id: "legend",  label: "Art Legend of Tiwaton", icon: "👑" }
];

// ------------------------------
// 1. Canvas state
// ------------------------------
let canvas, ctx;
let isDrawing = false;
let eraserMode = false;
let stickerMode = false;
let currentSticker = "";
let drawHistory = [];
let redoStack = [];
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

// Family + gallery state
let familyCodeInput = null;
let childNameInput = null;
let galleryUnsubscribe = null;

// Meta / badge state
let globalDrawingsCount = 0;
let lastBadgeLevelSeen = parseInt(
  localStorage.getItem("badgeLevelSeen") || "0",
  10
);
let metaDocRef = null;

// ------------------------------
// 2. Helpers: family / child
// ------------------------------
function getFamilyCode() {
  if (!familyCodeInput) return "GLOBAL";
  const val = (familyCodeInput.value || "").trim().toUpperCase();
  return val || "GLOBAL";
}

function getChildName() {
  if (!childNameInput) return "Little Artist";
  const val = (childNameInput.value || "").trim();
  return val || "Little Artist";
}

// ------------------------------
// 3. Canvas sizing + init
// ------------------------------
function syncCanvasSizeToDisplay() {
  if (!canvas) return;
  const width = canvas.clientWidth || canvas.offsetWidth || 600;
  const height = canvas.clientHeight || canvas.offsetHeight || 400;
  canvas.width = width;
  canvas.height = height;
}

function initDrawing() {
  // support both "drawingBoard" (your HTML) and "drawingCanvas" (earlier version)
  canvas =
    document.getElementById("drawingBoard") ||
    document.getElementById("drawingCanvas");
  if (!canvas) return;

  ctx = canvas.getContext("2d");

  familyCodeInput = document.getElementById("familyCode") || null;
  childNameInput = document.getElementById("childName") || null;

  syncCanvasSizeToDisplay();
  clearCanvas();

  // Mouse
  canvas.addEventListener("mousedown", startPosition);
  canvas.addEventListener("mouseup", finishedPosition);
  canvas.addEventListener("mouseout", finishedPosition);
  canvas.addEventListener("mousemove", draw);

  // Touch
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

  // Mirror
  const mirrorCheckbox = document.getElementById("mirrorMode");
  if (mirrorCheckbox) {
    mirrorCheckbox.addEventListener("change", () => {
      mirrorMode = mirrorCheckbox.checked;
    });
  }

  // Shape
  const shapeSelect = document.getElementById("shapeMode");
  if (shapeSelect) {
    shapeSelect.addEventListener("change", () => {
      shapeMode = shapeSelect.value;
    });
  }

  // Badge popup
  const badgePopupClose = document.getElementById("badgePopupClose");
  if (badgePopupClose) {
    badgePopupClose.addEventListener("click", hideBadgePopup);
  }

  // Export PNG button (from HTML)
  const exportPngBtn = document.getElementById("exportPngBtn");
  if (exportPngBtn) {
    exportPngBtn.addEventListener("click", downloadDrawing);
  }

  // “Save to cloud” meta button wired in HTML via onclick="saveDrawing()"
  // so we don't rewire it here.

  // Resize handling – keep board in sync with layout
  window.addEventListener("resize", () => {
    if (!canvas || !ctx) return;
    const currentImage = canvas.toDataURL();
    syncCanvasSizeToDisplay();
    clearCanvas();
    if (currentImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = currentImage;
    }
  });

  // When family code changes, refilter gallery
  if (familyCodeInput) {
    ["change", "blur", "keyup"].forEach((evt) => {
      familyCodeInput.addEventListener(evt, () => {
        subscribeDrawingGalleryToFamily(getFamilyCode());
      });
    });
  }

  renderDrawingProgress();
  initChallenges();
  initRealtimeMeta();
  renderBadges(globalDrawingsCount);
}

// ------------------------------
// 4. Real-time meta (badges + mission text)
// ------------------------------
function initRealtimeMeta() {
  if (typeof window.db === "undefined") return;

  const firestore = window.db;
  metaDocRef = firestore.collection("artMeta").doc("global");

  metaDocRef.onSnapshot((doc) => {
    const data = doc.exists ? doc.data() : {};
    globalDrawingsCount = data.totalDrawings || 0;

    const activeText = document.getElementById("currentChallenge");
    if (activeText && data.currentChallenge) {
      activeText.textContent = data.currentChallenge;
    }

    renderDrawingProgress();
    renderBadges(globalDrawingsCount);
    checkForNewBadgePopup(globalDrawingsCount);
  });
}

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

// ------------------------------
// 5. Background + clear
// ------------------------------
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

function clearCanvas() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  saveHistory();
}

// ------------------------------
// 6. Pointer helpers + drawing
// ------------------------------
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function startPosition(e) {
  if (!ctx || !canvas) return;
  const pos = getCanvasPos(e);

  if (panMode) {
    panStartX = pos.x;
    panStartY = pos.y;
    isDrawing = true;
    return;
  }

  isDrawing = true;
  saveHistory();

  startX = pos.x;
  startY = pos.y;

  const opacityEl = document.getElementById("brushOpacity");
  const opacity = opacityEl ? parseFloat(opacityEl.value) : 1;
  ctx.globalAlpha = opacity;

  if (shapeMode === "free") {
    draw(e);
  }
}

function finishedPosition() {
  if (!ctx) return;

  if (panMode) {
    isDrawing = false;
    return;
  }

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

  const pos = getCanvasPos(e);
  const x = pos.x;
  const y = pos.y;

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
    ctx.font = size * 5 + "px serif";
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

  // Shape tools: re-draw last saved image then preview shape
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
  ctx.lineJoin = "round";

  if (
    brushType === "normal" ||
    brushType === "chalk" ||
    brushType === "rainbow"
  ) {
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

  // mirror stroke (horizontally mirrored)
  if (mirrorMode) {
    const mirrorX = canvas.width - x;
    doStroke(mirrorX, y, baseColor);
  }

  ctx.globalAlpha = 1;
}

// ------------------------------
// 7. Eraser / pan / fill / colour
// ------------------------------
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

// ------------------------------
// 8. History (undo / redo)
// ------------------------------
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

// ------------------------------
// 9. Save drawing + PNG export + cloud + share link
// ------------------------------
function saveDrawing() {
  if (!canvas) return;

  const dataURL = canvas.toDataURL("image/png");
  const nameInput = document.getElementById("drawingName");
  const container = document.getElementById("savedDrawings");
  const parentCommentInput = document.getElementById("parentComment");

  if (!nameInput || !container) return;

  const name =
    nameInput.value.trim() || "Drawing " + (container.children.length + 1);
  const parentComment = parentCommentInput
    ? parentCommentInput.value.trim()
    : "";
  const familyCode = getFamilyCode();
  const childName = getChildName();

  // 1) local UI
  const wrapper = document.createElement("div");
  wrapper.classList.add("saved-drawing");

  const img = document.createElement("img");
  img.src = dataURL;
  img.alt = name;

  const caption = document.createElement("div");
  caption.className = "saved-drawing-name";
  caption.textContent = (childName ? childName + " – " : "") + name;

  wrapper.appendChild(img);
  wrapper.appendChild(caption);

  if (parentComment) {
    const commentEl = document.createElement("div");
    commentEl.className = "saved-drawing-comment";
    commentEl.textContent = parentComment;
    wrapper.appendChild(commentEl);
  }

  container.appendChild(wrapper);

  nameInput.value = "";
  // if you want to clear comment each time, uncomment:
  // if (parentCommentInput) parentCommentInput.value = "";

  if (typeof renderDrawingProgress === "function") {
    renderDrawingProgress();
  }

  // 2) Firestore (cloud)
  const firestore = typeof window.db !== "undefined" ? window.db : null;
  if (firestore) {
    firestore
      .collection("familyDrawings")
      .add({
        name: name,
        dataURL: dataURL,
        parentComment: parentComment || null,
        familyCode: familyCode,
        childName: childName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then((docRef) => {
        console.log("Saved drawing to Firestore with id:", docRef.id);
        incrementDrawingCount();
        // auto-refresh gallery for this family
        subscribeDrawingGalleryToFamily(familyCode);
      })
      .catch((err) => {
        console.error("Failed to save drawing:", err);
      });
  }
}

function downloadDrawing() {
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "tiwaton_drawing.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function loadDrawingOnCanvas(imageData) {
  if (!canvas || !ctx) return;
  const img = new Image();
  img.onload = () => {
    syncCanvasSizeToDisplay();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = imageData;
}

function copyShareLink(docId, familyCode) {
  const url =
    window.location.origin +
    window.location.pathname +
    "?drawingId=" +
    encodeURIComponent(docId) +
    "&family=" +
    encodeURIComponent(familyCode || "");
  navigator.clipboard
    .writeText(url)
    .then(() => alert("Share link copied! You can send this to anyone."))
    .catch(() =>
      alert("Could not copy link, please copy manually: " + url)
    );
}

// When someone opens a ?drawingId=... link
async function loadSharedDrawingIfNeeded() {
  const params = new URLSearchParams(window.location.search);
  const drawingId = params.get("drawingId");
  const family = params.get("family");

  if (!drawingId) return;

  const firestore = typeof window.db !== "undefined" ? window.db : null;
  if (!firestore) return;

  try {
    const doc = await firestore.collection("familyDrawings").doc(drawingId).get();
    if (!doc.exists) {
      alert("This drawing link is no longer available.");
      return;
    }
    const data = doc.data() || {};

    if (familyCodeInput) {
      familyCodeInput.value = family || data.familyCode || "";
    }
    if (childNameInput && data.childName) {
      childNameInput.value = data.childName;
    }
    const parentCommentInput = document.getElementById("parentComment");
    if (parentCommentInput && data.parentComment) {
      parentCommentInput.value = data.parentComment;
    }

    loadDrawingOnCanvas(data.dataURL);
    subscribeDrawingGalleryToFamily(data.familyCode || getFamilyCode());
  } catch (err) {
    console.error(err);
    alert("Error loading shared drawing.");
  }
}

function incrementDrawingCount() {
  if (!metaDocRef) return;
  metaDocRef.set(
    {
      totalDrawings: firebase.firestore.FieldValue.increment(1)
    },
    { merge: true }
  );
}

// ------------------------------
// 10. Progress + badges
// ------------------------------
function renderDrawingProgress() {
  const el = document.querySelector("#Drawing .progress-content");
  if (!el) return;
  const count = globalDrawingsCount || 0;
  let msg = "Total drawings saved (family): <b>" + count + "</b> <br>";
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
    const earned = count >= level.count;
    const badge = document.createElement("div");
    badge.className = "badge " + (earned ? "badge-earned" : "badge-locked");

    badge.innerHTML =
      '<div class="badge-icon">' +
      level.icon +
      "</div>" +
      '<div class="badge-label">' +
      level.label +
      "</div>" +
      '<div class="badge-count">' +
      level.count +
      " drawing" +
      (level.count === 1 ? "" : "s") +
      "</div>";

    strip.appendChild(badge);
  });
}

function checkForNewBadgePopup(count) {
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
  labelEl.textContent = level.label + " — " + level.count + " drawings!";

  popup.classList.remove("hidden");
  popup.classList.add("show");
}

function hideBadgePopup() {
  const popup = document.getElementById("badgePopup");
  if (!popup) return;
  popup.classList.remove("show");
  popup.classList.add("hidden");
}

// ------------------------------
// 11. Shape preview
// ------------------------------
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

// ------------------------------
// 12. Challenges
// ------------------------------
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

// ------------------------------
// 13. Family-aware realtime gallery
// ------------------------------
function subscribeDrawingGalleryToFamily(code) {
  const container = document.getElementById("savedDrawings");
  const firestore = typeof window.db !== "undefined" ? window.db : null;
  if (!container || !firestore) return;

  if (galleryUnsubscribe) {
    galleryUnsubscribe();
    galleryUnsubscribe = null;
  }

  let query = firestore.collection("familyDrawings");
  const familyCode = (code || "").toUpperCase();
  if (familyCode && familyCode !== "GLOBAL") {
    query = query.where("familyCode", "==", familyCode);
  }

  query = query.orderBy("createdAt", "asc");

  galleryUnsubscribe = query.onSnapshot((snapshot) => {
    container.innerHTML = "";

    if (snapshot.empty) {
      const p = document.createElement("p");
      p.textContent =
        "No drawings yet for this family. Save one to get started!";
      container.appendChild(p);
      if (typeof renderDrawingProgress === "function") {
        renderDrawingProgress();
      }
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      if (!data.dataURL) return;

      const name = data.name || "Family drawing";
      const parentComment = data.parentComment || "";
      const childName = data.childName || "Little Artist";
      const familyCodeValue = data.familyCode || "GLOBAL";

      const wrapper = document.createElement("div");
      wrapper.classList.add("saved-drawing");

      const img = document.createElement("img");
      img.src = data.dataURL;
      img.alt = name;

      const caption = document.createElement("div");
      caption.className = "saved-drawing-name";
      caption.textContent = childName + " – " + name;

      wrapper.appendChild(img);
      wrapper.appendChild(caption);

      if (parentComment) {
        const commentEl = document.createElement("div");
        commentEl.className = "saved-drawing-comment";
        commentEl.textContent = parentComment;
        wrapper.appendChild(commentEl);
      }

      const actions = document.createElement("div");
      actions.className = "saved-drawing-actions";

      const loadBtn = document.createElement("button");
      loadBtn.type = "button";
      loadBtn.textContent = "Load on Board";
      loadBtn.addEventListener("click", () => loadDrawingOnCanvas(data.dataURL));

      const shareBtn = document.createElement("button");
      shareBtn.type = "button";
      shareBtn.textContent = "Copy Share Link";
      shareBtn.addEventListener("click", () =>
        copyShareLink(doc.id, familyCodeValue)
      );

      actions.appendChild(loadBtn);
      actions.appendChild(shareBtn);
      wrapper.appendChild(actions);

      container.appendChild(wrapper);
    });

    if (typeof renderDrawingProgress === "function") {
      renderDrawingProgress();
    }
  });
}

function initDrawingRealtimeGallery() {
  subscribeDrawingGalleryToFamily(getFamilyCode());
}

// ------------------------------
// 14. Bootstrap
// ------------------------------
document.addEventListener("DOMContentLoaded", function () {
  initDrawing();
  initDrawingRealtimeGallery();
  loadSharedDrawingIfNeeded();
});
