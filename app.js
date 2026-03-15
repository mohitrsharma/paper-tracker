/* Recommended search queries */
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

/* Render query chips */
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

/* Paper persistence via localStorage */
var STORAGE_KEY = "paperTracker_papers";

function loadPapers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function savePapers(papers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
}

function renderPapers() {
  var list = document.getElementById("paper-list");
  if (!list) return;
  var papers = loadPapers();
  if (papers.length === 0) {
    list.innerHTML = '<p class="muted">No papers saved yet. Use the form above to add your first one.</p>';
    return;
  }
  list.innerHTML = papers
    .map(function (p) {
      var titleHtml = p.link
        ? '<a href="' + p.link + '" target="_blank" rel="noopener">' + p.title + "</a>"
        : p.title;
      return (
        '<div class="paper-item">' +
        "<div>" +
        "<strong>" + titleHtml + "</strong>" +
        '<div class="paper-meta">' + (p.authors || "") + (p.date ? " &middot; " + p.date : "") + "</div>" +
        "</div>" +
        '<span class="paper-topic">' + p.topic + "</span>" +
        "</div>"
      );
    })
    .join("");
}

/* Form handler */
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
    var papers = loadPapers();
    papers.unshift(paper);
    savePapers(papers);
    renderPapers();
    form.reset();
  });
}

/* Init on page load */
document.addEventListener("DOMContentLoaded", function () {
  renderChips();
  renderPapers();
  initForm();
});
