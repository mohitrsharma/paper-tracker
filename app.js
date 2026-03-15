/* ============================================================
   Paper Tracker – auto-fetches recent papers from OpenAlex API
   Sources: JCP, Computers & Fluids, CMAME, JFM, Physics of
   Fluids, Int J Numer Methods Fluids, arXiv (fluid-dyn + cs.LG)
   ============================================================ */

/* Each source gets a focused search query for FSI, multiphase, VOF, ML+CFD */
var SEARCH_TOPICS = "fluid-structure interaction OR multiphase OR volume of fluid OR VOF OR PLIC OR interface reconstruction OR immersed boundary OR contact line OR two-phase OR machine learning CFD OR neural operator";

var SOURCES = [
  { key: "jcp",   name: "JCP",                   issn: "0021-9991", badge: "badge-jcp" },
  { key: "cf",    name: "Computers & Fluids",     issn: "0045-7930", badge: "badge-cf" },
  { key: "cmame", name: "CMAME",                  issn: "0045-7825", badge: "badge-cmame" },
  { key: "jfm",   name: "J. Fluid Mech.",         issn: "0022-1120", badge: "badge-jfm" },
  { key: "pof",   name: "Physics of Fluids",      issn: "1089-7666", badge: "badge-pof" },
  { key: "ijnmf", name: "Int J Numer Meth Fluids", issn: "1097-0363", badge: "badge-injnmf" }
];

var ARXIV_SEARCHES = [
  { key: "arxiv-fsi",  name: "arXiv FSI+Multiphase", query: "fluid-structure interaction OR multiphase flow OR volume of fluid OR VOF OR immersed boundary OR two-phase OR interface reconstruction OR contact line", badge: "badge-arxiv" },
  { key: "arxiv-ml",   name: "arXiv ML+VOF",         query: "machine learning volume of fluid OR neural operator multiphase OR physics-informed multiphase OR deep learning CFD two-phase", badge: "badge-arxiv" }
];

var OPENALEX_BASE = "https://api.openalex.org/works";
var DAYS_BACK = 60;
var PER_SOURCE = 15;

/* ── State ── */
var allPapers = [];
var activeSource = "all";

/* ── Helpers ── */
function daysAgoISO(n) {
  var d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

function escapeHtml(s) {
  var div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

/* Reconstruct abstract from OpenAlex inverted index */
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return "";
  var words = [];
  Object.keys(invertedIndex).forEach(function (word) {
    invertedIndex[word].forEach(function (pos) {
      words[pos] = word;
    });
  });
  return words.join(" ").slice(0, 500);
}

function formatAuthors(authorships) {
  if (!authorships || authorships.length === 0) return "";
  var names = authorships.slice(0, 4).map(function (a) {
    return a.author && a.author.display_name ? a.author.display_name : "";
  }).filter(Boolean);
  if (authorships.length > 4) names.push("et al.");
  return names.join(", ");
}

function getDoi(work) {
  if (work.doi) return work.doi;
  if (work.primary_location && work.primary_location.landing_page_url)
    return work.primary_location.landing_page_url;
  if (work.id) return work.id;
  return "#";
}

/* ── Progress display ── */
function updateProgress(name, status, count, errMsg) {
  var log = document.getElementById("progress-log");
  if (!log) return;
  var id = "prog-" + name.replace(/[^a-zA-Z]/g, "");
  var el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "progress-item";
    log.appendChild(el);
  }
  if (status === "loading") {
    el.innerHTML = '<span class="mini-spin"></span> ' + escapeHtml(name) + '...';
  } else if (status === "done") {
    el.innerHTML = '<span class="prog-ok">&#10003;</span> ' + escapeHtml(name) + ' &mdash; ' + count + ' papers';
    el.className = "progress-item done";
  } else {
    el.innerHTML = '<span class="prog-err">&#10007;</span> ' + escapeHtml(name) + ' &mdash; ' + escapeHtml(errMsg || "failed");
    el.className = "progress-item err";
  }
}

