// Define unlock codes and associated clearance levels
const accessCodes = {
  "EOS-ALPHA": { name: "Dr. Lira", clearance: 2 },
  "CROCODYLUS": { name: "Dr. Marcus Duval", clearance: 1 },
};

// Handle login code submission
function submitCode() {
  const codeInput = document.getElementById("codeInput").value.trim();
  const messageEl = document.getElementById("codeMessage");
  const user = accessCodes[codeInput];

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    // Add this line to trigger the sync message
    localStorage.setItem("showSyncMessage", "true");
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

  const nameDisplay = document.getElementById("userDisplay");
  if (nameDisplay) nameDisplay.textContent = name;

  // Add sync message if just logged in
  if (localStorage.getItem("showSyncMessage") === "true") {
    localStorage.removeItem("showSyncMessage");
    
    const syncMessage = document.createElement("div");
    syncMessage.className = "text-green-400 text-sm mb-4 p-2 bg-gray-800 rounded";
    syncMessage.textContent = "Sat Uplink Sync Complete. New files found.";
    
    const container = document.getElementById("fileList");
    container.parentNode.insertBefore(syncMessage, container);
    
    setTimeout(() => {
      if (syncMessage.parentNode) {
        syncMessage.parentNode.removeChild(syncMessage);
      }
    }, 5000);
  }

  let allFiles = [];

  fetch("data/files.json")
    .then(res => res.json())
    .then(files => {
      const container = document.getElementById("fileList");
      const filteredFiles = files.filter(file => {
        const fileClearance = parseInt(file.clearance.replace("Level ", ""));
        return clearance >= fileClearance;
      });

      allFiles = filteredFiles;

      if (filteredFiles.length === 0) {
        container.innerHTML = "<p>No accessible files. Return to login.</p>";
        return;
      }

      const categories = [...new Set(filteredFiles.map(f => f.category))];
      showCategories(categories, filteredFiles, container);

      // Hook up search bar
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          const query = searchInput.value.toLowerCase();
          const matches = filteredFiles.filter(file =>
            file.title.toLowerCase().includes(query) ||
            file.category.toLowerCase().includes(query)
          );
          showSearchResults(matches, container);
        });
      }
    });

function showCategories(categories, files, container) {
  container.innerHTML = "";

  categories.forEach(category => {
    const count = files.filter(f => f.category === category).length;

    const div = document.createElement("div");
    div.className = "cursor-pointer bg-gray-800 p-4 rounded hover:bg-gray-700 mb-2";
    div.textContent = `${category} (${count})`;

    div.addEventListener("click", () =>
      showSubcategories(category, files, container, categories)
    );
    container.appendChild(div);
  });
}
function showSubcategories(category, files, container, allCategories) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.className = "text-xl font-semibold mb-4";
  heading.textContent = category;
  container.appendChild(heading);

  const subcategories = [...new Set(
    files.filter(f => f.category === category).map(f => f.subcategory || "Uncategorized")
  )];

  subcategories.forEach(sub => {
    const count = files.filter(f => f.category === category && (f.subcategory || "Uncategorized") === sub).length;

    const div = document.createElement("div");
    div.className = "cursor-pointer bg-gray-700 p-3 rounded hover:bg-gray-600 mb-2 ml-4";
    div.textContent = `${sub} (${count})`;

    div.addEventListener("click", () =>
      showFilesInSubcategory(category, sub, files, container, allCategories)
    );
    container.appendChild(div);
  });

  const backBtn = document.createElement("button");
  backBtn.textContent = "← Back to Categories";
  backBtn.className = "mt-6 text-gray-400 hover:text-white";
  backBtn.addEventListener("click", () => showCategories(allCategories, files, container));
  container.appendChild(backBtn);
}

function showFilesInSubcategory(category, subcategory, files, container, allCategories) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.className = "text-xl font-semibold mb-4";
  heading.textContent = `${category} > ${subcategory}`;
  container.appendChild(heading);

  files
    .filter(file => file.category === category && (file.subcategory || "Uncategorized") === subcategory)
    .forEach(file => {
      const link = document.createElement("a");
      link.href = `viewer.html?id=${file.id}`;
      link.className = "block p-2 rounded hover:bg-gray-800 text-blue-400";
      link.textContent = `${file.title} (${file.clearance})`;
      container.appendChild(link);
    });

  const backBtn = document.createElement("button");
  backBtn.textContent = "← Back to Subcategories";
  backBtn.className = "mt-6 text-gray-400 hover:text-white";
  backBtn.addEventListener("click", () =>
    showSubcategories(category, files, container, allCategories)
  );
  container.appendChild(backBtn);
}

function showSearchResults(files, container) {
  container.innerHTML = "<h2 class='text-xl mb-4'>Search Results</h2>";

    if (files.length === 0) {
      container.innerHTML += "<p>No matching files found.</p>";
      return;
    }

    files.forEach(file => {
      const link = document.createElement("a");
      link.href = `viewer.html?id=${file.id}`;
      link.className = "block p-2 rounded hover:bg-gray-800 text-blue-400";
      link.textContent = `${file.title} (${file.clearance}) [${file.category}]`;
      container.appendChild(link);
    });
  }
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
        if (!file) {
          document.body.innerHTML = "<p class='text-center p-6'>File not found.</p>";
          return;
        }

        const required = parseInt(file.clearance.replace("Level ", ""));
        if (clearance < required) {
          document.body.innerHTML = "<p class='text-center p-6'>Access denied. Return to login.</p>";
          return;
        }

        fetch(file.path)
        .then(res => res.text())
        .then(text => {
          if (file.path.endsWith(".md")) {
            document.getElementById("fileContent").innerHTML = marked.parse(text);
          } else if (file.path.endsWith(".html")) {
            // Directly embed the HTML
            document.getElementById("fileContent").innerHTML = text;
          } else {
            document.getElementById("fileContent").textContent = text;
          }
        });      
      });
  }
}
