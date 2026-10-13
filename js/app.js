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
    snapshotQuizState();
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

  /* ---------- section model: turn one big page into subtopic subpages ---------- */
  /* Splits a lesson's html on <h2> boundaries. Section 0 = everything before the
     first h2 (intro). Each section gets: id, title, html. Used by the day page
     ("In this topic" cards) and the subtopic route (#/day/15/s/2). */
  var sectionCache = {};
  function splitSections(key, html) {
    if (sectionCache[key]) return sectionCache[key];
    var H2 = /<h2[^>]*>([\s\S]*?)<\/h2>/g, sections = [], m, idx = [];
    while ((m = H2.exec(html)) !== null) idx.push({ start: m.index, title: m[1].replace(/<[^>]+>/g, "").trim() });
    if (idx.length === 0) { sectionCache[key] = [{ id: 0, title: "Lesson", html: html }]; return sectionCache[key]; }
    idx.forEach(function (h, i) {
      var end = i + 1 < idx.length ? idx[i + 1].start : html.length;
      sections.push({ id: i + 1, title: h.title, html: html.slice(h.start, end) });
    });
    // intro chunk before the first h2:
    var intro = html.slice(0, idx[0].start);
    if (intro.replace(/<[^>]+>/g, "").trim().length > 40)
      sections.unshift({ id: 0, title: "Overview", html: intro });
    sectionCache[key] = sections;
    return sections;
  }
  function sectionsFor(key, provider) {
    if (sectionCache[key]) return sectionCache[key];
    var html = provider();
    if (!html) return [];
    return splitSections(key, html);
  }
  function sectionBySlug(sections, slug) {
    var n = parseInt(slug, 10);
    for (var i = 0; i < sections.length; i++) if (sections[i].id === n) return sections[i];
    return null;
  }

  /* ---------- quizzes ---------- */
  var quizState = {};   // key "d15" -> { picked: {0: 2}, submitted: bool }
  function quizKey(kind, id) { return kind + id; }
  function getQuizState(key) {
    if (!quizState[key]) quizState[key] = { picked: {}, submitted: false };
    return quizState[key];
  }
  function renderQuiz(kind, id, questions) {
    var key = quizKey(kind, id), st = getQuizState(key);
    var score = quizScore(kind, id, questions);
    var html = '<section class="quiz" data-quiz="' + key + '">';
    html += '<div class="quiz-head"><span class="quiz-title">\u2753 Check your understanding</span>' +
      (score ? '<span class="quiz-score ' + (score.right === score.total ? "perfect" : "") + '">' +
        score.right + " / " + score.total + " correct</span>" : '<span class="quiz-score" id="score-' + key + '"></span>') +
      "</div>";
    questions.forEach(function (q, qi) {
      html += '<div class="quiz-q"><div class="q-text">' + (qi + 1) + '. ' + q.q + '</div><div class="q-opts">';
      q.a.forEach(function (opt, oi) {
        var picked = st.picked[qi] === oi;
        var cls = "q-opt" + (picked ? " picked" : "");
        if (st.submitted) {
          if (oi === q.correct) cls += " correct";
          else if (picked) cls += " wrong";
        }
        html += '<button type="button" class="' + cls + '" data-q="' + qi + '" data-o="' + oi + '">' +
          String.fromCharCode(65 + oi) + ". " + opt + "</button>";
      });
      html += "</div>";
      if (st.submitted) html += '<div class="q-expl">' + q.expl + "</div>";
      html += "</div>";
    });
    html += '<div class="quiz-actions">' +
      (st.submitted
        ? '<button type="button" class="icon-btn quiz-reset" data-quiz-key="' + key + '">Retry quiz</button>'
        : '<button type="button" class="icon-btn quiz-submit" data-quiz-key="' + key + '">Check answers</button>') +
      "</div></section>";
    return html;
  }
  function bindQuiz(root) {
    root.querySelectorAll(".quiz").forEach(function (quizEl) {
      var key = quizEl.getAttribute("data-quiz");
      quizEl.querySelectorAll(".q-opt").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var st = getQuizState(key);
          if (st.submitted) return;
          st.picked[btn.getAttribute("data-q")] = parseInt(btn.getAttribute("data-o"), 10);
          route();   // re-render whole page (simple + consistent state)
        });
      });
      var submit = quizEl.querySelector(".quiz-submit");
      if (submit) submit.addEventListener("click", function () {
        var st = getQuizState(key); st.submitted = true; persist(); route();
      });
      var reset = quizEl.querySelector(".quiz-reset");
      if (reset) reset.addEventListener("click", function () {
        quizState[key] = { picked: {}, submitted: false }; persist(); route();
      });
    });
  }
  function quizScore(kind, id, questions) {
    var st = getQuizState(quizKey(kind, id));
    if (!st.submitted) return null;
    var right = 0;
    questions.forEach(function (q, qi) { if (st.picked[qi] === q.correct) right++; });
    return { right: right, total: questions.length };
  }
  /* persist quiz answers inside the same storage record */
  function hydrateQuizState() {
    if (state.quizzes) Object.keys(state.quizzes).forEach(function (k) { quizState[k] = state.quizzes[k]; });
  }
  function snapshotQuizState() {
    state.quizzes = quizState;
  }

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

  function sectionSnippet(html, max) {
    var text = html.replace(/<h2[^>]*>[\s\S]*?<\/h2>/, "");
    var pm = text.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    var t = pm ? pm[1] : text;
    t = t.replace(/<[^>]+>/g, " ").replace(/&mdash;/g, "-").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    if (t.length > max) t = t.slice(0, max - 1).replace(/\s\S*$/, "") + "\u2026";
    return t;
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

    if (body) {
      // "In this topic" — subtopic subpage cards, each with a real summary of its section
      var sections = splitSections("d" + d.id, body.html);
      if (sections.length > 1) {
        html += '<h2 class="subtopic-h">In this topic <span class="muted small">(' + sections.length + ' subtopics)</span></h2>';
        html += '<div class="card-grid">';
        sections.forEach(function (s) {
          var mins = Math.max(3, Math.round((body.html.length / sections.length) / 900));
          var label = s.id === 0 ? "Overview" : "Subtopic " + s.id;
          html += '<a class="card subtopic-card" href="#/day/' + d.id + '/s/' + s.id + '">' +
            '<div class="card-top"><span class="card-num">' + label + " \u00B7 ~" + mins + " min</span></div>" +
            "<h3>" + esc(s.title) + "</h3><p>" + esc(sectionSnippet(s.html, 110)) + "</p></a>";
        });
        html += "</div>";
      }

      html += body.html;

      // quiz at the end of the lesson (score shows in the quiz header)
      if (body.quiz && body.quiz.length) {
        html += renderQuiz("d", d.id, body.quiz);
      }
    } else {
      html += '<div class="callout warning"><div class="co-title">Content missing</div><p>Lesson content for day ' + d.id + ' was not found.</p></div>';
    }
    html += pagerHtml(d);
    return html;
  }

  /* Detailed overview subpage: intro + objectives + roadmap + quiz status (no quiz here). */
  function renderDayOverview(d, body, sections, quiz) {    var lvl = '<span class="badge ' + d.level + '">' + d.level + "</span>";
    var html = '<div class="eyebrow">Day ' + d.id + " \u00B7 Overview \u00B7 " + lvl + "</div>";
    html += "<h1>" + esc(d.title) + "</h1>";
    html += '<p class="lede">' + esc(d.subtitle) + "</p>";

    // 1. The lesson's own intro prose (what it is about)
    html += sections[0].html;

    // 2. Objectives — what you will be able to do
    html += objectivesHtml(d);

    // 3. Roadmap — every subtopic with a real summary and link
    var rest = sections.filter(function (x) { return x.id !== 0; });
    html += '<h2>Lesson roadmap <span class="muted small">(' + rest.length + " subtopics, in order)</span></h2>";
    html += '<div class="table-wrap"><table><thead><tr><th style="width:52px">#</th><th>Subtopic</th><th>What it covers</th></tr></thead><tbody>';
    rest.forEach(function (x, i) {
      html += '<tr><td><a href="#/day/' + d.id + '/s/' + x.id + '">' + (i + 1) + "</a></td>" +
        '<td><a href="#/day/' + d.id + '/s/' + x.id + '">' + esc(x.title) + "</a></td>" +
        "<td>" + esc(sectionSnippet(x.html, 160)) + "</td></tr>";
    });
    html += "</tbody></table></div>";

    // 4. Checkpoint status — quiz lives at the end of the lesson, not here
    var score = quiz ? quizScore("d", d.id, quiz) : null;
    html += '<div class="callout ' + (score ? (score.right === score.total ? "tip" : "note") : "note") + '"><div class="co-title">\u2753 Checkpoint quiz</div>';
    if (score) {
      html += "<p>You scored <strong>" + score.right + " / " + score.total + "</strong>" +
        (score.right === score.total ? " \u2014 perfect. " : " \u2014 review the explanations for the ones you missed, then retry. ") +
        'The quiz is at the end of the last subtopic, or <a href="#/day/' + d.id + '">on the main day page</a>.</p>';
    } else {
      html += "<p>A " + (quiz ? quiz.length : 4) + "-question checkpoint waits at the end of this lesson \u2014 finish the subtopics in order, then take it. You can also take it from the <a href=\"#/day/" + d.id + '">main day page</a>.</p>';
    }
    html += "</div>";

    // 5. Start-here CTA + pager
    if (rest.length) {
      html += '<a class="next card" style="display:block;max-width:300px" href="#/day/' + d.id + '/s/' + rest[0].id + '"><div class="card-top"><span class="card-num">Begin</span></div><h3>' + esc(rest[0].title) + "</h3><p>Start with subtopic 1 of " + rest.length + ".</p></a>";
    }
    html += '<div class="pager"><a class="prev" href="#/day/' + d.id + '"><div class="dir">\u2190 Back</div><div class="pt">Full lesson (all subtopics on one page)</div></a>';
    html += rest.length ? '<a class="next" href="#/day/' + d.id + '/s/' + rest[0].id + '"><div class="dir">Start \u2192</div><div class="pt">' + esc(rest[0].title) + "</div></a>" : "";
    html += "</div>";
    return html;
  }

  function renderDaySubtopic(d, slug) {
    var body = content[d.id];
    var sections = body ? splitSections("d" + d.id, body.html) : [];
    var s = sectionBySlug(sections, slug);
    if (!s) return '<div class="callout danger"><div class="co-title">Not found</div><p>No such subtopic. <a href="#/day/' + d.id + '">Back to Day ' + d.id + '</a>.</p></div>';
    if (s.id === 0) return renderDayOverview(d, body, sections, body.quiz);

    var pos = sections.indexOf(s);
    var prev = sections[pos - 1], next = sections[pos + 1];
    var isLast = pos === sections.length - 1;
    var lvl = '<span class="badge ' + d.level + '">' + d.level + "</span>";
    var html = '<div class="crumbs"><a href="#/day/' + d.id + '">Day ' + d.id + " \u00B7 " + esc(d.title) + "</a> / Subtopic " + s.id + "</div>";
    html += '<div class="eyebrow">Day ' + d.id + " \u00B7 Subtopic " + s.id + " of " + (sections.length - 1) + " \u00B7 " + lvl + "</div>";
    html += "<h1>" + esc(s.title) + "</h1>";
    html += s.html;

    // checkpoint quiz only at the END of the lesson (last subtopic)
    if (isLast && body.quiz && body.quiz.length) {
      html += renderQuiz("d", d.id, body.quiz);
    }
    var nav = '<div class="pager">';
    nav += prev ? '<a class="prev" href="#/day/' + d.id + '/s/' + prev.id + '"><div class="dir">\u2190 Subtopic</div><div class="pt">' + esc(prev.title) + "</div></a>"
               : '<a class="prev" href="#/day/' + d.id + '"><div class="dir">\u2190 Back</div><div class="pt">Day ' + d.id + " overview</div></a>";
    nav += next ? '<a class="next" href="#/day/' + d.id + '/s/' + next.id + '"><div class="dir">Subtopic \u2192</div><div class="pt">' + esc(next.title) + "</div></a>"
               : '<a class="next" href="#/day/' + d.id + '"><div class="dir">Done \u2192</div><div class="pt">Back to Day ' + d.id + (isLast ? " \u00B7 take the quiz above first!" : "") + "</div></a>";
    nav += "</div>";
    html += nav;
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
    var ms = hash.match(/^#\/day\/(\d+)\/s\/(\d+)$/);
    var mg = hash.match(/^#\/(frameworks|objects)\/s\/(\d+)$/);
    var el = document.getElementById("content");
    var current = "home";

    if (ms) {
      var ds = dayById(parseInt(ms[1], 10));
      if (ds) {
        current = "day" + ds.id;
        el.innerHTML = renderDaySubtopic(ds, ms[2]);
      } else { el.innerHTML = '<div class="callout danger"><div class="co-title">Not found</div><p>No such day.</p></div>'; }
    } else if (mg) {
      var prov = mg[1] === "frameworks" ? frameworks : objects;
      var secs = splitSections(mg[1], prov.html || "");
      var s = sectionBySlug(secs, mg[2]);
      current = mg[1];
      if (s) {
        var prevS = secs[secs.indexOf(s) - 1], nextS = secs[secs.indexOf(s) + 1];
        var h = '<div class="eyebrow">Deep Dive \u00B7 Subtopic ' + s.id + "</div><h1>" + esc(s.title) + "</h1>" + s.html;
        h += '<div class="pager">';
        h += prevS ? '<a class="prev" href="#/' + mg[1] + '/s/' + prevS.id + '"><div class="dir">\u2190 Subtopic</div><div class="pt">' + esc(prevS.title) + "</div></a>"
                   : '<a class="prev" href="#/' + mg[1] + '"><div class="dir">\u2190 Back</div><div class="pt">' + esc(prov.title || "Guide") + " overview</div></a>";
        h += nextS ? '<a class="next" href="#/' + mg[1] + '/s/' + nextS.id + '"><div class="dir">Subtopic \u2192</div><div class="pt">' + esc(nextS.title) + "</div></a>"
                   : '<a class="next" href="#/' + mg[1] + '"><div class="dir">Done \u2192</div><div class="pt">Back to ' + esc(prov.title || "guide") + "</div></a>";
        h += "</div>";
        el.innerHTML = h;
      } else {
        el.innerHTML = '<div class="callout danger"><div class="co-title">Not found</div><p>No such subtopic. <a href="#/' + mg[1] + '">Back to the guide</a>.</p></div>';
      }
    } else if (m) {
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
    bindQuiz(el);
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
    hydrateQuizState();
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