/* ── Fetch with timeout ── */
function fetchWithTimeout(url, ms) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () { reject(new Error("timeout")); }, ms);
    fetch(url).then(function (r) {
      clearTimeout(timer);
      resolve(r);
    }).catch(function (err) {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function parseResults(data, meta) {
  return (data.results || []).map(function (w) {
    return {
      title: w.title || "Untitled",
      authors: formatAuthors(w.authorships),
      abstract: reconstructAbstract(w.abstract_inverted_index),
      url: getDoi(w),
      date: w.publication_date || "",
      source: meta.key,
      sourceName: meta.name,
      badge: meta.badge
    };
  });
}

/* ── Fetch from OpenAlex ── */
function fetchJournal(source) {
  var fromDate = daysAgoISO(DAYS_BACK);
  var url = OPENALEX_BASE +
    "?search=" + encodeURIComponent(SEARCH_TOPICS) +
    "&filter=primary_location.source.issn:" + source.issn +
    ",from_publication_date:" + fromDate +
    "&sort=relevance_score:desc" +
    "&per_page=" + PER_SOURCE +
    "&mailto=ms.rks2001@gmail.com";

  updateProgress(source.name, "loading");
  return fetchWithTimeout(url, 10000)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var papers = parseResults(data, source);
      updateProgress(source.name, "done", papers.length);
      return papers;
    })
    .catch(function (err) {
      updateProgress(source.name, "error", 0, err.message);
      return [];
    });
}

function fetchArxiv(search) {
  var fromDate = daysAgoISO(DAYS_BACK);
  var url = OPENALEX_BASE +
    "?search=" + encodeURIComponent(search.query) +
    "&filter=primary_location.source.type:repository,from_publication_date:" + fromDate +
    "&sort=publication_date:desc" +
    "&per_page=" + PER_SOURCE +
    "&mailto=ms.rks2001@gmail.com";

  updateProgress(search.name, "loading");
  return fetchWithTimeout(url, 10000)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var papers = parseResults(data, search);
      updateProgress(search.name, "done", papers.length);
      return papers;
    })
    .catch(function (err) {
      updateProgress(search.name, "error", 0, err.message);
      return [];
    });
}

/* ── Render ── */
function renderTabs() {
  var nav = document.getElementById("source-tabs");
  if (!nav) return;

  var allTab = '<button class="tab active" data-source="all">All</button>';
  var journalTabs = SOURCES.map(function (s) {
    return '<button class="tab" data-source="' + s.key + '">' + s.name + '</button>';
  }).join("");
  var arxivTabs = ARXIV_SEARCHES.map(function (s) {
    return '<button class="tab" data-source="' + s.key + '">' + s.name + '</button>';
  }).join("");

  nav.innerHTML = allTab + journalTabs + arxivTabs;

  nav.addEventListener("click", function (e) {
    if (!e.target.classList.contains("tab")) return;
    nav.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
    e.target.classList.add("active");
    activeSource = e.target.getAttribute("data-source");
    renderFeed();
  });
}

