let lastUrl = location.href;
let startTime = Date.now();

// detect URL change (important for Google, YouTube etc.)
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    startTime = Date.now();
  }
}, 1000);

// track time safely
setInterval(() => {
  try {
    let duration = 5;

    chrome.storage.local.get(["history"], (data) => {
      let history = data.history || [];

      let last = history[history.length - 1];

      if (last && last.url === lastUrl) {
        last.duration += duration;
      } else {
        history.push({
          url: lastUrl,
          duration: duration,
          time: Date.now()
        });
      }

      // limit history
      if (history.length > 100) {
        history.shift();
      }

      chrome.storage.local.set({ history });
    });

  } catch (err) {
    console.log("Tracking error:", err);
  }
}, 5000);