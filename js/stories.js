// js/stories.js

let stories = [ /* your full stories array exactly as now */ ];

function renderStories() {
  const container = document.getElementById("storiesContent");
  if (!container) return;
  container.innerHTML = '';
  stories.forEach((story, idx) => {
    const storyDiv = document.createElement('div');
    storyDiv.className = 'story';

    const title = document.createElement('div');
    title.className = 'story-title';
    title.textContent = story.title;
    title.setAttribute('tabindex', '0');
    title.setAttribute('role', 'button');
    title.setAttribute('aria-expanded', 'false');
    title.addEventListener('click', () => toggleStoryContent(idx));
    title.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') toggleStoryContent(idx);
    });

    const content = document.createElement('div');
    content.className = 'story-content';
    content.innerText = story.content;

    storyDiv.appendChild(title);
    storyDiv.appendChild(content);
    container.appendChild(storyDiv);
  });
}

function toggleStoryContent(idx) {
  const story = document.querySelectorAll('.story')[idx];
  if (!story) return;
  const content = story.querySelector('.story-content');
  const title = story.querySelector('.story-title');
  if (content.style.display === 'block') {
    content.style.display = 'none';
    title.setAttribute('aria-expanded', 'false');
  } else {
    content.style.display = 'block';
    title.setAttribute('aria-expanded', 'true');
  }
}

function addStory() {
  const input = document.getElementById('storyInput');
  if (!input) return;
  const storyText = input.value.trim();
  if (storyText) {
    const newTitle = 'New Story ' + (stories.length + 1);
    stories.push({ title: newTitle, content: storyText });
    input.value = '';
    renderStories();
    renderStoriesProgress();
  }
}

function renderStoriesProgress() {
  const el = document.querySelector('#Stories .progress-content');
  if (!el) return;
  el.innerHTML =
    'Total stories: <b>' + stories.length + '</b> <br>' +
    (stories.length >= 10
      ? '🟢 Story goal reached!'
      : 'Add ' + (10 - stories.length) + ' more stories for your goal!');
}

document.addEventListener('DOMContentLoaded', () => {
  renderStories();
  renderStoriesProgress();
});