function renderPaperCard(p) {
  var hasAbstract = p.abstract && p.abstract.length > 20;
  var id = "abs-" + Math.random().toString(36).slice(2, 9);
  return (
    '<div class="paper-card">' +
      '<div class="paper-card-header">' +
        '<div>' +
          '<div class="paper-title"><a href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' + escapeHtml(p.title) + '</a></div>' +
          '<div class="paper-authors">' + escapeHtml(p.authors) + '</div>' +
          '<div class="paper-meta-row">' +
            '<span class="journal-badge ' + p.badge + '">' + escapeHtml(p.sourceName) + '</span>' +
            '<span class="paper-date">' + escapeHtml(p.date) + '</span>' +
          '</div>' +
          (hasAbstract
            ? '<button class="abstract-toggle" onclick="toggleAbstract(\'' + id + '\', this)">Show abstract</button>' +
              '<div class="paper-abstract" id="' + id + '">' + escapeHtml(p.abstract) + '</div>'
            : '') +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function renderFeed() {
  var feed = document.getElementById("feed");
  if (!feed) return;

  var filtered = activeSource === "all"
    ? allPapers
    : allPapers.filter(function (p) { return p.source === activeSource; });

  if (filtered.length === 0) {
    feed.innerHTML = '<div class="empty-msg">No papers found for this source in the last ' + DAYS_BACK + ' days.</div>';
    return;
  }

  feed.innerHTML = filtered.map(renderPaperCard).join("");
}

function toggleAbstract(id, btn) {
  var el = document.getElementById(id);
  if (!el) return;
  var isOpen = el.classList.toggle("open");
  btn.textContent = isOpen ? "Hide abstract" : "Show abstract";
}

function updateStats() {
  var el = document.getElementById("stat-total");
  if (el) el.textContent = allPapers.length;
}

/* ── Fetch all sources ── */
function fetchAll() {
  var loader = document.getElementById("global-loader");

  var journalPromises = SOURCES.map(function (s) { return fetchJournal(s); });
  var arxivPromises = ARXIV_SEARCHES.map(function (s) { return fetchArxiv(s); });

  Promise.all(journalPromises.concat(arxivPromises))
    .then(function (results) {
      allPapers = [];
      results.forEach(function (papers) {
        allPapers = allPapers.concat(papers);
      });
      /* Sort by date descending */
      allPapers.sort(function (a, b) {
        return (b.date || "").localeCompare(a.date || "");
      });
      /* Deduplicate by title (lowercase) */
      var seen = {};
      allPapers = allPapers.filter(function (p) {
        var k = p.title.toLowerCase().trim();
        if (seen[k]) return false;
        seen[k] = true;
        return true;
      });
      if (loader) loader.style.display = "none";
      updateStats();
      renderFeed();
    })
    .catch(function () {
      if (loader) loader.innerHTML = '<div class="error-msg">Failed to fetch papers. Check your connection and refresh.</div>';
    });
}

/* ── Search Queries ── */
var QUERIES = [
  '"fluid-structure interaction" OR FSI',
  '"volume of fluid" OR VOF OR PLIC',
  '"multiphase flow" AND "machine learning"',
  '"interface reconstruction" AND neural',
  '"contact line" AND VOF',
  '"immersed boundary" OR "fictitious domain"',
  '"overset grid" AND multiphase',
  '"neural operator" AND CFD'
];

function renderChips() {
  var container = document.getElementById("query-chips");
  if (!container) return;
  container.innerHTML = "";
  QUERIES.forEach(function (q) {
    var chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = q;
    chip.title = "Click to copy";
    chip.addEventListener("click", function () {
      navigator.clipboard.writeText(q).then(function () {
        chip.classList.add("copied");
        chip.textContent = "Copied!";
        setTimeout(function () {
          chip.classList.remove("copied");
          chip.textContent = q;
        }, 1200);
      });
    });
    container.appendChild(chip);
  });
}

/* ── Manual Paper Save (localStorage) ── */
var STORAGE_KEY = "paperTracker_saved";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch (e) { return []; }
}

function saveSaved(papers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
}

function renderSaved() {
  var section = document.getElementById("saved-section");
  var list = document.getElementById("paper-list");
  if (!section || !list) return;
  var papers = loadSaved();
  if (papers.length === 0) { section.style.display = "none"; return; }
  section.style.display = "block";
  list.innerHTML = papers.map(function (p) {
    var titleHtml = p.link
      ? '<a href="' + escapeHtml(p.link) + '" target="_blank" rel="noopener">' + escapeHtml(p.title) + '</a>'
      : escapeHtml(p.title);
    return (
      '<div class="saved-item">' +
        '<div><strong>' + titleHtml + '</strong>' +
        '<div style="font-size:0.84rem;color:var(--muted)">' + escapeHtml(p.authors || "") + (p.date ? " &middot; " + p.date : "") + '</div></div>' +
        '<span class="saved-topic">' + escapeHtml(p.topic) + '</span>' +
      '</div>'
    );
  }).join("");
}

function initForm() {
  var form = document.getElementById("paper-form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var title = document.getElementById("paper-title").value.trim();
    if (!title) return;
    var paper = {
      title: title,
      authors: document.getElementById("paper-authors").value.trim(),
      link: document.getElementById("paper-link").value.trim(),
      topic: document.getElementById("paper-topic").value,
      date: new Date().toISOString().slice(0, 10)
    };
    var papers = loadSaved();
    papers.unshift(paper);
    saveSaved(papers);
    renderSaved();
    form.reset();
  });
}

/* ── Collapsible sections ── */
function initCollapsibles() {
  var toggles = document.querySelectorAll(".collapse-toggle");
  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var body = btn.nextElementSibling;
      if (body) body.classList.toggle("open");
    });
  });
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", function () {
  var dateLine = document.getElementById("date-line");
  if (dateLine) dateLine.textContent = todayStr();

  renderTabs();
  renderChips();
  renderSaved();
  initForm();
  initCollapsibles();
  fetchAll();
});
