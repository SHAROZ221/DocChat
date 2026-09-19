// ==========================================================================
// DocChat — Clean Studio Minimalist Controller
// Design System: Neutral Apple / Notion Paper Aesthetic
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    setupDropZone();
    setupTextarea();
    setupGlobalShortcuts();
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
// Slide-Over Knowledge Base Drawer
// --------------------------------------------------------------------------
function openLibraryDrawer() {
    const drawer = document.getElementById("library-drawer");
    const backdrop = document.getElementById("drawer-backdrop");
    if (!drawer || !backdrop) return;

    drawer.classList.remove("drawer-closed");
    drawer.classList.add("drawer-open");
    backdrop.classList.remove("hidden");
    lucide.createIcons();
}

function closeLibraryDrawer() {
    const drawer = document.getElementById("library-drawer");
    const backdrop = document.getElementById("drawer-backdrop");
    if (!drawer || !backdrop) return;

    drawer.classList.remove("drawer-open");
    drawer.classList.add("drawer-closed");
    backdrop.classList.add("hidden");
}

function setupGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeLibraryDrawer();
            closeModal();
        }
    });
}

// --------------------------------------------------------------------------
// Toast Notification System
// --------------------------------------------------------------------------
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-enter pointer-events-auto flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium backdrop-blur-md shadow-studio-elevated transition-all ${
        type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
            : type === "error"
            ? "bg-rose-50 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800"
            : "bg-studio-card dark:bg-studio-darkCard text-studio-ink dark:text-studio-darkInk border-studio-border dark:border-studio-darkBorder"
    }`;

    const iconName = type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "info";
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
    }, 3500);
}

// --------------------------------------------------------------------------
// Custom Modal Dialogs
// --------------------------------------------------------------------------
function showModal({ title, message, confirmText = "Confirm", confirmClass = "bg-rose-600 hover:bg-rose-700", onConfirm }) {
    const container = document.getElementById("modal-container");
    const content = document.getElementById("modal-content");
    if (!container || !content) return;

    content.innerHTML = `
        <div class="flex items-start justify-between mb-3">
            <h3 class="text-sm font-bold text-studio-ink dark:text-studio-darkInk">${escapeHtml(title)}</h3>
            <button onclick="closeModal()" class="p-1 rounded-lg studio-pill hover:text-studio-ink dark:hover:text-studio-darkInk cursor-pointer">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
        </div>
        <p class="text-xs text-studio-muted dark:text-studio-darkMuted leading-relaxed mb-6">${escapeHtml(message)}</p>
        <div class="flex items-center justify-end space-x-2">
            <button onclick="closeModal()" class="px-3.5 py-1.5 text-xs font-medium text-studio-muted dark:text-studio-darkMuted hover:text-studio-ink dark:hover:text-studio-darkInk rounded-lg transition-colors cursor-pointer">
                Cancel
            </button>
            <button id="modal-confirm-btn" class="px-3.5 py-1.5 text-xs font-medium text-white rounded-lg shadow-studio-sm transition-all cursor-pointer ${confirmClass}">
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

    items.forEach(item => {
        const name = item.getAttribute("data-name") || "";
        if (name.includes(lowerQuery)) {
            item.classList.remove("hidden");
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
// Input Auto-Grow & Keyboard Shortcuts
// --------------------------------------------------------------------------
function setupTextarea() {
    const input = document.getElementById("question-input");
    if (input) {
        autoGrow(input);
    }
}

function autoGrow(element) {
    element.style.height = "auto";
    element.style.height = Math.min(element.scrollHeight, 160) + "px";
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
            dropZone.classList.add("border-studio-ink", "dark:border-studio-darkInk");
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("border-studio-ink", "dark:border-studio-darkInk");
        });
    });

    dropZone.addEventListener("drop", (e) => {
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    // Window drag-and-drop listener to auto-open drawer
    window.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    window.addEventListener("drop", (e) => {
        if (e.target.closest("#drop-zone")) return; // handled by drop-zone
        if (e.dataTransfer.files.length > 0) {
            e.preventDefault();
            openLibraryDrawer();
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
}

async function handleFileUpload(file) {
    const statusBox = document.getElementById("upload-status");
    const statusText = document.getElementById("upload-status-text");
    const fileInput = document.getElementById("file-input");

    if (statusBox) statusBox.classList.remove("hidden");
    if (statusText) {
        statusText.innerHTML = `
            <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin text-indigo-500"></i>
            <span class="truncate max-w-[200px]">Parsing '${file.name}'...</span>
        `;
        lucide.createIcons();
    }

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
                if (statusBox) statusBox.classList.add("hidden");
            }, 1000);
        } else {
            showToast(result.error || "Upload failed", "error");
            if (statusBox) statusBox.classList.add("hidden");
        }
    } catch (err) {
        showToast("Upload error: " + err.message, "error");
        if (statusBox) statusBox.classList.add("hidden");
    } finally {
        if (fileInput) fileInput.value = "";
    }
}

