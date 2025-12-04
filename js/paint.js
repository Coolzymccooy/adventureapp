// js/paint.js
//
// Paint Studio with Template Browser
// ----------------------------------
// - Kids can pick a colouring page from a thumbnail grid
// - Or from the dropdowns on the left
// - Then paint on a canvas layered on top of the PNG

// 1. Template catalogue
//    Start with a curated list. You can keep adding more entries
//    and the dropdowns + browser will pick them up automatically.
const PAINT_TEMPLATES = [
  // Animals
  {
    id: "cute-dinosaur",
    name: "Cute Dinosaur",
    category: "Animals",
    src: "asset/paint/cute-dinosaur.png"
  },
  {
    id: "happy-elephant",
    name: "Happy Elephant",
    category: "Animals",
    src: "asset/paint/happy-elephant.png"
  },
  {
    id: "lion-king",
    name: "Smiling Lion",
    category: "Animals",
    src: "asset/paint/lion-king.png"
  },
  {
    id: "monkey-banana",
    name: "Monkey with Banana",
    category: "Animals",
    src: "asset/paint/monkey-banana.png"
  },

  // Space
  {
    id: "space-rocket",
    name: "Space Rocket",
    category: "Space",
    src: "asset/paint/space-rocket.png"
  },
  {
    id: "astronaut-boy",
    name: "Astronaut Boy",
    category: "Space",
    src: "asset/paint/astronaut-boy.png"
  },
  {
    id: "happy-alien",
    name: "Happy Alien",
    category: "Space",
    src: "asset/paint/happy-alien.png"
  },
  {
    id: "planet-saturn",
    name: "Planet Saturn",
    category: "Space",
    src: "asset/paint/planet-saturn.png"
  },

  // Bible stories
  {
    id: "noahs-ark",
    name: "Noah's Ark",
    category: "Bible Stories",
    src: "asset/paint/noahs-ark.png"
  },
  {
    id: "david-and-goliath",
    name: "David & Goliath",
    category: "Bible Stories",
    src: "asset/paint/david-and-goliath.png"
  },
  {
    id: "daniel-lions-den",
    name: "Daniel in the Lions' Den",
    category: "Bible Stories",
    src: "asset/paint/daniel-lions-den.png"
  },
  {
    id: "jesus-and-children",
    name: "Jesus & the Children",
    category: "Bible Stories",
    src: "asset/paint/jesus-and-children.png"
  },

  // Family / everyday life
  {
    id: "family-home",
    name: "Family House",
    category: "Family",
    src: "asset/paint/family-home.png"
  },
  {
    id: "family-meal",
    name: "Family Meal",
    category: "Family",
    src: "asset/paint/family-meal.png"
  },
  {
    id: "bedtime-story",
    name: "Bedtime Story",
    category: "Family",
    src: "asset/paint/bedtime-story.png"
  },

  // Sports
  {
    id: "soccer-game",
    name: "Football Match",
    category: "Sports",
    src: "asset/paint/soccer-game.png"
  },
  {
    id: "basketball-shot",
    name: "Basketball Shot",
    category: "Sports",
    src: "asset/paint/basketball-shot.png"
  },

  // Seasons / celebrations
  {
    id: "snowman",
    name: "Snowman",
    category: "Seasons",
    src: "asset/paint/snowman.png"
  },
  {
    id: "spring-flowers",
    name: "Spring Flowers",
    category: "Seasons",
    src: "asset/paint/spring-flowers.png"
  },
  {
    id: "birthday-cake",
    name: "Birthday Cake",
    category: "Celebrations",
    src: "asset/paint/birthday-cake.png"
  },
  {
    id: "party-balloons",
    name: "Party Balloons",
    category: "Celebrations",
    src: "asset/paint/party-balloons.png"
  }
  // You can keep adding more objects here – the UI will update automatically.
];

// 2. State
let paintCanvas, paintCtx;
let isPainting = false;
let brushColor = "#ff4b81";
let brushSize = 12;
let currentTemplate = null;

// NEW: drawing tool + history
let currentTool = "brush"; // "brush" | "eraser"
let currentStroke = null;
const strokeHistory = [];
const redoStack = [];

// 3. Helpers
function getUniqueCategories() {
  const set = new Set();
  PAINT_TEMPLATES.forEach((t) => set.add(t.category));
  return Array.from(set).sort();
}

