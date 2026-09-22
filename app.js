/* Portfolio — everything renders from data/site.json.
   To make this site yours, edit ONLY data/site.json. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header border on scroll */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Reveal on scroll */
  function armReveals(root) {
    var els = (root || document).querySelectorAll(".reveal:not(.in)");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* Footer year */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function timeAgo(iso) {
    var days = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return days + " days ago";
    var months = Math.floor(days / 30);
    if (months < 12) return months + (months === 1 ? " month ago" : " months ago");
    var yrs = Math.floor(months / 12);
    return yrs + (yrs === 1 ? " year ago" : " years ago");
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && value != null) el.textContent = value;
  }

  /* LinkedIn posts — rendered from data/posts.json */
  function loadPosts(linkedinUrl) {
    var box = document.getElementById("postsRows");
    if (!box) return;
    fetch("data/posts.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("posts"); return r.json(); })
      .then(function (data) {
        var posts = (data && data.posts) || [];
        if (!posts.length) throw new Error("empty");
        box.innerHTML = posts.map(function (p, i) {
          var n = ("0" + (i + 1)).slice(-2);
          return '<article class="row reveal">' +
            '<span class="row-idx">' + n + "</span>" +
            '<div class="row-main"><h3>' + esc(p.title) + "</h3><p>" + esc(p.body) + "</p></div>" +
            '<a class="row-link" href="' + esc(p.url) + '" target="_blank" rel="noopener">LinkedIn &#8599;</a>' +
            "</article>";
        }).join("");
        armReveals(box);
      })
      .catch(function () {
        box.innerHTML = '<article class="row reveal">' + '<span class="row-idx">--</span>' +
          '<div class="row-main"><h3>Latest writing lives on LinkedIn.</h3></div>' +
          '<a class="row-link" href="' + esc(linkedinUrl || "https://www.linkedin.com/") + '" target="_blank" rel="noopener">LinkedIn &#8599;</a></article>';
        armReveals(box);
      });
  }

  /* GitHub — featured repos from config, live metadata from the API */
  function loadGitHub(username, featured) {
    var box = document.getElementById("githubRows");
    if (!box) return;
    if (!username || !featured || !featured.length) {
      var wrap = document.getElementById("githubLive");
      if (wrap) wrap.style.display = "none";
      return;
    }
    fetch("https://api.github.com/users/" + encodeURIComponent(username) + "/repos?per_page=100", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("gh"); return r.json(); })
      .then(function (repos) {
        var byName = {};
        repos.forEach(function (r) { byName[r.name.toLowerCase()] = r; });
        var list = featured
          .map(function (n) { return byName[String(n).toLowerCase()]; })
          .filter(function (r) { return !!r; });
        if (!list.length) throw new Error("empty");
        box.innerHTML = list.map(function (r, i) {
          var n = ("0" + (i + 1)).slice(-2);
          return '<article class="row reveal">' +
            '<span class="row-idx">' + n + "</span>" +
            '<div class="row-main"><h3>' + esc(r.name) + "</h3><p>" + esc(r.description || "No description yet.") + "</p>" +
            '<p class="row-meta">' + esc(r.language || "code") +
            " \u00b7 updated " + timeAgo(r.pushed_at) + "</p></div>" +
            '<a class="row-link" href="' + esc(r.html_url) + '" target="_blank" rel="noopener">GitHub &#8599;</a>' +
            "</article>";
        }).join("");
        armReveals(box);
      })
      .catch(function () {
        var wrap = document.getElementById("githubLive");
        if (wrap) wrap.style.display = "none";
      });
  }

  /* Main: render everything from data/site.json */
  fetch("data/site.json", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("site.json missing"); return r.json(); })
    .then(function (s) {
      document.title = s.title || (s.name + " — Portfolio");
      var md = document.getElementById("metaDescription");
      if (md) md.setAttribute("content", s.meta_description || "");
      var ot = document.getElementById("ogTitle");
      if (ot) ot.setAttribute("content", s.og_title || s.title || "");
      var od = document.getElementById("ogDescription");
      if (od) od.setAttribute("content", s.og_description || "");

      var brand = document.getElementById("brand");
      if (brand) brand.innerHTML = esc(s.brand || s.name || "") + '<span class="brand-sq" aria-hidden="true"></span>';

      var kicker = document.getElementById("heroKicker");
      if (kicker) kicker.innerHTML = '<span class="kicker-blue">' + esc(s.name || "") + "</span> — " + esc(s.role || "");
      var headline = document.getElementById("heroHeadline");
      if (headline) headline.innerHTML = (s.headline_lines || []).map(esc).join("<br />");
      setText("heroSub", s.hero_sub);

      var strip = document.getElementById("factStrip");
      if (strip) {
        strip.innerHTML = (s.stats || []).map(function (st) {
          return "<div><dt>" + esc(st.label) + "</dt><dd>" + esc(st.value) + "</dd></div>";
        }).join("");
      }

      setText("workNote", s.work_note);
      var workRows = document.getElementById("workRows");
      if (workRows) {
        workRows.innerHTML = (s.work || []).map(function (w, i) {
          var n = ("0" + (i + 1)).slice(-2);
          return '<article class="row reveal">' +
            '<span class="row-idx">' + n + "</span>" +
            '<div class="row-main"><h3>' + esc(w.title) + "</h3><p>" + esc(w.body) + "</p>" +
            (w.meta ? '<p class="row-meta">' + esc(w.meta) + "</p>" : "") + "</div>" +
            (w.tag ? '<span class="row-tag">' + esc(w.tag) + "</span>" : "") +
            "</article>";
        }).join("");
      }
      setText("githubNote", (s.github && s.github.note) || "");

      setText("writingNote", s.writing_note);
      setText("servicesNote", s.services_note);
      var svcGrid = document.getElementById("svcGrid");
      if (svcGrid) {
        svcGrid.innerHTML = (s.services || []).map(function (sv) {
          return '<article class="svc reveal">' +
            '<p class="svc-kicker">' + esc(sv.kicker) + "</p>" +
            "<h3>" + esc(sv.title) + "</h3>" +
            "<p>" + esc(sv.body) + "</p>" +
            (sv.examples ? '<p class="svc-examples">' + esc(sv.examples) + "</p>" : "") +
            "</article>";
        }).join("");
      }
      setText("svcCtaText", s.services_cta);

      setText("aboutLede", s.about_lede);
      setText("aboutBody", s.about_body);
      var timeline = document.getElementById("timeline");
      if (timeline) {
        timeline.innerHTML = (s.timeline || []).map(function (t) {
          return '<div class="cv-row"><dt>' + esc(t.date) + "</dt><dd><strong>" + esc(t.title) + "</strong>" +
            (t.body ? "<span>" + esc(t.body) + "</span>" : "") + "</dd></div>";
        }).join("");
      }

      setText("contactBig", s.contact_big);
      setText("contactNote", s.contact_note);
      setText("footerName", s.name);
      setText("footerNote", s.footer_note);

      /* Links */
      document.querySelectorAll("[data-booking]").forEach(function (a) {
        if (s.booking_url) { a.href = s.booking_url; }
        else { a.style.display = "none"; }
      });
      document.querySelectorAll("[data-email]").forEach(function (a) {
        if (s.email) { a.href = "mailto:" + s.email; a.textContent = s.email; }
        else { a.style.display = "none"; }
      });
      document.querySelectorAll("[data-linkedin]").forEach(function (a) {
        if (s.linkedin) { a.href = s.linkedin; }
        else { a.style.display = "none"; }
      });
      document.querySelectorAll("[data-github]").forEach(function (a) {
        var url = s.github_url || (s.github && s.github.username ? "https://github.com/" + s.github.username : "");
        if (url) { a.href = url; }
        else { a.style.display = "none"; }
      });

      armReveals(document);
      loadPosts(s.linkedin);
      loadGitHub(s.github && s.github.username, s.github && s.github.featured);
    })
    .catch(function (err) {
      document.body.innerHTML = '<p style="font-family:sans-serif;padding:40px;max-width:600px">' +
        "This site renders from <strong>data/site.json</strong>, which could not be loaded. " +
        "If you are setting this template up, copy <strong>data/site.example.json</strong> to <strong>data/site.json</strong> and fill it in.</p>";
    });
})();
