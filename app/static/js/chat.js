// ==========================================================================
// DocChat — Modern UI/UX Controller
// Design System: Clean AI SaaS / OLED Dark Mode / Data-Dense
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    setupDropZone();
    setupTextarea();
    lucide.createIcons();
});

// --------------------------------------------------------------------------
// Theme Management
// --------------------------------------------------------------------------
function initTheme() {
    const savedTheme = localStorage.getItem("docchat_theme") || "dark";
    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
    updateThemeIcon();

    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            document.documentElement.classList.toggle("dark");
            const isDark = document.documentElement.classList.contains("dark");
            localStorage.setItem("docchat_theme", isDark ? "dark" : "light");
            updateThemeIcon();
        });
    }
}

function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains("dark");
    const icon = document.getElementById("theme-icon");
    if (icon) {
        icon.setAttribute("data-lucide", isDark ? "sun" : "moon");
        lucide.createIcons();
    }
}

// --------------------------------------------------------------------------
// Mobile Sidebar Drawer
// --------------------------------------------------------------------------
function toggleMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (!sidebar || !backdrop) return;

    const isClosed = sidebar.classList.contains("-translate-x-full");
    if (isClosed) {
        sidebar.classList.remove("-translate-x-full");
        sidebar.classList.add("translate-x-0");
        backdrop.classList.remove("hidden");
    } else {
        sidebar.classList.add("-translate-x-full");
        sidebar.classList.remove("translate-x-0");
        backdrop.classList.add("hidden");
    }
}

// --------------------------------------------------------------------------
// Toast Notification System
// --------------------------------------------------------------------------
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-enter pointer-events-auto flex items-center space-x-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold backdrop-blur-md transition-all ${
        type === "success" 
            ? "bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
            : type === "error"
            ? "bg-rose-50/95 dark:bg-rose-950/90 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800"
            : "bg-white/95 dark:bg-dark-card/95 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-dark-border"
    }`;

    const iconName = type === "success" ? "check-circle" : type === "error" ? "alert-triangle" : "info";
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.remove("toast-enter");
        toast.classList.add("toast-exit");
        setTimeout(() => toast.remove(), 250);
    }, 3800);
}

// --------------------------------------------------------------------------
// Custom Modal Dialogs
// --------------------------------------------------------------------------
function showModal({ title, message, confirmText = "Confirm", confirmClass = "bg-rose-600 hover:bg-rose-700", onConfirm }) {
    const container = document.getElementById("modal-container");
    const content = document.getElementById("modal-content");
    if (!container || !content) return;

    content.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">${escapeHtml(title)}</h3>
            <button onclick="closeModal()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
        <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-6">${escapeHtml(message)}</p>
        <div class="flex items-center justify-end space-x-2">
            <button onclick="closeModal()" class="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-dark-surface rounded-xl transition-colors cursor-pointer">
                Cancel
            </button>
            <button id="modal-confirm-btn" class="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all cursor-pointer ${confirmClass}">
                ${escapeHtml(confirmText)}
            </button>
        </div>
    `;

    container.classList.remove("hidden");
    setTimeout(() => container.classList.add("modal-show"), 10);
    lucide.createIcons();

    document.getElementById("modal-confirm-btn").onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };
}

function closeModal() {
    const container = document.getElementById("modal-container");
    if (!container) return;
    container.classList.remove("modal-show");
    setTimeout(() => container.classList.add("hidden"), 150);
}

// --------------------------------------------------------------------------
// Document Filter & Search
// --------------------------------------------------------------------------
function filterDocuments(query) {
    const items = document.querySelectorAll("#document-list .doc-item");
    const clearBtn = document.getElementById("clear-filter-btn");
    const lowerQuery = query.toLowerCase().trim();

    if (clearBtn) {
        if (lowerQuery) {
            clearBtn.classList.remove("hidden");
        } else {
            clearBtn.classList.add("hidden");
        }
    }

    let matchCount = 0;
    items.forEach(item => {
        const name = item.getAttribute("data-name") || "";
        if (name.includes(lowerQuery)) {
            item.classList.remove("hidden");
            matchCount++;
        } else {
            item.classList.add("hidden");
        }
    });
}