function loadTemplate(templateId) {
  const imgEl = document.getElementById("paintTemplateImage");
  if (!imgEl) return;
  const template = PAINT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return;

  currentTemplate = template;
  imgEl.src = template.src;
  imgEl.alt = template.name;
  imgEl.onload = syncPaintCanvasSize;
}

function syncPaintCanvasSize() {
  if (!paintCanvas) return;
  const wrapper = document.querySelector(".paint-board");
  if (!wrapper) return;

  const rect = wrapper.getBoundingClientRect();
  const style = window.getComputedStyle(wrapper);
  const paddingX =
    parseFloat(style.paddingLeft || 0) + parseFloat(style.paddingRight || 0);
  const paddingY =
    parseFloat(style.paddingTop || 0) + parseFloat(style.paddingBottom || 0);

  const width = rect.width - paddingX;
  const height = rect.height - paddingY;

  if (width > 0 && height > 0) {
    paintCanvas.width = width;
    paintCanvas.height = height;
    redrawAllStrokes(); // keep strokes scaled on resize
  }
}

// 4. Painting
function startPaint(e) {
  if (!paintCtx) return;

  isPainting = true;

  const pos = getCanvasPos(e);

  // set composite based on tool
  paintCtx.globalCompositeOperation =
    currentTool === "eraser" ? "destination-out" : "source-over";

  paintCtx.strokeStyle = brushColor;
  paintCtx.lineWidth = brushSize;
  paintCtx.lineCap = "round";
  paintCtx.lineJoin = "round";

  currentStroke = {
    tool: currentTool,
    color: brushColor,
    size: brushSize,
    points: [pos]
  };

  paintCtx.beginPath();
  paintCtx.moveTo(pos.x, pos.y);
}

function movePaint(e) {
  if (!isPainting || !paintCtx || !currentStroke) return;
  const pos = getCanvasPos(e);
  currentStroke.points.push(pos);
  paintCtx.lineTo(pos.x, pos.y);
  paintCtx.stroke();
}

function endPaint() {
  if (!isPainting) return;
  isPainting = false;

  if (currentStroke && currentStroke.points.length > 1) {
    strokeHistory.push(currentStroke);
    // clear redo when new stroke is made
    redoStack.length = 0;
  }
  currentStroke = null;

  // restore default composite
  if (paintCtx) {
    paintCtx.globalCompositeOperation = "source-over";
  }
}

function getCanvasPos(e) {
  const rect = paintCanvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function redrawAllStrokes() {
  if (!paintCtx || !paintCanvas) return;

  // Clear all user paint
  paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);

  // Replay each stroke
  for (const stroke of strokeHistory) {
    if (!stroke.points || stroke.points.length < 2) continue;

    paintCtx.globalCompositeOperation =
      stroke.tool === "eraser" ? "destination-out" : "source-over";
    paintCtx.strokeStyle = stroke.color;
    paintCtx.lineWidth = stroke.size;
    paintCtx.lineCap = "round";
    paintCtx.lineJoin = "round";

    paintCtx.beginPath();
    paintCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      paintCtx.lineTo(p.x, p.y);
    }
    paintCtx.stroke();
  }

  // Reset to normal brush defaults
  paintCtx.globalCompositeOperation = "source-over";
}

