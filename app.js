/* ============================================================
   Daily Hour — app logic
   Runs in two places:
   - GitHub Pages: progress in this browser (localStorage), live
     OpenAlex search, browser speech + recorder.
   - Claude artifact: progress synced through the artifact's db,
     "Ask Claude" summaries and speaking feedback via `sample`,
     dictation and Claude voice for recitation.
   ============================================================ */
(function () {
  "use strict";

  var START = "2026-11-11";           // Day 1 of the 28-day cycle
  var CYCLE = 28;
  var BLOCKS = [
    { k: "research", min: 25, label: "Research radar" },
    { k: "classic", min: 15, label: "Classic" },
    { k: "philo", min: 10, label: "Śloka" },
    { k: "speak", min: 10, label: "Speaking" }
  ];
  var PROFILE = "Mohit is a PhD student (Engineering and Applied Science, UMass Dartmouth, advisor Dr. Mehdi Raessi) working on computational multiphase flow: VOF/PLIC interface reconstruction, three-phase contact-line dynamics and contact angles, the fictitious-domain FSI method of Pathak & Raessi, ML acceleration of interface reconstruction (PLIC-Net, TorchScript models called from a C++ solver), the variable-density pressure Poisson solver and its condition number, and quantum linear solvers (HHL, VQLS) for the pressure equation. He also validates cases in OpenFOAM. He is preparing his proposal defense and aiming for faculty positions.";
  var KEYWORDS = [
    ["contact line", 5], ["contact angle", 5], ["wetting", 3], ["volume of fluid", 5], ["vof", 4], ["plic", 5],
    ["interface reconstruction", 5], ["three-phase", 4], ["multiphase", 3], ["two-phase", 3], ["droplet", 2], ["bubble", 2],
    ["surface tension", 3], ["curvature", 2], ["spurious current", 3], ["level set", 3], ["front tracking", 2],
    ["fluid-structure", 4], ["immersed boundary", 4], ["fictitious domain", 5], ["rigid body", 2],
    ["pressure poisson", 5], ["poisson", 3], ["projection method", 3], ["multigrid", 3], ["precondition", 3], ["condition number", 3],
    ["quantum", 3], ["hhl", 4], ["variational quantum", 3], ["neural", 2], ["machine learning", 2], ["deep learning", 2],
    ["neural operator", 3], ["physics-informed", 2], ["surrogate", 1], ["turbulen", 1], ["openfoam", 3]
  ];
  /* JCP, JFM, Int J Multiphase Flow, Phys Fluids, Comput Fluids, CMAME, Phys Rev Fluids, IJNMF */
  var ISSNS = "0021-9991|0022-1120|0301-9322|1070-6631|0045-7930|0045-7825|2469-990X|0271-2091";

  var isArtifact = !!(window.claude && typeof window.claude.use === "function");
  var caps = { db: null, sample: null, tts: null, dictation: null, user: null };

  /* ── tiny helpers ── */
  function $(id) { return document.getElementById(id); }
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoLocal(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseISO(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parseISO(s); d.setDate(d.getDate() + n); return isoLocal(d); }
  function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
  function cycleIndex(dateStr) { var n = daysBetween(START, dateStr); return ((n % CYCLE) + CYCLE) % CYCLE; }
  function prettyDate(s) { return parseISO(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
  var toastTimer;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }
  function copyText(text, okMsg) {
    try {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg || "Copied"); }, function () { toast("Copy blocked — select the text and copy it"); });
    } catch (e) { toast("Copy blocked — select the text and copy it"); }
  }

  /* ── state ── */
  var TODAY = isoLocal(new Date());
  var viewDate = TODAY;
  var state = { saved: [], read: {}, log: {}, blocks: {}, drafts: {}, checks: {} };
  var LS_KEY = "dailyHour_v1";

  function loadLocal() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) Object.assign(state, JSON.parse(raw));
      var old = localStorage.getItem("paperTracker_saved"); // from the old Paper Tracker
      if (old && !state.migrated) {
        JSON.parse(old).forEach(function (p) {
          state.saved.push({ title: p.title, authors: p.authors || "", url: p.link || "", venue: p.topic || "", date: p.date || "" });
        });
        state.migrated = true;
      }
    } catch (e) { /* storage unavailable: start fresh */ }
  }
  var saveTimer;
  function persist() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
    if (caps.db && caps.userDoc) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        caps.userDoc.set(JSON.parse(JSON.stringify(state))).catch(function () { setStatus("Sync paused — progress is kept in this browser"); });
      }, 800);
    }
  }
  function setStatus(s) { $("mode-status").textContent = s; }

  /* ── session clock ── */
  var active = "research", remaining = 25 * 60, running = false, tick = null;
  function blocksDone() { return state.blocks[TODAY] || {}; }
  function blockMin(k) { for (var i = 0; i < BLOCKS.length; i++) if (BLOCKS[i].k === k) return BLOCKS[i].min; return 10; }
  function fmt(sec) { return pad(Math.floor(sec / 60)) + ":" + pad(sec % 60); }
  function renderClock() {
    var done = blocksDone();
    document.querySelectorAll(".blk").forEach(function (b) {
      var k = b.getAttribute("data-k");
      b.classList.toggle("active", k === active);
      b.classList.toggle("done", !!done[k]);
      b.setAttribute("aria-selected", k === active ? "true" : "false");
      var fill = b.querySelector(".fill");
      var total = blockMin(k) * 60;
      fill.style.width = done[k] ? "100%" : (k === active ? Math.round(100 * (total - remaining) / total) + "%" : "0");
    });
    $("timer-t").textContent = fmt(remaining);
    $("timer-btn").textContent = running ? "Pause" : (remaining < blockMin(active) * 60 ? "Resume" : "Start");
  }
  function selectBlock(k, scroll) {
    if (running) stopTimer();
    active = k; remaining = blockMin(k) * 60; renderClock();
    if (scroll) { var el = $(k); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }
  function stopTimer() { running = false; clearInterval(tick); renderClock(); }
  function startTimer() {
    running = true;
    tick = setInterval(function () {
      remaining--;
      if (remaining <= 0) {
        stopTimer();
        markBlock(active);
        var idx = BLOCKS.findIndex(function (b) { return b.k === active; });
        var next = BLOCKS[idx + 1];
        toast(next ? "Time's up — next: " + next.label : "Hour finished — close it below");
        if (next) selectBlock(next.k, true); else { remaining = 0; renderClock(); $("reflect").scrollIntoView({ behavior: "smooth" }); }
        return;
      }
      renderClock();
    }, 1000);
    renderClock();
  }
  function markBlock(k) {
    state.blocks[TODAY] = state.blocks[TODAY] || {};
    state.blocks[TODAY][k] = true; persist(); renderClock();
  }

  /* ── research radar ── */
  var feed = { items: [], generated: "" };
  var radarTab = "today";

  function paperKey(p) { return (p.url || p.title || "").toLowerCase(); }
  function isSaved(p) { var k = paperKey(p); return state.saved.some(function (s) { return paperKey(s) === k; }); }
  function toggleSave(p) {
    var k = paperKey(p);
    if (isSaved(p)) state.saved = state.saved.filter(function (s) { return paperKey(s) !== k; });
    else state.saved.unshift({ title: p.title, authors: p.authors, url: p.url, venue: p.venue, date: p.date, summary: p.summary || null, why: p.why || "", savedOn: TODAY });
    persist();
  }
  function rank(p) { return (p.relevance || 0) + (p.hasAbstract === false ? -1.5 : 0); }
  function todaysThree() {
    var sorted = feed.items.slice().sort(function (a, b) { return (rank(b) - rank(a)) || (b.date || "").localeCompare(a.date || ""); });
    var unread = sorted.filter(function (p) { return !state.read[paperKey(p)] || state.read[paperKey(p)] === TODAY; });
    var pick = unread.length >= 3 ? unread : sorted;
    return pick.slice(0, 3);
  }

  function paperCard(p, opts) {
    opts = opts || {};
    var el = document.createElement("article");
    el.className = "card paper" + (opts.deep ? " deep" : "");
    var stars = p.relevance ? "relevance " + p.relevance + "/5" : "";
    var html = "";
    if (opts.deep) html += '<span class="eyebrow" style="color:var(--t-research)">Deep read · about 12 min</span>';
    else if (opts.skim) html += '<span class="eyebrow">Skim · about 5 min</span>';
    html += '<div class="tags">' + (stars ? '<span class="rel">' + stars + "</span>" : "") +
      (p.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") +
      (p.hasAbstract === false ? '<span class="badge-note">title only</span>' : "") + "</div>";
    html += '<h3 class="ptitle"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a></h3>";
    html += '<div class="meta">' + esc(p.authors) + " · <i>" + esc(p.venue) + "</i> · " + esc(p.date) + "</div>";
    if (p.summary) {
      html += '<dl class="pmr"><dt>Problem</dt><dd>' + esc(p.summary.problem) + "</dd><dt>Method</dt><dd>" + esc(p.summary.method) + "</dd><dt>Result</dt><dd>" + esc(p.summary.result) + "</dd></dl>";
    }
    if (p.why) html += '<div class="why"><b>Why it matters for you</b>' + esc(p.why) + "</div>";
    html += '<div class="row">' +
      '<button class="btn act-save">' + (isSaved(p) ? "Saved" : "Save") + "</button>" +
      '<button class="btn act-read">' + (state.read[paperKey(p)] ? "Read ✓" : "Mark as read") + "</button>" +
      (caps.sample ? '<button class="btn act-ask">Ask Claude: explain &amp; connect</button>' : "") +
      "</div><div class=\"ai-out\" hidden></div>";
    el.innerHTML = html;
    el.querySelector(".act-save").addEventListener("click", function (e) {
      toggleSave(p); e.target.textContent = isSaved(p) ? "Saved" : "Save"; e.target.classList.toggle("on", isSaved(p));
      toast(isSaved(p) ? "Saved to your library" : "Removed from library"); if (radarTab === "saved") renderSaved();
    });
    el.querySelector(".act-save").classList.toggle("on", isSaved(p));
    var readBtn = el.querySelector(".act-read");
    readBtn.classList.toggle("on", !!state.read[paperKey(p)]);
    readBtn.addEventListener("click", function () {
      var k = paperKey(p);
      if (state.read[k]) delete state.read[k]; else state.read[k] = TODAY;
      persist(); readBtn.textContent = state.read[k] ? "Read ✓" : "Mark as read"; readBtn.classList.toggle("on", !!state.read[k]);
    });
    var ask = el.querySelector(".act-ask");
    if (ask) ask.addEventListener("click", function () { askAboutPaper(p, el.querySelector(".ai-out"), ask); });
    return el;
  }

  function askAboutPaper(p, out, btn) {
    out.hidden = false; out.textContent = "Thinking…"; btn.disabled = true;
    var prompt = "You are a research mentor in computational fluid dynamics.\n\nAbout the reader: " + PROFILE +
      "\n\nPaper:\nTitle: " + p.title + "\nVenue: " + (p.venue || "") + " (" + (p.date || "") + ")\n" +
      (p.summary ? "Summary: " + p.summary.problem + " " + p.summary.method + " " + p.summary.result + "\n" : "") +
      (p.abstract ? "Abstract: " + p.abstract + "\n" : "") +
      "\nIn plain text (no markdown headers), under 180 words, give:\n1. The key idea in two sentences a PhD student could repeat aloud.\n2. The most direct connection to the reader's own work (be specific).\n3. One sharp question to ask the authors or to test in his own code.\nOnly use what is given; say so if the information is too thin.";
    caps.sample(prompt, { onText: function (u) { out.textContent = u.text; } })
      .then(function (r) { out.textContent = r.text; })
      .catch(function (e) { out.textContent = e && e.code === "rate_limited" ? "Claude is busy — try again in a minute." : "Couldn't reach Claude here."; })
      .then(function () { btn.disabled = false; });
  }

  function renderRadar() {
    var t = $("radar-today"); t.innerHTML = "";
    if (!feed.items.length) { t.innerHTML = '<div class="card meta">No summaries loaded yet. Use Live search, or check back after the morning update.</div>'; }
    todaysThree().forEach(function (p, i) { t.appendChild(paperCard(p, { deep: i === 0, skim: i > 0 })); });
    var a = $("radar-all"); a.innerHTML = "";
    feed.items.slice().sort(function (x, y) { return (y.relevance - x.relevance) || (y.date || "").localeCompare(x.date || ""); })
      .forEach(function (p) { a.appendChild(paperCard(p)); });
    $("radar-note").textContent = feed.generated ? "Radar updated " + prettyDate(feed.generated) + ". " + (feed.note || "") : "";
  }
  function renderSaved() {
    var box = $("saved-list");
    if (!state.saved.length) { box.innerHTML = '<p class="meta" style="margin:0">Nothing saved yet. Use “Save” on any paper, or add one by hand below.</p>'; return; }
    box.innerHTML = "";
    state.saved.forEach(function (p, i) {
      var it = document.createElement("div"); it.className = "more-item";
      it.innerHTML = '<div class="ptitle">' + (p.url ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>" : esc(p.title)) + "</div>" +
        '<div class="meta">' + esc([p.authors, p.venue, p.date].filter(Boolean).join(" · ")) + "</div>" +
        (p.why ? '<div class="meta">' + esc(p.why) + "</div>" : "") +
        '<div class="row"><button class="btn">Remove</button></div>';
      it.querySelector("button").addEventListener("click", function () { state.saved.splice(i, 1); persist(); renderSaved(); });
      box.appendChild(it);
    });
  }
  function setRadarTab(tab) {
    radarTab = tab;
    document.querySelectorAll("#research .subtabs button").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-tab") === tab ? "true" : "false"); });
    $("radar-today").hidden = tab !== "today"; $("radar-all").hidden = tab !== "all";
    $("radar-live").hidden = tab !== "live"; $("radar-saved").hidden = tab !== "saved";
    if (tab === "saved") renderSaved();
  }

  /* live OpenAlex search */
  function reconstruct(inv) {
    if (!inv) return "";
    var w = []; Object.keys(inv).forEach(function (k) { inv[k].forEach(function (i) { w[i] = k; }); });
    return w.join(" ");
  }
  function score(text) {
    var t = text.toLowerCase(), s = 0;
    KEYWORDS.forEach(function (kw) { if (t.indexOf(kw[0]) >= 0) s += kw[1]; });
    return s;
  }
  function liveSearch() {
    var out = $("live-out"); out.hidden = false; out.innerHTML = '<p class="meta">Searching…</p>';
    var from = addDays(TODAY, -60);
    var base = "https://api.openalex.org/works?search=" + encodeURIComponent($("live-topic").value) +
      "&per_page=30&select=id,doi,title,publication_date,authorships,primary_location,abstract_inverted_index&filter=from_publication_date:" + from + ",";
    var urls = [base + "primary_location.source.issn:" + ISSNS, base + "primary_location.source.type:repository"];
    var ctrl = new AbortController(); var to = setTimeout(function () { ctrl.abort(); }, 12000);
    Promise.all(urls.map(function (u) {
      return fetch(u, { signal: ctrl.signal }).then(function (r) { return r.json(); }).catch(function () { return { results: [] }; });
    })).then(function (pages) {
      clearTimeout(to);
      var all = pages[0].results.concat(pages[1].results || []);
      if (!all.length && !pages[0].meta && !pages[1].meta) throw new Error("unreachable");
      var seen = {};
      var rows = all.filter(function (w) { var k = (w.title || "").toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; }).map(function (w) {
        var abs = reconstruct(w.abstract_inverted_index);
        return {
          title: w.title || "Untitled", url: w.doi || w.id, date: w.publication_date || "",
          venue: (w.primary_location && w.primary_location.source && w.primary_location.source.display_name) || "",
          authors: (w.authorships || []).slice(0, 3).map(function (a) { return a.author && a.author.display_name; }).filter(Boolean).join(", ") + ((w.authorships || []).length > 3 ? " et al." : ""),
          abstract: abs, s: score((w.title || "") + " " + abs)
        };
      }).sort(function (a, b) { return b.s - a.s; }).slice(0, 15);
      if (!rows.length) { out.innerHTML = '<p class="meta">No matches in the last 60 days. Try another topic.</p>'; return; }
      out.innerHTML = "";
      rows.forEach(function (p) {
        var it = document.createElement("div"); it.className = "more-item";
        it.innerHTML = '<div class="ptitle"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a></div>" +
          '<div class="meta">' + esc(p.authors) + " · <i>" + esc(p.venue) + "</i> · " + esc(p.date) + ' · <span class="rel">match ' + p.s + "</span></div>" +
          (p.abstract ? "<details><summary>Abstract</summary><p class=\"meta\">" + esc(p.abstract.slice(0, 1400)) + "</p></details>" : '<span class="badge-note" style="align-self:flex-start">no abstract</span>') +
          '<div class="row"><button class="btn sv">' + (isSaved(p) ? "Saved" : "Save") + "</button>" +
          (caps.sample ? '<button class="btn ak">Ask Claude: explain &amp; connect</button>' : "") + '</div><div class="ai-out" hidden></div>';
        it.querySelector(".sv").addEventListener("click", function (e) { toggleSave(p); e.target.textContent = isSaved(p) ? "Saved" : "Save"; });
        var ak = it.querySelector(".ak"); if (ak) ak.addEventListener("click", function () { askAboutPaper(p, it.querySelector(".ai-out"), ak); });
        out.appendChild(it);
      });
    }).catch(function () {
      clearTimeout(to);
      out.innerHTML = '<p class="meta">Live search could not reach OpenAlex from this page' + (isArtifact ? " (the Claude page blocks outside requests). It works on your GitHub site." : ". Check your connection and try again.") + "</p>";
    });
  }

  /* ── classic ── */
  function typeset(el) {
    var tries = 0;
    (function go() {
      if (window.MathJax && MathJax.typesetPromise) { MathJax.typesetClear && MathJax.typesetClear([el]); MathJax.typesetPromise([el]).catch(function () {}); }
      else if (tries++ < 40) setTimeout(go, 250);
    })();
  }
  function renderClassic(i) {
    var c = window.CLASSICS[i % window.CLASSICS.length];
    var el = $("classic-card");
    el.innerHTML =
      '<div><span class="eyebrow">' + esc(c.field) + " · " + c.year + "</span>" +
      "<h3>" + esc(c.title) + "</h3>" +
      '<div class="meta">' + esc(c.authors) + " — " + esc(c.cite) + "</div></div>" +
      '<p class="lede" style="margin:0">' + esc(c.idea) + "</p>" +
      '<div class="eqbox">\\[' + c.eq + "\\]</div>" +
      '<div class="why"><b>For your work</b>' + esc(c.you) + "</div>" +
      '<div class="recall"><span class="eyebrow">Recall</span><div>' + esc(c.recall.q) + "</div>" +
      '<textarea id="recall-try" placeholder="Answer first, in your own words…" style="min-height:60px"></textarea>' +
      '<div class="row"><button class="btn" id="recall-btn">Reveal answer</button></div>' +
      '<div class="ans" hidden id="recall-ans">' + esc(c.recall.a) + "</div></div>";
    $("recall-btn").addEventListener("click", function () { var a = $("recall-ans"); a.hidden = !a.hidden; this.textContent = a.hidden ? "Reveal answer" : "Hide answer"; });
    typeset(el);
  }

  /* ── philosophy ── */
  var speechVoice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    var vs = speechSynthesis.getVoices();
    speechVoice = vs.find(function (v) { return /^(sa|hi)(-|_)/i.test(v.lang); }) || null;
  }
  function renderPhilo(i) {
    var v = window.PHILOSOPHY[i % window.PHILOSOPHY.length];
    var el = $("philo-card");
    var canListen = !!caps.tts || !!speechVoice;
    el.innerHTML =
      '<div class="row" style="justify-content:space-between"><span class="ref">' + esc(v.track) + " · " + esc(v.ref) + "</span>" +
      (canListen ? '<button class="btn" id="listen-btn">Listen</button>' : "") + "</div>" +
      '<p class="deva" lang="sa">' + esc(v.deva) + "</p>" +
      '<p class="iast" lang="sa-Latn">' + esc(v.iast) + "</p>" +
      '<ul class="words">' + v.words.map(function (w) { return "<li><i>" + esc(w[0]) + "</i> — " + esc(w[1]) + "</li>"; }).join("") + "</ul>" +
      '<p class="translation">' + esc(v.meaning) + "</p>" +
      '<p class="lede" style="margin:0">' + esc(v.reflect) + "</p>" +
      '<div class="practice"><span class="eyebrow" style="color:var(--saffron)">Practice today</span><div>' + esc(v.practice) + "</div></div>" +
      "<details><summary>Pronunciation guide</summary><dl class=\"guide\">" +
      window.IAST_GUIDE.map(function (g) { return "<dt>" + esc(g[0]) + "</dt><dd>" + esc(g[1]) + "</dd>"; }).join("") + "</dl></details>";
    var lb = $("listen-btn");
    if (lb) lb.addEventListener("click", function () { listen(v.deva, lb); });
  }
  function listen(text, btn) {
    var clean = text.replace(/[।॥|]/g, ", ");
    if (caps.tts) {
      btn.textContent = "Playing…";
      caps.tts.speak(clean, { language: "hi", rate: 0.8 }).catch(function () {}).then(function () { btn.textContent = "Listen"; });
      return;
    }
    if (speechVoice) {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(clean); u.voice = speechVoice; u.lang = speechVoice.lang; u.rate = 0.75;
      u.onend = function () { btn.textContent = "Listen"; }; btn.textContent = "Playing…"; speechSynthesis.speak(u);
    }
  }

  /* ── speaking ── */
  var speakSecs = 120, speakTick = null, transcript = "", recognizer = null, mediaRec = null;
  function renderSpeak(i) {
    var s = window.SPEAKING[i % window.SPEAKING.length];
    var v = window.PHILOSOPHY[i % window.PHILOSOPHY.length];
    var checks = state.checks[viewDate] || {};
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var canDictate = !!caps.dictation || (!isArtifact && !!SR);
    var canRecord = !isArtifact && !!(navigator.mediaDevices && window.MediaRecorder);
    $("speak-card").innerHTML =
      '<div><span class="eyebrow">Warm-up · 2 min</span><div>Recite <b>' + esc(v.ref) + "</b> aloud three times, slowly. Mind the long vowels and retroflex sounds.</div></div>" +
      '<div><span class="speak-kind">' + esc(s.kind) + "</span><p class=\"prompt\">" + esc(s.prompt) + "</p></div>" +
      '<div class="why"><b>How to structure it</b>' + esc(s.tip) + "</div>" +
      '<div class="row" style="gap:14px"><span class="speakclock" id="sp-clock">2:00</span>' +
      '<button class="btn" id="sp-timer">Start 2-minute timer</button>' +
      (canDictate ? '<button class="btn" id="sp-dict">Transcribe while I speak</button>' : "") +
      (canRecord ? '<button class="btn" id="sp-rec">Record to listen back</button>' : "") + "</div>" +
      '<audio id="sp-audio" controls hidden style="width:100%"></audio>' +
      '<div class="field" id="sp-tr-wrap" ' + (canDictate ? "" : "hidden") + '><label for="sp-tr">Transcript (edit freely)</label><textarea id="sp-tr" placeholder="Your words appear here as you speak…"></textarea></div>' +
      '<div class="row">' + (caps.sample ? '<button class="btn" id="sp-fb">Get feedback from Claude</button>' : '<button class="btn" id="sp-copy">Copy transcript + rubric to ask Claude</button>') + "</div>" +
      '<div class="ai-out" id="sp-out" hidden></div>' +
      '<div><span class="eyebrow">Self-check</span><ul class="rubric" style="margin-top:6px">' +
      window.SPEAKING_RUBRIC.map(function (r, j) { return '<li><label><input type="checkbox" data-j="' + j + '"' + (checks[j] ? " checked" : "") + "> <span>" + esc(r) + "</span></label></li>"; }).join("") + "</ul></div>";

    speakSecs = 120;
    $("sp-timer").addEventListener("click", function () {
      if (speakTick) { clearInterval(speakTick); speakTick = null; this.textContent = "Start 2-minute timer"; return; }
      speakSecs = 120; var btn = this; btn.textContent = "Stop";
      speakTick = setInterval(function () {
        speakSecs--; $("sp-clock").textContent = Math.floor(speakSecs / 60) + ":" + pad(speakSecs % 60);
        if (speakSecs <= 0) { clearInterval(speakTick); speakTick = null; btn.textContent = "Start 2-minute timer"; toast("Two minutes — finish your sentence"); }
      }, 1000);
    });
    document.querySelectorAll(".rubric input").forEach(function (cb) {
      cb.addEventListener("change", function () {
        state.checks[viewDate] = state.checks[viewDate] || {};
        state.checks[viewDate][cb.getAttribute("data-j")] = cb.checked; persist();
      });
    });
    var dict = $("sp-dict"); if (dict) dict.addEventListener("click", function () { toggleDictation(dict, SR); });
    var rec = $("sp-rec"); if (rec) rec.addEventListener("click", function () { toggleRecord(rec); });
    var fb = $("sp-fb"); if (fb) fb.addEventListener("click", function () { speakingFeedback(s, fb); });
    var cp = $("sp-copy"); if (cp) cp.addEventListener("click", function () {
      copyText(feedbackPrompt(s, ($("sp-tr") || {}).value || "(paste or type what you said)"), "Copied — paste it into Claude");
    });
  }
  function feedbackPrompt(s, text) {
    return "Give me speaking feedback as a supportive but direct coach.\nContext: " + PROFILE +
      "\nPrompt I answered (" + s.kind + "): " + s.prompt + "\nWhat I said (speech-to-text, may contain recognition errors):\n\"\"\"\n" + text + "\n\"\"\"\n" +
      "Assess against: clear opening, one main idea, a concrete number or example, filler words, a clear ending, and whether it was true, useful and calm.\n" +
      "Reply in plain text under 200 words: 2 strengths, 2 specific fixes, and a rewritten stronger first sentence. If it was a technical answer, flag any technical inaccuracy.";
  }
  function speakingFeedback(s, btn) {
    var text = ($("sp-tr").value || "").trim();
    var out = $("sp-out"); out.hidden = false;
    if (text.split(/\s+/).length < 15) { out.textContent = "Speak or type at least a few sentences first, then ask for feedback."; return; }
    btn.disabled = true; out.textContent = "Listening back…";
    caps.sample(feedbackPrompt(s, text), { onText: function (u) { out.textContent = u.text; } })
      .then(function (r) { out.textContent = r.text; })
      .catch(function () { out.textContent = "Couldn't reach Claude here. Try again in a minute."; })
      .then(function () { btn.disabled = false; });
  }
  function toggleDictation(btn, SR) {
    var ta = $("sp-tr");
    if (caps.dictation) {
      var d = caps.dictation;
      if (btn.dataset.on === "1") { d.stop().catch(function () {}); return; }
      var base = ta.value ? ta.value + " " : "";
      d.onPartial(function (p) { ta.value = base + p.text; });
      d.onFinal(function (f) { base = base + f.text + " "; ta.value = base; });
      d.onState(function (st) {
        var on = st.state === "listening"; btn.dataset.on = on ? "1" : "0";
        btn.innerHTML = on ? '<span class="rec-dot"></span> Stop transcribing' : "Transcribe while I speak";
      });
      d.start().catch(function (e) { if (e && e.code === "not_granted") { btn.hidden = true; toast("Microphone not allowed — type your answer instead"); } });
      return;
    }
    if (recognizer) { recognizer.stop(); return; }
    recognizer = new SR(); recognizer.lang = "en-US"; recognizer.continuous = true; recognizer.interimResults = true;
    var finalText = ta.value ? ta.value + " " : "";
    recognizer.onresult = function (ev) {
      var interim = "";
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript + " "; else interim += ev.results[i][0].transcript;
      }
      ta.value = finalText + interim;
    };
    recognizer.onend = function () { recognizer = null; btn.textContent = "Transcribe while I speak"; };
    recognizer.onerror = function () { toast("Speech recognition stopped"); };
    recognizer.start(); btn.innerHTML = '<span class="rec-dot"></span> Stop transcribing';
  }
  function toggleRecord(btn) {
    if (mediaRec && mediaRec.state === "recording") { mediaRec.stop(); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var chunks = []; mediaRec = new MediaRecorder(stream);
      mediaRec.ondataavailable = function (e) { chunks.push(e.data); };
      mediaRec.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        var a = $("sp-audio"); a.src = URL.createObjectURL(new Blob(chunks, { type: mediaRec.mimeType })); a.hidden = false;
        btn.textContent = "Record again";
      };
      mediaRec.start(); btn.innerHTML = '<span class="rec-dot"></span> Stop recording';
    }).catch(function () { toast("Microphone not available"); });
  }

  /* ── reflect / streak ── */
  function streak() {
    var n = 0, d = state.log[TODAY] && state.log[TODAY].done ? TODAY : addDays(TODAY, -1);
    while (state.log[d] && state.log[d].done) { n++; d = addDays(d, -1); }
    return n;
  }
  function renderReflect() {
    var entry = state.log[viewDate] || {};
    var draft = state.drafts[viewDate] || {};
    $("r-learned").value = entry.learned || draft.learned || "";
    $("r-action").value = entry.action || draft.action || "";
    var done = !!entry.done;
    $("complete-btn").textContent = done ? "Update today's entry" : (viewDate === TODAY ? "Complete today's hour" : "Log this day");
    $("complete-status").textContent = done ? "Completed " + prettyDate(viewDate) + " ✓" : "";
    var wk = $("week"); wk.innerHTML = "";
    for (var i = 13; i >= 0; i--) {
      var d = addDays(TODAY, -i); var s = document.createElement("span");
      s.className = state.log[d] && state.log[d].done ? "on" : ""; s.title = prettyDate(d); wk.appendChild(s);
    }
    var days = Object.keys(state.log).filter(function (d) { return state.log[d].done; }).sort().reverse();
    $("history").innerHTML = days.length ? days.slice(0, 30).map(function (d) {
      var e = state.log[d];
      return '<li><span class="d">' + prettyDate(d) + " · day " + (cycleIndex(d) + 1) + "</span><div>" + esc(e.learned || "—") + "</div>" +
        (e.action ? '<div class="meta">Next: ' + esc(e.action) + "</div>" : "") + "</li>";
    }).join("") : '<li class="meta">Your entries will collect here.</li>';
    $("stat-streak").textContent = streak();
    $("stat-total").textContent = days.length;
  }
  function saveDraft() {
    state.drafts[viewDate] = { learned: $("r-learned").value, action: $("r-action").value };
    persist();
  }
  function complete() {
    state.log[viewDate] = { done: true, learned: $("r-learned").value.trim(), action: $("r-action").value.trim(), day: cycleIndex(viewDate) + 1 };
    delete state.drafts[viewDate];
    if (viewDate === TODAY) BLOCKS.forEach(function (b) { markBlock(b.k); });
    persist(); renderReflect();
    toast(viewDate === TODAY ? "Hour complete — streak " + streak() : "Logged");
  }

  /* ── day navigation ── */
  function renderDay() {
    var idx = cycleIndex(viewDate);
    $("stat-day").textContent = idx + 1;
    $("day-label").textContent = (viewDate === TODAY ? "Today" : prettyDate(viewDate)) + " · Day " + (idx + 1);
    $("today-btn").hidden = viewDate === TODAY;
    renderClassic(idx); renderPhilo(idx); renderSpeak(idx); renderReflect();
  }
  function shiftDay(n) { viewDate = addDays(viewDate, n); renderDay(); }

  /* ── data loading ── */
  function loadFeed() {
    return fetch("data/latest.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
      feed = d;
    }).catch(function () { feed = { items: [] }; });
  }
  function loadFeedFromDb() {
    if (!caps.db) return Promise.resolve();
    return caps.db.doc("feed/latest").get().then(function (snap) {
      if (snap.exists) {
        var d = snap.data();
        if (d && d.items && (!feed.generated || (d.generated || "") > feed.generated)) { feed = d; renderRadar(); }
      }
    }).catch(function () {});
  }

  function initCapabilities() {
    if (!isArtifact) { setStatus("Progress is saved in this browser"); return; }
    setStatus("Connecting…");
    var use = function (n) { return window.claude.use(n).catch(function () { return null; }); };
    Promise.all([use("db"), use("user"), use("sample"), use("tts"), use("dictation")]).then(function (r) {
      caps.db = r[0]; caps.user = r[1]; caps.sample = r[2]; caps.tts = r[3]; caps.dictation = r[4];
      var chain = Promise.resolve();
      if (caps.db && caps.user) {
        chain = caps.user.id().then(function (id) {
          caps.userDoc = caps.db.collection("data/users/" + id).doc("state");
          return caps.userDoc.get();
        }).then(function (snap) {
          if (snap.exists) {
            var remote = snap.data() || {};
            ["saved", "read", "log", "blocks", "drafts", "checks"].forEach(function (k) { if (remote[k]) state[k] = remote[k]; });
          } else { persist(); }
          setStatus("Progress syncs across your devices");
        }).catch(function () { caps.userDoc = null; setStatus("Progress is saved in this browser"); });
      } else setStatus("Progress is saved in this browser");
      return chain.then(loadFeedFromDb);
    }).then(function () { renderRadar(); renderDay(); renderClock(); });
  }

  /* ── wire up ── */
  document.addEventListener("DOMContentLoaded", function () {
    loadLocal();
    pickVoice(); if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = function () { pickVoice(); renderPhilo(cycleIndex(viewDate)); };

    document.querySelectorAll(".blk").forEach(function (b) { b.addEventListener("click", function () { selectBlock(b.getAttribute("data-k"), true); }); });
    $("timer-btn").addEventListener("click", function () { if (running) stopTimer(); else { if (remaining <= 0) remaining = blockMin(active) * 60; startTimer(); } });
    $("prev-day").addEventListener("click", function () { shiftDay(-1); });
    $("next-day").addEventListener("click", function () { shiftDay(1); });
    $("today-btn").addEventListener("click", function () { viewDate = TODAY; renderDay(); });
    document.querySelectorAll("#research .subtabs button").forEach(function (b) { b.addEventListener("click", function () { setRadarTab(b.getAttribute("data-tab")); }); });
    $("live-go").addEventListener("click", liveSearch);
    $("paper-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var t = $("pf-title").value.trim(); if (!t) return;
      state.saved.unshift({ title: t, authors: $("pf-authors").value.trim(), url: $("pf-link").value.trim(), venue: $("pf-topic").value, date: TODAY });
      persist(); renderSaved(); this.reset(); toast("Saved");
    });
    ["r-learned", "r-action"].forEach(function (id) { $(id).addEventListener("input", function () { clearTimeout(window._dr); window._dr = setTimeout(saveDraft, 500); }); });
    $("complete-btn").addEventListener("click", complete);

    renderClock(); renderDay();
    loadFeed().then(function () { renderRadar(); });
    initCapabilities();
  });
})();