function clearDocumentFilter() {
    const input = document.getElementById("doc-filter-input");
    if (input) {
        input.value = "";
        filterDocuments("");
    }
}

// --------------------------------------------------------------------------
// Input Auto-Grow & Keyboard
// --------------------------------------------------------------------------
function setupTextarea() {
    const input = document.getElementById("question-input");
    if (input) {
        autoGrow(input);
    }
}

function autoGrow(element) {
    element.style.height = "auto";
    element.style.height = Math.min(element.scrollHeight, 180) + "px";
}

function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitQuestion(event);
    }
}

function askPreset(promptText) {
    const input = document.getElementById("question-input");
    if (input) {
        input.value = promptText;
        autoGrow(input);
        submitQuestion(new Event("submit"));
    }
}

// --------------------------------------------------------------------------
// File Upload & Drag-and-Drop
// --------------------------------------------------------------------------
function setupDropZone() {
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input");

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            handleFileUpload(fileInput.files[0]);
        }
    });

    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add("border-brand-500", "bg-brand-50/40", "dark:bg-brand-950/20", "scale-[1.01]");
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("border-brand-500", "bg-brand-50/40", "dark:bg-brand-950/20", "scale-[1.01]");
        });
    });

    dropZone.addEventListener("drop", (e) => {
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
}

async function handleFileUpload(file) {
    const statusBox = document.getElementById("upload-status");
    const statusText = document.getElementById("upload-status-text");
    const fileInput = document.getElementById("file-input");

    statusBox.classList.remove("hidden");
    statusText.innerHTML = `
        <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin text-brand-500"></i>
        <span class="truncate max-w-[200px]">Parsing '${file.name}'...</span>
    `;
    lucide.createIcons();

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            showToast(`Indexed ${result.filename} (${result.chunks_count} chunks)`, "success");
            renderDocumentList(result.documents_detailed || []);
            setTimeout(() => {
                statusBox.classList.add("hidden");
            }, 1200);
        } else {
            showToast(result.error || "Upload failed", "error");
            statusBox.classList.add("hidden");
        }
    } catch (err) {
        showToast("Upload error: " + err.message, "error");
        statusBox.classList.add("hidden");
    } finally {
        fileInput.value = "";
    }
}

function renderDocumentList(documents) {
    const list = document.getElementById("document-list");
    const docCountBadge = document.getElementById("doc-count-badge");
    const headerDocCount = document.getElementById("header-doc-count");
    const totalChunksCount = document.getElementById("total-chunks-count");
    const inputDocStatus = document.getElementById("input-doc-status");

    if (!list) return;

    const count = documents.length;
    const totalChunks = documents.reduce((sum, d) => sum + (d.chunks || 0), 0);

    if (docCountBadge) docCountBadge.textContent = count;
    if (headerDocCount) headerDocCount.textContent = count;
    if (totalChunksCount) totalChunksCount.textContent = totalChunks;
    if (inputDocStatus) inputDocStatus.textContent = `${count} doc(s) in context`;

    if (count === 0) {
        list.innerHTML = `
            <li id="no-docs-item" class="text-xs text-slate-400 dark:text-zinc-500 italic py-8 text-center flex flex-col items-center">
                <i data-lucide="file-plus" class="w-8 h-8 text-slate-300 dark:text-zinc-700 mb-2"></i>
                <span>No documents indexed yet.</span>
                <span class="text-[11px] mt-1 text-slate-400 dark:text-zinc-600">Upload documents above to begin.</span>
            </li>
        `;
        lucide.createIcons();
        return;
    }

    list.innerHTML = documents.map(doc => {
        const ext = doc.name.split('.').pop().toLowerCase();
        let badgeColor = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
        let label = "TXT";

        if (ext === "pdf") {
            badgeColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
            label = "PDF";
        } else if (ext === "docx") {
            badgeColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
            label = "DOC";
        } else if (ext === "xlsx") {
            badgeColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
            label = "XLS";
        } else if (ext === "pptx") {
            badgeColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
            label = "PPT";
        }

        return `
            <li class="doc-item group flex items-center justify-between p-2 rounded-xl bg-white dark:bg-dark-surface/80 border border-slate-200/60 dark:border-dark-border/80 hover:border-brand-500/50 dark:hover:border-brand-500/50 hover:shadow-sm transition-all" data-name="${escapeHtml(doc.name.toLowerCase())}">
                <div class="flex items-center space-x-2.5 overflow-hidden flex-1 min-w-0 pr-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold border ${badgeColor}">
                        ${label}
                    </div>
                    <div class="flex flex-col min-w-0 flex-1">
                        <span class="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate" title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</span>
                        <span class="text-[10px] font-mono text-slate-400 dark:text-zinc-500">${doc.chunks || 0} chunks indexed</span>
                    </div>
                </div>
                <button onclick="confirmDeleteDocument('${escapeHtml(doc.name)}')" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer" title="Delete document">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </li>
        `;
    }).join("");

    lucide.createIcons();
}

