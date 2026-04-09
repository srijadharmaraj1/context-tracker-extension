let currentUrl = "";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentUrl = tab.url;

  loadData();
  setInterval(loadData, 3000);
});

// ================= LOAD =================
function loadData() {
  chrome.storage.local.get(["history", "intents"], (data) => {
    let history = data.history || [];
    let intents = data.intents || [];

    // 🧹 CLEAN OLD COMPLETED TASKS (>1 day)
    const now = Date.now();
    intents = intents.filter(task => {
      if (!task.done) return true;
      return (now - task.completedAt) < 86400000; // 24 hrs
    });

    chrome.storage.local.set({ intents });

    renderSummary(history);
    renderActivity(history);
    renderInsights(history);
    renderReminders(history, intents);
    renderReport(history);
    renderStreak(history);
  });
}

// ================= SAVE INTENT =================
document.getElementById("saveIntent").onclick = () => {
  const input = document.getElementById("intentInput");
  const text = input.value.trim();

  if (!text) return;

  chrome.storage.local.get(["intents"], (data) => {
    let intents = data.intents || [];

    intents.push({
      text,
      done: false,
      createdAt: Date.now()
    });

    chrome.storage.local.set({ intents });
  });

  input.value = "";
};

// ================= SUMMARY =================
function renderSummary(history) {
  let total = 0, distract = 0;

  history.forEach(h => {
    total += h.duration;
    if (isDistracting(h.url)) distract += h.duration;
  });

  let percent = Math.round(((total - distract) / (total || 1)) * 100);

  document.getElementById("summary").innerHTML =
    `🎯 Productive: ${percent}%<br>
     😴 Distracting: ${100 - percent}%`;
}

// ================= ACTIVITY =================
function renderActivity(history) {
  const container = document.getElementById("activity");
  container.innerHTML = "";

  history.slice(-5).forEach(item => {
    let div = document.createElement("div");

    div.innerHTML = `
      <div>${getName(item.url)} - ${formatTime(item.duration)}</div>
      <div class="bar"><div class="fill"></div></div>
    `;

    container.appendChild(div);

    setTimeout(() => {
      div.querySelector(".fill").style.width =
        Math.min(item.duration * 2, 100) + "%";
    }, 100);
  });
}

// ================= INSIGHTS =================
function renderInsights(history) {
  let container = document.getElementById("insights");
  container.innerHTML = "";

  history.slice(-3).forEach(h => {
    let msg =
      h.duration > 40 ? "🔥 Deep focus" :
      h.duration > 15 ? "📖 Reading" :
      "👀 Quick";

    container.innerHTML += `${getName(h.url)} - ${msg}<br>`;
  });
}

// ================= REMINDERS (FULL FIX) =================
function renderReminders(history, intents) {
  let container = document.getElementById("reminders");

  let html = "";
  let total = 0, distract = 0;

  history.forEach(h => {
    total += h.duration;
    if (isDistracting(h.url)) distract += h.duration;
  });

  let percent = (distract / (total || 1)) * 100;

  // 🔴 / 🟢 STATUS
  if (percent > 40) {
    html += "🔴 Distracted<br>";
    html += "⚠️ Too much distraction<br>";
    showAlert("⚠️ You're distracted!");
  } else {
    html += "🟢 Focused<br>";
  }

  // ⏱ STUCK
  let last = history[history.length - 1];
  if (last && last.duration >= 300) {
    html += "⏱ Stuck too long<br>";
    showAlert("⏱ 5 mins on same page!");
  }

  // 🧠 TASKS (ALWAYS SHOW)
  if (intents.length > 0) {
    html += "<br><b>Tasks:</b><br>";

    intents.forEach((task, index) => {
      html += `
        <label>
          <input type="checkbox" data-index="${index}" ${task.done ? "checked" : ""}>
          ${task.text}
        </label><br>
      `;
    });
  }

  if (!html) {
    html = "✅ Good focus!";
  }

  container.innerHTML = html;

  // ✅ HANDLE CHECKBOX
  document.querySelectorAll("#reminders input[type='checkbox']")
    .forEach(cb => {
      cb.onchange = (e) => {
        let index = e.target.dataset.index;

        chrome.storage.local.get(["intents"], (data) => {
          let intents = data.intents || [];

          intents[index].done = e.target.checked;

          if (e.target.checked) {
            intents[index].completedAt = Date.now();
            showAlert("✅ Well done! 🎉");
          }

          chrome.storage.local.set({ intents });
        });
      };
    });
}

// ================= REPORT =================
function renderReport(history) {
  let total = history.reduce((s, h) => s + h.duration, 0);

  document.getElementById("report").innerHTML =
    `⏱ ${formatTime(total)}`;
}

// ================= STREAK =================
function renderStreak(history) {
  let days = new Set();

  history.forEach(h => {
    if (h.time) {
      days.add(new Date(h.time).toDateString());
    }
  });

  document.getElementById("streak").innerHTML =
    `🔥 ${days.size} day streak`;
}

// ================= HELPERS =================
function isDistracting(url) {
  return url.includes("youtube") ||
         url.includes("instagram") ||
         url.includes("amazon") ||
         url.includes("flipkart") ||
         url.includes("myntra") ||
         url.includes("ajio") ||
         url.includes("bookmyshow") ||
         url.includes("netflix");
}

function getName(url) {
  if (url.includes("google")) return "Google 🔍";
  if (url.includes("youtube")) return "YouTube 🎥";
  return new URL(url).hostname;
}

function formatTime(sec) {
  let h = Math.floor(sec / 3600);
  let m = Math.floor((sec % 3600) / 60);
  let s = sec % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ================= ALERT =================
function showAlert(msg) {
  if (document.getElementById("alert")) return;

  let div = document.createElement("div");
  div.id = "alert";
  div.innerText = msg;

  div.style.position = "fixed";
  div.style.bottom = "10px";
  div.style.right = "10px";
  div.style.background = "#ff4d4f";
  div.style.color = "white";
  div.style.padding = "10px";
  div.style.borderRadius = "6px";

  document.body.appendChild(div);

  setTimeout(() => div.remove(), 3000);
}

// ================= CLEAR =================
document.getElementById("clearData").onclick = () => {
  chrome.storage.local.clear(() => {
    alert("Reset done");
    location.reload();
  });
};