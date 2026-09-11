// DocChat Frontend Controller

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    setupDropZone();
    lucide.createIcons();
});

// ----------------------------------------------------
// Theme Management
// ----------------------------------------------------
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

// ----------------------------------------------------
// Input Auto-Grow & Keyboard
// ----------------------------------------------------
function autoGrow(element) {
    element.style.height = "auto";
    element.style.height = Math.min(element.scrollHeight, 140) + "px";
    const charCount = document.getElementById("char-count");
    if (charCount) {
        charCount.textContent = `${element.value.length} chars`;
    }
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

// ----------------------------------------------------
// File Upload & Drag-and-Drop
// ----------------------------------------------------
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
            dropZone.classList.add("border-brand-500", "bg-brand-50/50", "dark:bg-slate-800");
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("border-brand-500", "bg-brand-50/50", "dark:bg-slate-800");
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
    statusText.textContent = `Processing '${file.name}'...`;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            statusText.textContent = `✓ Indexed ${result.filename} (${result.chunks_count} chunks)`;
            renderDocumentList(result.documents);
            setTimeout(() => {
                statusBox.classList.add("hidden");
            }, 3500);
        } else {
            statusText.textContent = `✗ ${result.error || "Upload failed"}`;
        }
    } catch (err) {
        statusText.textContent = `✗ Error: ${err.message}`;
    } finally {
        fileInput.value = "";
    }
}

function renderDocumentList(documents) {
    const list = document.getElementById("document-list");
    const docCount = document.getElementById("doc-count");
    const headerBadge = document.getElementById("header-doc-badge");

    if (!list) return;

    if (docCount) docCount.textContent = documents.length;
    if (headerBadge) headerBadge.textContent = `${documents.length} doc(s) indexed`;

    if (documents.length === 0) {
        list.innerHTML = `<li id="no-docs-item" class="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center">No documents uploaded yet.</li>`;
        return;
    }

    list.innerHTML = documents.map(doc => `
        <li class="group flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors" data-source="${escapeHtml(doc)}">
            <div class="flex items-center space-x-2.5 overflow-hidden">
                <i data-lucide="file-text" class="w-4 h-4 text-brand-500 flex-shrink-0"></i>
                <span class="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[190px]" title="${escapeHtml(doc)}">${escapeHtml(doc)}</span>
            </div>
            <button onclick="deleteDocument('${escapeHtml(doc)}')" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 rounded transition-opacity" title="Remove document">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        </li>
    `).join("");

    lucide.createIcons();
}

async function deleteDocument(sourceName) {
    if (!confirm(`Delete "${sourceName}" and all its searchable vectors?`)) return;

    try {
        const response = await fetch(`/api/documents/${encodeURIComponent(sourceName)}`, {
            method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
            renderDocumentList(result.documents);
        } else {
            alert(result.error || "Failed to delete document.");
        }
    } catch (err) {
        alert("Error deleting document: " + err.message);
    }
}

// ----------------------------------------------------
// Chat & Q&A
// ----------------------------------------------------
async function submitQuestion(event) {
    if (event) event.preventDefault();

    const input = document.getElementById("question-input");
    const question = input.value.trim();
    if (!question) return;

    // Reset input
    input.value = "";
    autoGrow(input);

    // Hide welcome card if visible
    const welcome = document.getElementById("welcome-card");
    if (welcome) welcome.classList.add("hidden");

    // Append user message
    appendMessage("user", question);

    // Append loading skeleton
    const loadingId = appendLoadingIndicator();
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

        // Remove loading
        removeLoadingIndicator(loadingId);

        if (data.success) {
            appendMessage("assistant", data.answer, data.sources);
        } else {
            appendMessage("assistant", `⚠️ **Error:** ${data.error || "Something went wrong."}`);
        }
    } catch (err) {
        removeLoadingIndicator(loadingId);
        appendMessage("assistant", `⚠️ **Network Error:** ${err.message}`);
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        scrollToBottom();
    }
}

function appendMessage(role, text, sources = []) {
    const container = document.getElementById("messages-container");
    if (!container) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `flex ${role === "user" ? "justify-end" : "justify-start"} max-w-4xl mx-auto w-full`;

    if (role === "user") {
        messageDiv.innerHTML = `
            <div class="max-w-2xl bg-brand-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-sm text-sm">
                <p class="whitespace-pre-wrap">${escapeHtml(text)}</p>
            </div>
        `;
    } else {
        const htmlContent = marked.parse(text);
        let sourcesHtml = "";

        if (sources && sources.length > 0) {
            sourcesHtml = `
                <div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button onclick="toggleSources(this)" class="flex items-center space-x-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                        <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
                        <span>Cited Sources (${sources.length})</span>
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform"></i>
                    </button>
                    <div class="sources-panel hidden mt-2.5 space-y-2">
                        ${sources.map((src, i) => `
                            <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                                <div class="flex items-center justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    <span class="flex items-center space-x-1">
                                        <i data-lucide="file" class="w-3 h-3 text-slate-400"></i>
                                        <span class="truncate max-w-[200px]">${escapeHtml(src.source)} (p. ${escapeHtml(String(src.page))})</span>
                                    </span>
                                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                                        score: ${src.score}
                                    </span>
                                </div>
                                <p class="text-slate-500 dark:text-slate-400 italic text-[11px] leading-relaxed">
                                    "${escapeHtml(src.snippet)}"
                                </p>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="flex items-start space-x-3 max-w-3xl">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-primary-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                    <i data-lucide="bot" class="w-4 h-4"></i>
                </div>
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm p-4 shadow-sm text-slate-800 dark:text-slate-200 w-full overflow-hidden">
                    <div class="prose-chat">${htmlContent}</div>
                    ${sourcesHtml}
                </div>
            </div>
        `;
    }

    container.appendChild(messageDiv);
    lucide.createIcons();
    scrollToBottom();
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

function appendLoadingIndicator() {
    const container = document.getElementById("messages-container");
    const id = "loading-" + Date.now();
    const div = document.createElement("div");
    div.id = id;
    div.className = "flex items-start space-x-3 max-w-3xl max-w-4xl mx-auto w-full";
    div.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-primary-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
            <i data-lucide="bot" class="w-4 h-4"></i>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
            <div class="flex items-center space-x-3 py-1">
                <div class="dot-flashing"></div>
                <span class="text-xs text-slate-400 dark:text-slate-500 ml-4 font-medium">Searching documents & thinking...</span>
            </div>
        </div>
    `;
    container.appendChild(div);
    lucide.createIcons();
    return id;
}

function removeLoadingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

async function clearChat() {
    if (!confirm("Are you sure you want to reset this chat conversation?")) return;

    try {
        await fetch("/api/chat/clear", { method: "POST" });
        const container = document.getElementById("messages-container");
        container.innerHTML = `
            <div id="welcome-card" class="max-w-xl mx-auto my-12 text-center p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-primary-500 mx-auto flex items-center justify-center text-white mb-4 shadow-lg">
                    <i data-lucide="sparkles" class="w-7 h-7"></i>
                </div>
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">Ask anything about your documents</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Chat session has been reset. Upload documents or ask a question to begin.
                </p>
            </div>
        `;
        lucide.createIcons();
    } catch (err) {
        alert("Error resetting chat: " + err.message);
    }
}

function scrollToBottom() {
    const container = document.getElementById("messages-container");
    if (container) {
        container.scrollTop = container.scrollHeight;
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