function renderDocumentList(documents) {
    const list = document.getElementById("document-list");
    const docCountBadge = document.getElementById("doc-count-badge");
    const headerDocCount = document.getElementById("header-doc-count");
    const headerDocCounterBadge = document.getElementById("header-doc-counter-badge");
    const totalChunksCount = document.getElementById("total-chunks-count");
    const inputDocStatus = document.getElementById("input-doc-status");

    const count = documents.length;
    const totalChunks = documents.reduce((sum, d) => sum + (d.chunks || 0), 0);

    if (docCountBadge) docCountBadge.textContent = count;
    if (headerDocCount) headerDocCount.textContent = count;
    if (headerDocCounterBadge) headerDocCounterBadge.textContent = count;
    if (totalChunksCount) totalChunksCount.textContent = totalChunks;
    if (inputDocStatus) inputDocStatus.textContent = `${count} doc(s) in context`;

    if (!list) return;

    if (count === 0) {
        list.innerHTML = `
            <li id="no-docs-item" class="text-xs text-studio-muted dark:text-studio-darkMuted italic py-10 text-center flex flex-col items-center">
                <div class="w-10 h-10 rounded-xl studio-surface flex items-center justify-center mb-2 text-studio-muted">
                    <i data-lucide="file-plus" class="w-5 h-5"></i>
                </div>
                <span class="font-medium text-studio-ink dark:text-studio-darkInk">No documents indexed yet</span>
                <span class="text-[11px] mt-1 text-studio-muted">Upload documents above to begin querying.</span>
            </li>
        `;
        lucide.createIcons();
        return;
    }

    list.innerHTML = documents.map(doc => {
        const ext = doc.name.split('.').pop().toLowerCase();
        let label = "TXT";
        if (ext === "pdf") label = "PDF";
        else if (ext === "docx") label = "DOC";
        else if (ext === "xlsx") label = "XLS";
        else if (ext === "pptx") label = "PPT";

        return `
            <li class="doc-item group flex items-center justify-between p-2.5 rounded-xl studio-card studio-card-interactive" data-name="${escapeHtml(doc.name.toLowerCase())}">
                <div class="flex items-center space-x-2.5 overflow-hidden flex-1 min-w-0 pr-2">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold studio-pill">
                        ${label}
                    </div>
                    <div class="flex flex-col min-w-0 flex-1">
                        <span class="text-xs font-medium text-studio-ink dark:text-studio-darkInk truncate" title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</span>
                        <span class="text-[10px] font-mono text-studio-muted dark:text-studio-darkMuted">${doc.chunks || 0} indexed vectors</span>
                    </div>
                </div>
                <button onclick="confirmDeleteDocument('${escapeHtml(doc.name)}')" class="opacity-0 group-hover:opacity-100 text-studio-muted hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer" title="Delete document">
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
        message: `Are you sure you want to remove "${sourceName}"? All its vector embeddings and search chunks will be permanently removed from ChromaDB.`,
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

    // Disable send button while answering
    const sendBtn = document.getElementById("send-button");
    if (sendBtn) sendBtn.disabled = true;

    const streamContext = createStreamingAssistantMessage();
    let sources = [];

    try {
        const response = await fetch("/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith("data: ")) {
                    const jsonStr = trimmed.slice(6);
                    try {
                        const payload = JSON.parse(jsonStr);
                        if (payload.type === "sources") {
                            sources = payload.sources || [];
                            if (sources.length > 0 && streamContext.sourcesContainer) {
                                streamContext.sourcesContainer.innerHTML = renderSourcesHtml(sources);
                                lucide.createIcons();
                            }
                        } else if (payload.type === "token") {
                            updateStreamingAssistantMessage(streamContext, payload.token);
                        } else if (payload.type === "done") {
                            finalizeStreamingAssistantMessage(streamContext, sources);
                        } else if (payload.type === "error") {
                            showToast(payload.error, "error");
                            updateStreamingAssistantMessage(streamContext, `\n\n⚠️ **Error:** ${payload.error}`);
                        }
                    } catch (e) {
                        console.error("Error parsing SSE data:", e, jsonStr);
                    }
                }
            }
        }

        finalizeStreamingAssistantMessage(streamContext, sources);

    } catch (err) {
        console.error("Streaming error:", err);
        if (streamContext && !streamContext.hasStarted) {
            streamContext.contentEl.innerHTML = `<p class="text-rose-600 dark:text-rose-400 text-sm">⚠️ **Error:** ${escapeHtml(err.message)}</p>`;
        } else {
            showToast("Streaming interrupted: " + err.message, "error");
        }
        finalizeStreamingAssistantMessage(streamContext, sources);
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        scrollToBottom();
    }
}

function createStreamingAssistantMessage() {
    const container = document.getElementById("messages-container");
    if (!container) return null;

    const div = document.createElement("div");
    div.className = "flex justify-start max-w-3xl lg:max-w-4xl mx-auto w-full";

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageId = "msg-" + Date.now();

    div.innerHTML = `
        <div class="flex items-start space-x-3 max-w-full w-full">
            <div class="w-7 h-7 rounded-lg bg-studio-surface dark:bg-studio-darkSurface text-studio-ink dark:text-studio-darkInk flex items-center justify-center flex-shrink-0 mt-0.5 border border-studio-border dark:border-studio-darkBorder">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            </div>
            <div class="flex flex-col flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1.5">
                    <span class="text-xs font-bold text-studio-ink dark:text-studio-darkInk">DocChat</span>
                    <span class="text-[10px] font-mono px-1.5 py-0.2 rounded studio-pill font-medium">Grounded RAG</span>
                    <span class="text-[10px] text-studio-muted dark:text-studio-darkMuted font-mono">${timestamp}</span>
                </div>
                <div class="studio-card rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-studio-card text-studio-ink dark:text-studio-darkInk w-full overflow-hidden">
                    <div class="prose-chat" id="${messageId}">
                        <div class="stream-placeholder flex items-center space-x-2 text-xs font-semibold text-studio-muted dark:text-studio-darkMuted">
                            <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin text-indigo-500"></i>
                            <span>Synthesizing response...</span>
                        </div>
                    </div>
                    <div class="sources-container"></div>
                    <!-- Bottom Action Bar -->
                    <div class="action-bar hidden mt-3 pt-2 flex items-center justify-end space-x-2 text-[11px] text-studio-muted dark:text-studio-darkMuted border-t border-studio-border dark:border-studio-darkBorder">
                        <button onclick="copyAnswer('${messageId}')" class="flex items-center space-x-1 px-2 py-1 rounded hover:text-studio-ink dark:hover:text-studio-darkInk transition-colors cursor-pointer" title="Copy answer">
                            <i data-lucide="copy" class="w-3 h-3"></i>
                            <span>Copy answer</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.appendChild(div);
    lucide.createIcons();
    scrollToBottom();

    return {
        wrapper: div,
        messageId: messageId,
        contentEl: div.querySelector(`#${messageId}`),
        sourcesContainer: div.querySelector(".sources-container"),
        actionBar: div.querySelector(".action-bar"),
        accumulatedText: "",
        hasStarted: false,
        isFinalized: false,
    };
}

function updateStreamingAssistantMessage(ctx, token) {
    if (!ctx || ctx.isFinalized) return;
    if (!ctx.hasStarted) {
        ctx.hasStarted = true;
        ctx.contentEl.innerHTML = "";
    }
    ctx.accumulatedText += token;
    const rawHtml = marked.parse(ctx.accumulatedText);
    ctx.contentEl.innerHTML = DOMPurify.sanitize(rawHtml) + '<span class="stream-cursor"></span>';
    scrollToBottom();
}

function finalizeStreamingAssistantMessage(ctx, sources = []) {
    if (!ctx || ctx.isFinalized) return;
    ctx.isFinalized = true;

    if (ctx.accumulatedText) {
        const rawHtml = marked.parse(ctx.accumulatedText);
        ctx.contentEl.innerHTML = DOMPurify.sanitize(rawHtml);
    }

    if (sources && sources.length > 0 && ctx.sourcesContainer && !ctx.sourcesContainer.innerHTML.trim()) {
        ctx.sourcesContainer.innerHTML = renderSourcesHtml(sources);
    }

    if (ctx.actionBar) {
        ctx.actionBar.classList.remove("hidden");
    }

    lucide.createIcons();
    setupCodeBlockCopy(ctx.wrapper);
    scrollToBottom();
}

function renderSourcesHtml(sources) {
    if (!sources || sources.length === 0) return "";
    return `
        <div class="mt-4 pt-3.5 border-t border-studio-border dark:border-studio-darkBorder">
            <button onclick="toggleSources(this)" class="flex items-center space-x-2 text-xs font-semibold text-studio-muted dark:text-studio-darkMuted hover:text-studio-ink dark:hover:text-studio-darkInk transition-colors cursor-pointer group">
                <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
                <span>Cited Document Sources (${sources.length})</span>
                <i data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-y-0.5"></i>
            </button>
            <div class="sources-panel hidden mt-3 space-y-2">
                ${sources.map((src) => {
                    const pct = Math.round((src.score || 0) * 100);

                    return `
                        <div class="p-3 rounded-xl studio-card text-xs">
                            <div class="flex items-center justify-between font-medium text-studio-ink dark:text-studio-darkInk mb-1">
                                <div class="flex items-center space-x-2 truncate max-w-[280px] sm:max-w-[400px]">
                                    <i data-lucide="file-text" class="w-3 h-3 text-studio-muted"></i>
                                    <span class="font-semibold truncate" title="${escapeHtml(src.source)}">${escapeHtml(src.source)}</span>
                                    <span class="text-studio-muted dark:text-studio-darkMuted text-[10px] font-mono">p.${escapeHtml(String(src.page))}</span>
                                </div>
                                <div class="flex items-center space-x-2 flex-shrink-0">
                                    <span class="text-[10px] font-mono px-2 py-0.5 rounded studio-pill font-semibold">
                                        ${pct}% match
                                    </span>
                                    <button onclick="copySnippet(this, '${escapeHtml(src.snippet)}')" class="text-studio-muted hover:text-studio-ink dark:hover:text-studio-darkInk p-1 rounded transition-colors cursor-pointer" title="Copy snippet">
                                        <i data-lucide="copy" class="w-3 h-3"></i>
                                    </button>
                                </div>
                            </div>
                            <p class="text-studio-muted dark:text-studio-darkMuted text-[11px] leading-relaxed italic border-l-2 border-studio-border dark:border-studio-darkBorder pl-2.5 my-1.5">
                                "${escapeHtml(src.snippet)}"
                            </p>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}

function appendUserMessage(text) {
    const container = document.getElementById("messages-container");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "flex justify-end max-w-3xl lg:max-w-4xl mx-auto w-full";

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="flex items-end space-x-2.5 max-w-xl sm:max-w-2xl">
            <div class="flex flex-col items-end">
                <div class="bg-studio-ink text-white dark:bg-studio-darkInk dark:text-studio-darkBg rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed shadow-studio-sm">
                    <p class="whitespace-pre-wrap">${escapeHtml(text)}</p>
                </div>
                <span class="text-[10px] text-studio-muted dark:text-studio-darkMuted mt-1 font-mono">${timestamp}</span>
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
    div.className = "flex justify-start max-w-3xl lg:max-w-4xl mx-auto w-full";

    const rawHtml = marked.parse(text);
    const sanitizedHtml = DOMPurify.sanitize(rawHtml);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageId = "msg-" + Date.now();
    const sourcesHtml = renderSourcesHtml(sources);

    div.innerHTML = `
        <div class="flex items-start space-x-3 max-w-full w-full">
            <div class="w-7 h-7 rounded-lg bg-studio-surface dark:bg-studio-darkSurface text-studio-ink dark:text-studio-darkInk flex items-center justify-center flex-shrink-0 mt-0.5 border border-studio-border dark:border-studio-darkBorder">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            </div>
            <div class="flex flex-col flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1.5">
                    <span class="text-xs font-bold text-studio-ink dark:text-studio-darkInk">DocChat</span>
                    <span class="text-[10px] font-mono px-1.5 py-0.2 rounded studio-pill font-medium">Grounded RAG</span>
                    <span class="text-[10px] text-studio-muted dark:text-studio-darkMuted font-mono">${timestamp}</span>
                </div>
                <div class="studio-card rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-studio-card text-studio-ink dark:text-studio-darkInk w-full overflow-hidden">
                    <div class="prose-chat" id="${messageId}">${sanitizedHtml}</div>
                    ${sourcesHtml}
                    <!-- Bottom Action Bar -->
                    <div class="mt-3 pt-2 flex items-center justify-end space-x-2 text-[11px] text-studio-muted dark:text-studio-darkMuted border-t border-studio-border dark:border-studio-darkBorder">
                        <button onclick="copyAnswer('${messageId}')" class="flex items-center space-x-1 px-2 py-1 rounded hover:text-studio-ink dark:hover:text-studio-darkInk transition-colors cursor-pointer" title="Copy answer">
                            <i data-lucide="copy" class="w-3 h-3"></i>
                            <span>Copy answer</span>
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
        copyBtn.className = "absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-sm transition-all cursor-pointer border border-white/10";
        copyBtn.title = "Copy code";
        copyBtn.innerHTML = `<i data-lucide="copy" class="w-3 h-3"></i>`;

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
        showToast("Snippet copied!", "success");
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
    div.className = "flex items-start space-x-3 max-w-3xl lg:max-w-4xl mx-auto w-full";
    div.innerHTML = `
        <div class="w-7 h-7 rounded-lg bg-studio-surface dark:bg-studio-darkSurface text-studio-ink dark:text-studio-darkInk flex items-center justify-center flex-shrink-0 mt-0.5 border border-studio-border dark:border-studio-darkBorder">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        </div>
        <div class="studio-card rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-studio-card w-full max-w-md">
            <div class="flex items-center space-x-2 text-xs font-semibold text-studio-muted dark:text-studio-darkMuted mb-3">
                <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin text-indigo-500"></i>
                <span>Retrieving context & synthesizing...</span>
            </div>
            <div class="space-y-2">
                <div class="h-3 w-full rounded skeleton-shimmer"></div>
                <div class="h-3 w-4/5 rounded skeleton-shimmer"></div>
                <div class="h-3 w-2/3 rounded skeleton-shimmer"></div>
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
        confirmClass: "bg-studio-ink dark:bg-studio-darkInk text-white dark:text-studio-darkBg hover:opacity-90",
        onConfirm: clearChat
    });
}

async function clearChat() {
    try {
        await fetch("/api/chat/clear", { method: "POST" });
        showToast("Conversation history reset", "info");

        const container = document.getElementById("messages-container");
        container.innerHTML = `
            <div id="welcome-card" class="max-w-xl mx-auto my-12 md:my-20 text-center">
                <div class="w-12 h-12 rounded-xl bg-studio-ink dark:bg-studio-darkInk text-white dark:text-studio-darkBg mx-auto flex items-center justify-center mb-4 shadow-studio-sm">
                    <i data-lucide="sparkles" class="w-6 h-6"></i>
                </div>
                <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-studio-ink dark:text-studio-darkInk">
                    Grounded Document Intelligence
                </h1>
                <p class="text-sm text-studio-muted dark:text-studio-darkMuted mt-2 max-w-md mx-auto leading-relaxed">
                    Chat session has been reset. Upload documents to begin querying.
                </p>
                <div class="mt-6 flex items-center justify-center gap-3">
                    <button onclick="openLibraryDrawer()" class="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-studio-ink dark:bg-studio-darkInk text-white dark:text-studio-darkBg hover:opacity-90 transition-all cursor-pointer shadow-studio-sm">
                        <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>
                        <span>Manage & Upload Documents</span>
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
