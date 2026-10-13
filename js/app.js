/* Master .NET in 30 Days — app logic (router, nav, progress, theme) */
(function () {
  "use strict";

  var days = window.COURSE_DAYS;
  var content = window.DAY_CONTENT || {};
  var frameworks = window.FRAMEWORKS_CONTENT || { html: "<p>Framework guide not loaded.</p>" };
  var objects = window.FRAMEWORK_OBJECTS_CONTENT || { html: "<p>Framework objects guide not loaded.</p>" };

  /* ---------- state ---------- */
  var KEY = "dotnet30.progress.v1";
  var state = { completed: {}, theme: null };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (saved && typeof saved === "object") { state.completed = saved.completed || {}; state.theme = saved.theme || null; }
  } catch (e) { /* first run */ }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  /* ---------- theme ---------- */
  function applyTheme() {
    if (state.theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    var t = document.getElementById("themeToggle");
    if (t) t.textContent = state.theme === "dark" ? "\u263C" : "\u2600";
  }
  function toggleTheme() {
    state.theme = state.theme === "dark" ? null : "dark";
    persist(); applyTheme();
  }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function dayById(id) {
    for (var i = 0; i < days.length; i++) if (days[i].id === id) return days[i];
    return null;
  }
  function completedCount() { return days.filter(function (d) { return state.completed[d.id]; }).length; }

  function bindCopyButtons(root) {
    root.querySelectorAll("pre code").forEach(function (code) {
      var block = code.closest(".codeblock") || code.closest("pre");
      if (!block || block.querySelector(".copy-btn")) return;
      var btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.textContent = "Copy";
      btn.addEventListener("click", function () {
        var text = code.textContent || "";
        function done() { btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = "Copy"; }, 1400); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
        else done();
      });
      var header = block.querySelector(".codeblock-header");
      if (header) header.appendChild(btn);
      else { block.style.position = "relative"; btn.style.position = "absolute"; btn.style.top = "8px"; btn.style.right = "8px"; block.appendChild(btn); }
    });
  }

  /* ---------- sidebar ---------- */
  function buildNav(current) {
    var nav = document.getElementById("nav");
    if (!nav) return;
    var html = [];
    html.push('<div class="nav-group"><div class="nav-title">Start Here</div>');
    html.push('<a class="nav-item' + (current === "home" ? " active" : "") + '" href="#/home"><span class="dot"></span>Home</a>');
    html.push('<a class="nav-item' + (current === "overview" ? " active" : "") + '" href="#/overview"><span class="dot"></span>Curriculum Overview</a>');
    html.push('<a class="nav-item' + (current === "frameworks" ? " active" : "") + '" href="#/frameworks"><span class="dot"></span>Framework Comparison</a>');
    html.push('<a class="nav-item' + (current === "objects" ? " active" : "") + '" href="#/objects"><span class="dot"></span>Framework Objects</a>');
    html.push("</div>");

    for (var w = 1; w <= 4; w++) {
      var label = w === 1 ? "Week 1 · Beginner" : w === 2 ? "Week 2 · Intermediate" : w === 3 ? "Week 3 · Advanced" : "Week 4 · Expert";
      html.push('<div class="nav-group"><div class="nav-title">' + label + "</div>");
      days.filter(function (d) { return d.week === w; }).forEach(function (d) {
        var cls = "nav-item" + (current === "day" + d.id ? " active" : "") + (state.completed[d.id] ? " done" : "");
        html.push('<a class="' + cls + '" href="#/day/' + d.id + '" title="' + esc(d.title) + '">' +
          '<span class="dot"></span>Day ' + d.id + " · " + esc(d.title) +
          '<span class="num">' + (state.completed[d.id] ? "\u2713" : "") + "</span></a>");
      });
      html.push("</div>");
    }
    nav.innerHTML = html.join("");
  }

  /* ---------- pages ---------- */
  function objectivesHtml(d) {
    if (!d.objectives || !d.objectives.length) return "";
    return '<section class="objectives"><div class="ob-title">\uD83C\uDFAF Learning Objectives</div><ul>' +
      d.objectives.map(function (o) { return "<li>" + o + "</li>"; }).join("") + "</ul></section>";
  }

  function pagerHtml(d) {
    var prev = dayById(d.id - 1), next = dayById(d.id + 1);
    var html = '<div class="pager">';
    html += prev
      ? '<a class="prev" href="#/day/' + prev.id + '"><div class="dir">\u2190 Previous</div><div class="pt">Day ' + prev.id + ": " + esc(prev.title) + "</div></a>"
      : '<a class="prev" href="#/overview"><div class="dir">\u2190 Back</div><div class="pt">Curriculum Overview</div></a>';
    html += next
      ? '<a class="next" href="#/day/' + next.id + '"><div class="dir">Next \u2192</div><div class="pt">Day ' + next.id + ": " + esc(next.title) + "</div></a>"
      : '<a class="next" href="#/home"><div class="dir">Finish \u2192</div><div class="pt">Back to Home</div></a>';
    html += "</div>";
    return html;
  }

  function renderDay(d) {
    var body = content[d.id];
    var lvl = '<span class="badge ' + d.level + '">' + d.level + "</span>";
    var done = state.completed[d.id];
    var html = '<div class="eyebrow">Day ' + d.id + " \u00B7 Week " + d.week + " \u00B7 ~" + d.minutes + " min \u00B7 " + lvl + "</div>";
    html += "<h1>" + esc(d.title) + "</h1>";
    html += '<p class="lede">' + esc(d.subtitle) + "</p>";
    html += '<div style="margin-bottom:18px"><button class="icon-btn mark-btn" id="markComplete" style="border-color:' + (done ? "var(--green)" : "var(--border)") + ';color:' + (done ? "var(--green)" : "inherit") + '">' +
      (done ? "\u2713 Completed \u2014 click to unmark" : "Mark day as complete") + "</button></div>";
    html += objectivesHtml(d);
    html += body ? body.html : '<div class="callout warning"><div class="co-title">Content missing</div><p>Lesson content for day ' + d.id + ' was not found.</p></div>';
    html += pagerHtml(d);
    return html;
  }

  function renderHome() {
    var done = completedCount();
    var pct = Math.round((done / days.length) * 100);
    var html = '<div class="hero"><div class="eyebrow">Interactive Tutorial</div>';
    html += "<h1>Master .NET in 30 Days</h1>";
    html += '<p class="lede">A structured path from zero to advanced .NET developer. Daily lessons with runnable C# examples, diagrams, exercises, and weekly projects \u2014 covering console apps, ASP.NET Core, Blazor, EF Core, MAUI, Orleans, AI integration, and prompt engineering.</p>';
    html += '<div class="hero-stats">';
    html += '<div class="stat"><div class="n">30</div><div class="l">Daily lessons</div></div>';
    html += '<div class="stat"><div class="n">' + pct + "%</div><div class=\"l\">Complete</div></div>";
    html += '<div class="stat"><div class="n">4</div><div class="l">Skill levels</div></div>';
    html += '<div class="stat"><div class="n">3</div><div class="l">Weekly projects</div></div>';
    html += "</div></div>";

    html += "<h2>Start here</h2><div class=\"card-grid\">";
    html += '<a class="card" href="#/frameworks"><div class="card-top"><span class="card-num">Reference</span></div><h3>Framework Comparison</h3><p>.NET Framework vs .NET Core vs modern .NET \u2014 with diagrams, decision guide, and migration notes.</p></a>';
    html += '<a class="card" href="#/objects"><div class="card-top"><span class="card-num">Reference</span></div><h3>Framework Objects</h3><p>CLR, CTS, CLS, IL, assemblies, JIT, GC, BCL, host, SDK, NuGet \u2014 what each is and how it works.</p></a>';
    html += '<a class="card" href="#/overview"><div class="card-top"><span class="card-num">Roadmap</span></div><h3>Curriculum Overview</h3><p>The full 30-day plan, what each week covers, and how the days build on each other.</p></a>';
    html += '<a class="card" href="#/day/1"><div class="card-top"><span class="card-num">Beginner</span></div><h3>Day 1 \u00B7 Getting Started</h3><p>Install the .NET SDK, learn the CLI, and write your first C# program.</p></a>';
    html += "</div>";

    html += "<h2>Week 1 \u00B7 Beginner</h2><div class=\"card-grid\">";
    days.filter(function (d) { return d.week === 1; }).forEach(function (d) {
      html += '<a class="card" href="#/day/' + d.id + '">' + (state.completed[d.id] ? '<span class="check">\u2713</span>' : "") +
        '<div class="card-top"><span class="card-num">Day ' + d.id + " \u00B7 ~" + d.minutes + " min</span><span class=\"badge " + d.level + '">' + d.level + "</span></div>" +
        "<h3>" + esc(d.title) + "</h3><p>" + esc(d.subtitle) + "</p></a>";
    });
    html += "</div>";

    html += "<h2>Week 2 \u00B7 Intermediate</h2><div class=\"card-grid\">";
    days.filter(function (d) { return d.week === 2; }).forEach(function (d) {
      html += '<a class="card" href="#/day/' + d.id + '">' + (state.completed[d.id] ? '<span class="check">\u2713</span>' : "") +
        '<div class="card-top"><span class="card-num">Day ' + d.id + " \u00B7 ~" + d.minutes + " min</span><span class=\"badge " + d.level + '">' + d.level + "</span></div>" +
        "<h3>" + esc(d.title) + "</h3><p>" + esc(d.subtitle) + "</p></a>";
    });
    html += "</div>";

    html += "<h2>Week 3 \u00B7 Advanced</h2><div class=\"card-grid\">";
    days.filter(function (d) { return d.week === 3; }).forEach(function (d) {
      html += '<a class="card" href="#/day/' + d.id + '">' + (state.completed[d.id] ? '<span class="check">\u2713</span>' : "") +
        '<div class="card-top"><span class="card-num">Day ' + d.id + " \u00B7 ~" + d.minutes + " min</span><span class=\"badge " + d.level + '">' + d.level + "</span></div>" +
        "<h3>" + esc(d.title) + "</h3><p>" + esc(d.subtitle) + "</p></a>";
    });
    html += "</div>";

    html += "<h2>Week 4 \u00B7 Expert</h2><div class=\"card-grid\">";
    days.filter(function (d) { return d.week === 4; }).forEach(function (d) {
      html += '<a class="card" href="#/day/' + d.id + '">' + (state.completed[d.id] ? '<span class="check">\u2713</span>' : "") +
        '<div class="card-top"><span class="card-num">Day ' + d.id + " \u00B7 ~" + d.minutes + " min</span><span class=\"badge " + d.level + '">' + d.level + "</span></div>" +
        "<h3>" + esc(d.title) + "</h3><p>" + esc(d.subtitle) + "</p></a>";
    });
    html += "</div>";
    return html;
  }

  function renderOverview() {
    var html = '<div class="eyebrow">Roadmap</div><h1>Curriculum Overview</h1>';
    html += '<p class="lede">Each day is a focused, self-contained lesson: concepts first, then runnable code, then diagrams and exercises. Weekly projects consolidate everything you learned.</p>';
    html += '<div class="table-wrap"><table><thead><tr><th>Day</th><th>Title</th><th>Level</th><th>Time</th><th>Status</th></tr></thead><tbody>';
    days.forEach(function (d) {
      html += "<tr><td><a href=\"#/day/" + d.id + '">Day ' + d.id + "</a></td><td><a href=\"#/day/" + d.id + '">' + esc(d.title) + "</a><br><span class=\"small muted\">" + esc(d.subtitle) + "</span></td>" +
        '<td><span class="badge ' + d.level + '">' + d.level + "</span></td><td>~" + d.minutes + " min</td><td>" + (state.completed[d.id] ? "\u2713" : "\u2013") + "</td></tr>";
    });
    html += "</tbody></table></div>";
    html += '<div class="callout tip"><div class="co-title">How to use this course</div><p>Do one day per day. Type every example yourself instead of pasting \u2014 muscle memory matters. Each week ends with a project day; don\u2019t skip those, they\u2019re where knowledge becomes skill.</p></div>';
    html += '<a class="next card" style="display:block;max-width:280px" href="#/day/1"><div class="card-top"><span class="card-num">Start</span></div><h3>Day 1 \u00B7 Getting Started with .NET</h3><p>Install the SDK and write your first program.</p></a>';
    return html;
  }

  function updateProgressChip() {
    var done = completedCount();
    var pct = Math.round((done / days.length) * 100);
    var bar = document.getElementById("chipBar"), txt = document.getElementById("chipText");
    if (bar) bar.style.width = pct + "%";
    if (txt) txt.textContent = done + " / " + days.length;
  }

  /* ---------- router ---------- */
  function route() {
    var hash = location.hash || "#/home";
    var m = hash.match(/^#\/day\/(\d+)$/);
    var el = document.getElementById("content");
    var current = "home";

    if (m) {
      var d = dayById(parseInt(m[1], 10));
      if (d) {
        current = "day" + d.id;
        el.innerHTML = renderDay(d);
        var btn = document.getElementById("markComplete");
        if (btn) btn.addEventListener("click", function () {
          state.completed[d.id] = !state.completed[d.id];
          if (!state.completed[d.id]) delete state.completed[d.id];
          persist(); route();
        });
      } else { el.innerHTML = '<div class="callout danger"><div class="co-title">Not found</div><p>No such day. <a href="#/overview">Back to overview</a>.</p></div>'; }
    } else if (hash === "#/frameworks") {
      current = "frameworks";
      el.innerHTML = '<div class="eyebrow">Deep Dive</div><h1>' + esc(frameworks.title || "Framework Comparison") + "</h1>" + (frameworks.html || "");
    } else if (hash === "#/objects") {
      current = "objects";
      el.innerHTML = '<div class="eyebrow">Deep Dive</div><h1>' + esc(objects.title || "Framework Objects") + "</h1>" + (objects.html || "");
    } else if (hash === "#/overview") {
      current = "overview";
      el.innerHTML = renderOverview();
    } else {
      el.innerHTML = renderHome();
    }

    buildNav(current);
    updateProgressChip();
    bindCopyButtons(el);
    if (!m) el.scrollTop = 0;
    window.scrollTo(0, 0);
    closeSidebar();
  }

  /* ---------- sidebar (mobile) ---------- */
  function closeSidebar() {
    var sb = document.getElementById("sidebar"), bd = document.getElementById("sidebarBackdrop");
    if (sb) sb.classList.remove("open");
    if (bd) bd.classList.remove("show");
  }
  function toggleSidebar() {
    var sb = document.getElementById("sidebar"), bd = document.getElementById("sidebarBackdrop");
    if (!sb || !bd) return;
    sb.classList.toggle("open"); bd.classList.toggle("show", sb.classList.contains("open"));
  }

  /* ---------- init ---------- */
  function init() {
    applyTheme();
    var t = document.getElementById("themeToggle");
    if (t) t.addEventListener("click", toggleTheme);
    var st = document.getElementById("sidebarToggle");
    if (st) st.addEventListener("click", toggleSidebar);
    var bd = document.getElementById("sidebarBackdrop");
    if (bd) bd.addEventListener("click", closeSidebar);
    window.addEventListener("hashchange", route);
    route();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
