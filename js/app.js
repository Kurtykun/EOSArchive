// Define unlock codes and their file IDs
const unlockCodes = {
  "EOS-ALPHA": ["file_001", "file_002"],
  "CROCODYLUS": ["file_003"]
};

// Handle code submission
function submitCode() {
  const codeInput = document.getElementById("codeInput").value.trim();
  const messageEl = document.getElementById("codeMessage");
  if (unlockCodes[codeInput]) {
    // Save unlocked IDs
    let unlocked = JSON.parse(localStorage.getItem("unlockedFiles")) || [];
    unlocked = [...new Set([...unlocked, ...unlockCodes[codeInput]])];
    localStorage.setItem("unlockedFiles", JSON.stringify(unlocked));
    window.location.href = "archive.html";
  } else {
    messageEl.textContent = "Invalid code. Try again.";
  }
}

// On archive.html load
if (window.location.pathname.endsWith("archive.html")) {
  fetch("data/files.json")
    .then(res => res.json())
    .then(data => {
      const unlocked = JSON.parse(localStorage.getItem("unlockedFiles")) || [];
      const container = document.getElementById("fileList");
      if (unlocked.length === 0) {
        container.innerHTML = "<p>No files unlocked. Return to login.</p>";
        return;
      }
      unlocked.forEach(id => {
        const file = data.find(f => f.id === id);
        if (file) {
          const link = document.createElement("a");
          link.href = `viewer.html?id=${file.id}`;
          link.className = "block p-3 bg-gray-800 rounded hover:bg-gray-700";
          link.textContent = `${file.title} (${file.clearance})`;
          container.appendChild(link);
        }
      });
    });
}

// On viewer.html load
if (window.location.pathname.endsWith("viewer.html")) {
  const urlParams = new URLSearchParams(window.location.search);
  const fileId = urlParams.get("id");
  if (fileId) {
    fetch("data/files.json")
      .then(res => res.json())
      .then(data => {
        const file = data.find(f => f.id === fileId);
        if (file) {
          fetch(file.path)
            .then(res => res.text())
            .then(text => {
              document.getElementById("fileContent").innerHTML = marked.parse(text);
            });
        }
      });
  }
}
