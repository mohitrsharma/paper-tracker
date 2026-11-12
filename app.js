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
    { k: "field", min: 15, label: "Your field" },
    { k: "research", min: 25, label: "Research radar" },
    { k: "classic", min: 15, label: "Classic" },
    { k: "philo", min: 10, label: "Śloka" },
    { k: "speak", min: 10, label: "Mock defense" }
  ];
  var PROFILE = "Mohit is a PhD student (Engineering and Applied Science, UMass Dartmouth, advisor Dr. Mehdi Raessi) working on computational multiphase flow: VOF/PLIC interface reconstruction, three-phase contact-line dynamics and contact angles, the fictitious-domain FSI method of Pathak & Raessi, ML acceleration of interface reconstruction (PLIC-Net, TorchScript models called from a C++ solver), the variable-density pressure Poisson solver and its condition number, and quantum linear solvers (HHL, VQLS) for the pressure equation. He also validates cases in OpenFOAM. His proposal defense (within two weeks of 11 Nov 2026) is a review titled “Simulating moving solids that interact with two-phase interfaces”: FSI grids (conforming/ALE, immersed methods on both sides or fluid side only, overset) and contact-angle methods for water entry with wettability. Gap: no fixed-grid method imposes a contact angle other than 90° on a solid moving through the grid while conserving liquid volume at the water–air density ratio. His solver (Ghasemi 2014, Pathak & Raessi 2016: momentum projection + geometric VOF) leaves an air film in water entry. Proposed remedies: contact angle via the PLIC plane orientation and curvature, rigid velocity restricted/weighted by solid fraction, conservative hand-over of covered cells; validation against Duez 2007 U*, Do-Quang & Amberg 2009, Ding 2015, Kintea 2016. He is aiming for faculty positions and is working hard to improve his spoken English and confidence.";
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
  var state = { saved: [], read: {}, log: {}, blocks: {}, drafts: {}, checks: {}, speech: {} };
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
  var active = "field", remaining = 15 * 60, running = false, tick = null;
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

  /* ── field mastery ── */
  function renderField(i) {
    var c = window.FIELD[i % window.FIELD.length];
    var el = $("field-card");
    el.innerHTML =
      '<div><span class="grp">' + esc(c.group) + "</span><h3>" + esc(c.title) + '</h3><div class="meta">' + esc(c.cite) + "</div></div>" +
      '<p class="lede" style="margin:0">' + esc(c.summary) + "</p>" +
      c.eqs.map(function (e) { return '<div class="eqbox">\\[' + e + "\\]</div>"; }).join("") +
      '<div class="where"><b>In your proposal:</b> ' + esc(c.where) + "</div>" +
      '<div class="cq"><span class="eyebrow" style="color:var(--t-field)">Committee question</span><div class="q">' + esc(c.question) + "</div>" +
      '<div class="row"><button class="btn" id="cq-btn">Show answer outline</button>' + (caps.sample ? '<button class="btn" id="cq-drill">Drill this aloud in mock defense</button>' : "") + "</div>" +
      '<ol class="outline" id="cq-out" hidden>' + c.answer.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ol></div>";
    $("cq-btn").addEventListener("click", function () { var o = $("cq-out"); o.hidden = !o.hidden; this.textContent = o.hidden ? "Show answer outline" : "Hide outline"; });
    var dr = $("cq-drill"); if (dr) dr.addEventListener("click", function () { startDefense({ q: c.question, look: c.answer }); $("speak").scrollIntoView({ behavior: "smooth" }); });
    typeset(el);
  }

  /* ── speaking metrics ── */
  var FILLERS = ["um", "uh", "erm", "er", "ah", "like", "basically", "actually", "you know", "kind of", "sort of", "i mean"];
  function metrics(text, secs) {
    var t = " " + (text || "").toLowerCase().replace(/[^a-z' ]+/g, " ") + " ";
    var words = t.trim() ? t.trim().split(/\s+/).length : 0;
    var fill = 0, found = {};
    FILLERS.forEach(function (f) { var m = t.split(" " + f + " ").length - 1; if (m) { fill += m; found[f] = m; } });
    var mins = secs > 5 ? secs / 60 : 0;
    return { words: words, fillers: fill, found: found, wpm: mins ? Math.round(words / mins) : 0, fpm: mins ? +(fill / mins).toFixed(1) : 0 };
  }
  function renderMeters(m) {
    var box = $("df-meters"); if (!box) return;
    var paceCls = !m.wpm ? "" : (m.wpm >= 120 && m.wpm <= 160 ? "ok" : "warn");
    var fillCls = !m.wpm ? "" : (m.fpm <= 3 ? "ok" : "warn");
    var top = Object.keys(m.found).sort(function (a, b) { return m.found[b] - m.found[a]; }).slice(0, 3).map(function (f) { return "“" + f + "” ×" + m.found[f]; }).join(", ");
    box.innerHTML = "<span><b>" + m.words + "</b> words</span>" +
      '<span class="' + paceCls + '"><b>' + (m.wpm || "–") + "</b> words/min (aim 130–150)</span>" +
      '<span class="' + fillCls + '"><b>' + m.fillers + "</b> fillers" + (m.wpm ? " · " + m.fpm + "/min" : "") + "</span>" +
      (top ? "<span>Most: " + esc(top) + "</span>" : "");
  }
  function recordSpeech(m) {
    if (!m.wpm || m.words < 25) return;
    state.speech[TODAY] = { wpm: m.wpm, fpm: m.fpm, words: m.words };
    persist(); renderCoach();
  }

  /* ── mock defense ── */
  var thread = [], current = null, dictStart = 0, dictSecs = 0, recognizer = null, mediaRec = null, listening = false;
  function speakAloud(text, btn) {
    if (caps.tts) { if (btn) btn.textContent = "Speaking…"; caps.tts.speak(text, { language: "en", rate: 0.95 }).catch(function () {}).then(function () { if (btn) btn.textContent = "Hear it again"; }); return true; }
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = 0.95;
      var v = speechSynthesis.getVoices().find(function (x) { return /^en(-|_)/i.test(x.lang); }); if (v) u.voice = v;
      if (btn) { btn.textContent = "Speaking…"; u.onend = function () { btn.textContent = "Hear it again"; }; }
      speechSynthesis.speak(u); return true;
    }
    return false;
  }
  function startDefense(item) {
    current = item; thread = [{ role: "examiner", text: item.q }];
    renderThread(); resetAnswer();
    var hb = $("df-hear"); if (hb) { hb.textContent = "Hear the question"; }
  }
  function renderThread() {
    var box = $("df-thread"); if (!box) return;
    $("df-q").textContent = thread[0].text;
    box.innerHTML = thread.slice(1).map(function (t) {
      return '<div class="turn ' + (t.role === "examiner" ? "claude" : "") + '"><span class="who">' + (t.role === "examiner" ? "Examiner" : "You") + "</span>" + esc(t.text) + "</div>";
    }).join("");
  }
  function resetAnswer() { var ta = $("sp-tr"); if (ta) ta.value = ""; dictSecs = 0; renderMeters(metrics("", 0)); }
  function lastExaminer() { for (var i = thread.length - 1; i >= 0; i--) if (thread[i].role === "examiner") return thread[i].text; return ""; }

  function renderSpeak(i) {
    var item = window.DEFENSE[i % window.DEFENSE.length];
    var drill = window.SPEAKING[i % window.SPEAKING.length];
    var v = window.PHILOSOPHY[i % window.PHILOSOPHY.length];
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var canDictate = !!caps.dictation || (!isArtifact && !!SR);
    var canRecord = !isArtifact && !!(navigator.mediaDevices && window.MediaRecorder);
    var canHear = !!caps.tts || "speechSynthesis" in window;
    $("speak-card").innerHTML =
      '<div><span class="eyebrow">Warm-up · 1 min</span><div>Recite <b>' + esc(v.ref) + "</b> once, slowly and loudly.</div></div>" +
      '<div class="examiner"><span class="speak-kind">Committee question</span><p class="q" id="df-q"></p>' +
      '<div class="row">' + (canHear ? '<button class="btn" id="df-hear">Hear the question</button>' : "") +
      (canDictate ? '<button class="btn" id="sp-dict">Answer aloud</button>' : "") +
      (canRecord ? '<button class="btn" id="sp-rec">Record to listen back</button>' : "") +
      '<button class="btn" id="df-look">What a strong answer covers</button></div>' +
      '<ol class="outline" id="df-look-out" hidden></ol>' +
      '<div class="field"><label for="sp-tr">Your answer (transcribed as you speak — or type it)</label><textarea id="sp-tr" placeholder="Press “Answer aloud” and speak for one to two minutes…"></textarea></div>' +
      '<div class="meters" id="df-meters"></div>' +
      '<audio id="sp-audio" controls hidden style="width:100%"></audio>' +
      '<div class="row">' + (caps.sample ? '<button class="iconbtn primary" id="df-fb">Examiner: feedback + follow-up</button>' : '<button class="btn" id="sp-copy">Copy answer + question to ask Claude for feedback</button>') +
      '<button class="btn" id="df-new">Restart this question</button></div>' +
      '<div class="thread" id="df-thread"></div></div>' +
      '<details><summary>Extra drill (' + esc(drill.kind) + ")</summary><div class=\"stack\" style=\"margin-top:8px\"><p class=\"prompt\">" + esc(drill.prompt) + '</p><div class="why"><b>How to structure it</b>' + esc(drill.tip) + "</div></div></details>";

    startDefense(item);
    $("df-look").addEventListener("click", function () {
      var o = $("df-look-out"); o.innerHTML = (current.look || []).map(function (a) { return "<li>" + esc(a) + "</li>"; }).join(""); o.hidden = !o.hidden;
    });
    var hb = $("df-hear"); if (hb) hb.addEventListener("click", function () { speakAloud(lastExaminer(), hb); });
    var dict = $("sp-dict"); if (dict) dict.addEventListener("click", function () { toggleDictation(dict, SR); });
    var rec = $("sp-rec"); if (rec) rec.addEventListener("click", function () { toggleRecord(rec); });
    $("sp-tr").addEventListener("input", function () { renderMeters(metrics(this.value, dictSecs)); });
    $("df-new").addEventListener("click", function () { startDefense(current); });
    var fb = $("df-fb"); if (fb) fb.addEventListener("click", function () { examinerTurn(fb); });
    var cp = $("sp-copy"); if (cp) cp.addEventListener("click", function () {
      copyText(examinerPrompt($("sp-tr").value || "(type what you said)"), "Copied — paste it into Claude");
    });
  }
  function examinerPrompt(answer) {
    var hist = thread.map(function (t) { return (t.role === "examiner" ? "EXAMINER: " : "STUDENT: ") + t.text; }).join("\n");
    var m = metrics(answer, dictSecs);
    return "You are a fair but demanding member of a PhD proposal committee in computational fluid dynamics, and also a speaking coach.\n\nStudent: " + PROFILE +
      "\n\nKey points a strong answer to the opening question would cover (for you, not to be read out): " + (current.look || []).join(" | ") +
      "\n\nConversation so far:\n" + hist + "\nSTUDENT (latest answer, from speech-to-text, may contain recognition errors): " + answer +
      "\n\nSpeaking data: " + m.words + " words" + (m.wpm ? ", " + m.wpm + " words per minute, " + m.fillers + " filler words" : "") + ".\n\n" +
      "Reply in plain text, under 170 words, in exactly this order:\n" +
      "CONTENT: one or two sentences — what was right, and the most important missing or wrong technical point.\n" +
      "DELIVERY: one concrete tip on clarity, structure or confidence, based on the wording and speaking data.\n" +
      "BETTER OPENING: one strong first sentence he could have said.\n" +
      "FOLLOW-UP: one probing follow-up question a real committee member would ask next, on a single line starting with 'FOLLOW-UP:'.";
  }
  function examinerTurn(btn) {
    var ans = ($("sp-tr").value || "").trim();
    if (ans.split(/\s+/).length < 12) { toast("Answer aloud (or type) a few sentences first"); return; }
    var m = metrics(ans, dictSecs); recordSpeech(m);
    thread.push({ role: "you", text: ans });
    var reply = { role: "examiner", text: "Thinking…" }; thread.push(reply); renderThread();
    btn.disabled = true;
    caps.sample(examinerPrompt(ans), { onText: function (u) { reply.text = u.text; renderThread(); } })
      .then(function (r) {
        reply.text = r.text; renderThread();
        var f = /FOLLOW-UP:\s*(.+)/i.exec(r.text);
        if (f) { thread.push({ role: "examiner", text: f[1].trim(), followup: true }); }
        resetAnswer(); renderThread();
        var hb = $("df-hear"); if (hb) hb.textContent = "Hear the follow-up";
        $("sp-tr").placeholder = "Answer the follow-up aloud…";
      })
      .catch(function (e) { reply.text = e && e.code === "rate_limited" ? "Claude is busy — try again in a minute." : "Couldn't reach Claude here."; renderThread(); })
      .then(function () { btn.disabled = false; });
  }
  function toggleDictation(btn, SR) {
    var ta = $("sp-tr");
    if (caps.dictation) {
      var d = caps.dictation;
      if (listening) { d.stop().catch(function () {}); return; }
      var base = ta.value ? ta.value + " " : "";
      d.onPartial(function (p) { ta.value = base + p.text; renderMeters(metrics(ta.value, dictSecs + (Date.now() - dictStart) / 1000)); });
      d.onFinal(function (f) { base = base + f.text + " "; ta.value = base; });
      d.onState(function (st) {
        var on = st.state === "listening";
        if (on && !listening) dictStart = Date.now();
        if (!on && listening) { dictSecs += (Date.now() - dictStart) / 1000; renderMeters(metrics(ta.value, dictSecs)); }
        listening = on;
        btn.innerHTML = on ? '<span class="rec-dot"></span> Stop' : "Answer aloud";
      });
      d.start().catch(function (e) { if (e && e.code === "not_granted") { btn.hidden = true; toast("Microphone not allowed — type your answer instead"); } });
      return;
    }
    if (recognizer) { recognizer.stop(); return; }
    recognizer = new SR(); recognizer.lang = "en-US"; recognizer.continuous = true; recognizer.interimResults = true;
    var finalText = ta.value ? ta.value + " " : "";
    dictStart = Date.now();
    recognizer.onresult = function (ev) {
      var interim = "";
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript + " "; else interim += ev.results[i][0].transcript;
      }
      ta.value = finalText + interim;
      renderMeters(metrics(ta.value, dictSecs + (Date.now() - dictStart) / 1000));
    };
    recognizer.onend = function () { dictSecs += (Date.now() - dictStart) / 1000; recognizer = null; btn.textContent = "Answer aloud"; var m = metrics(ta.value, dictSecs); renderMeters(m); recordSpeech(m); };
    recognizer.onerror = function () { toast("Speech recognition stopped"); };
    recognizer.start(); btn.innerHTML = '<span class="rec-dot"></span> Stop';
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

  /* ── coach ── */
  function renderCoach() {
    var tips = window.COACH_TIPS;
    $("tips-speaking").innerHTML = tips.speaking.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    $("tips-growth").innerHTML = tips.growth.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    var days = Object.keys(state.speech || {}).sort().slice(-7);
    var box = $("speech-trend");
    if (!days.length) { box.innerHTML = ""; return; }
    var maxW = Math.max.apply(null, days.map(function (d) { return state.speech[d].wpm; }).concat([160]));
    box.innerHTML = days.map(function (d) {
      var e = state.speech[d];
      return '<div class="bar" title="' + esc(prettyDate(d)) + ": " + e.wpm + ' wpm" style="height:' + Math.max(6, Math.round(44 * e.wpm / maxW)) + 'px"><span>' + e.wpm + "</span></div>";
    }).join("");
    var last = state.speech[days[days.length - 1]];
    var first = state.speech[days[0]];
    $("speech-summary").textContent = "Latest: " + last.wpm + " words/min, " + last.fpm + " fillers/min." +
      (days.length > 1 ? " First of these: " + first.wpm + " words/min, " + first.fpm + " fillers/min." : "") +
      " Target: 130–150 words/min and under 3 fillers/min.";
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
    renderField(idx); renderClassic(idx); renderPhilo(idx); renderSpeak(idx); renderReflect();
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
            ["saved", "read", "log", "blocks", "drafts", "checks", "speech"].forEach(function (k) { if (remote[k]) state[k] = remote[k]; });
          } else { persist(); }
          setStatus("Progress syncs across your devices");
        }).catch(function () { caps.userDoc = null; setStatus("Progress is saved in this browser"); });
      } else setStatus("Progress is saved in this browser");
      return chain.then(loadFeedFromDb);
    }).then(function () { renderRadar(); renderDay(); renderClock(); renderCoach(); });
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

    renderClock(); renderDay(); renderCoach();
    loadFeed().then(function () { renderRadar(); });
    initCapabilities();
  });
})();
