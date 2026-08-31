const draftKey = "write.draft.v1";
const postsKey = "write.posts.v1";

const titleInput = document.querySelector("#post-title");
const contentInput = document.querySelector("#post-content");
const preview = document.querySelector("#preview-content");
const wordCount = document.querySelector("#word-count");
const saveStatus = document.querySelector("#save-status");
const publishButton = document.querySelector("#publish-button");
const postsButton = document.querySelector("#posts-button");
const postsDialog = document.querySelector("#posts-dialog");
const postList = document.querySelector("#post-list");
const toast = document.querySelector("#toast");
let saveTimer;
let toastTimer;

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}

function renderMarkdown(source) {
  const lines = source.split("\n");
  const html = [];
  let paragraph = [];
  let list = [];
  let code = [];
  let inCode = false;
  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${paragraph.map(inlineMarkdown).join("<br>")}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  };
  const flushCode = () => {
    if (code.length) html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    code = [];
  };

  lines.forEach((line) => {
    if (line.startsWith("```")) {
      if (inCode) flushCode();
      else { flushParagraph(); flushList(); }
      inCode = !inCode;
    } else if (inCode) code.push(line);
    else if (!line.trim()) { flushParagraph(); flushList(); }
    else if (/^###\s+/.test(line)) { flushParagraph(); flushList(); html.push(`<h3>${inlineMarkdown(line.replace(/^###\s+/, ""))}</h3>`); }
    else if (/^##\s+/.test(line)) { flushParagraph(); flushList(); html.push(`<h2>${inlineMarkdown(line.replace(/^##\s+/, ""))}</h2>`); }
    else if (/^#\s+/.test(line)) { flushParagraph(); flushList(); html.push(`<h1>${inlineMarkdown(line.replace(/^#\s+/, ""))}</h1>`); }
    else if (/^>\s?/.test(line)) { flushParagraph(); flushList(); html.push(`<blockquote><p>${inlineMarkdown(line.replace(/^>\s?/, ""))}</p></blockquote>`); }
    else if (/^-\s+/.test(line)) { flushParagraph(); list.push(line.replace(/^-\s+/, "")); }
    else paragraph.push(line);
  });
  if (inCode) flushCode();
  flushParagraph();
  flushList();
  return html.join("");
}

function updatePreview() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  wordCount.textContent = `${content.length}자`;
  if (!title && !content) {
    preview.innerHTML = '<p class="empty-preview">초안을 시작하면 이곳에서 글의 모양을 바로 확인할 수 있습니다.</p>';
    return;
  }
  preview.innerHTML = `${title ? `<h1>${escapeHtml(title)}</h1>` : ""}${renderMarkdown(content)}`;
}

function saveDraft() {
  localStorage.setItem(draftKey, JSON.stringify({ title: titleInput.value, content: contentInput.value }));
  saveStatus.textContent = "임시저장됨";
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveStatus.textContent = "저장 중";
  saveTimer = window.setTimeout(saveDraft, 250);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function readPosts() {
  try { return JSON.parse(localStorage.getItem(postsKey)) || []; }
  catch { return []; }
}

function renderPosts() {
  const posts = readPosts();
  if (!posts.length) {
    postList.innerHTML = '<p class="post-list-empty">아직 저장한 글이 없습니다.</p>';
    return;
  }
  postList.replaceChildren(...posts.map((post) => {
    const item = document.createElement("article");
    item.className = "saved-post";
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = post.title;
    const date = document.createElement("span");
    date.textContent = new Date(post.savedAt).toLocaleDateString("ko-KR");
    const load = document.createElement("button");
    load.className = "load-post";
    load.type = "button";
    load.textContent = "불러오기";
    load.addEventListener("click", () => {
      titleInput.value = post.title;
      contentInput.value = post.content;
      updatePreview();
      saveDraft();
      postsDialog.close();
      titleInput.focus();
      showToast("글을 불러왔습니다.");
    });
    copy.append(title, date);
    item.append(copy, load);
    return item;
  }));
}

function savePost() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) {
    showToast("제목과 내용을 모두 입력해 주세요.");
    (!title ? titleInput : contentInput).focus();
    return;
  }
  const posts = readPosts();
  posts.unshift({ id: crypto.randomUUID(), title, content, savedAt: new Date().toISOString() });
  localStorage.setItem(postsKey, JSON.stringify(posts));
  saveDraft();
  renderPosts();
  showToast("이 브라우저에 글을 저장했습니다.");
}

function insertFormat(format) {
  const start = contentInput.selectionStart;
  const end = contentInput.selectionEnd;
  const selection = contentInput.value.slice(start, end) || "내용";
  const templates = {
    heading: `# ${selection}`,
    bold: `**${selection}**`,
    italic: `_${selection}_`,
    quote: `> ${selection}`,
    code: `\`\`\`\n${selection}\n\`\`\``,
    list: `- ${selection}`,
  };
  contentInput.setRangeText(templates[format], start, end, "end");
  contentInput.focus();
  updatePreview();
  scheduleSave();
}

try {
  const draft = JSON.parse(localStorage.getItem(draftKey));
  if (draft) {
    titleInput.value = draft.title || "";
    contentInput.value = draft.content || "";
  }
} catch { localStorage.removeItem(draftKey); }

titleInput.addEventListener("input", () => { updatePreview(); scheduleSave(); });
contentInput.addEventListener("input", () => { updatePreview(); scheduleSave(); });
document.querySelectorAll("[data-format]").forEach((button) => button.addEventListener("click", () => insertFormat(button.dataset.format)));
publishButton.addEventListener("click", savePost);
postsButton.addEventListener("click", () => { renderPosts(); postsDialog.showModal(); });
document.querySelector("#close-dialog").addEventListener("click", () => postsDialog.close());
updatePreview();
