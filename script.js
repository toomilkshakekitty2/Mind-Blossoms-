// ============================================================
// Mind Blossoms — shared behaviour
// Renders the site's flower motif into any [data-blossom] mount
// point: real macro flower photography for icon/hero-scale spots
// (picked per growth stage: bud, half, full), and small illustrated
// flower stickers for inline bullet points, where a cropped photo
// would just read as a blurry smudge.
// ============================================================

(function () {
  "use strict";

  var BUD_KEYS = ["bud_gomphrena", "bud_cyclamen", "bud_lilac", "bud_phlox"];
  var HALF_KEYS = ["half_dianthus", "half_bougainvillea", "half_primula", "half_azalea"];
  var FULL_KEYS = ["full_dahlia", "full_osteospermum", "full_crepemyrtle", "full_rhododendron", "full_mums_dark", "full_mums_pink"];
  var STICKER_KEYS = ["sticker_pink_cosmos", "sticker_purple_bloom", "sticker_pink_plumeria", "sticker_red_pink_daisy", "sticker_purple_daisy"];

  function stageKeys(stage) {
    if (stage === "bud" || stage === "seed") return BUD_KEYS;
    if (stage === "half") return HALF_KEYS;
    return FULL_KEYS;
  }

  // Demo (single-file) builds inject window.MB_ASSETS, a key -> data URI
  // map, so the preview is fully self-contained. Production pages ship
  // the images alongside the HTML, so this just falls back to their path.
  function resolveAsset(kind, key) {
    if (window.MB_ASSETS && window.MB_ASSETS[key]) return window.MB_ASSETS[key];
    if (kind === "sticker") return "assets/stickers/" + key + ".png";
    return "assets/flowers/" + key + ".jpg";
  }

  var counters = { bud: 0, half: 0, full: 0, sticker: 0 };

  function nextKey(kind, stage) {
    if (kind === "sticker") {
      var i = counters.sticker % STICKER_KEYS.length;
      counters.sticker++;
      return STICKER_KEYS[i];
    }
    var bucket = stage === "bud" || stage === "seed" ? "bud" : stage === "half" ? "half" : "full";
    var keys = stageKeys(bucket);
    var idx = counters[bucket] % keys.length;
    counters[bucket]++;
    return keys[idx];
  }

  function mountBlossoms(scope) {
    var mounts = (scope || document).querySelectorAll("[data-blossom]");
    mounts.forEach(function (el) {
      var stage = el.getAttribute("data-blossom") || "full";
      var kind = el.getAttribute("data-kind") === "sticker" ? "sticker" : "photo";
      var key = nextKey(kind, stage);
      var url = resolveAsset(kind, key);
      if (kind === "sticker") {
        el.innerHTML = '<img class="sticker-flower" src="' + url + '" alt="" aria-hidden="true">';
      } else {
        var shapeAttr = el.getAttribute("data-shape");
        var shape = shapeAttr === "organic" ? " organic" : shapeAttr === "flower" ? " flower-mask" : "";
        el.innerHTML = '<span class="photo-blossom' + shape + '" style="background-image:url(&quot;' + url + '&quot;)" aria-hidden="true"></span>';
      }
    });
  }

  // Gentle typewriter reveal: characters appear left-to-right in typewriter
  // rhythm, but each one eases in with a soft fade + tiny lift instead of
  // snapping into place, and a slow, soft-blinking caret (sine fade, not a
  // hard on/off flicker) follows along and disappears once done.
  function typewriterReveal(el) {
    if (!el) return;
    var full = el.textContent;
    el.innerHTML = "";
    var parts = full.split(/(\s+)/);
    var charIndex = 0;
    parts.forEach(function (chunk) {
      if (chunk === "") return;
      if (/^\s+$/.test(chunk)) {
        el.appendChild(document.createTextNode(chunk));
        return;
      }
      // Each word is one unbreakable unit (browsers only line-wrap at the
      // whitespace between words) so wrapping individual letters in their
      // own inline-block never splits a word mid-way onto two lines.
      var wordWrap = document.createElement("span");
      wordWrap.className = "tw-word";
      chunk.split("").forEach(function (ch) {
        var span = document.createElement("span");
        span.className = "tw-char";
        span.textContent = ch;
        span.style.transitionDelay = Math.min(charIndex * 42, 1050) + "ms";
        wordWrap.appendChild(span);
        charIndex++;
      });
      el.appendChild(wordWrap);
    });
    var cursor = document.createElement("span");
    cursor.className = "tw-cursor";
    el.appendChild(cursor);

    void el.offsetWidth;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        el.querySelectorAll(".tw-char").forEach(function (c) {
          c.classList.add("in");
        });
      });
    });

    var finishAt = Math.min(charIndex * 42, 1050) + 450;
    window.setTimeout(function () {
      if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
    }, finishAt);
  }

  function animateEntrance(el) {
    if (!el) return;
    el.classList.add("entering");
    void el.offsetWidth;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        el.classList.remove("entering");
      });
    });
  }

  window.MindBlossoms = {
    typewriterReveal: typewriterReveal,
    animateEntrance: animateEntrance,
    mountBlossoms: mountBlossoms,
  };

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || items.length === 0) {
      items.forEach(function (el) {
        el.classList.add("in");
        var h = el.querySelector("h2, h3");
        if (h) typewriterReveal(h);
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            var heading = entry.target.matches("h2, h3") ? entry.target : entry.target.querySelector(".section-head h2, .section-head h3");
            if (heading) typewriterReveal(heading);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (el) { io.observe(el); });
  }

  function initForm() {
    var form = document.querySelector(".inquiry");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      var name = form.querySelector("#name");
      var service = form.querySelector("#service");
      var subject = encodeURIComponent("Mind Blossoms inquiry — " + (service ? service.value : ""));
      var bodyLines = [];
      form.querySelectorAll("input, select, textarea").forEach(function (field) {
        if (!field.name) return;
        bodyLines.push(field.previousElementSibling ? field.previousElementSibling.textContent + ": " + field.value : field.value);
      });
      var mailto = "mailto:mindblossomske@gmail.com?subject=" + subject + "&body=" + encodeURIComponent(bodyLines.join("\n"));
      if (status) {
        status.textContent = "Opening your email app to send this to mindblossomske@gmail.com" + (name && name.value ? ", thank you " + name.value + "." : ".");
        status.classList.add("show");
      }
      window.location.href = mailto;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    mountBlossoms();
    initNav();
    initReveal();
    initForm();
    animateEntrance(document.getElementById("main"));
    var h1 = document.querySelector("h1");
    if (h1) typewriterReveal(h1);
    var year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  });
})();
