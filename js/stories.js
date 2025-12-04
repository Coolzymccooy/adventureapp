// js/stories.js

function getStoriesFamilyCode() {
  if (typeof getGlobalFamilyCode === "function") {
    return getGlobalFamilyCode();
  }
  return "GLOBAL";
}

function renderStoriesProgress() {
  const el = document.querySelector("#Stories .progress-content");
  if (!el) return;
  const total = stories.length;
  const goal = 10;
  const remaining = Math.max(goal - total, 0);
  const familyCode = getStoriesFamilyCode();

  el.innerHTML =
    "Family code: <b>" + familyCode + "</b><br>" +
    "Total stories: <b>" + total + "</b><br>" +
    (total >= goal
      ? "🟢 Story goal reached! Keep creating and reading together."
      : "Add <b>" +
        remaining +
        "</b> more stor" +
        (remaining === 1 ? "y" : "ies") +
        " to reach your goal!");
}

function updateStoriesProgressFromMetrics(metrics) {
  const el = document.querySelector("#Stories .progress-content");
  if (!el) return;

  const familyCode = metrics.code || (
    typeof getCurrentFamilyCode === "function" ? getCurrentFamilyCode() : "GLOBAL"
  );
  const storiesCount = metrics.storiesCount || 0;
  const drawingsCount = metrics.drawingsCount || 0;
  const activitiesCount = metrics.activitiesCount || 0;
  const gamesCount = metrics.gamesCount || 0;

  el.innerHTML =
    "Family code: <b>" + familyCode + "</b><br>" +
    "Stories saved: <b>" + storiesCount + "</b><br>" +
    "Drawings saved: <b>" + drawingsCount + "</b><br>" +
    "Activities done: <b>" + activitiesCount + "</b><br>" +
    "Games played: <b>" + gamesCount + "</b>";
}


// 10 kids-friendly, caring, family-focused stories
let stories = [
  {
    title: "The Kind Lunchbox",
    content:
      "Tomi always packed two snacks in her lunchbox. One was for her, and one was 'just in case'.\n\n" +
      "One day, a new girl came to school and forgot her lunch. Tomi quietly took out her extra snack and said, 'You can share with me.'\n\n" +
      "The new girl’s eyes sparkled with surprise. From that day, she never felt alone again.\n\n" +
      "A small lunchbox made a big difference!"
  },
  {
    title: "The Little Light in the Window",
    content:
      "Whenever Daddy came home late, he looked for the little lamp in the window.\n\n" +
      "It meant: 'We are waiting for you. We love you.'\n\n" +
      "One evening, there was a power cut. No lamp. No lights anywhere.\n\n" +
      "So Mum, David, and Praise held up small torches by the window and waved.\n\n" +
      "Daddy smiled from the street. Love always finds a way to shine."
  },
  {
    title: "The Brave Umbrella",
    content:
      "It was raining after church, and there was only one umbrella.\n\n" +
      "Mum opened it and covered the children first, even though her own clothes were getting wet.\n\n" +
      "'Why, Mum?' they asked.\n\n" +
      "She smiled and said, 'Because parents are like umbrellas. We might get a little wet so you can stay dry.'\n\n" +
      "The children cuddled closer, feeling warm and safe under Mum’s brave umbrella."
  },
  {
    title: "The Sharing Game",
    content:
      "David loved his new toy car so much that he did not want anyone to touch it.\n\n" +
      "When his cousin visited, he watched the car from far away, looking a bit sad.\n\n" +
      "David remembered how Jesus shared His time and stories with everyone.\n\n" +
      "He took a deep breath, walked over, and placed the car gently in his cousin’s hand.\n\n" +
      "'Let’s race together,' he said.\n\n" +
      "The game became twice as fun when it was shared."
  },
  {
    title: "Praise and the Quiet Friend",
    content:
      "Praise noticed a girl at church who always sat alone during game time.\n\n" +
      "At first, Praise felt shy as well. What if the girl did not want to play?\n\n" +
      "But she remembered that kindness is brave.\n\n" +
      "Slowly, she walked over and asked, 'Would you like to join our team?'\n\n" +
      "The girl’s smile lit up her whole face.\n\n" +
      "From that day, Praise had a new friend, and so did the quiet girl."
  },
  {
    title: "The Secret Thank-You",
    content:
      "Mum worked very hard every day, cooking, cleaning, praying, and planning.\n\n" +
      "The children decided to plan a secret thank-you.\n\n" +
      "They cleaned the living room, arranged the pillows, made a big colourful card, and left her favourite snack on the table.\n\n" +
      "When Mum opened the door, she put her hands on her head in surprise.\n\n" +
      "'Who did this?' she asked.\n\n" +
      "'We all did!' they shouted.\n\n" +
      "Mum’s eyes filled with happy tears. Kindness is a powerful team sport."
  },
  {
    title: "The Lost Teddy Rescue",
    content:
      "At children’s church, someone forgot a small, worn-out teddy bear.\n\n" +
      "Its fur was old and its eye was a little scratched, but it looked very loved.\n\n" +
      "Instead of throwing it away, the teacher kept it safe and called it 'Teddy Hope'.\n\n" +
      "Each week, different children took turns looking after Teddy Hope in class.\n\n" +
      "Many weeks later, a young boy ran in and shouted, 'My teddy! I thought I lost you forever!'\n\n" +
      "He hugged Teddy Hope so tight.\n\n" +
      "Everyone realised that nothing is too small to be cared for."
  },
  {
    title: "The Listening Ear",
    content:
      "One evening, Dad put his phone away, turned off the TV, and sat on the sofa.\n\n" +
      "He said, 'Today, you have my full ears and eyes.'\n\n" +
      "The children told him everything, about school, games, funny moments, and even the parts that made them feel sad.\n\n" +
      "By the end, they did not just feel heard. They felt important.\n\n" +
      "Listening is one of the kindest gifts we can give."
  },
  {
    title: "The Garden of Words",
    content:
      "Mum told the children that words are like seeds.\n\n" +
      "Nice words grow flowers. Mean words grow weeds.\n\n" +
      "All week, they practised saying 'please', 'thank you', 'well done', and 'I am sorry'.\n\n" +
      "They tried their best not to shout, complain, or tease.\n\n" +
      "By Sunday, their home felt different, softer, warmer, and kinder.\n\n" +
      "It felt like a colourful garden made of good words."
  },
  {
    title: "The Extra Chair",
    content:
      "Every Friday, there was an extra chair at the dinner table.\n\n" +
      "'Who is that for?' the children asked.\n\n" +
      "Dad said, 'It is for whoever needs a family tonight.'\n\n" +
      "Sometimes a neighbour sat there.\n\n" +
      "Sometimes a friend from church.\n\n" +
      "Sometimes someone new.\n\n" +
      "The extra chair reminded them that love always makes space for one more."
  }
];

