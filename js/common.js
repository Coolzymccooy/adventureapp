// js/common.js

// Universal Comments (shared by all pages)
let comments = {};

function addComment(btn) {
  const tabName = btn.closest('.tabcontent').id;
  comments[tabName] = comments[tabName] || [];
  const textarea = btn.parentElement.querySelector('.comment-input');
  const text = textarea.value.trim();
  if (!text) return;
  comments[tabName].push(text);
  textarea.value = '';
  renderComments(tabName, btn.parentElement.querySelector('.comments-list'));
}

function renderComments(tabName, listEl) {
  listEl.innerHTML = '';
  (comments[tabName] || []).forEach(c => {
    const d = document.createElement('div');
    d.className = 'comment';
    d.textContent = c;
    listEl.appendChild(d);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.tabcontent').forEach(tab => {
    const section = tab.querySelector('.comments-section');
    if (section) {
      renderComments(tab.id, section.querySelector('.comments-list'));
    }
  });
});


// ===== Footer helpers =====
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