function confirmDeleteDocument(sourceName) {
    showModal({
        title: "Delete Document",
        message: `Are you sure you want to delete "${sourceName}"? All its vector embeddings and search chunks will be permanently removed from ChromaDB.`,
        confirmText: "Delete",
        confirmClass: "bg-rose-600 hover:bg-rose-700",
        onConfirm: () => deleteDocument(sourceName)
    });
}

async function deleteDocument(sourceName) {
    try {
        const response = await fetch(`/api/documents/${encodeURIComponent(sourceName)}`, {
            method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
            showToast(`Deleted '${sourceName}'`, "info");
            renderDocumentList(result.documents_detailed || []);
        } else {
            showToast(result.error || "Failed to delete document.", "error");
        }
    } catch (err) {
        showToast("Error deleting document: " + err.message, "error");
    }
}

// --------------------------------------------------------------------------
// Chat & Q&A Controller
// --------------------------------------------------------------------------
async function submitQuestion(event) {
    if (event) event.preventDefault();

    const input = document.getElementById("question-input");
    const question = input.value.trim();
    if (!question) return;

    // Reset input and height
    input.value = "";
    autoGrow(input);

    // Hide welcome card if visible
    const welcome = document.getElementById("welcome-card");
    if (welcome) welcome.classList.add("hidden");

    // Append user message
    appendUserMessage(question);

    // Append loading shimmer state
    const loadingId = appendLoadingSkeleton();
    scrollToBottom();

    // Disable send button while answering
    const sendBtn = document.getElementById("send-button");
    if (sendBtn) sendBtn.disabled = true;

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question }),
        });

        const data = await response.json();

        // Remove loading state
        removeLoadingSkeleton(loadingId);

        if (data.success) {
            appendAssistantMessage(data.answer, data.sources);
        } else {
            appendAssistantMessage(`⚠️ **Error:** ${data.error || "Something went wrong."}`);
        }
    } catch (err) {
        removeLoadingSkeleton(loadingId);
        appendAssistantMessage(`⚠️ **Network Error:** ${err.message}`);
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        scrollToBottom();
    }
}

