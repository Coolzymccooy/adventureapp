// js/comments.js
// Generic comment system for any .comments-section on the site.
// Persists comments per-page (section) using localStorage.

// Helper: get a storage key based on the nearest parent section id
function getCommentsKeyFromElement(el) {
  // Find closest section wrapper (e.g. #Stories, #Drawing, etc.)
  const section = el.closest("section");
  const sectionId = section && section.id ? section.id : "global";
  return "tiwaton_comments_" + sectionId;
}

// Render comments in a given comments-section from localStorage
function renderCommentsForSection(section) {
  if (!section) return;

  const list = section.querySelector(".comments-list");
  if (!list) return;

  const key = getCommentsKeyFromElement(section);
  const stored = localStorage.getItem(key);
  let comments = [];

  try {
    comments = stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn("Could not parse stored comments for key:", key, e);
    comments = [];
  }

  // Clear and rebuild the list
  list.innerHTML = "";

  if (!comments.length) {
    const empty = document.createElement("p");
    empty.className = "comment-empty";
    empty.textContent = "No parent comments yet. Be the first to encourage!";
    list.appendChild(empty);
    return;
  }

  comments.forEach((item) => {
    const commentDiv = document.createElement("div");
    commentDiv.className = "comment-item";

    const meta = document.createElement("div");
    meta.className = "comment-meta";
    meta.textContent = item.when || "";

    const text = document.createElement("p");
    text.className = "comment-text";
    text.textContent = item.text;

    commentDiv.appendChild(meta);
    commentDiv.appendChild(text);
    list.appendChild(commentDiv);
  });
}

// Called from HTML: <button onclick="addComment(this)">Post Comment</button>
function addComment(buttonEl) {
  const section = buttonEl.closest(".comments-section");
  if (!section) return;

  const input = section.querySelector(".comment-input");
  const list = section.querySelector(".comments-list");
  if (!input || !list) return;

  const text = input.value.trim();
  if (!text) return;

  const key = getCommentsKeyFromElement(section);

  // Read existing comments
  const stored = localStorage.getItem(key);
  let comments = [];
  try {
    comments = stored ? JSON.parse(stored) : [];
  } catch (e) {
    comments = [];
  }

  // New comment object
  const now = new Date();
  const niceTime =
    now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  comments.push({
    text: text,
    when: niceTime
  });

  // Persist back to localStorage
  localStorage.setItem(key, JSON.stringify(comments));

  // Clear textarea
  input.value = "";

  // Re-render for that section
  renderCommentsForSection(section);
}

// Initialise comments on page load
document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll(".comments-section");
  sections.forEach((section) => {
    renderCommentsForSection(section);
  });
});
