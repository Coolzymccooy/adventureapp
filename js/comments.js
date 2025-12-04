// js/comments.js

function initCommentsRealtime() {
  if (typeof db === "undefined") return;

  const list = document.querySelector("#Drawing .comments-list");
  if (!list) return;

  db.collection("comments")
    .orderBy("createdAt", "asc")
    .onSnapshot((snapshot) => {
      list.innerHTML = "";

      snapshot.forEach((doc) => {
        const data = doc.data() || {};
        const text = data.text || "";
        const author = data.author || "Someone";
        let timeStr = "";

        if (data.createdAt && data.createdAt.toDate) {
          const d = data.createdAt.toDate();
          timeStr = d.toLocaleString();
        }

        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `
          <strong>${author}:</strong> ${text}
          <div class="comment-time">${timeStr}</div>
        `;
        list.appendChild(div);
      });

      // Scroll to bottom so latest comment is visible
      list.scrollTop = list.scrollHeight;
    });
}

function addComment(button) {
  const section = button.closest(".comments-section");
  if (!section) return;
  const input = section.querySelector(".comment-input");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const author = "Parent"; // you can customise this later

  if (typeof db !== "undefined") {
    db.collection("comments").add({
      text,
      author,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  input.value = "";
}

document.addEventListener("DOMContentLoaded", initCommentsRealtime);
