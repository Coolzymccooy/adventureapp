// js/countdown.js

let events = [];

function renderEvents() {
  const container = document.getElementById('eventsList');
  if (!container) return;
  container.innerHTML = '';
  const today = new Date();
  events.forEach(evt => {
    const evtDiv = document.createElement('div');
    evtDiv.className = 'event';

    const title = document.createElement('h4');
    title.textContent = evt.name;

    const notes = document.createElement('p');
    notes.textContent = evt.notes;

    const eventDate = new Date(evt.date);
    let diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) diffDays = 0;

    const daysLeft = document.createElement('div');
    daysLeft.className = 'days-left';
    daysLeft.textContent = diffDays + (diffDays === 1 ? ' day left' : ' days left');

    evtDiv.appendChild(title);
    evtDiv.appendChild(daysLeft);
    evtDiv.appendChild(notes);
    container.appendChild(evtDiv);
  });
}

function addEvent() {
  const nameEl = document.getElementById('eventName');
  const dateEl = document.getElementById('eventDate');
  const notesEl = document.getElementById('eventNotes');
  if (!nameEl || !dateEl || !notesEl) return;

  const name = nameEl.value.trim();
  const date = dateEl.value;
  const notes = notesEl.value.trim();

  if (!name || !date) {
    alert('Please enter an event name and date');
    return;
  }

  events.push({ name, date, notes });
  nameEl.value = '';
  dateEl.value = '';
  notesEl.value = '';
  renderEvents();
}

document.addEventListener('DOMContentLoaded', () => {
  renderEvents();
});