// 5. Template Browser
function buildTemplateBrowserFilters() {
  const categorySelect = document.getElementById(
    "templateBrowserCategoryFilter"
  );
  if (!categorySelect) return;

  const cats = getUniqueCategories();
  categorySelect.innerHTML = "";

  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "All categories";
  categorySelect.appendChild(allOpt);

  cats.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function renderTemplateGrid() {
  const grid = document.getElementById("templateGrid");
  const catFilter = document.getElementById("templateBrowserCategoryFilter");
  const searchInput = document.getElementById("templateBrowserSearch");
  if (!grid) return;

  const cat = catFilter ? catFilter.value : "";
  const term = searchInput ? searchInput.value.trim().toLowerCase() : "";

  let list = PAINT_TEMPLATES.slice();
  if (cat) {
    list = list.filter((t) => t.category === cat);
  }
  if (term) {
    list = list.filter((t) => {
      return (
        t.name.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term)
      );
    });
  }

  grid.innerHTML = "";

  list.forEach((t) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "template-card";
    card.setAttribute("data-template-id", t.id);

    const thumb = document.createElement("div");
    thumb.className = "template-thumb";

    const img = document.createElement("img");
    img.src = t.src;
    img.alt = t.name;
    img.loading = "lazy";
    img.addEventListener("error", () => {
      img.style.display = "none";
      thumb.classList.add("template-thumb-fallback");
    });

    const placeholder = document.createElement("span");
    placeholder.className = "template-thumb-placeholder";
    placeholder.textContent = t.name;

    thumb.appendChild(img);
    thumb.appendChild(placeholder);
    card.appendChild(thumb);

    const nameEl = document.createElement("div");
    nameEl.className = "template-name";
    nameEl.textContent = t.name;
    card.appendChild(nameEl);

    const catEl = document.createElement("div");
    catEl.className = "template-category";
    catEl.textContent = t.category;
    card.appendChild(catEl);

    card.addEventListener("click", () => {
      const templateSelect = document.getElementById("paintTemplateSelect");
      if (templateSelect) {
        templateSelect.value = t.id;
      }
      loadTemplate(t.id);
      closeTemplateBrowser();
    });

    grid.appendChild(card);
  });

  if (!list.length) {
    const empty = document.createElement("p");
    empty.className = "template-empty";
    empty.textContent = "No templates match that search yet.";
    grid.appendChild(empty);
  }
}

function openTemplateBrowser() {
  const overlay = document.getElementById("templateBrowser");
  if (!overlay) return;
  overlay.classList.add("is-open");
  document.body.classList.add("no-scroll");
  buildTemplateBrowserFilters();
  renderTemplateGrid();
}

function closeTemplateBrowser() {
  const overlay = document.getElementById("templateBrowser");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
}

