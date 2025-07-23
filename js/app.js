// Define unlock codes and associated clearance levels
const accessCodes = {
  "EOS-ALPHA": { name: "Dr. Lira", clearance: 1 },
  "CROCODYLUS": { name: "Ops Observer", clearance: 2 },
};

// Handle login code submission
function submitCode() {
  const codeInput = document.getElementById("codeInput").value.trim();
  const messageEl = document.getElementById("codeMessage");
  const user = accessCodes[codeInput];

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    window.location.href = "archive.html";
  } else {
    messageEl.textContent = "Invalid code. Try again.";
  }
}

// On archive.html
if (window.location.pathname.endsWith("archive.html")) {
  const user = JSON.parse(localStorage.getItem("user"));
  const clearance = user?.clearance || 0;
  const name = user?.name || "Unknown";
  
  // Show the logged-in name
  const nameDisplay = document.getElementById("userDisplay");
  if (nameDisplay) nameDisplay.textContent = name;

  fetch("data/files.json")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("fileList");

      // Group files by category if clearance allows
      const grouped = {};
      data.forEach(file => {
        const fileClearance = parseInt(file.clearance.replace("Level ", ""));
        if (clearance >= fileClearance) {
          if (!grouped[file.category]) grouped[file.category] = [];
          grouped[file.category].push(file);
        }
      });

      if (Object.keys(grouped).length === 0) {
        container.innerHTML = "<p>No accessible files. Return to login.</p>";
        return;
      }

      // Render files by category group
      Object.entries(grouped).forEach(([category, files]) => {
        const section = document.createElement("div");
        const header = document.createElement("h3");
        header.className = "text-xl text-blue-400 mt-6 mb-2";
        header.textContent = category;
        section.appendChild(header);

        files.forEach(file => {
          const link = document.createElement("a");
          link.href = `viewer.html?id=${file.id}`;
          link.className = "block p-3 bg-gray-800 rounded hover:bg-gray-700";
          link.textContent = `${file.title} (${file.clearance})`;
          section.appendChild(link);
        });

        container.appendChild(section);
      });
    });
}

// On viewer.html load
if (window.location.pathname.endsWith("viewer.html")) {
  const urlParams = new URLSearchParams(window.location.search);
  const fileId = urlParams.get("id");
  const user = JSON.parse(localStorage.getItem("user"));
  const clearance = user?.clearance || 0;

  if (fileId) {
    fetch("data/files.json")
      .then(res => res.json())
      .then(data => {
        const file = data.find(f => f.id === fileId);
        const required = parseInt(file.clearance.replace("Level ", ""));
        if (!file || clearance < required) {
          document.body.innerHTML = "<p class='text-center p-6'>Access denied. Return to login.</p>";
          return;
        }
        fetch(file.path)
          .then(res => res.text())
          .then(text => {
            document.getElementById("fileContent").innerHTML = marked.parse(text);
          });
      });
  }
}
