(function () {
  "use strict";

  // ==========================================================================
  // DeepSeek 对话模块（以 C 语言问答为主，也允许简短日常对话）
  // 用户只需要填一个 API Key，其余全部在这里预配置好。
  // 隐私：Key 只保存在本机浏览器的 localStorage，不发往除 DeepSeek 官方接口以外的任何地方。
  // ==========================================================================
  var CHAT_CONFIG = {
    endpoint: "https://api.deepseek.com/chat/completions",
    keyPageUrl: "https://platform.deepseek.com/api_keys",
    pricingUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    // 官方 2026-10 文档里的模型 id：deepseek-flash = DeepSeek-V4.1-Flash。
    // 只保留这一个模型，避免选到不被支持的 id（deepseek-v41-flash / deepseek-v4-pro 等一律不用）。
    model: "deepseek-flash",
    modelLabel: "deepseek-flash（DeepSeek-V4.1-Flash）",
    modelChoices: ["deepseek-flash"],
    // 历史遗留/不支持的模型名：读到就丢掉并用默认模型，绝不发给服务端
    staleModelNames: ["deepseek-v41-flash", "deepseek-v4.1-flash", "deepseek-v4-flash",
      "deepseek-chat", "deepseek-reasoner", "deepseek-v4-pro", "deepseek-reasoner-flash"],
    // 官方取值 low/high/max；medium 在官方映射表里等价于 high（思考模式默认就是 high）
    reasoningEffort: "medium",                                     // 用户要求：中等推理强度
    reasoningChoices: ["low", "medium", "high"],
    temperature: 0.3,
    maxTokens: 1024,
    timeoutMs: 60000,
    storageKey: "csyntax.deepseek.apiKey",
    modelStorageKey: "csyntax.deepseek.model",
    effortStorageKey: "csyntax.deepseek.reasoningEffort",
    historyStorageKey: "csyntax.deepseek.history",
    panelSizeStorageKey: "csyntax.deepseek.panelSize",
    historyLimit: 20
  };

  var TOPIC_RULE = "你是一个以 C 语言为主的助教，重点回答 C 语言语法、C 标准库、编译与链接错误、程序调试、以及本词典词条相关的问题。"
    + "也允许简单日常对话，例如问好、道谢、闲聊一两句，或回答“你是谁”“你能做什么”；自然简短回应即可，不要长篇大论。"
    + "对于写小说或文案、代写整篇作业或论文、以及其它专业领域的深入咨询（例如医疗、法律、投资建议），用一句中文礼貌拒绝并引导回 C 语言，不要展开。"
    + "回答用简体中文，尽量短，能用代码说明就用代码；不确定的地方要说不确定，不要编造标准里没有的行为。";

  var REVIEW_RULE = "现在是批改模式：请只检查学生的代码并给建议。指出问题（编译错误、逻辑错误、边界、风格）时要点明原因和位置；"
    + "不要重写学生的代码、不要直接给出完整答案；需要示例时最多给 1–2 行片段。回答用简体中文、分条、尽量短。";

  var GENERATE_RULE = "现在是出题模式：围绕【当前练习】的知识点，出 {N} 道**基础难度**的练习题。"
    + "风格请参考浙江大学翁恺《程序设计入门——C 语言》的课后练习：题目短（参考答案 8–15 行）、只考一个知识点、"
    + "把输入输出格式写清楚（例如「按 fahr=150 celsius=65 的格式输出一行」），像「温度转换」「时间换算」「逆序三位数」「数位数」「判断闰年」那样的小题。"
    + "每道题只允许出现最基础的函数：printf，加上整数运算、if、for/while、switch，最多再有一个自己写的小函数；"
    + "不要用 scanf 等需要键盘输入的东西；不要读写真实文件，也不要用 tmpfile；不要用 freopen、动态内存、可变参数、递归或位运算。"
    + "每题都要给出【题目】、【要求】（2–4 条可判定要求，越直白越好）、【提示】、【参考答案】和【预期输出】；"
    + "【参考答案】必须是完整可编译的 C 程序，包含 int main(void) 与 return 0;，并且尽量短；"
    + "【预期输出】必须与程序实际输出逐字节一致。答案必须能通过 gcc -std=c11 -Wall -Wextra 零告警；"
    + "输出只用 ASCII（英文、数字、符号），避免中文乱码。"
    + "不要重复当前已有的这道题，不要输出与 C 语言无关的内容；用简体中文讲解。"
    + "只输出题目本身，不要客套话，不要重写用户已有的代码。";

  // ------------------------------------------------------------------ 存储
  function readStorage(key) {
    try { return window.localStorage ? window.localStorage.getItem(key) : null; } catch (error) { return null; }
  }
  function writeStorage(key, value) {
    try {
      if (!window.localStorage) return false;
      if (value === null || value === undefined) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
      return true;
    } catch (error) { return false; }
  }

  function sanitize(text) {
    return String(text === undefined || text === null ? "" : text).replace(/sk-[A-Za-z0-9_\-]{4,}/g, "sk-***");
  }
  function maskKey(key) {
    var value = String(key || "");
    if (value.length <= 8) return "sk-****";
    return value.slice(0, 3) + "****" + value.slice(-4);
  }

  // 只允许使用配置里列出的模型；localStorage 里如果是旧版本留下的其它模型名，直接丢掉并回落到默认模型。
  function storedModel() {
    var saved = readStorage(CHAT_CONFIG.modelStorageKey);
    if (saved && CHAT_CONFIG.modelChoices.indexOf(saved) !== -1) return saved;
    if (saved) writeStorage(CHAT_CONFIG.modelStorageKey, null);   // 清掉陈旧值，避免每次都被服务端拒绝
    return CHAT_CONFIG.model;
  }
  function isStaleModel(name) {
    var value = String(name || "");
    return value !== CHAT_CONFIG.model &&
      (CHAT_CONFIG.staleModelNames.indexOf(value) !== -1 || /v4[.-]?1|v41/i.test(value));
  }

  // ------------------------------------------------------- system prompt 组装
  function currentEntry() {
    return window.C_SYNTAX_CURRENT_ENTRY || null;
  }
  function buildSystemPrompt(options) {
    var opts = options || {};
    var lines = [TOPIC_RULE];
    if (opts.mode === "review") lines.push(REVIEW_RULE);
    if (opts.mode === "generate") lines.push(GENERATE_RULE.replace("{N}", normalizeGenerateCount(opts.count)));
    var entry = currentEntry();
    if (entry) {
      lines.push("");
      lines.push("【用户当前正在翻阅的词条】");
      lines.push("名称：" + entry.name + "（分类：" + entry.category + "）");
      lines.push("所需头文件：" + ((entry.headers && entry.headers.length) ? entry.headers.map(function (h) { return "#include <" + h + ">"; }).join(" ") : "无需头文件（纯语法）"));
      if (entry.behavior) lines.push("作用：" + entry.behavior);
      if (entry.usage) lines.push("用法：" + entry.usage);
      if (entry.syntax) lines.push("语法：" + entry.syntax);
      if (entry.example) lines.push("完整示例：\n" + entry.example);
      if (entry.notes && entry.notes.length) lines.push("注意事项：" + entry.notes.join("；"));
      lines.push("如果用户的提问与这个词条有关（例如“这个怎么用”“它返回什么”），直接结合上面的内容回答。");
    }
    return lines.join("\n");
  }

  function buildMessages(history, question, options) {
    var messages = [{ role: "system", content: buildSystemPrompt(options) }];
    (history || []).forEach(function (item) {
      if (item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string") {
        messages.push({ role: item.role, content: item.content });
      }
    });
    messages.push({ role: "user", content: String(question || "") });
    return messages;
  }

  function buildPayload(question, history, options) {
    var opts = options || {};
    var payload = {
      model: opts.model || CHAT_CONFIG.model,
      messages: buildMessages(history, question, opts),
      temperature: CHAT_CONFIG.temperature,
      max_tokens: opts.mode === "generate" ? Math.max(4000, CHAT_CONFIG.maxTokens) : CHAT_CONFIG.maxTokens,
      stream: false
    };
    if (opts.includeReasoning !== false) payload.reasoning_effort = opts.reasoningEffort || CHAT_CONFIG.reasoningEffort;
    return payload;
  }

  function buildReviewQuestion(exercise, code) {
    var item = exercise || {};
    var requirements = Array.isArray(item.requirements) ? item.requirements : [];
    return "我在做这道练习，请帮我检查。\n"
      + "【题目】" + String(item.prompt || "") + "\n"
      + "【要求】\n" + requirements.map(function (requirement, index) {
        return (index + 1) + ". " + requirement;
      }).join("\n") + "\n"
      + "【我的代码】\n```c\n" + String(code || "") + "\n```";
  }

  function normalizeGenerateCount(count) {
    var numeric = Number(count);
    return numeric === 1 || numeric === 5 ? numeric : 3;
  }

  function exerciseEntryNames(exercise) {
    var item = exercise || {};
    var ids = Array.isArray(item.entryIds) ? item.entryIds : [];
    var source = Array.isArray(window.C_SYNTAX_ENTRIES) ? window.C_SYNTAX_ENTRIES : [];
    return ids.map(function (id) {
      var entry = source.find(function (candidate) { return candidate && candidate.id === id; });
      return entry && entry.name ? entry.name : id;
    });
  }

  function buildGenerateQuestion(exercise, count, note) {
    var item = exercise || {};
    var amount = normalizeGenerateCount(count);
    var requirements = Array.isArray(item.requirements) ? item.requirements : [];
    var difficulty = { 1: "入门", 2: "进阶", 3: "综合" }[item.difficulty] || "未标记";
    var lines = [
      "请按出题模式生成 " + amount + " 道新题。",
      "【当前练习】",
      "标题：" + String(item.title || ""),
      "题目：" + String(item.prompt || ""),
      "要求：\n" + requirements.map(function (requirement, index) {
        return (index + 1) + ". " + requirement;
      }).join("\n"),
      "难度：" + difficulty + "（出题时请按入门水平来，宁可简单也不要偏难）",
      "关联词条：" + (exerciseEntryNames(item).join("、") || "无"),
      "题量：" + amount,
      "难度偏好：像浙大翁恺课后题那样的小题——只考一个知识点、参考答案 8~15 行、输入输出格式写清楚，只用 printf 与整数运算 / if / for / while / switch（最多再有一个自己写的小函数）"
    ];
    var trimmedNote = String(note || "").trim();
    if (trimmedNote) lines.push("侧重：" + trimmedNote);
    return lines.join("\n");
  }

  function buildGeneratePrompt(exercise, count, note) {
    var amount = normalizeGenerateCount(count);
    return buildMessages([], buildGenerateQuestion(exercise, amount, note), { mode: "generate", count: amount });
  }

  function mapError(status, bodyText) {
    var body = sanitize(bodyText || "").slice(0, 300);
    if (status === 401 || status === 403) return "API Key 无效或已过期。请点「清除 Key」后重新填写（" + status + "）。";
    if (status === 402) return "账户余额不足，请到 DeepSeek 平台充值后再试（402）。";
    if (status === 404 && /model/i.test(body)) return "服务端不认识这个模型名（404）。本页面固定使用 " + CHAT_CONFIG.model + "，请刷新页面后再试。服务端说：" + body;
    if (status === 404) return "接口地址或资源不存在（404）。服务端说：" + body;
    if (status === 400 && /model/i.test(body) && !/reasoning/i.test(body)) {
      return "服务端不接受这个模型名（400）。本页面固定使用 " + CHAT_CONFIG.model + "（官方 DeepSeek-V4.1-Flash 的模型 id）；"
        + "如果你打开的是旧版文件，请换成最新的单文件版。服务端说：" + body;
    }
    if (status === 429) return "请求太频繁或额度用尽，稍后再试（429）。";
    if (status >= 500) return "DeepSeek 服务端出错（" + status + "），稍后再试。";
    return "请求失败（" + status + "）。服务端说：" + body;
  }

  // ------------------------------------------------------------------ DOM
  var els = {};
  var state = {
    history: [], busy: false, controller: null, keyDraft: "", panelSize: null,
    maximized: false, preMaximizeSize: null, resizeSession: null
  };
  var PANEL_DEFAULT_WIDTH = 420;
  var PANEL_DEFAULT_HEIGHT = 620;
  var PANEL_MIN_WIDTH = 320;
  var PANEL_MIN_HEIGHT = 320;
  var PANEL_MAX_WIDTH = 900;
  var PANEL_VIEWPORT_WIDTH_RATIO = 0.96;
  var PANEL_VIEWPORT_HEIGHT_RATIO = 0.92;
  var PANEL_NARROW_BREAKPOINT = 760;
  var PANEL_DEFAULT_RIGHT = 20;
  var PANEL_DEFAULT_BOTTOM = 78;
  var RESIZE_DIRECTIONS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

  function viewportSize() {
    return {
      width: Math.max(1, Number(window.innerWidth) || 1200),
      height: Math.max(1, Number(window.innerHeight) || 900)
    };
  }

  function normalizePanelSize(width, height) {
    var viewport = viewportSize();
    var narrow = viewport.width <= PANEL_NARROW_BREAKPOINT;
    var maxWidth = Math.min(PANEL_MAX_WIDTH, viewport.width * PANEL_VIEWPORT_WIDTH_RATIO);
    var maxHeight = viewport.height * PANEL_VIEWPORT_HEIGHT_RATIO;
    var minWidth = Math.min(PANEL_MIN_WIDTH, maxWidth);
    var minHeight = Math.min(PANEL_MIN_HEIGHT, maxHeight);
    var numericWidth = Number(width);
    var numericHeight = Number(height);
    if (!Number.isFinite(numericWidth)) numericWidth = PANEL_DEFAULT_WIDTH;
    if (!Number.isFinite(numericHeight)) numericHeight = PANEL_DEFAULT_HEIGHT;
    return {
      // 窄屏由 CSS 强制整宽；内存里保留桌面宽度，避免手机打开一次就覆盖桌面偏好。
      width: Math.round(narrow ? Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, numericWidth)) :
        Math.min(maxWidth, Math.max(minWidth, numericWidth))),
      height: Math.round(Math.min(maxHeight, Math.max(minHeight, numericHeight)))
    };
  }

  function maximumPanelSize() {
    var viewport = viewportSize();
    return normalizePanelSize(Math.min(PANEL_MAX_WIDTH, viewport.width * PANEL_VIEWPORT_WIDTH_RATIO),
      viewport.height * PANEL_VIEWPORT_HEIGHT_RATIO);
  }

  function isDesktopPanel() {
    return viewportSize().width > PANEL_NARROW_BREAKPOINT;
  }

  function clampPanelPosition(size) {
    if (!els.panel || !els.panel.style || !isDesktopPanel()) return;
    var viewport = viewportSize();
    var rect = typeof els.panel.getBoundingClientRect === "function" ? els.panel.getBoundingClientRect() : null;
    var trustworthyRect = !els.panel.hidden && rect && Number.isFinite(rect.width) && rect.width >= 1 &&
      Number.isFinite(rect.height) && rect.height >= 1 && Number.isFinite(rect.right) && Number.isFinite(rect.bottom);
    // hidden/display:none 会得到全 0 矩形；此时绝不能用“视口 - 0”反推位置。
    // 保留现有内联值（没有内联值时继续由样式表的 20px / 78px 生效），等面板可见后再夹紧。
    if (!trustworthyRect) return;
    var right = viewport.width - rect.right;
    var bottom = viewport.height - rect.bottom;
    if (!Number.isFinite(right)) right = parseFloat(els.panel.style.right);
    if (!Number.isFinite(bottom)) bottom = parseFloat(els.panel.style.bottom);
    if (!Number.isFinite(right)) right = PANEL_DEFAULT_RIGHT;
    if (!Number.isFinite(bottom)) bottom = PANEL_DEFAULT_BOTTOM;
    els.panel.style.right = Math.round(Math.min(Math.max(0, viewport.width - rect.width), Math.max(0, right))) + "px";
    els.panel.style.bottom = Math.round(Math.min(Math.max(0, viewport.height - rect.height), Math.max(0, bottom))) + "px";
  }

  function resetPanelPosition() {
    if (!els.panel || !els.panel.style) return;
    // 每次打开都回到样式表定义的右下角；空字符串会恢复 CSS 的 20px / 78px。
    els.panel.style.right = "";
    els.panel.style.bottom = "";
  }

  function applyPanelSize(size) {
    var normalized = normalizePanelSize(size && size.width, size && size.height);
    state.panelSize = normalized;
    if (els.panel && els.panel.style) {
      els.panel.style.width = viewportSize().width <= PANEL_NARROW_BREAKPOINT ? "" : normalized.width + "px";
      els.panel.style.height = normalized.height + "px";
    }
    return { width: normalized.width, height: normalized.height };
  }

  function panelSize() {
    if (els.panel && !els.panel.hidden && typeof els.panel.getBoundingClientRect === "function") {
      var rect = els.panel.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        state.panelSize = normalizePanelSize(rect.width, rect.height);
      }
    }
    var current = state.panelSize || normalizePanelSize(PANEL_DEFAULT_WIDTH, PANEL_DEFAULT_HEIGHT);
    return { width: current.width, height: current.height };
  }

  function setPanelSize(width, height) {
    var size = applyPanelSize({ width: width, height: height });
    clampPanelPosition(size);
    if (!state.maximized && isDesktopPanel()) {
      writeStorage(CHAT_CONFIG.panelSizeStorageKey, JSON.stringify(size));
    }
    return size;
  }

  function applyStoredPanelSize() {
    var raw = readStorage(CHAT_CONFIG.panelSizeStorageKey);
    var stored = null;
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.width === "number" && Number.isFinite(parsed.width) &&
          typeof parsed.height === "number" && Number.isFinite(parsed.height)) stored = parsed;
      } catch (error) { /* 非法尺寸按默认值恢复。 */ }
    }
    var size = applyPanelSize(stored || { width: PANEL_DEFAULT_WIDTH, height: PANEL_DEFAULT_HEIGHT });
    if (raw && isDesktopPanel()) {
      if (stored) writeStorage(CHAT_CONFIG.panelSizeStorageKey, JSON.stringify(size));
      else writeStorage(CHAT_CONFIG.panelSizeStorageKey, null);
    }
    return size;
  }

  function updateMaximizeButton() {
    if (!els.maximize) return;
    var label = state.maximized ? "还原" : "放大";
    els.maximize.setAttribute("aria-pressed", state.maximized ? "true" : "false");
    els.maximize.setAttribute("aria-label", label + " DeepSeek 对话面板");
    els.maximize.textContent = (state.maximized ? "↙ " : "↗ ") + label;
  }

  function togglePanelMaximize() {
    if (!isDesktopPanel()) return panelSize();
    var size;
    if (!state.maximized) {
      state.preMaximizeSize = panelSize();
      state.maximized = true;
      size = applyPanelSize(maximumPanelSize());
    } else {
      var restoreSize = state.preMaximizeSize || { width: PANEL_DEFAULT_WIDTH, height: PANEL_DEFAULT_HEIGHT };
      state.maximized = false;
      state.preMaximizeSize = null;
      size = setPanelSize(restoreSize.width, restoreSize.height);
    }
    clampPanelPosition(size);
    updateMaximizeButton();
    return panelSize();
  }

  function resizedPanelSize(direction, startSize, deltaX, deltaY) {
    var width = startSize.width;
    var height = startSize.height;
    if (direction.indexOf("e") !== -1) width += deltaX;
    if (direction.indexOf("w") !== -1) width -= deltaX;
    if (direction.indexOf("s") !== -1) height += deltaY;
    if (direction.indexOf("n") !== -1) height -= deltaY;
    return normalizePanelSize(width, height);
  }

  function beginPanelResize(event) {
    if (!isDesktopPanel() || (event.button !== undefined && event.button !== 0)) return;
    var handle = event.currentTarget;
    var direction = handle && handle.getAttribute ? handle.getAttribute("data-resize") : "";
    if (RESIZE_DIRECTIONS.indexOf(direction) === -1) return;
    var startSize = panelSize();
    var rect = els.panel.getBoundingClientRect();
    var viewport = viewportSize();
    state.resizeSession = {
      pointerId: event.pointerId,
      direction: direction,
      startX: Number(event.clientX) || 0,
      startY: Number(event.clientY) || 0,
      startSize: startSize,
      startLeft: rect.left,
      startTop: rect.top,
      startRight: viewport.width - rect.right,
      startBottom: viewport.height - rect.bottom,
      handle: handle
    };
    if (handle.setPointerCapture && event.pointerId !== undefined) handle.setPointerCapture(event.pointerId);
    if (event.preventDefault) event.preventDefault();
  }

  function movePanelResize(event) {
    var session = state.resizeSession;
    if (!session || (event.pointerId !== undefined && session.pointerId !== undefined && event.pointerId !== session.pointerId)) return;
    var deltaX = (Number(event.clientX) || 0) - session.startX;
    var deltaY = (Number(event.clientY) || 0) - session.startY;
    var size = resizedPanelSize(session.direction, session.startSize, deltaX, deltaY);
    applyPanelSize(size);
    var viewport = viewportSize();
    // 拖右边/下边时固定相对的左边/上边；拖左边/上边时 right/bottom 保持不动。
    if (session.direction.indexOf("e") !== -1) {
      els.panel.style.right = Math.round(Math.max(0, viewport.width - session.startLeft - size.width)) + "px";
    } else els.panel.style.right = Math.round(Math.max(0, session.startRight)) + "px";
    if (session.direction.indexOf("s") !== -1) {
      els.panel.style.bottom = Math.round(Math.max(0, viewport.height - session.startTop - size.height)) + "px";
    } else els.panel.style.bottom = Math.round(Math.max(0, session.startBottom)) + "px";
    if (event.preventDefault) event.preventDefault();
  }

  function finishPanelResize(event) {
    var session = state.resizeSession;
    if (!session || (event.pointerId !== undefined && session.pointerId !== undefined && event.pointerId !== session.pointerId)) return;
    state.resizeSession = null;
    if (session.handle.releasePointerCapture && session.pointerId !== undefined) {
      try { session.handle.releasePointerCapture(session.pointerId); } catch (error) { /* 捕获已释放时无需处理。 */ }
    }
    // 放大态拖拽只改变当前显示；放大前基准保留，普通态仅在结束时写一次。
    var size = panelSize();
    clampPanelPosition(size);
    if (!state.maximized) writeStorage(CHAT_CONFIG.panelSizeStorageKey, JSON.stringify(size));
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildUi() {
    var launcher = el("button", "chat-launcher", "问 DeepSeek");
    launcher.type = "button";
    launcher.setAttribute("aria-label", "打开 DeepSeek 对话");

    var panel = el("section", "chat-panel");
    panel.hidden = true;
    panel.setAttribute("aria-label", "DeepSeek 对话");

    var header = el("header", "chat-header");
    var title = el("div", "chat-title");
    title.appendChild(el("strong", "", "问 DeepSeek"));
    title.appendChild(el("span", "chat-topic-hint", "C 语言问答，也可以简单聊两句"));
    header.appendChild(title);
    var headerActions = el("div", "chat-header-actions");
    var maximize = el("button", "chat-maximize", "↗ 放大");
    maximize.type = "button";
    maximize.setAttribute("aria-label", "放大 DeepSeek 对话面板");
    maximize.setAttribute("aria-pressed", "false");
    headerActions.appendChild(maximize);
    var close = el("button", "chat-close", "关闭");
    close.type = "button";
    headerActions.appendChild(close);
    header.appendChild(headerActions);
    panel.appendChild(header);

    // —— 没有 Key 时的引导区（含用户要求的「没有api？」按钮）——
    var gate = el("div", "chat-gate");
    gate.appendChild(el("p", "chat-gate-title", "填入你的 DeepSeek API Key 即可开始使用"));
    var keyInput = document.createElement("input");
    keyInput.type = "password";
    keyInput.className = "chat-key-input";
    keyInput.placeholder = "sk-...";
    keyInput.autocomplete = "off";
    keyInput.spellcheck = false;
    gate.appendChild(keyInput);
    var gateRow = el("div", "chat-gate-row");
    var saveKey = el("button", "chat-primary", "保存并开始");
    saveKey.type = "button";
    gateRow.appendChild(saveKey);
    gate.appendChild(gateRow);
    // 用户明确要求：按钮上面有「没有api？」字样，点了跳转到 DeepSeek 平台获取 Key
    gate.appendChild(el("p", "chat-nokey-hint", "没有api？"));
    var keyLink = document.createElement("a");
    keyLink.className = "chat-getkey";
    keyLink.href = CHAT_CONFIG.keyPageUrl;
    keyLink.target = "_blank";
    keyLink.rel = "noopener noreferrer";
    keyLink.textContent = "去 DeepSeek 平台获取 API Key";
    gate.appendChild(keyLink);
    gate.appendChild(el("p", "chat-privacy", "Key 只保存在本机浏览器（localStorage），不会上传到任何地方，也不会写进文件。"));
    // 计费提示：所有模型选项都是 API 调用，会按 token 扣账户余额（不是免费的网页版）
    var billing = el("p", "chat-billing", "提示：面板里所有模型都走 API，会按 token 从你的账户余额扣费（网页版 chat.deepseek.com 的免费额度与这里无关）。不填 Key 不会发出任何请求。");
    gate.appendChild(billing);
    var pricingLink = document.createElement("a");
    pricingLink.className = "chat-pricing-link";
    pricingLink.href = CHAT_CONFIG.pricingUrl;
    pricingLink.target = "_blank";
    pricingLink.rel = "noopener noreferrer";
    pricingLink.textContent = "查看官方计费说明";
    gate.appendChild(pricingLink);
    panel.appendChild(gate);

    // —— 对话区 ——
    var body = el("div", "chat-body");
    var messages = el("div", "chat-messages");
    body.appendChild(messages);
    panel.appendChild(body);

    var tools = el("div", "chat-tools");
    // 只保留 flash 一个模型：这里显示成静态标签，不给用户选到不被支持的 id 的机会
    tools.appendChild(el("span", "chat-tools-label", "模型"));
    tools.appendChild(el("span", "chat-model-badge", CHAT_CONFIG.modelLabel));
    var effortSelect = document.createElement("select");
    effortSelect.className = "chat-select";
    CHAT_CONFIG.reasoningChoices.forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      option.textContent = "推理强度：" + name;
      effortSelect.appendChild(option);
    });
    tools.appendChild(effortSelect);
    var clearHistory = el("button", "chat-tool-button", "清空对话");
    clearHistory.type = "button";
    tools.appendChild(clearHistory);
    var clearKey = el("button", "chat-tool-button", "清除 Key");
    clearKey.type = "button";
    tools.appendChild(clearKey);
    var keyState = el("span", "chat-key-state", "");
    tools.appendChild(keyState);
    panel.appendChild(tools);

    var composer = el("div", "chat-composer");
    var input = document.createElement("textarea");
    input.className = "chat-input";
    input.rows = 2;
    input.placeholder = "问点什么，例如：malloc 和 calloc 有什么区别？（Enter 发送，Shift+Enter 换行）";
    composer.appendChild(input);
    var sendRow = el("div", "chat-send-row");
    var send = el("button", "chat-primary", "发送");
    send.type = "button";
    var stop = el("button", "chat-tool-button", "停止");
    stop.type = "button";
    stop.hidden = true;
    sendRow.appendChild(send);
    sendRow.appendChild(stop);
    composer.appendChild(sendRow);
    panel.appendChild(composer);

    var resizeHandles = [];
    RESIZE_DIRECTIONS.forEach(function (direction) {
      var handle = el("div", "chat-resize-handle chat-resize-" + direction);
      handle.setAttribute("data-resize", direction);
      handle.setAttribute("aria-hidden", "true");
      panel.appendChild(handle);
      resizeHandles.push(handle);
    });

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    els = {
      launcher: launcher, panel: panel, gate: gate, keyInput: keyInput, saveKey: saveKey, keyLink: keyLink,
      messages: messages, body: body, input: input, send: send, stop: stop, tools: tools,
      effortSelect: effortSelect, clearHistory: clearHistory, clearKey: clearKey,
      keyState: keyState, close: close, header: header, maximize: maximize, resizeHandles: resizeHandles
    };
    updateMaximizeButton();
  }

  // ------------------------------------------------------------------ 渲染
  function addBubble(role, text) {
    var bubble = el("div", "chat-bubble chat-" + role);
    bubble.appendChild(el("div", "chat-bubble-text", text));
    els.messages.appendChild(bubble);
    els.body.scrollTop = els.body.scrollHeight;
    return bubble;
  }
  function renderHistory() {
    els.messages.replaceChildren();
    if (!state.history.length) {
      addBubble("system", "你好，我是以 C 语言为主的助教。可以问我语法、标准库函数、编译报错，或者简单聊两句。");
    }
    state.history.forEach(function (item) { addBubble(item.role, item.content); });
  }
  function refreshKeyUi() {
    var key = readStorage(CHAT_CONFIG.storageKey);
    var hasKey = Boolean(key);
    els.gate.hidden = hasKey;
    els.tools.hidden = !hasKey;
    els.keyState.textContent = hasKey ? "Key：" + maskKey(key) : "";
    els.input.disabled = !hasKey;
    els.send.disabled = !hasKey;
    storedModel();   // 顺手清掉旧版本留下的、不被支持的模型名
    var savedEffort = readStorage(CHAT_CONFIG.effortStorageKey);
    els.effortSelect.value = CHAT_CONFIG.reasoningChoices.indexOf(savedEffort) !== -1
      ? savedEffort : CHAT_CONFIG.reasoningEffort;
  }
  function loadHistory() {
    var raw = readStorage(CHAT_CONFIG.historyStorageKey);
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (item) { return item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string"; })
        .slice(-CHAT_CONFIG.historyLimit);
    } catch (error) { return []; }
  }
  function saveHistory() {
    writeStorage(CHAT_CONFIG.historyStorageKey, JSON.stringify(state.history.slice(-CHAT_CONFIG.historyLimit)));
  }

  // ------------------------------------------------------------------ 请求
  function requestDeepSeek(question, options, history) {
    var requestOptions = options || {};
    var key = readStorage(CHAT_CONFIG.storageKey);
    if (!key) return Promise.reject(new Error("NO_KEY"));
    var model = storedModel();
    var savedEffort = readStorage(CHAT_CONFIG.effortStorageKey);
    var effort = CHAT_CONFIG.reasoningChoices.indexOf(savedEffort) !== -1 ? savedEffort : CHAT_CONFIG.reasoningEffort;

    function once(options) {
      var opts = options || {};
      var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      state.controller = controller;
      var timer = setTimeout(function () { if (controller) controller.abort(); }, CHAT_CONFIG.timeoutMs);
      return fetch(CHAT_CONFIG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
        body: JSON.stringify(buildPayload(question, history || [], {
          model: opts.model || model,
          reasoningEffort: effort,
          includeReasoning: opts.includeReasoning !== false,
          mode: requestOptions.mode,
          count: requestOptions.count
        })),
        signal: controller ? controller.signal : undefined
      }).then(function (response) {
        return response.text().then(function (text) { return { ok: response.ok, status: response.status, text: text }; });
      }).finally(function () { clearTimeout(timer); });
    }

    // 服务端抱怨模型名的两种情况：400 里带 "model"、或 404 Model Not Exist
    function isModelRejection(result) {
      if (result.ok) return false;
      if (result.status === 404 && /model/i.test(result.text)) return true;
      return result.status === 400 && /model/i.test(result.text) && !/reasoning/i.test(result.text);
    }

    return once({}).then(function (result) {
      if (isModelRejection(result) && model !== CHAT_CONFIG.model) {
        // 旧版本可能把不支持的模型名留在本地；这里自动改用官方 id 重试一次
        writeStorage(CHAT_CONFIG.modelStorageKey, null);
        return once({ model: CHAT_CONFIG.model }).then(function (retry) {
          retry.notice = "检测到不被支持的模型名，已自动改用 " + CHAT_CONFIG.model + " 重试。";
          return retry;
        });
      }
      if (!result.ok && result.status === 400 && /reasoning/i.test(result.text)) {
        return once({ includeReasoning: false }).then(function (retry) {
          retry.notice = "该模型不接受推理强度参数，已按默认强度重试。";
          return retry;
        });
      }
      return result;
    }).then(function (result) {
      if (!result.ok) {
        var error = new Error(mapError(result.status, result.text));
        error.status = result.status;
        throw error;
      }
      var data;
      try { data = JSON.parse(result.text); } catch (error) { throw new Error("返回内容无法解析：" + sanitize(result.text).slice(0, 200)); }
      if (!data || !data.choices || !data.choices.length || !data.choices[0].message) {
        throw new Error("返回结构异常：" + sanitize(result.text).slice(0, 200));
      }
      return { text: data.choices[0].message.content || "(空回复)", notice: result.notice, usage: data.usage };
    });
  }

  function send(question, options) {
    if (state.busy) return Promise.resolve();
    var providedQuestion = typeof question === "string";
    var message = providedQuestion ? question.trim() : els.input.value.trim();
    var requestOptions = options || {};
    if (!message) return Promise.resolve();
    if (!readStorage(CHAT_CONFIG.storageKey)) { refreshKeyUi(); return Promise.resolve(); }
    var previousHistory = state.history.slice();
    if (!providedQuestion) els.input.value = "";
    state.history.push({ role: "user", content: message });
    addBubble("user", message);
    saveHistory();
    state.busy = true;
    els.send.disabled = true;
    els.stop.hidden = false;
    var pending = addBubble("assistant", "思考中…");
    return requestDeepSeek(message, requestOptions, previousHistory).then(function (result) {
      pending.remove();
      addBubble("assistant", result.text);
      if (result.notice) addBubble("system", result.notice);
      state.history.push({ role: "assistant", content: result.text });
      saveHistory();
    }).catch(function (error) {
      pending.remove();
      addBubble("system", readableRequestError(error));
    }).finally(function () {
      state.busy = false;
      state.controller = null;
      els.send.disabled = false;
      els.stop.hidden = true;
      els.input.focus();
    });
  }

  function reviewCode(payload) {
    var item = payload || {};
    var exercise = item.exercise || {};
    var code = String(item.code || "").trim();
    if (!code || !readStorage(CHAT_CONFIG.storageKey) || typeof document === "undefined") {
      return Promise.resolve(false);
    }
    els.launcher.click();
    return send(buildReviewQuestion(exercise, code), { mode: "review", exercise: exercise });
  }

  function readableRequestError(error) {
    if (error && error.name === "AbortError") return "本次请求已停止。";
    if (error && error.message === "NO_KEY") return "请先填入 API Key。";
    if (error && (error.name === "TypeError" || /Failed to fetch|NetworkError|Load failed/i.test(String(error.message)))) {
      return "连不上 DeepSeek，请检查网络或代理（本词典的离线查询不受影响）。";
    }
    return sanitize((error && error.message) || "未知错误");
  }

  function generateExercises(payload) {
    var options = payload || {};
    var exercise = options.exercise || {};
    var count = normalizeGenerateCount(options.count);
    var onStart = typeof options.onStart === "function" ? options.onStart : function () {};
    var onDone = typeof options.onDone === "function" ? options.onDone : function () {};
    var onError = typeof options.onError === "function" ? options.onError : function () {};
    if (!readStorage(CHAT_CONFIG.storageKey)) {
      onError("请先填入 API Key。");
      return Promise.resolve(false);
    }
    onStart();
    return requestDeepSeek(buildGenerateQuestion(exercise, count, options.note), {
      mode: "generate",
      count: count
    }, []).then(function (result) {
      onDone(result.text, result);
      return result.text;
    }).catch(function (error) {
      onError(readableRequestError(error), error);
      return false;
    });
  }

  function notifyKeyChanged() {
    if (typeof window.dispatchEvent !== "function" || typeof CustomEvent === "undefined") return;
    window.dispatchEvent(new CustomEvent("csyntax:api-key-changed"));
  }

  // ------------------------------------------------------------------ 事件
  function wire() {
    els.launcher.addEventListener("click", function () {
      els.panel.hidden = false;
      resetPanelPosition();
      var size = state.maximized ? applyPanelSize(maximumPanelSize()) : applyStoredPanelSize();
      clampPanelPosition(size);
      updateMaximizeButton();
      refreshKeyUi();
      renderHistory();
      if (readStorage(CHAT_CONFIG.storageKey)) els.input.focus();
      else els.keyInput.focus();
    });
    els.close.addEventListener("click", function () {
      if (state.controller) state.controller.abort();
      els.panel.hidden = true;
    });
    els.maximize.addEventListener("click", function () { togglePanelMaximize(); });
    els.header.addEventListener("dblclick", function (event) {
      var target = event.target;
      if (target && ((typeof target.closest === "function" && target.closest("button")) || target.tagName === "BUTTON")) return;
      togglePanelMaximize();
    });
    els.resizeHandles.forEach(function (handle) {
      handle.addEventListener("pointerdown", beginPanelResize);
      handle.addEventListener("pointermove", movePanelResize);
      handle.addEventListener("pointerup", finishPanelResize);
      handle.addEventListener("pointercancel", finishPanelResize);
    });
    els.saveKey.addEventListener("click", function () {
      var value = els.keyInput.value.trim();
      if (!value) { els.keyInput.focus(); return; }
      writeStorage(CHAT_CONFIG.storageKey, value);
      notifyKeyChanged();
      els.keyInput.value = "";
      refreshKeyUi();
      renderHistory();
      addBubble("system", "已在本机保存 Key（只存在这个浏览器的 localStorage 里）。");
      els.input.focus();
    });
    els.clearKey.addEventListener("click", function () {
      writeStorage(CHAT_CONFIG.storageKey, null);
      notifyKeyChanged();
      refreshKeyUi();
      addBubble("system", "已清除本机保存的 Key。");
    });
    els.clearHistory.addEventListener("click", function () {
      state.history = [];
      saveHistory();
      renderHistory();
    });
    els.effortSelect.addEventListener("change", function () { writeStorage(CHAT_CONFIG.effortStorageKey, els.effortSelect.value); });
    els.send.addEventListener("click", function () { send(); });
    els.stop.addEventListener("click", function () { if (state.controller) state.controller.abort(); });
    els.input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        send();
      }
    });
    window.addEventListener("resize", function () {
      var size;
      if (state.maximized) size = applyPanelSize(maximumPanelSize());
      else {
        var current = state.panelSize || { width: PANEL_DEFAULT_WIDTH, height: PANEL_DEFAULT_HEIGHT };
        size = applyPanelSize(current);
        if (isDesktopPanel()) writeStorage(CHAT_CONFIG.panelSizeStorageKey, JSON.stringify(size));
      }
      if (!els.panel.hidden) clampPanelPosition(size);
      updateMaximizeButton();
    });
  }

  // ------------------------------------------------------------- 测试与调试钩子
  window.C_SYNTAX_CHAT = {
    config: CHAT_CONFIG,
    state: state,
    buildSystemPrompt: buildSystemPrompt,
    buildMessages: buildMessages,
    buildPayload: buildPayload,
    buildReviewQuestion: buildReviewQuestion,
    buildGeneratePrompt: buildGeneratePrompt,
    buildGenerateQuestion: buildGenerateQuestion,
    mapError: mapError,
    sanitize: sanitize,
    storedModel: storedModel,
    isStaleModel: isStaleModel,
    maskKey: maskKey,
    send: send,
    reviewCode: reviewCode,
    generateExercises: generateExercises,
    panelSize: panelSize,
    setPanelSize: setPanelSize,
    applyStoredPanelSize: applyStoredPanelSize,
    maximumPanelSize: maximumPanelSize,
    resizedPanelSize: resizedPanelSize,
    togglePanelMaximize: togglePanelMaximize,
    storage: { read: readStorage, write: writeStorage },
    open: function () { els.launcher.click(); },
    elements: function () { return els; }
  };

  if (typeof document === "undefined") return;
  try {
    buildUi();
    applyStoredPanelSize();
    wire();
    state.history = loadHistory();
    refreshKeyUi();
    renderHistory();
  } catch (error) {
    // 聊天模块出问题时，绝不影响词典本身的离线查询
    if (window.console && console.warn) console.warn("chat 模块初始化失败：", error);
  }
}());