function appendUserMessage(text) {
    const container = document.getElementById("messages-container");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "flex justify-end max-w-4xl mx-auto w-full";

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="flex items-end space-x-2 max-w-2xl">
            <div class="flex flex-col items-end">
                <div class="bg-gradient-to-br from-brand-600 to-indigo-700 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-sm text-sm leading-relaxed border border-brand-500/20">
                    <p class="whitespace-pre-wrap">${escapeHtml(text)}</p>
                </div>
                <span class="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-mono">${timestamp}</span>
            </div>
            <div class="w-7 h-7 rounded-lg bg-slate-200 dark:bg-dark-surface text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mb-4">
                U
            </div>
        </div>
    `;

    container.appendChild(div);
    scrollToBottom();
}

function appendAssistantMessage(text, sources = []) {
    const container = document.getElementById("messages-container");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "flex justify-start max-w-4xl mx-auto w-full";

    const rawHtml = marked.parse(text);
    const sanitizedHtml = DOMPurify.sanitize(rawHtml);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageId = "msg-" + Date.now();

    let sourcesHtml = "";
    if (sources && sources.length > 0) {
        sourcesHtml = `
            <div class="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-dark-border">
                <button onclick="toggleSources(this)" class="flex items-center space-x-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer group">
                    <div class="p-1 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
                    </div>
                    <span>Cited Document Excerpts (${sources.length})</span>
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-y-0.5"></i>
                </button>
                <div class="sources-panel hidden mt-3 grid grid-cols-1 gap-2">
                    ${sources.map((src, i) => {
                        const pct = Math.round((src.score || 0) * 100);
                        const isHigh = pct >= 50;
                        const scoreColor = isHigh ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
                        const barColor = isHigh ? "bg-emerald-500" : "bg-blue-500";

                        return `
                            <div class="p-3 rounded-xl bg-slate-50/80 dark:bg-dark-surface/60 border border-slate-200/60 dark:border-dark-border text-xs relative group">
                                <div class="flex items-center justify-between font-medium text-slate-800 dark:text-zinc-200 mb-1.5">
                                    <div class="flex items-center space-x-1.5 truncate max-w-[280px]">
                                        <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-400"></i>
                                        <span class="font-semibold truncate" title="${escapeHtml(src.source)}">${escapeHtml(src.source)}</span>
                                        <span class="text-slate-400 dark:text-zinc-500 text-[10px]">p.${escapeHtml(String(src.page))}</span>
                                    </div>
                                    <div class="flex items-center space-x-2 flex-shrink-0">
                                        <div class="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${scoreColor}">
                                            <span>${pct}% match</span>
                                        </div>
                                        <button onclick="copySnippet(this, '${escapeHtml(src.snippet)}')" class="text-slate-400 hover:text-brand-500 p-1 rounded transition-colors cursor-pointer" title="Copy snippet">
                                            <i data-lucide="copy" class="w-3 h-3"></i>
                                        </button>
                                    </div>
                                </div>
                                <p class="text-slate-600 dark:text-zinc-400 text-[11px] leading-relaxed italic border-l-2 border-slate-300 dark:border-zinc-700 pl-2 my-1">
                                    "${escapeHtml(src.snippet)}"
                                </p>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
    }

    div.innerHTML = `
        <div class="flex items-start space-x-3 max-w-3xl w-full">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-glow-brand mt-0.5">
                <i data-lucide="sparkles" class="w-4 h-4"></i>
            </div>
            <div class="flex flex-col flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1.5">
                    <span class="text-xs font-bold text-slate-900 dark:text-white">DocChat AI</span>
                    <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-dark-surface text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-dark-border">
                        Grounded
                    </span>
                    <span class="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">${timestamp}</span>
                </div>
                <div class="bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border rounded-2xl rounded-tl-sm p-4 md:p-5 shadow-soft dark:shadow-soft-dark text-slate-800 dark:text-zinc-200 w-full overflow-hidden">
                    <div class="prose-chat" id="${messageId}">${sanitizedHtml}</div>
                    ${sourcesHtml}
                    <!-- Action Bar -->
                    <div class="mt-3 pt-2.5 flex items-center justify-end space-x-2 text-[11px] text-slate-400 dark:text-zinc-500 border-t border-slate-100 dark:border-dark-border/40">
                        <button onclick="copyAnswer('${messageId}')" class="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-dark-surface hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer" title="Copy full response">
                            <i data-lucide="copy" class="w-3 h-3"></i>
                            <span>Copy response</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.appendChild(div);
    lucide.createIcons();
    setupCodeBlockCopy(div);
    scrollToBottom();
}

function setupCodeBlockCopy(container) {
    const preBlocks = container.querySelectorAll("pre");
    preBlocks.forEach(pre => {
        const copyBtn = document.createElement("button");
        copyBtn.className = "absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer";
        copyBtn.title = "Copy code";
        copyBtn.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i>`;

        copyBtn.onclick = () => {
            const code = pre.querySelector("code")?.innerText || pre.innerText;
            navigator.clipboard.writeText(code).then(() => {
                showToast("Code copied to clipboard!", "success");
            });
        };

        pre.appendChild(copyBtn);
    });
    lucide.createIcons();
}

function copyAnswer(messageId) {
    const el = document.getElementById(messageId);
    if (!el) return;
    navigator.clipboard.writeText(el.innerText).then(() => {
        showToast("Answer copied to clipboard!", "success");
    });
}

function copySnippet(btn, snippet) {
    navigator.clipboard.writeText(snippet).then(() => {
        showToast("Excerpt snippet copied!", "success");
    });
}

function toggleSources(btn) {
    const panel = btn.nextElementSibling;
    const chevron = btn.querySelector("[data-lucide='chevron-down']");
    if (panel) {
        panel.classList.toggle("hidden");
        if (chevron) {
            chevron.classList.toggle("rotate-180");
        }
    }
}

function appendLoadingSkeleton() {
    const container = document.getElementById("messages-container");
    const id = "loading-" + Date.now();
    const div = document.createElement("div");
    div.id = id;
    div.className = "flex items-start space-x-3 max-w-3xl max-w-4xl mx-auto w-full";
    div.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-glow-brand mt-0.5">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
        </div>
        <div class="bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border rounded-2xl rounded-tl-sm p-4 shadow-soft dark:shadow-soft-dark w-full max-w-md">
            <div class="flex items-center space-x-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-3">
                <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i>
                <span>Retrieving document context & synthesizing...</span>
            </div>
            <div class="space-y-2">
                <div class="h-3 w-full rounded-full skeleton-shimmer"></div>
                <div class="h-3 w-4/5 rounded-full skeleton-shimmer"></div>
                <div class="h-3 w-2/3 rounded-full skeleton-shimmer"></div>
            </div>
        </div>
    `;
    container.appendChild(div);
    lucide.createIcons();
    return id;
}

function removeLoadingSkeleton(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function confirmClearChat() {
    showModal({
        title: "Reset Conversation Session",
        message: "Are you sure you want to clear this conversation history? The active document index in ChromaDB will not be deleted.",
        confirmText: "Reset Chat",
        confirmClass: "bg-slate-900 dark:bg-zinc-100 dark:text-slate-900 hover:bg-slate-800",
        onConfirm: clearChat
    });
}

async function clearChat() {
    try {
        await fetch("/api/chat/clear", { method: "POST" });
        showToast("Conversation history reset", "info");

        const container = document.getElementById("messages-container");
        container.innerHTML = `
            <div id="welcome-card" class="max-w-2xl mx-auto my-8 md:my-14 text-center p-6 md:p-10 rounded-3xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-soft dark:shadow-soft-dark">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 mx-auto flex items-center justify-center text-white mb-5 shadow-glow-brand">
                    <i data-lucide="sparkles" class="w-8 h-8"></i>
                </div>
                <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Chat with your documents
                </h2>
                <p class="text-sm text-slate-500 dark:text-zinc-400 mt-2.5 max-w-lg mx-auto leading-relaxed">
                    Chat session has been reset. Upload documents or click a starter question below.
                </p>

                <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <button onclick="askPreset('Provide a structured executive summary of the uploaded document(s).')" class="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/50 hover:border-brand-500/60 hover:shadow-md text-slate-800 dark:text-zinc-200 transition-all group cursor-pointer">
                        <div class="flex items-center space-x-2.5">
                            <div class="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                                <i data-lucide="file-text" class="w-4 h-4"></i>
                            </div>
                            <span class="text-xs font-bold">Executive Summary</span>
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 line-clamp-2">Summarize the core message and objectives.</p>
                    </button>

                    <button onclick="askPreset('What are the key statistics, figures, and numerical metrics mentioned?')" class="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/50 hover:border-brand-500/60 hover:shadow-md text-slate-800 dark:text-zinc-200 transition-all group cursor-pointer">
                        <div class="flex items-center space-x-2.5">
                            <div class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
                            </div>
                            <span class="text-xs font-bold">Key Figures & Metrics</span>
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 line-clamp-2">Extract quantitative findings and measurements.</p>
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons();
    } catch (err) {
        showToast("Error resetting chat: " + err.message, "error");
    }
}

function scrollToBottom() {
    const container = document.getElementById("messages-container");
    if (container) {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
        });
    }
}

function escapeHtml(string) {
    const entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };
    return String(string).replace(/[&<>"'/]/g, (s) => entityMap[s]);
}
