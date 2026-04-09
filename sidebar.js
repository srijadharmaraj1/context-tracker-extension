let currentUrl = "";

// INIT
document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentUrl = tab.url;

  loadIntent();

  chrome.storage.local.get(["history"], (data) => {
    const history = data.history || [];

    renderSummary(history);
    renderGraph(history);
    renderHistory(history);
    renderInsights(history);
    renderReminders(history);
    renderReport(history);
  });
});

// CLOSE
document.getElementById("closeBtn").onclick = () => {
  window.frameElement.remove();
};

// DARK MODE
document.getElementById("themeBtn").onclick = () => {
  document.body.classList.toggle("dark");
};

// SAVE INTENT
document.getElementById("saveIntent").onclick = () => {
  const text = document.getElementById("intentInput").value;

  chrome.storage.local.set({
    ["intent_" + currentUrl]: text
  });

  alert("Saved!");
};

function loadIntent() {
  chrome.storage.local.get(["intent_" + currentUrl], (data) => {
    if (data["intent_" + currentUrl]) {
      document.getElementById("intentInput").value =
        data["intent_" + currentUrl];
    }
  });
}

// SUMMARY
function renderSummary(history) {
  let productive = 0;

  history.forEach(h => {
    if (!isDistracting(h.url)) productive++;
  });

  let total = history.length || 1;
  let percent = Math.round((productive / total) * 100);

  document.getElementById("summary").innerHTML =
    `🎯 Productive: ${percent}%<br>😴 Distracting: ${100 - percent}%`;
}

// GRAPH
function renderGraph(history) {
  const container = document.getElementById("graph");

  history.slice(-6).forEach(item => {
    let div = document.createElement("div");

    div.innerHTML = `
      ${new URL(item.url).hostname}
      <div class="bar"><div class="fill"></div></div>
    `;

    container.appendChild(div);

    setTimeout(() => {
      div.querySelector(".fill").style.width =
        Math.min(item.duration * 2, 100) + "%";
    }, 100);
  });
}

// HISTORY
function renderHistory(history) {
  const container = document.getElementById("history");

  history.slice(-5).forEach(item => {
    let div = document.createElement("div");
    div.innerHTML =
      `${new URL(item.url).hostname} - ${Math.round(item.duration)} sec`;

    container.appendChild(div);
  });
}

// INSIGHTS
function renderInsights(history) {
  const container = document.getElementById("insights");

  history.slice(-3).forEach(item => {
    let msg =
      item.duration > 40 ? "🔥 Deep focus" :
      item.duration > 15 ? "📖 Good reading" :
      "👀 Quick check";

    let div = document.createElement("div");
    div.innerHTML =
      `${new URL(item.url).hostname} - ${msg}`;

    container.appendChild(div);
  });
}

// ✅ FIXED REMINDERS
function renderReminders(history) {
  const container = document.getElementById("reminders");
  container.innerHTML = "";

  let fastSwitch = history.filter(h => h.duration < 5).length;

  if (fastSwitch >= 2) {
    container.innerHTML += "⚡ You are switching too fast<br>";
  }

  let distractTime = history.filter(h => isDistracting(h.url) && h.duration > 10);

  if (distractTime.length > 0) {
    container.innerHTML += "⚠️ Spending time on distracting sites<br>";
  }

  if (container.innerHTML === "") {
    container.innerHTML = "✅ You're doing well!";
  }
}

// REPORT
function renderReport(history) {
  let total = history.reduce((s, h) => s + h.duration, 0);

  document.getElementById("report").innerHTML =
    `⏱ Total time: ${Math.round(total)} sec`;
}

// HELPERS
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
