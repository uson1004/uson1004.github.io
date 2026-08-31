const draftKey = "write.draft.v2";
const postsKey = "write.published.v2";
const legacyDraftKey = "write.draft.v1";
const legacyPostsKey = "write.posts.v1";

const root = document.querySelector(".app-shell");
const homeView = document.querySelector("#home-view");
const editorView = document.querySelector("#editor-view");
const homeActions = document.querySelector("#home-actions");
const editorActions = document.querySelector("#editor-actions");
const titleInput = document.querySelector("#post-title");
const contentInput = document.querySelector("#post-content");
const preview = document.querySelector("#preview-content");
const wordCount = document.querySelector("#word-count");
const saveStatus = document.querySelector("#save-status");
const homePostList = document.querySelector("#home-post-list");
const publishedCount = document.querySelector("#published-count");
const postsDialog = document.querySelector("#posts-dialog");
const postList = document.querySelector("#post-list");
const toast = document.querySelector("#toast");
let activePostId = null;
let saveTimer;
let toastTimer;

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function migrateStorage() {
  if (!Array.isArray(readJson(postsKey, null))) {
    const legacy = readJson(legacyPostsKey, []);
    const posts = Array.isArray(legacy) ? legacy.map((post) => ({ ...post, publishedAt: post.publishedAt || post.savedAt })) : [];
    localStorage.setItem(postsKey, JSON.stringify(posts));
  }
  if (!readJson(draftKey, null)) {
    const legacy = readJson(legacyDraftKey, null);
    if (legacy) localStorage.setItem(draftKey, JSON.stringify(legacy));
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function inlineMarkdown(value) {
  return escapeHtml(value).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/_([^_]+)_/g, "<em>$1</em>");
}

function renderMarkdown(source) {
  const html = [];
  let paragraph = [];
  let list = [];
  let code = [];
  let inCode = false;
  const flushParagraph = () => { if (paragraph.length) html.push(`<p>${paragraph.map(inlineMarkdown).join("<br>")}</p>`); paragraph = []; };
  const flushList = () => { if (list.length) html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`); list = []; };
  const flushCode = () => { if (code.length) html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`); code = []; };
  source.split("\n").forEach((line) => {
    if (line.startsWith("```")) { if (inCode) flushCode(); else { flushParagraph(); flushList(); } inCode = !inCode; }
    else if (inCode) code.push(line);
    else if (!line.trim()) { flushParagraph(); flushList(); }
    else if (/^###\s+/.test(line)) { flushParagraph(); flushList(); html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`); }
    else if (/^##\s+/.test(line)) { flushParagraph(); flushList(); html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`); }
    else if (/^#\s+/.test(line)) { flushParagraph(); flushList(); html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`); }
    else if (/^>\s?/.test(line)) { flushParagraph(); flushList(); html.push(`<blockquote><p>${inlineMarkdown(line.replace(/^>\s?/, ""))}</p></blockquote>`); }
    else if (/^-\s+/.test(line)) { flushParagraph(); list.push(line.slice(2)); }
    else paragraph.push(line);
  });
  if (inCode) flushCode();
  flushParagraph();
  flushList();
  return html.join("");
}

function getPosts() { return readJson(postsKey, []); }
function formatDate(value) { return new Date(value).toLocaleDateString("ko-KR", { month: "short", day: "numeric", year: "numeric" }); }
function excerpt(value) { return value.replace(/^#+\s*/gm, "").replace(/[>*_`-]/g, "").replace(/\s+/g, " ").trim().slice(0, 150) || "본문을 작성해 보세요."; }

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function setView(view) {
  const home = view === "home";
  root.dataset.view = view;
  homeView.hidden = !home;
  editorView.hidden = home;
  homeActions.hidden = !home;
  editorActions.hidden = home;
  if (home) renderHome();
}

function updatePreview() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  wordCount.textContent = `${content.length}자`;
  preview.innerHTML = !title && !content ? '<p class="empty-preview">초안을 시작하면 이곳에서 글의 모양을 바로 확인할 수 있습니다.</p>' : `${title ? `<h1>${escapeHtml(title)}</h1>` : ""}${renderMarkdown(content)}`;
}

function saveDraft() {
  localStorage.setItem(draftKey, JSON.stringify({ title: titleInput.value, content: contentInput.value, updatedAt: new Date().toISOString() }));
  saveStatus.textContent = "임시저장됨";
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveStatus.textContent = "저장 중";
  saveTimer = window.setTimeout(saveDraft, 250);
}

function restoreDraft() {
  const draft = readJson(draftKey, null);
  titleInput.value = draft?.title || "";
  contentInput.value = draft?.content || "";
  saveStatus.textContent = draft ? "임시저장됨" : "임시저장되지 않음";
  updatePreview();
}

function renderHome() {
  const posts = getPosts();
  publishedCount.textContent = `${posts.length}개의 글`;
  if (!posts.length) {
    homePostList.innerHTML = '<div class="empty-feed"><p>아직 출간한 글이 없습니다. 첫 생각을 기록해 보세요.</p><button class="publish-button" id="empty-new-post-button" type="button">첫 글 작성</button></div>';
    document.querySelector("#empty-new-post-button").addEventListener("click", newPost);
    return;
  }
  homePostList.replaceChildren(...posts.map((post) => {
    const card = document.createElement("article");
    card.className = "post-card";
    card.dataset.postCard = post.id;
    const meta = document.createElement("div");
    meta.className = "post-card-meta";
    meta.textContent = formatDate(post.publishedAt);
    const copy = document.createElement("div");
    copy.className = "post-card-copy";
    const title = document.createElement("h2");
    title.textContent = post.title;
    const summary = document.createElement("p");
    summary.textContent = excerpt(post.content);
    const read = document.createElement("button");
    read.className = "read-post-button";
    read.type = "button";
    read.textContent = "계속 읽기";
    read.addEventListener("click", () => loadPost(post.id));
    copy.append(title, summary);
    card.append(meta, copy, read);
    return card;
  }));
}

function renderPosts() {
  const posts = getPosts();
  if (!posts.length) { postList.innerHTML = '<p class="post-list-empty">아직 출간한 글이 없습니다.</p>'; return; }
  postList.replaceChildren(...posts.map((post) => {
    const item = document.createElement("article");
    item.className = "saved-post";
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = post.title;
    const date = document.createElement("span");
    date.textContent = formatDate(post.publishedAt);
    const load = document.createElement("button");
    load.className = "load-post";
    load.type = "button";
    load.textContent = "이어서 작성";
    load.addEventListener("click", () => loadPost(post.id));
    copy.append(title, date);
    item.append(copy, load);
    return item;
  }));
}

function openEditor() { setView("editor"); titleInput.focus(); }
function newPost() { activePostId = null; titleInput.value = ""; contentInput.value = ""; saveStatus.textContent = "임시저장되지 않음"; updatePreview(); openEditor(); }
function resumeDraft() { activePostId = null; restoreDraft(); openEditor(); }
function loadPost(id) {
  const post = getPosts().find((item) => item.id === id);
  if (!post) return;
  activePostId = id;
  titleInput.value = post.title;
  contentInput.value = post.content;
  saveDraft();
  postsDialog.close();
  updatePreview();
  openEditor();
}

function publishPost() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) { showToast("제목과 내용을 모두 입력해 주세요."); (!title ? titleInput : contentInput).focus(); return; }
  const posts = getPosts();
  const now = new Date().toISOString();
  const post = { id: activePostId || crypto.randomUUID(), title, content, publishedAt: now };
  const index = posts.findIndex((item) => item.id === post.id);
  if (index < 0) posts.unshift(post); else posts[index] = post;
  clearTimeout(saveTimer);
  localStorage.setItem(postsKey, JSON.stringify(posts));
  localStorage.removeItem(draftKey);
  activePostId = null;
  titleInput.value = "";
  contentInput.value = "";
  saveStatus.textContent = "임시저장되지 않음";
  updatePreview();
  renderPosts();
  setView("home");
  showToast("이 브라우저에 글을 출간했습니다.");
}

function insertFormat(format) {
  const start = contentInput.selectionStart;
  const end = contentInput.selectionEnd;
  const selection = contentInput.value.slice(start, end) || "내용";
  const templates = { heading: `# ${selection}`, bold: `**${selection}**`, italic: `_${selection}_`, quote: `> ${selection}`, code: `\`\`\`\n${selection}\n\`\`\``, list: `- ${selection}` };
  contentInput.setRangeText(templates[format], start, end, "end");
  contentInput.focus();
  updatePreview();
  scheduleSave();
}

migrateStorage();
restoreDraft();
renderPosts();
setView("home");
titleInput.addEventListener("input", () => { updatePreview(); scheduleSave(); });
contentInput.addEventListener("input", () => { updatePreview(); scheduleSave(); });
document.querySelectorAll("[data-format]").forEach((button) => button.addEventListener("click", () => insertFormat(button.dataset.format)));
document.querySelector("#new-post-button").addEventListener("click", newPost);
document.querySelector("#resume-draft-button").addEventListener("click", resumeDraft);
document.querySelector("#back-home-button").addEventListener("click", () => setView("home"));
document.querySelector("#save-draft-button").addEventListener("click", () => { saveDraft(); showToast("임시저장했습니다."); });
document.querySelector("#publish-button").addEventListener("click", publishPost);
document.querySelector("#posts-button").addEventListener("click", () => { renderPosts(); postsDialog.showModal(); });
document.querySelector("#close-dialog").addEventListener("click", () => postsDialog.close());
document.querySelector(".brand").addEventListener("click", (event) => { event.preventDefault(); setView("home"); });
