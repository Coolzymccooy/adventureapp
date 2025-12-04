function logFamilyGameSession(gameId, label, score) {
  if (typeof getFirestore !== "function") return;
  const db = getFirestore();
  if (!db) return;

  const familyCode = getCurrentFamilyCode ? getCurrentFamilyCode() : "GLOBAL";
  const childName = getCurrentChildName ? getCurrentChildName() : null;

  db.collection("familyGameSessions").add({
    familyCode: familyCode,
    gameId: gameId,
    label: label,
    score: typeof score === "number" ? score : null,
    childName: childName,
    playedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    console.log("✅ Game session logged:", label, "for", familyCode);
  }).catch((err) => {
    console.error("❌ Failed to log game:", err);
  });

  if (typeof updateFamilyMetric === "function") {
    updateFamilyMetric("gamesCount", 1);
  }
}

function onGameFinished(gameId, label, score) {
  // your existing animations / messages / etc
  logFamilyGameSession(gameId, label, score);
}
