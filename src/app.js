(function () {
  "use strict";

  var THEME_STORAGE_KEY = "csyntax.theme.v2";
  var LEGACY_THEME_STORAGE_KEY = "csyntax.theme";
  var THEME_ORDER = ["light", "blue", "dark"];

  function isSupportedTheme(value) {
    return THEME_ORDER.indexOf(value) !== -1;
  }

  function getThemeStorage(scope) {
    try { return scope && scope.localStorage ? scope.localStorage : null; }
    catch (error) { return null; }
  }

  function readStoredTheme(storage) {
    if (!storage) return "";
    try {
      var value = storage.getItem(THEME_STORAGE_KEY);
      if (isSupportedTheme(value)) {
        if (storage.getItem(LEGACY_THEME_STORAGE_KEY) !== null) storage.removeItem(LEGACY_THEME_STORAGE_KEY);
        return value;
      }
      if (value !== null) storage.removeItem(THEME_STORAGE_KEY);
      var legacyValue = storage.getItem(LEGACY_THEME_STORAGE_KEY);
      if (legacyValue === null) return "";
      var migratedTheme = legacyValue === "dark" ? "blue" : (legacyValue === "light" ? "light" : "");
      if (migratedTheme) storage.setItem(THEME_STORAGE_KEY, migratedTheme);
      storage.removeItem(LEGACY_THEME_STORAGE_KEY);
      return migratedTheme;
    } catch (error) { /* 存储被禁用时仍允许本次页面切换。 */ }
    return "";
  }

  function applyTheme(theme, root) {
    if (!root) return;
    var selectedTheme = isSupportedTheme(theme) ? theme : "blue";
    root.setAttribute("data-theme", selectedTheme);
    if (root.style && typeof root.style.setProperty === "function") {
      root.style.setProperty("--theme-index", String(THEME_ORDER.indexOf(selectedTheme)));
    }
  }

  function initializeTheme(root, storage) {
    var theme = readStoredTheme(storage) || "blue";
    applyTheme(theme, root);
    return theme;
  }

  function effectiveTheme(root) {
    var explicitTheme = root && root.getAttribute("data-theme");
    if (isSupportedTheme(explicitTheme)) return explicitTheme;
    return "blue";
  }

  function updateThemeSlider(slider, theme) {
    if (!slider) return;
    var selectedTheme = isSupportedTheme(theme) ? theme : "blue";
    var buttons = Array.prototype.slice.call(slider.querySelectorAll('[role="radio"][data-theme-value]'));
    buttons.forEach(function (button) {
      var checked = button.getAttribute("data-theme-value") === selectedTheme;
      button.setAttribute("aria-checked", checked ? "true" : "false");
      button.setAttribute("tabindex", checked ? "0" : "-1");
    });
    if (slider.style && typeof slider.style.setProperty === "function") {
      slider.style.setProperty("--theme-index", String(THEME_ORDER.indexOf(selectedTheme)));
    }
  }

  function setupThemeSlider(slider, root, storage) {
    if (!slider || !root) return;
    var buttons = Array.prototype.slice.call(slider.querySelectorAll('[role="radio"][data-theme-value]'));

    function selectTheme(selectedTheme, focusSelected) {
      applyTheme(selectedTheme, root);
      try { if (storage) storage.setItem(THEME_STORAGE_KEY, selectedTheme); }
      catch (error) { /* 存储不可用不影响当前页面切换。 */ }
      updateThemeSlider(slider, selectedTheme);
      if (focusSelected) {
        var selectedButton = buttons[THEME_ORDER.indexOf(selectedTheme)];
        if (selectedButton && typeof selectedButton.focus === "function") selectedButton.focus();
      }
    }

    updateThemeSlider(slider, effectiveTheme(root));
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        selectTheme(button.getAttribute("data-theme-value"), false);
      });
      button.addEventListener("keydown", function (event) {
        var currentIndex = THEME_ORDER.indexOf(button.getAttribute("data-theme-value"));
        var nextIndex = -1;
        if (event.key === "ArrowLeft") nextIndex = (currentIndex + THEME_ORDER.length - 1) % THEME_ORDER.length;
        else if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % THEME_ORDER.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = THEME_ORDER.length - 1;
        if (nextIndex === -1) return;
        event.preventDefault();
        selectTheme(THEME_ORDER[nextIndex], true);
      });
    });
  }

  var themeStorage = typeof window !== "undefined" ? getThemeStorage(window) : null;
  if (typeof document !== "undefined") initializeTheme(document.documentElement, themeStorage);

  var ALL_CATEGORY = "全部";
  var ALL_HEADER = "全部头文件";
  var CATEGORIES = [
    "入门基础", "实战运用", "工具与环境",
    "基础语法", "数据类型", "运算符", "流程控制", "函数", "数组与字符串", "指针",
    "结构体·联合·枚举", "内存管理", "预处理", "标准库函数", "文件 IO", "常见易错点"
  ];

  function searchableText(entry) {
    return [entry.name]
      .concat(entry.aliases, entry.keywords || [], entry.headers, [entry.behavior, entry.usage, entry.summary, entry.syntax], entry.notes)
      .join("\n")
      .toLocaleLowerCase();
  }

  function headerOptions(entries) {
    var headers = [];
    entries.forEach(function (entry) {
      entry.headers.forEach(function (header) {
        if (!headers.includes(header)) headers.push(header);
      });
    });
    return [ALL_HEADER].concat(headers.sort(function (left, right) {
      return left.localeCompare(right, "en");
    }));
  }

  function filterEntriesWithMode(entries, query, category, header) {
    var normalizedQuery = String(query || "").trim().toLocaleLowerCase();
    var selectedCategory = category || ALL_CATEGORY;
    var selectedHeader = header || ALL_HEADER;
    var facetMatches = entries.filter(function (entry) {
      var categoryMatches = selectedCategory === ALL_CATEGORY || entry.category === selectedCategory;
      var headerMatches = selectedHeader === ALL_HEADER || entry.headers.includes(selectedHeader);
      return categoryMatches && headerMatches;
    });
    if (!normalizedQuery) return { entries: facetMatches, exampleFallback: false };

    var matches = facetMatches.filter(function (entry) {
      return searchableText(entry).includes(normalizedQuery);
    });
    if (!matches.length) {
      return {
        entries: facetMatches.filter(function (entry) {
          return entry.example.toLocaleLowerCase().includes(normalizedQuery);
        }),
        exampleFallback: true
      };
    }

    function relevance(entry) {
      var name = entry.name.toLocaleLowerCase();
      var aliases = entry.aliases.map(function (alias) { return alias.toLocaleLowerCase(); });
      var keywords = (entry.keywords || []).map(function (keyword) { return keyword.toLocaleLowerCase(); });
      if (name === normalizedQuery) return 0;
      if (aliases.includes(normalizedQuery)) return 1;
      if (name.startsWith(normalizedQuery)) return 2;
      if (name.includes(normalizedQuery)) return 3;
      if (aliases.some(function (alias) { return alias.includes(normalizedQuery); })) return 4;
      // 关键词命中排在"正文里碰巧出现"之前：先精确命中，再包含命中
      if (keywords.includes(normalizedQuery)) return 5;
      if (keywords.some(function (keyword) { return keyword.includes(normalizedQuery); })) return 6;
      if (entry.headers.some(function (value) { return value.toLocaleLowerCase().includes(normalizedQuery); })) return 7;
      if (typeof entry.behavior === "string" && entry.behavior.toLocaleLowerCase().includes(normalizedQuery)) return 8;
      if (entry.usage.toLocaleLowerCase().includes(normalizedQuery)) return 9;
      if (entry.summary.toLocaleLowerCase().includes(normalizedQuery)) return 10;
      if (entry.syntax.toLocaleLowerCase().includes(normalizedQuery)) return 11;
      if (entry.notes.some(function (note) { return note.toLocaleLowerCase().includes(normalizedQuery); })) return 12;
      return 13;
    }

    matches = matches.map(function (entry, index) {
      return { entry: entry, index: index, score: relevance(entry) };
    }).sort(function (left, right) {
      return left.score - right.score || left.index - right.index;
    }).map(function (item) { return item.entry; });
    return { entries: matches, exampleFallback: false };
  }

  function filterEntries(entries, query, category, header) {
    return filterEntriesWithMode(entries, query, category, header).entries;
  }

  function resultCountText(count, total, hasQuery, hasCategory, exampleFallback) {
    if (exampleFallback) return "在示例代码中匹配 " + count + " 条 / 共 " + total + " 条";
    var prefix = hasQuery || hasCategory ? "命中" : "共";
    return prefix + " " + count + " 条 / 共 " + total + " 条";
  }

  function matchPreview(entry, query) {
    var needle = String(query || "").trim().toLocaleLowerCase();
    if (!needle) return entry.summary;
    var candidates = [entry.name].concat(entry.aliases, entry.keywords || [], entry.headers, [entry.behavior, entry.usage, entry.summary, entry.syntax, entry.example], entry.notes);
    return candidates.find(function (value) {
      return String(value).toLocaleLowerCase().includes(needle);
    }) || entry.summary;
  }

  function appendHighlightedText(parent, text, query) {
    var source = String(text);
    var needle = String(query || "").trim();
    if (!needle) {
      parent.appendChild(document.createTextNode(source));
      return;
    }
    var lowerSource = source.toLocaleLowerCase();
    var lowerNeedle = needle.toLocaleLowerCase();
    var cursor = 0;
    var index = lowerSource.indexOf(lowerNeedle, cursor);
    while (index !== -1) {
      parent.appendChild(document.createTextNode(source.slice(cursor, index)));
      var mark = document.createElement("mark");
      mark.textContent = source.slice(index, index + needle.length);
      parent.appendChild(mark);
      cursor = index + needle.length;
      index = lowerSource.indexOf(lowerNeedle, cursor);
    }
    parent.appendChild(document.createTextNode(source.slice(cursor)));
  }

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function isTypingTarget(target) {
    var node = target && target.nodeType === 3 ? target.parentElement : target;
    while (node) {
      var tagName = node.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || node.isContentEditable === true) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function exercisesForEntry(exercises, entryId) {
    return (Array.isArray(exercises) ? exercises : []).filter(function (exercise) {
      return exercise && Array.isArray(exercise.entryIds) && exercise.entryIds.indexOf(entryId) !== -1;
    });
  }

  function difficultyLabel(difficulty) {
    return { 1: "入门", 2: "进阶", 3: "综合" }[difficulty] || "未标记";
  }

  function hasDeepSeekKey(storage) {
    try {
      var source = storage || window.localStorage;
      return Boolean(source && source.getItem("csyntax.deepseek.apiKey"));
    } catch (error) { return false; }
  }

  function learningPosition(entryId, stages) {
    var safeStages = Array.isArray(stages) ? stages : [];
    for (var stageIndex = 0; stageIndex < safeStages.length; stageIndex += 1) {
      var patterns = Array.isArray(safeStages[stageIndex].match) ? safeStages[stageIndex].match : [];
      var stageOrder = patterns.indexOf(entryId);
      if (stageOrder === -1) {
        stageOrder = patterns.findIndex(function (pattern) {
          return pattern !== "*" && typeof pattern === "string" && entryId.indexOf(pattern) === 0;
        });
      }
      if (stageOrder === -1) stageOrder = patterns.indexOf("*");
      if (stageOrder !== -1) {
        return { stageIndex: stageIndex, stageOrder: stageOrder, stage: safeStages[stageIndex] };
      }
    }
    return { stageIndex: safeStages.length, stageOrder: Number.MAX_SAFE_INTEGER, stage: null };
  }

  function sortEntriesByLearningPath(entries, stages) {
    return (Array.isArray(entries) ? entries : []).map(function (entry, index) {
      return { entry: entry, index: index, position: learningPosition(entry.id, stages) };
    }).sort(function (left, right) {
      return left.position.stageIndex - right.position.stageIndex ||
        left.position.stageOrder - right.position.stageOrder || left.index - right.index;
    }).map(function (item) { return item.entry; });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      filterEntries: filterEntries,
      filterEntriesWithMode: filterEntriesWithMode,
      resultCountText: resultCountText,
      searchableText: searchableText,
      headerOptions: headerOptions,
      exercisesForEntry: exercisesForEntry,
      difficultyLabel: difficultyLabel,
      learningPosition: learningPosition,
      sortEntriesByLearningPath: sortEntriesByLearningPath,
      isTypingTarget: isTypingTarget,
      hasDeepSeekKey: hasDeepSeekKey,
      isSupportedTheme: isSupportedTheme,
      readStoredTheme: readStoredTheme,
      applyTheme: applyTheme,
      initializeTheme: initializeTheme,
      effectiveTheme: effectiveTheme,
      updateThemeSlider: updateThemeSlider,
      setupThemeSlider: setupThemeSlider
    };
  }

  if (typeof document === "undefined") return;

  var entries = Array.isArray(window.C_SYNTAX_ENTRIES) ? window.C_SYNTAX_ENTRIES : [];
  var exercises = Array.isArray(window.C_SYNTAX_EXERCISES) ? window.C_SYNTAX_EXERCISES : [];
  var learningPath = window.C_SYNTAX_LEARNING_PATH && typeof window.C_SYNTAX_LEARNING_PATH === "object"
    ? window.C_SYNTAX_LEARNING_PATH : {};
  var learningStages = Array.isArray(learningPath.stages) ? learningPath.stages : [];

  // 把生成表里的中文关键词挂到词条上；生成表缺项时保留词条内联关键词。
  (function attachKeywords() {
    var table = window.C_SYNTAX_KEYWORDS;
    if (!table || typeof table !== "object") return;
    entries.forEach(function (entry) {
      var list = table[entry.id];
      entry.keywords = Array.isArray(list) ? list.slice() : (Array.isArray(entry.keywords) ? entry.keywords : []);
    });
  }());
  var searchInput = document.getElementById("search-input");
  var categorySelect = document.getElementById("category-select");
  var headerSelect = document.getElementById("header-select");
  var resultList = document.getElementById("result-list");
  var resultCount = document.getElementById("result-count");
  var detailPanel = document.getElementById("detail-panel");
  var emptyState = document.getElementById("empty-state");
  var emptyMessage = document.getElementById("empty-message");
  var clearSearch = document.getElementById("clear-search");
  var toast = document.getElementById("toast");
  var stageDirectory = document.getElementById("stage-directory");
  var stageDirectoryList = document.getElementById("stage-directory-list");
  var themeSlider = document.querySelector(".theme-slider");
  setupThemeSlider(themeSlider, document.documentElement, themeStorage);
  var filtered = entries.slice();
  var selectedIndex = entries.length ? 0 : -1;
  var openedId = "";
  var roadmapExpanded = true;
  var toastTimer;
  var entryNavigationFrame;
  var detailFlashTimer;
  var EXERCISE_DRAFTS_KEY = "csyntax.exercise.drafts";
  var exerciseGenerations = new Map();
  var exerciseGenerationViews = new Map();

  function loadExerciseDrafts() {
    var drafts = new Map();
    try {
      var raw = window.sessionStorage && window.sessionStorage.getItem(EXERCISE_DRAFTS_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return drafts;
      Object.keys(parsed).forEach(function (exerciseId) {
        if (typeof parsed[exerciseId] === "string") drafts.set(exerciseId, parsed[exerciseId]);
      });
    } catch (error) { /* sessionStorage 不可用或数据损坏时只使用内存草稿。 */ }
    return drafts;
  }

  var exerciseDrafts = loadExerciseDrafts();

  function saveExerciseDraft(exerciseId, value) {
    exerciseDrafts.set(exerciseId, value);
    try {
      if (!window.sessionStorage) return;
      var serialized = {};
      exerciseDrafts.forEach(function (draft, id) { serialized[id] = draft; });
      window.sessionStorage.setItem(EXERCISE_DRAFTS_KEY, JSON.stringify(serialized));
    } catch (error) { /* 存储受限时仍保留当前页面内的 Map 草稿。 */ }
  }

  function populateCategories() {
    [ALL_CATEGORY].concat(CATEGORIES).forEach(function (category) {
      var option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });
  }

  function populateHeaders() {
    headerOptions(entries).forEach(function (header) {
      var option = document.createElement("option");
      option.value = header;
      option.textContent = header;
      headerSelect.appendChild(option);
    });
  }

  function renderStageDirectory() {
    if (!stageDirectory || !stageDirectoryList || !learningStages.length) return;
    stageDirectory.hidden = false;
    stageDirectoryList.replaceChildren();
    learningStages.forEach(function (stage, stageIndex) {
      var button = createElement("button", "stage-directory-button", stage.title || ("第 " + (stageIndex + 1) + " 步"));
      button.type = "button";
      if (stage.detail) button.title = stage.detail;
      button.addEventListener("click", function () {
        searchInput.value = "";
        categorySelect.value = ALL_CATEGORY;
        headerSelect.value = ALL_HEADER;
        applyFilters();
        var target = resultList.querySelector('[data-stage-index="' + stageIndex + '"]');
        if (!target) return;
        selectedIndex = Array.prototype.indexOf.call(resultList.children, target);
        renderEntryAndFinish(filtered[selectedIndex], { panelToTop: true });
      });
      stageDirectoryList.appendChild(button);
    });
  }

  function svgElement(tag, className) {
    // 拆开命名空间字面量，避免离线地址检查把标准 SVG 命名空间误判成联网资源。
    var element = document.createElementNS("http:" + "//www.w3.org/2000/svg", tag);
    if (className) element.setAttribute("class", className);
    return element;
  }

  function roadmapLayout(nodes, mode) {
    var hasCoordinates = nodes.every(function (node) {
      return Number.isFinite(node.x) && Number.isFinite(node.y);
    });
    var layout = [];
    if (hasCoordinates) {
      nodes.forEach(function (node) {
        layout.push({ node: node, x: node.x, y: node.y, width: node.width || 260, height: node.height || 78 });
      });
      return {
        items: layout,
        width: Math.max.apply(null, layout.map(function (item) { return item.x + item.width; })) + 30,
        height: Math.max.apply(null, layout.map(function (item) { return item.y + item.height; })) + 30
      };
    }

    if (mode === "wide") {
      nodes.forEach(function (node, index) {
        var row = Math.floor(index / 2);
        var offset = index % 2;
        var column = row % 2 === 0 ? offset : 1 - offset;
        layout.push({ node: node, x: 28 + column * 342, y: 28 + row * 118, width: 300, height: 78 });
      });
      return { items: layout, width: 700, height: Math.ceil(nodes.length / 2) * 118 + 28 };
    }

    nodes.forEach(function (node, index) {
      layout.push({ node: node, x: 20, y: 22 + index * 112, width: 320, height: 78 });
    });
    return { items: layout, width: 360, height: nodes.length * 112 + 18 };
  }

  function edgePoint(from, to, leaving) {
    var fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
    var toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
    var source = leaving ? from : to;
    var sourceCenter = leaving ? fromCenter : toCenter;
    var targetCenter = leaving ? toCenter : fromCenter;
    var dx = targetCenter.x - sourceCenter.x;
    var dy = targetCenter.y - sourceCenter.y;
    var scale = 1 / Math.max(Math.abs(dx) / (source.width / 2), Math.abs(dy) / (source.height / 2));
    return { x: sourceCenter.x + dx * scale, y: sourceCenter.y + dy * scale };
  }

  function createRoadmapSvg(nodes, edges, mode, hasCoordinates) {
    var layout = roadmapLayout(nodes, mode);
    var positions = {};
    layout.items.forEach(function (item) { positions[item.node.id] = item; });
    var svg = svgElement("svg", "roadmap-svg roadmap-svg--" + (hasCoordinates ? "custom" : mode));
    svg.setAttribute("viewBox", "0 0 " + layout.width + " " + layout.height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "C 语言学习流程图，方框可点击打开对应词条");

    var defs = svgElement("defs");
    var marker = svgElement("marker");
    marker.setAttribute("id", "roadmap-arrow-" + mode);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "8");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "7");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("orient", "auto-start-reverse");
    var arrow = svgElement("path");
    arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    marker.appendChild(arrow);
    defs.appendChild(marker);
    svg.appendChild(defs);

    edges.forEach(function (edge) {
      var from = positions[edge.from];
      var to = positions[edge.to];
      if (!from || !to) return;
      var start = edgePoint(from, to, true);
      var end = edgePoint(from, to, false);
      var line = svgElement("line", "roadmap-edge");
      line.setAttribute("x1", start.x);
      line.setAttribute("y1", start.y);
      line.setAttribute("x2", end.x);
      line.setAttribute("y2", end.y);
      line.setAttribute("marker-end", "url(#roadmap-arrow-" + mode + ")");
      svg.appendChild(line);
      if (edge.label) {
        var label = svgElement("text", "roadmap-edge-label");
        label.setAttribute("x", (start.x + end.x) / 2);
        label.setAttribute("y", (start.y + end.y) / 2 - 5);
        label.textContent = edge.label;
        svg.appendChild(label);
      }
    });

    layout.items.forEach(function (item, index) {
      var node = item.node;
      var decision = node.type === "decision" || node.kind === "decision" || /[?？]/.test(node.label || "");
      var group = svgElement("g", "roadmap-node" + (decision ? " is-decision" : "") +
        (index === 0 ? " is-start" : "") + (index === nodes.length - 1 ? " is-end" : ""));
      group.setAttribute("transform", "translate(" + item.x + " " + item.y + ")");
      var targetEntry = entries.find(function (entry) { return entry.id === node.entryId; });
      if (targetEntry) {
        group.setAttribute("role", "button");
        group.setAttribute("tabindex", "0");
        group.setAttribute("aria-label", "打开词条：" + targetEntry.name);
        group.addEventListener("click", function () { selectRelated(node.entryId, { panelToTop: true }); });
        group.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectRelated(node.entryId, { panelToTop: true });
          }
        });
      } else {
        group.classList.add("is-disabled");
      }
      var shape;
      if (decision) {
        shape = svgElement("polygon", "roadmap-node-shape");
        shape.setAttribute("points", (item.width / 2) + ",0 " + item.width + "," + (item.height / 2) + " " +
          (item.width / 2) + "," + item.height + " 0," + (item.height / 2));
      } else {
        shape = svgElement("rect", "roadmap-node-shape");
        shape.setAttribute("width", item.width);
        shape.setAttribute("height", item.height);
        shape.setAttribute("rx", index === 0 || index === nodes.length - 1 ? item.height / 2 : 14);
      }
      group.appendChild(shape);
      if (index === nodes.length - 1 && !decision) {
        var inner = svgElement("rect", "roadmap-node-inner");
        inner.setAttribute("x", "5");
        inner.setAttribute("y", "5");
        inner.setAttribute("width", item.width - 10);
        inner.setAttribute("height", item.height - 10);
        inner.setAttribute("rx", (item.height - 10) / 2);
        group.appendChild(inner);
      }
      var labelText = svgElement("text", "roadmap-node-label");
      labelText.setAttribute("x", item.width / 2);
      labelText.setAttribute("y", node.hint ? 32 : 44);
      labelText.textContent = node.label || node.id;
      group.appendChild(labelText);
      if (node.hint) {
        var hint = svgElement("text", "roadmap-node-hint");
        hint.setAttribute("x", item.width / 2);
        hint.setAttribute("y", "55");
        hint.textContent = node.hint;
        group.appendChild(hint);
      }
      var title = svgElement("title");
      title.textContent = (node.label || node.id) + (node.hint ? "：" + node.hint : "");
      group.appendChild(title);
      svg.appendChild(group);
    });
    return svg;
  }

  function roadmapFallback() {
    var list = createElement("ol", "roadmap-fallback");
    var items = learningStages.length ? learningStages.map(function (stage) {
      var firstId = Array.isArray(stage.match) ? stage.match.find(function (pattern) { return pattern !== "*"; }) : "";
      return { label: stage.title, detail: stage.detail, entryId: firstId };
    }) : entries.filter(function (entry) { return entry.category === "入门基础"; }).map(function (entry) {
      return { label: entry.name, detail: entry.summary, entryId: entry.id };
    });
    items.forEach(function (item) {
      var row = document.createElement("li");
      var target = entries.find(function (entry) { return entry.id === item.entryId; });
      if (target) {
        var button = createElement("button", "roadmap-fallback-link", item.label);
        button.type = "button";
        button.addEventListener("click", function () { selectRelated(target.id); });
        row.appendChild(button);
      } else {
        row.appendChild(document.createTextNode(item.label || "未命名步骤"));
      }
      if (item.detail) row.appendChild(createElement("span", "roadmap-fallback-detail", item.detail));
      list.appendChild(row);
    });
    if (!items.length) list.appendChild(createElement("li", "", "学习路径数据暂未加载，请从入门词条开始浏览。"));
    return list;
  }

  function roadmapBody() {
    var body = createElement("div", "roadmap-body");
    var roadmap = learningPath.roadmap;
    var validNodes = roadmap && Array.isArray(roadmap.nodes) ? roadmap.nodes.filter(function (node) {
      return node && typeof node.id === "string";
    }) : [];
    if (!validNodes.length) {
      body.appendChild(roadmapFallback());
      return body;
    }
    var edges = Array.isArray(roadmap.edges) ? roadmap.edges : [];
    var hasCoordinates = validNodes.every(function (node) {
      return Number.isFinite(node.x) && Number.isFinite(node.y);
    });
    var canvas = createElement("div", "roadmap-canvas");
    canvas.appendChild(createRoadmapSvg(validNodes, edges, hasCoordinates ? "custom" : "wide", hasCoordinates));
    if (!hasCoordinates) canvas.appendChild(createRoadmapSvg(validNodes, edges, "narrow", false));
    body.appendChild(canvas);
    body.appendChild(createElement("p", "roadmap-caption", "点方框可以打开对应词条"));
    var actions = createElement("div", "roadmap-actions");
    var courseLink = createElement("a", "roadmap-action-link", "看网课（浙大翁恺）");
    courseLink.href = "https://www.bilibili.com/video/BV1Ls411w7rx/";
    courseLink.target = "_blank";
    courseLink.rel = "noopener noreferrer";
    actions.appendChild(courseLink);
    var chenQianCourseLink = createElement("a", "roadmap-action-link", "看网课（山大陈千）");
    chenQianCourseLink.href = "https://space.bilibili.com/535834809";
    chenQianCourseLink.target = "_blank";
    chenQianCourseLink.rel = "noopener noreferrer";
    actions.appendChild(chenQianCourseLink);
    var toolsButton = createElement("button", "roadmap-action-link", "安装工具");
    toolsButton.type = "button";
    toolsButton.addEventListener("click", function () { selectRelated("install-dev-cpp", { panelToTop: true }); });
    actions.appendChild(toolsButton);
    body.appendChild(actions);
    return body;
  }

  function renderRoadmap(collapsible) {
    var roadmap = learningPath.roadmap || {};
    var block = createElement(collapsible ? "details" : "section", "learning-roadmap" + (collapsible ? " is-collapsible" : ""));
    if (collapsible) {
      block.open = roadmapExpanded;
      var summary = createElement("summary", "roadmap-heading");
      summary.appendChild(createElement("span", "", roadmap.title || "C 语言学习路线图"));
      summary.appendChild(createElement("small", "", roadmap.subtitle || "按顺序学习，点方框打开词条"));
      block.appendChild(summary);
      block.addEventListener("toggle", function () { roadmapExpanded = block.open; });
    } else {
      var heading = createElement("div", "roadmap-heading");
      heading.appendChild(createElement("h3", "", roadmap.title || "C 语言学习路线图"));
      heading.appendChild(createElement("p", "", roadmap.subtitle || "按顺序学习，点方框打开词条"));
      block.appendChild(heading);
    }
    block.appendChild(roadmapBody());
    return block;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 1300);
  }

  function legacyCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var copied = false;
    try { copied = document.execCommand("copy"); } catch (error) { copied = false; }
    document.body.removeChild(area);
    return copied;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast("已复制");
      }).catch(function () {
        showToast(legacyCopy(text) ? "已复制" : "复制失败，请手动复制");
      });
    } else {
      showToast(legacyCopy(text) ? "已复制" : "复制失败，请手动复制");
    }
  }

  function codeBlock(text, query) {
    var wrap = createElement("div", "code-wrap");
    var pre = document.createElement("pre");
    var code = document.createElement("code");
    appendHighlightedText(code, text, query);
    pre.appendChild(code);
    var button = createElement("button", "copy-button", "复制");
    button.type = "button";
    button.addEventListener("click", function () { copyText(text); });
    wrap.appendChild(pre);
    wrap.appendChild(button);
    return wrap;
  }

  function section(title) {
    var block = createElement("section", "detail-section");
    block.appendChild(createElement("h3", "", title));
    return block;
  }

  function finishEntryNavigation(options) {
    options = options || {};
    if (entryNavigationFrame) window.cancelAnimationFrame(entryNavigationFrame);
    entryNavigationFrame = window.requestAnimationFrame(function () {
      entryNavigationFrame = 0;
      var selected = resultList.querySelector(".result-item.is-selected");
      if (selected) {
        var selectedRect = selected.getBoundingClientRect();
        var listRect = resultList.getBoundingClientRect();
        var scrollDelta = selectedRect.top < listRect.top
          ? selectedRect.top - listRect.top
          : (selectedRect.bottom > listRect.bottom ? selectedRect.bottom - listRect.bottom : 0);
        if (scrollDelta) {
          resultList.scrollTo({ top: resultList.scrollTop + scrollDelta, behavior: "auto" });
        }
      }

      var rect = detailPanel.getBoundingClientRect();
      if (options.panelToTop === true || rect.top > window.innerHeight * 0.25) {
        detailPanel.scrollIntoView({ block: "start", behavior: "auto" });
      }

      detailPanel.classList.add("is-flash");
      window.clearTimeout(detailFlashTimer);
      detailFlashTimer = window.setTimeout(function () {
        detailPanel.classList.remove("is-flash");
      }, 1000);
    });
  }

  function renderEntryAndFinish(entry, options) {
    if (!entry) return;
    renderList();
    renderDetail(entry);
    finishEntryNavigation(options);
  }

  function selectRelated(id, options) {
    var entry = entries.find(function (item) { return item.id === id; });
    if (!entry) return;
    searchInput.value = "";
    categorySelect.value = ALL_CATEGORY;
    headerSelect.value = ALL_HEADER;
    applyFilters();
    selectedIndex = filtered.findIndex(function (item) { return item.id === id; });
    renderEntryAndFinish(entry, options);
  }

  function disclosureButton(label, panel, id) {
    var button = createElement("button", "exercise-toggle", label);
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", id);
    panel.id = id;
    panel.hidden = true;
    button.addEventListener("click", function () {
      var opening = panel.hidden;
      panel.hidden = !opening;
      button.setAttribute("aria-expanded", opening ? "true" : "false");
    });
    return button;
  }

  function generatedExerciseFollowUp(exercise, text) {
    var requirements = Array.isArray(exercise.requirements) ? exercise.requirements : [];
    return "我想围绕下面这批新题继续提问。请先结合当前练习与生成结果理解上下文。\n"
      + "【当前练习】" + String(exercise.title || "") + "\n"
      + "【题目】" + String(exercise.prompt || "") + "\n"
      + "【要求】\n" + requirements.map(function (requirement, index) {
        return (index + 1) + ". " + requirement;
      }).join("\n") + "\n"
      + "【生成结果】\n" + String(text || "");
  }

  function createExerciseGenerate(exercise) {
    var cached = exerciseGenerations.get(exercise.id);
    if (!cached) {
      cached = { count: 3, note: "", status: "idle", text: "", error: "" };
      exerciseGenerations.set(exercise.id, cached);
    }

    var block = createElement("div", "exercise-generate");
    block.appendChild(createElement("h5", "exercise-subtitle", "让 AI 再出几道同类题"));
    var controls = createElement("div", "exercise-generate-controls");
    var countLabel = createElement("label", "exercise-generate-count");
    countLabel.appendChild(document.createTextNode("题量 "));
    var countSelect = document.createElement("select");
    countSelect.setAttribute("aria-label", "生成题量");
    [1, 3, 5].forEach(function (amount) {
      var option = document.createElement("option");
      option.value = String(amount);
      option.textContent = amount + " 道";
      countSelect.appendChild(option);
    });
    countSelect.value = String(cached.count);
    countLabel.appendChild(countSelect);
    controls.appendChild(countLabel);

    var noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.className = "exercise-generate-note";
    noteInput.placeholder = "想重点练什么？例如：只练指针、难度再高一点";
    noteInput.value = cached.note;
    controls.appendChild(noteInput);

    var generateButton = createElement("button", "exercise-generate-button", "生成新题目");
    generateButton.type = "button";
    controls.appendChild(generateButton);
    block.appendChild(controls);

    var output = createElement("div", "exercise-generate-output");
    block.appendChild(output);

    function renderOutput() {
      output.replaceChildren();
      generateButton.disabled = cached.status === "loading";
      output.hidden = cached.status === "idle";
      if (cached.status === "idle") return;
      if (cached.status === "loading") {
        output.appendChild(createElement("p", "exercise-generate-status", "正在出题…"));
        return;
      }
      if (cached.status === "error") {
        output.appendChild(createElement("p", "exercise-generate-error", cached.error));
        var retryButton = createElement("button", "exercise-generate-action", "重试");
        retryButton.type = "button";
        retryButton.addEventListener("click", startGeneration);
        output.appendChild(retryButton);
        return;
      }

      output.appendChild(createElement("pre", "exercise-generate-text", cached.text));
      var actions = createElement("div", "exercise-generate-actions");
      var copyButton = createElement("button", "exercise-generate-action", "复制");
      copyButton.type = "button";
      copyButton.addEventListener("click", function () { copyText(cached.text); });
      actions.appendChild(copyButton);
      var againButton = createElement("button", "exercise-generate-action", "再来一批");
      againButton.type = "button";
      againButton.addEventListener("click", startGeneration);
      actions.appendChild(againButton);
      var continueButton = createElement("button", "exercise-generate-action", "在对话里继续问");
      continueButton.type = "button";
      continueButton.addEventListener("click", function () {
        if (!window.C_SYNTAX_CHAT || typeof window.C_SYNTAX_CHAT.send !== "function") {
          showToast("DeepSeek 模块尚未就绪");
          return;
        }
        if (typeof window.C_SYNTAX_CHAT.open === "function") window.C_SYNTAX_CHAT.open();
        window.C_SYNTAX_CHAT.send(generatedExerciseFollowUp(exercise, cached.text));
      });
      actions.appendChild(continueButton);
      output.appendChild(actions);
    }

    function refreshLatestOutput() {
      var render = exerciseGenerationViews.get(exercise.id);
      if (render) render();
    }

    function startGeneration() {
      cached.count = Number(countSelect.value) || 3;
      cached.note = noteInput.value.trim();
      cached.status = "loading";
      cached.error = "";
      refreshLatestOutput();
      if (!window.C_SYNTAX_CHAT || typeof window.C_SYNTAX_CHAT.generateExercises !== "function") {
        cached.status = "error";
        cached.error = "DeepSeek 模块尚未就绪，请稍后重试。";
        refreshLatestOutput();
        return;
      }
      window.C_SYNTAX_CHAT.generateExercises({
        exercise: exercise,
        count: cached.count,
        note: cached.note,
        onStart: function () {
          cached.status = "loading";
          refreshLatestOutput();
        },
        onDone: function (text) {
          cached.status = "done";
          cached.text = String(text || "");
          cached.error = "";
          refreshLatestOutput();
        },
        onError: function (message) {
          cached.status = "error";
          cached.error = String(message || "生成失败，请稍后重试。");
          refreshLatestOutput();
        }
      });
    }

    countSelect.addEventListener("change", function () {
      cached.count = Number(countSelect.value) || 3;
    });
    noteInput.addEventListener("input", function () { cached.note = noteInput.value; });
    generateButton.addEventListener("click", startGeneration);
    exerciseGenerationViews.set(exercise.id, renderOutput);
    renderOutput();
    return block;
  }

  function renderExercises(entry) {
    var matched = exercisesForEntry(exercises, entry.id);
    if (!matched.length) return;

    var exerciseSection = section("练习（共 " + matched.length + " 道）");
    exerciseSection.classList.add("exercise-section");
    matched.forEach(function (exercise) {
      var card = createElement("article", "exercise-card");
      var heading = createElement("div", "exercise-heading");
      heading.appendChild(createElement("h4", "exercise-title", exercise.title));
      heading.appendChild(createElement("span", "exercise-difficulty difficulty-" + exercise.difficulty,
        difficultyLabel(exercise.difficulty)));
      card.appendChild(heading);

      var related = createElement("div", "exercise-entry-tags");
      related.appendChild(createElement("span", "exercise-label", "关联词条："));
      exercise.entryIds.forEach(function (id) {
        var relatedEntry = entries.find(function (item) { return item.id === id; });
        var tag = createElement("button", "exercise-entry-tag", relatedEntry ? relatedEntry.name : id);
        tag.type = "button";
        tag.addEventListener("click", function () { selectRelated(id); });
        related.appendChild(tag);
      });
      card.appendChild(related);

      card.appendChild(createElement("h5", "exercise-subtitle", "题目"));
      card.appendChild(createElement("p", "exercise-prompt", exercise.prompt));
      card.appendChild(createElement("h5", "exercise-subtitle", "要求"));
      var requirements = createElement("ul", "exercise-list");
      exercise.requirements.forEach(function (requirement) {
        requirements.appendChild(createElement("li", "", requirement));
      });
      card.appendChild(requirements);

      var actions = createElement("div", "exercise-actions");
      var hints = createElement("div", "exercise-disclosure");
      var hintList = createElement("ol", "exercise-list exercise-hints");
      exercise.hints.forEach(function (hint) { hintList.appendChild(createElement("li", "", hint)); });
      hints.appendChild(hintList);
      actions.appendChild(disclosureButton("提示", hints, exercise.id + "-hints"));

      var answer = createElement("div", "exercise-disclosure exercise-answer");
      answer.appendChild(codeBlock(exercise.solution, ""));
      actions.appendChild(disclosureButton("参考答案", answer, exercise.id + "-answer"));
      card.appendChild(actions);
      card.appendChild(hints);
      card.appendChild(answer);

      var output = createElement("div", "exercise-output");
      output.appendChild(createElement("span", "exercise-label", "运行后应该看到"));
      output.appendChild(createElement("pre", "", exercise.expectedOutput));
      card.appendChild(output);
      card.appendChild(createElement("h5", "exercise-subtitle", "讲解"));
      card.appendChild(createElement("p", "exercise-explanation", exercise.explanation));

      if (hasDeepSeekKey()) {
        var review = createElement("div", "exercise-review");
        var reviewLabel = createElement("label", "exercise-subtitle", "让 DeepSeek 检查我的代码");
        var reviewInput = document.createElement("textarea");
        reviewInput.rows = 8;
        reviewInput.className = "exercise-code-input";
        reviewInput.placeholder = "把你写的代码粘到这里";
        reviewLabel.htmlFor = exercise.id + "-review-code";
        reviewInput.id = exercise.id + "-review-code";
        reviewInput.value = exerciseDrafts.get(exercise.id) || "";
        reviewInput.addEventListener("input", function () {
          saveExerciseDraft(exercise.id, reviewInput.value);
        });
        var reviewButton = createElement("button", "exercise-review-button", "让 DeepSeek 检查我的代码");
        reviewButton.type = "button";
        reviewButton.addEventListener("click", function () {
          var code = reviewInput.value.trim();
          if (!code) {
            showToast("请先粘贴你写的代码");
            reviewInput.focus();
            return;
          }
          if (!window.C_SYNTAX_CHAT || typeof window.C_SYNTAX_CHAT.reviewCode !== "function") {
            showToast("DeepSeek 模块尚未就绪");
            return;
          }
          window.C_SYNTAX_CHAT.reviewCode({ exercise: exercise, code: code });
        });
        review.appendChild(reviewLabel);
        review.appendChild(reviewInput);
        review.appendChild(reviewButton);
        card.appendChild(review);
        card.appendChild(createExerciseGenerate(exercise));
      }

      exerciseSection.appendChild(card);
    });
    detailPanel.appendChild(exerciseSection);
  }

  function renderDetail(entry) {
    openedId = entry.id;
    window.C_SYNTAX_CURRENT_ENTRY = entry;   // 供 chat.js 取"用户正在看的词条"作为问答上下文
    detailPanel.replaceChildren();
    var query = searchInput.value.trim();
    var beginnerCategoryView = categorySelect.value === "入门基础" && !query;
    if (beginnerCategoryView) detailPanel.appendChild(renderRoadmap(true));
    var heading = createElement("div", "detail-heading");
    var position = learningPosition(entry.id, learningStages);
    if (position.stage) {
      heading.appendChild(createElement("span", "learning-order-badge",
        "学习顺序：" + (position.stage.title || ("第 " + (position.stageIndex + 1) + " 步"))));
    }
    heading.appendChild(createElement("span", "category-badge", entry.category));
    var title = createElement("h2");
    appendHighlightedText(title, entry.name, query);
    heading.appendChild(title);
    var includeLines = entry.headers.map(function (header) { return "#include <" + header + ">"; });
    var includeCallout = createElement("div", "include-callout");
    var includeLabel = createElement("span", "include-label");
    includeLabel.textContent = includeLines.length ? "需要 " + includeLines.join("\n") : "无需头文件（纯语法）";
    includeCallout.appendChild(includeLabel);
    var includeCopy = createElement("button", "include-copy", "复制");
    includeCopy.type = "button";
    includeCopy.disabled = includeLines.length === 0;
    includeCopy.addEventListener("click", function () { copyText(includeLines.join("\n")); });
    includeCallout.appendChild(includeCopy);
    heading.appendChild(includeCallout);
    if (entry.aliases.length) {
      var aliases = createElement("p", "detail-aliases");
      aliases.appendChild(document.createTextNode("别名："));
      entry.aliases.forEach(function (alias, index) {
        if (index > 0) aliases.appendChild(document.createTextNode(" · "));
        appendHighlightedText(aliases, alias, query);
      });
      heading.appendChild(aliases);
    }
    var summary = createElement("p", "summary");
    appendHighlightedText(summary, entry.summary, query);
    heading.appendChild(summary);

    // 中文关键字标签：点一下就按这个词搜索（用户"搜内存出 malloc"的入口）
    if (entry.keywords && entry.keywords.length) {
      var keywordRow = createElement("p", "keyword-row");
      keywordRow.appendChild(createElement("span", "keyword-row-label", "关键字："));
      entry.keywords.forEach(function (keyword, index) {
        if (index > 0) keywordRow.appendChild(document.createTextNode(" "));
        var tag = createElement("button", "keyword-tag", keyword);
        tag.type = "button";
        tag.title = "搜索「" + keyword + "」";
        tag.addEventListener("click", function () {
          searchInput.value = keyword;
          categorySelect.value = ALL_CATEGORY;
          headerSelect.value = ALL_HEADER;
          applyFilters();
          searchInput.focus({ preventScroll: true });
          if (filtered.length) renderEntryAndFinish(filtered[selectedIndex], { panelToTop: true });
        });
        keywordRow.appendChild(tag);
      });
      heading.appendChild(keywordRow);
    }
    detailPanel.appendChild(heading);
    if (entry.id === "learning-roadmap" && !beginnerCategoryView) {
      detailPanel.appendChild(renderRoadmap(false));
    }

    if (typeof entry.behavior === "string" && entry.behavior.trim()) {
      var behaviorSection = section("作用");
      var behavior = createElement("p", "behavior-text");
      appendHighlightedText(behavior, entry.behavior, query);
      behaviorSection.appendChild(behavior);
      detailPanel.appendChild(behaviorSection);
    }

    var usageSection = section("用法");
    var usage = createElement("p", "usage-text");
    appendHighlightedText(usage, entry.usage, query);
    usageSection.appendChild(usage);
    detailPanel.appendChild(usageSection);

    var syntaxSection = section("语法");
    syntaxSection.appendChild(codeBlock(entry.syntax, query));
    detailPanel.appendChild(syntaxSection);

    var exampleSection = section("完整示例");
    exampleSection.appendChild(codeBlock(entry.example, query));
    detailPanel.appendChild(exampleSection);

    var notesSection = section("注意事项");
    var notes = createElement("ul", "notes-list");
    entry.notes.forEach(function (note) {
      var item = document.createElement("li");
      appendHighlightedText(item, note, query);
      notes.appendChild(item);
    });
    notesSection.appendChild(notes);
    detailPanel.appendChild(notesSection);

    if (Array.isArray(entry.links) && entry.links.length) {
      var linksSection = section("外部链接");
      var linksList = createElement("div", "entry-links");
      entry.links.forEach(function (link) {
        var anchor = createElement("a", "entry-link", link.label);
        anchor.href = link.url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        linksList.appendChild(anchor);
      });
      linksSection.appendChild(linksList);
      detailPanel.appendChild(linksSection);
    }

    if (entry.related.length) {
      var relatedSection = section("相关条目");
      var relatedList = createElement("div", "related-list");
      entry.related.forEach(function (id) {
        var relatedEntry = entries.find(function (item) { return item.id === id; });
        if (!relatedEntry) return;
        var button = createElement("button", "related-button", relatedEntry.name);
        button.type = "button";
        button.addEventListener("click", function () { selectRelated(id, { panelToTop: true }); });
        relatedList.appendChild(button);
      });
      relatedSection.appendChild(relatedList);
      detailPanel.appendChild(relatedSection);
    }

    renderExercises(entry);
  }

  function renderList() {
    resultList.replaceChildren();
    var query = searchInput.value.trim();
    var seenStages = {};
    filtered.forEach(function (entry, index) {
      var item = createElement("li", "result-item" + (index === selectedIndex ? " is-selected" : ""));
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", index === selectedIndex ? "true" : "false");
      var position = learningPosition(entry.id, learningStages);
      if (position.stage) {
        item.dataset.stageIndex = position.stageIndex;
        if (!seenStages[position.stageIndex]) {
          item.id = "learning-stage-" + position.stageIndex;
          seenStages[position.stageIndex] = true;
        }
      }
      var button = document.createElement("button");
      button.type = "button";
      if (position.stage) {
        button.appendChild(createElement("span", "result-learning-step",
          position.stage.title || ("第 " + (position.stageIndex + 1) + " 步")));
      }
      var name = createElement("span", "result-name");
      appendHighlightedText(name, entry.name, query);
      button.appendChild(name);
      var badges = createElement("span", "result-badges");
      badges.appendChild(createElement("span", "result-category", entry.category));
      entry.headers.forEach(function (header) {
        badges.appendChild(createElement("span", "result-header", header));
      });
      button.appendChild(badges);
      var preview = createElement("span", "result-preview");
      appendHighlightedText(preview, matchPreview(entry, query), query);
      button.appendChild(preview);
      button.addEventListener("click", function () {
        selectedIndex = index;
        renderEntryAndFinish(entry);
      });
      item.appendChild(button);
      resultList.appendChild(item);
    });
  }

  function applyFilters() {
    var query = searchInput.value.trim();
    var filterResult = filterEntriesWithMode(entries, query, categorySelect.value, headerSelect.value);
    filtered = query ? filterResult.entries : sortEntriesByLearningPath(filterResult.entries, learningStages);
    selectedIndex = filtered.length ? 0 : -1;
    resultCount.textContent = resultCountText(
      filtered.length,
      entries.length,
      Boolean(query),
      categorySelect.value !== ALL_CATEGORY || headerSelect.value !== ALL_HEADER,
      filterResult.exampleFallback && filtered.length > 0
    );
    emptyState.hidden = filtered.length !== 0;
    resultList.hidden = filtered.length === 0;
    if (!filtered.length) {
      var label = searchInput.value.trim() || (headerSelect.value !== ALL_HEADER ? headerSelect.value : categorySelect.value);
      emptyMessage.textContent = "未找到与「" + label + "」匹配的语法条目。";
      openedId = "";
    } else {
      renderDetail(filtered[0]);
    }
    renderList();
  }

  function moveSelection(delta) {
    if (!filtered.length) return;
    selectedIndex = (selectedIndex + delta + filtered.length) % filtered.length;
    renderList();
    var selected = resultList.children[selectedIndex];
    if (selected) selected.scrollIntoView({ block: "nearest" });
  }

  searchInput.addEventListener("input", applyFilters);
  categorySelect.addEventListener("change", applyFilters);
  headerSelect.addEventListener("change", applyFilters);
  window.addEventListener("csyntax:api-key-changed", function () {
    var entry = entries.find(function (item) { return item.id === openedId; });
    if (entry) renderDetail(entry);
  });
  window.addEventListener("storage", function (event) {
    if (event.key !== "csyntax.deepseek.apiKey") return;
    var entry = entries.find(function (item) { return item.id === openedId; });
    if (entry) renderDetail(entry);
  });
  clearSearch.addEventListener("click", function () {
    searchInput.value = "";
    categorySelect.value = ALL_CATEGORY;
    headerSelect.value = ALL_HEADER;
    searchInput.focus();
    applyFilters();
  });

  document.addEventListener("keydown", function (event) {
    var tagName = event.target && event.target.tagName;
    var typing = isTypingTarget(event.target);
    var searchShortcut = event.key.toLocaleLowerCase() === "k" && (event.ctrlKey || event.metaKey);
    if (typing && !searchShortcut) return;
    if ((event.key === "/" && !typing) || (event.key.toLocaleLowerCase() === "k" && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (tagName === "SELECT") return;
      event.preventDefault();
      moveSelection(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key === "Enter" && filtered[selectedIndex]) {
      event.preventDefault();
      renderEntryAndFinish(filtered[selectedIndex]);
      return;
    }
    if (event.key === "Escape") {
      if (searchInput.value || categorySelect.value !== ALL_CATEGORY || headerSelect.value !== ALL_HEADER) {
        searchInput.value = "";
        categorySelect.value = ALL_CATEGORY;
        headerSelect.value = ALL_HEADER;
        applyFilters();
      }
      searchInput.focus();
    }
  });

  populateCategories();
  populateHeaders();
  renderStageDirectory();
  applyFilters();
}());
