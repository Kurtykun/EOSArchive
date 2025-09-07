document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const fileId = params.get("id");

  const contentDiv = document.getElementById("fileContent");

  try {
    // Load metadata
    const res = await fetch("data/files.json");
    const files = await res.json();
    const file = files.find(f => f.id === fileId);

    if (!file) {
      contentDiv.innerHTML = "<p>File not found.</p>";
      return;
    }
    if (file.type === "html") {
      // For complex HTML files, redirect directly
      if (file.id === "file_020"|| file.id === "file_016") {
        window.location.href = file.path;
        return;
      }
      
      // For simple HTML, load as before
      const htmlRes = await fetch(file.path);
      const htmlContent = await htmlRes.text();
      contentDiv.innerHTML = `
        <h1 class="text-2xl font-bold mb-4">${file.title}</h1>
        <div class="prose prose-invert max-w-none">${htmlContent}</div>
      `;
    } else {
      // Default: load and render markdown
      const mdRes = await fetch(file.path);
      const markdown = await mdRes.text();
      const html = marked.parse(markdown);

      contentDiv.innerHTML = `
        <h1 class="text-2xl font-bold mb-4">${file.title}</h1>
        <div class="prose prose-invert max-w-none">${html}</div>
      `;
    }
  } catch (err) {
    console.error("Error loading file:", err);
    contentDiv.innerHTML = "<p>Failed to load file content.</p>";
  }
});