// 6. Init UI (left-hand controls)
function initPaintControls() {
  const categorySelect = document.getElementById("paintCategoryFilter");
  const templateSelect = document.getElementById("paintTemplateSelect");
  const colorInput = document.getElementById("paintColor");
  const sizeInput = document.getElementById("paintBrushSize");
  const clearBtn = document.getElementById("paintClearBtn");
  const randomBtn = document.getElementById("paintRandomTemplateBtn");
  const paletteEl = document.getElementById("paintPalette");
const saveBtn = document.getElementById("paintSaveBtn");


  if (!categorySelect || !templateSelect) {
    return;
  }

  // Populate category dropdown
  const categories = getUniqueCategories();
  categorySelect.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "All categories";
  categorySelect.appendChild(allOpt);

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  function refreshTemplateOptions() {
    const cat = categorySelect.value;
    const list = cat
      ? PAINT_TEMPLATES.filter((t) => t.category === cat)
      : PAINT_TEMPLATES;
    templateSelect.innerHTML = "";
    list.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      templateSelect.appendChild(opt);
    });
    if (list.length > 0) {
      loadTemplate(list[0].id);
      templateSelect.value = list[0].id;
    }
  }

  categorySelect.addEventListener("change", refreshTemplateOptions);
  templateSelect.addEventListener("change", (e) => {
    loadTemplate(e.target.value);
  });

  if (colorInput) {
    colorInput.addEventListener("input", (e) => {
      brushColor = e.target.value || "#ff4b81";
    });
  }
    // Preset palette swatches
  if (paletteEl) {
    paletteEl.querySelectorAll(".palette-swatch").forEach((swatch) => {
      swatch.addEventListener("click", () => {
        const selected = swatch.getAttribute("data-color");
        if (!selected) return;
        brushColor = selected;
        if (colorInput) {
          colorInput.value = selected;
        }
      });
    });
  }


  if (sizeInput) {
    sizeInput.addEventListener("input", (e) => {
      brushSize = parseInt(e.target.value, 10) || 12;
    });
  }

    if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!paintCtx) return;
      paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
      strokeHistory.length = 0;
      redoStack.length = 0;
    });
  }


  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      if (!PAINT_TEMPLATES.length) return;
      const idx = Math.floor(Math.random() * PAINT_TEMPLATES.length);
      const t = PAINT_TEMPLATES[idx];
      categorySelect.value = "";
      refreshTemplateOptions();
      templateSelect.value = t.id;
      loadTemplate(t.id);
    });
  }

    // Save as PNG (template + painting)
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (!paintCanvas) return;

      const imgEl = document.getElementById("paintTemplateImage");
      const exportCanvas = document.createElement("canvas");
      const w = paintCanvas.width;
      const h = paintCanvas.height;

      if (!w || !h) return;

      exportCanvas.width = w;
      exportCanvas.height = h;
      const ctx = exportCanvas.getContext("2d");

      // White background so PNG is not transparent
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // Draw the template image if it exists
      if (imgEl && imgEl.complete) {
        try {
          ctx.drawImage(imgEl, 0, 0, w, h);
        } catch (err) {
          // If drawing the image fails due to CORS, we just skip the template
          console.warn("Could not draw template on export:", err);
        }
      }

      // Draw the paint layer on top
      ctx.drawImage(paintCanvas, 0, 0);

      const link = document.createElement("a");
      const safeName = currentTemplate ? currentTemplate.id : "drawing";
      link.download = `tiwaton-${safeName}-${Date.now()}.png`;
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
    });
  }

  // Template browser triggers
  const openBrowserBtn = document.getElementById("openTemplateBrowserBtn");
  const closeBrowserBtn = document.getElementById("closeTemplateBrowserBtn");
  const browserCatFilter = document.getElementById(
    "templateBrowserCategoryFilter"
  );
  const browserSearch = document.getElementById("templateBrowserSearch");

  if (openBrowserBtn) {
    openBrowserBtn.addEventListener("click", () => {
      openTemplateBrowser();
    });
  }
  if (closeBrowserBtn) {
    closeBrowserBtn.addEventListener("click", () => {
      closeTemplateBrowser();
    });
  }

  const overlay = document.getElementById("templateBrowser");
  if (overlay) {
    // Close when clicking the dimmed background (outside the panel)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeTemplateBrowser();
      }
    });
  }

  if (browserCatFilter) {
    browserCatFilter.addEventListener("change", renderTemplateGrid);
  }
  if (browserSearch) {
    browserSearch.addEventListener("input", () => {
      renderTemplateGrid();
    });
  }

  // === Tool buttons ===
  const toolBrushBtn = document.getElementById("toolBrushBtn");
  const toolEraserBtn = document.getElementById("toolEraserBtn");
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");

  function setTool(tool) {
    currentTool = tool;
    if (toolBrushBtn && toolEraserBtn) {
      if (tool === "brush") {
        toolBrushBtn.classList.add("tool-toggle-active");
        toolEraserBtn.classList.remove("tool-toggle-active");
      } else {
        toolEraserBtn.classList.add("tool-toggle-active");
        toolBrushBtn.classList.remove("tool-toggle-active");
      }
    }
  }

  if (toolBrushBtn) {
    toolBrushBtn.addEventListener("click", () => setTool("brush"));
  }
  if (toolEraserBtn) {
    toolEraserBtn.addEventListener("click", () => setTool("eraser"));
  }

  if (undoBtn) {
    undoBtn.addEventListener("click", () => {
      if (!strokeHistory.length) return;
      const last = strokeHistory.pop();
      redoStack.push(last);
      redrawAllStrokes();
    });
  }

  if (redoBtn) {
    redoBtn.addEventListener("click", () => {
      if (!redoStack.length) return;
      const stroke = redoStack.pop();
      strokeHistory.push(stroke);
      redrawAllStrokes();
    });
  }

  // Start with brush tool
  setTool("brush");

  // Initial dropdown population
  refreshTemplateOptions();
}

// 7. Main init
function initPaintStudio() {
  paintCanvas = document.getElementById("paintCanvas");
  if (!paintCanvas) return;
  paintCtx = paintCanvas.getContext("2d");

  syncPaintCanvasSize();
  window.addEventListener("resize", syncPaintCanvasSize);

  paintCanvas.addEventListener("mousedown", startPaint);
  paintCanvas.addEventListener("mousemove", movePaint);
  window.addEventListener("mouseup", endPaint);

  paintCanvas.addEventListener(
    "touchstart",
    function (e) {
      e.preventDefault();
      startPaint(e);
    },
    { passive: false }
  );
  paintCanvas.addEventListener(
    "touchmove",
    function (e) {
      e.preventDefault();
      movePaint(e);
    },
    { passive: false }
  );
  window.addEventListener("touchend", endPaint);

  initPaintControls();
}

document.addEventListener("DOMContentLoaded", initPaintStudio);
