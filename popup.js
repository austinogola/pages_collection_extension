document.getElementById('start').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "startCookieCheck" }, (response) => {
    if (response.started) {
      document.getElementById('output').textContent = "Scan started...\n";
    }
  });
});

// Auto-refresh output every 2s
setInterval(() => {
  chrome.storage.local.get("results", (data) => {
    const output = document.getElementById('output');
    const results = data.results || [];
    output.textContent = results.map(r =>
      r.matched.length > 0
        ? `✅ ${r.url} matched: ${r.matched.join(", ")}`
        : `❌ ${r.url} has no matching cookies`
    ).join('\n');
  });
}, 2000);
