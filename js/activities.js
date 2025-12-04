// js/activities.js

let activities = [];

function renderActivities() {
  const container = document.getElementById('activitiesContent');
  if (!container) return;
  container.innerHTML = '';
  activities.forEach((act, idx) => {
    const actDiv = document.createElement('div');
    actDiv.className = 'activity';

    const header = document.createElement('div');
    header.className = 'activity-header';
    header.textContent = act.title + ` (Priority: ${act.priority})`;
    header.setAttribute('tabindex', '0');
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
    header.addEventListener('click', () => toggleActivityContent(idx));
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') toggleActivityContent(idx);
    });

    const content = document.createElement('div');
    content.className = 'activity-content';
    content.innerText = act.details;

    actDiv.appendChild(header);
    actDiv.appendChild(content);
    container.appendChild(actDiv);
  });
}

function toggleActivityContent(idx) {
  const acts = document.querySelectorAll('.activity');
  if (!acts[idx]) return;
  const content = acts[idx].querySelector('.activity-content');
  const header = acts[idx].querySelector('.activity-header');
  if (content.style.display === 'block') {
    content.style.display = 'none';
    header.setAttribute('aria-expanded', 'false');
  } else {
    content.style.display = 'block';
    header.setAttribute('aria-expanded', 'true');
  }
}

function addActivity() {
  const titleEl = document.getElementById('activityTitle');
  const detailsEl = document.getElementById('activityDetails');
  const priorityEl = document.getElementById('activityPriority');
  if (!titleEl || !detailsEl || !priorityEl) return;

  const title = titleEl.value.trim();
  const details = detailsEl.value.trim();
  const priority = priorityEl.value;

  if (!title) {
    alert('Please enter an activity title');
    return;
  }

  activities.push({ title, details, priority });
  titleEl.value = '';
  detailsEl.value = '';
  renderActivities();
  renderActivitiesProgress();
}

function renderActivitiesProgress() {
  const el = document.querySelector('#Activities .progress-content');
  if (!el) return;
  const totActs = activities.length;
  const highPriority = activities.filter(a => a.priority === 'High').length;
  el.innerHTML =
    'Total activities: <b>' + totActs + '</b> | High priority: <b>' + highPriority + '</b><br>' +
    (totActs >= 3
      ? '🟢 Milestone hit: 3+ total activities!'
      : 'Add ' + (3 - totActs) + ' to reach your milestone.');
}

document.addEventListener('DOMContentLoaded', () => {
  renderActivities();
  renderActivitiesProgress();
});