function renderStories() {
  const container = document.getElementById("storiesContent");
  if (!container) return;

  container.innerHTML = "";

  stories.forEach((story, idx) => {
    const storyDiv = document.createElement("div");
    storyDiv.className = "story";

    const title = document.createElement("div");
    title.className = "story-title";
    title.textContent = story.title;
    title.setAttribute("tabindex", "0");
    title.setAttribute("role", "button");
    title.setAttribute("aria-expanded", "false");

    title.addEventListener("click", () => toggleStoryContent(idx));
    title.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleStoryContent(idx);
      }
    });

    const content = document.createElement("div");
    content.className = "story-content";
    content.style.display = "none"; // start hidden
    content.textContent = story.content; // safe: no HTML, just text

    storyDiv.appendChild(title);
    storyDiv.appendChild(content);
    container.appendChild(storyDiv);
  });
}

function toggleStoryContent(idx) {
  const storyEls = document.querySelectorAll("#storiesContent .story");
  const story = storyEls[idx];
  if (!story) return;

  const content = story.querySelector(".story-content");
  const title = story.querySelector(".story-title");
  if (!content || !title) return;

  const isOpen = content.style.display === "block";
  content.style.display = isOpen ? "none" : "block";
  title.setAttribute("aria-expanded", isOpen ? "false" : "true");
}

// Kids can add their own simple story text
function addStory() {
  const input = document.getElementById("storyInput");
  if (!input) return;

  const storyText = input.value.trim();
  if (!storyText) return;

  const newTitle = "New Story " + (stories.length + 1);
  stories.push({ title: newTitle, content: storyText });
  input.value = "";

  // Save custom story to Firestore per family
function saveFamilyStoryToCloud(title, content) {
  if (typeof getFirestore !== "function") return;
  const db = getFirestore();
  if (!db) return;

  const familyCode = typeof getCurrentFamilyCode === "function"
    ? getCurrentFamilyCode()
    : "GLOBAL";

  const childName = typeof getCurrentChildName === "function"
    ? getCurrentChildName()
    : null;

  db.collection("familyStories").add({
    familyCode: familyCode,
    title: title,
    content: content,
    childName: childName,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    console.log("✅ Story saved for family:", familyCode);
  }).catch((err) => {
    console.error("❌ Failed to save story:", err);
  });
}

function subscribeToFamilyStories() {
  if (typeof getFirestore !== "function") return;
  const db = getFirestore();
  if (!db) return;

  const familyCode = typeof getCurrentFamilyCode === "function"
    ? getCurrentFamilyCode()
    : "GLOBAL";

  db.collection("familyStories")
    .where("familyCode", "==", familyCode)
    .orderBy("createdAt", "asc")
    .onSnapshot((snap) => {
      // start with the built-in default stories
      const baseStories = stories.slice(0, 10); // first 10 are defaults
      const extra = [];

      snap.forEach((doc) => {
        const data = doc.data() || {};
        if (!data.title || !data.content) return;
        extra.push({
          title: data.title,
          content: data.content
        });
      });

      stories = baseStories.concat(extra);
      renderStories();
      renderStoriesProgress();
    });
}


  renderStories();

  // 🔹 Update family metrics
  if (typeof updateFamilyMetric === "function") {
    updateFamilyMetric("storiesCount", 1);
  }

  // 🔹 Save this story to Firestore for this family
  saveFamilyStoryToCloud(newTitle, storyText);
}


function renderStoriesProgress() {
  const el = document.querySelector("#Stories .progress-content");
  if (!el) return;

  const total = stories.length;
  const goal = 10;
  const remaining = Math.max(goal - total, 0);

  el.innerHTML =
    "Total stories: <b>" +
    total +
    "</b><br>" +
    (total >= goal
      ? "🟢 Story goal reached! Keep creating and reading together."
      : "Add <b>" +
        remaining +
        "</b> more stor" +
        (remaining === 1 ? "y" : "ies") +
        " to reach your goal!");
}

document.addEventListener("DOMContentLoaded", function () {
  renderStories();
  renderStoriesProgress();
});

document.addEventListener("DOMContentLoaded", function () {
  renderStories();
  renderStoriesProgress();

  if (typeof subscribeToFamilyStories === "function") {
    subscribeToFamilyStories();
  }

  // also subscribe to family metrics for progress
  if (typeof subscribeToFamilyMetrics === "function") {
    subscribeToFamilyMetrics(updateStoriesProgressFromMetrics);
  }
});
