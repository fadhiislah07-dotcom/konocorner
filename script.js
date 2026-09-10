/* =================================================================
   KONO CORNER — script.js
   Small, dependency-free interactions. No backend required.
================================================================= */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------
     MOBILE NAV
  ----------------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  var mobileBackdrop = document.getElementById("mobileBackdrop");

  function openMenu() {
    document.body.classList.add("menu-open");
    navToggle.setAttribute("aria-expanded", "true");
    mobileMenu.setAttribute("aria-hidden", "false");
  }
  function closeMenu() {
    document.body.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
  }
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var isOpen = document.body.classList.contains("menu-open");
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });
  }
  if (mobileBackdrop) mobileBackdrop.addEventListener("click", closeMenu);
  document.querySelectorAll(".mobile-link").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* -----------------------------------------------------------
     SCROLL HINT — jump to About
  ----------------------------------------------------------- */
  var scrollHint = document.getElementById("scrollHint");
  if (scrollHint) {
    scrollHint.addEventListener("click", function () {
      var about = document.getElementById("about");
      if (about) about.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* -----------------------------------------------------------
     ACCORDION (FAQ)
  ----------------------------------------------------------- */
  document.querySelectorAll(".accordion__question").forEach(function (btn) {
    var answer = btn.nextElementSibling;
    btn.addEventListener("click", function () {
      var isOpen = btn.getAttribute("aria-expanded") === "true";

      // close all others (single-open accordion)
      document.querySelectorAll(".accordion__question").forEach(function (otherBtn) {
        if (otherBtn !== btn) {
          otherBtn.setAttribute("aria-expanded", "false");
          otherBtn.nextElementSibling.style.maxHeight = null;
        }
      });

      if (isOpen) {
        btn.setAttribute("aria-expanded", "false");
        answer.style.maxHeight = null;
      } else {
        btn.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  /* -----------------------------------------------------------
     GALLERY LIGHTBOX
  ----------------------------------------------------------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImage = document.getElementById("lightboxImage");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxClose = document.getElementById("lightboxClose");

  document.querySelectorAll(".gallery-item").forEach(function (item) {
    item.addEventListener("click", function () {
      var caption = item.getAttribute("data-caption") || "";
      var phEl = item.querySelector(".gallery-item__ph");
      var phClass = phEl ? phEl.className.replace("gallery-item__ph", "").trim() : "";

      // REPLACE THIS IMAGE: once you swap placeholders for real <img> tags,
      // update this to show item.querySelector('img').src instead.
      lightboxImage.className = "lightbox__image " + phClass;
      lightboxCaption.textContent = caption;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
    });
  });

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
  }
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });

  /* -----------------------------------------------------------
     FAKE "NOW PLAYING" MUSIC PLAYER (visual only, no real audio)
  ----------------------------------------------------------- */
  var playToggle = document.getElementById("playToggle");
  var iconPlay = document.getElementById("iconPlay");
  var iconPause = document.getElementById("iconPause");
  var progressBar = document.getElementById("nowPlayingProgress");
  var isPlaying = false;
  var progress = 35;
  var progressTimer = null;

  function tickProgress() {
    progress += 1;
    if (progress > 100) progress = 0;
    if (progressBar) progressBar.style.width = progress + "%";
  }

  function startProgress() {
    if (prefersReducedMotion) return;
    stopProgress();
    progressTimer = setInterval(tickProgress, 700);
  }
  function stopProgress() {
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = null;
  }

  if (playToggle) {
    playToggle.addEventListener("click", function () {
      isPlaying = !isPlaying;
      if (iconPlay && iconPause) {
        iconPlay.style.display = isPlaying ? "none" : "block";
        iconPause.style.display = isPlaying ? "block" : "none";
      }
      if (isPlaying) { startProgress(); } else { stopProgress(); }
    });
  }

  /* -----------------------------------------------------------
     FOOTER: DIGITAL CLOCK + "currently decorating" STATUS
  ----------------------------------------------------------- */
  var clockEl = document.getElementById("clock");
  function updateClock() {
    if (!clockEl) return;
    var now = new Date();
    var h = String(now.getHours()).padStart(2, "0");
    var m = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = h + ":" + m + " ♡ local time";
  }
  updateClock();
  setInterval(updateClock, 1000 * 15);

  var statuses = [
    "currently decorating a binder...",
    "sorting stickers by colour ✧",
    "wrapping a preloved photocard 🩵",
    "sketching a new digital design...",
    "answering DMs between decos ♡"
  ];
  var statusText = document.getElementById("statusText");
  var statusIndex = 0;
  if (statusText) {
    setInterval(function () {
      statusIndex = (statusIndex + 1) % statuses.length;
      statusText.textContent = statuses[statusIndex];
    }, 6000);
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -----------------------------------------------------------
     NOTIFICATION TOAST (easter egg popup)
  ----------------------------------------------------------- */
  var toast = document.getElementById("toast");
  var toastText = document.getElementById("toastText");
  var toastClose = document.getElementById("toastClose");
  var toastMessages = [
    "someone just added a photocard to their binder ♡",
    "a new preloved item was just picked up 🩵",
    "a binder deco slot just got booked ✧",
    "someone said hi in the DMs just now ♡"
  ];

  function showToast() {
    if (!toast) return;
    toastText.textContent = toastMessages[Math.floor(Math.random() * toastMessages.length)];
    toast.classList.add("is-visible");
    setTimeout(hideToast, 6000);
  }
  function hideToast() {
    if (toast) toast.classList.remove("is-visible");
  }
  if (toastClose) toastClose.addEventListener("click", hideToast);

  // first appearance after a little delay, so it feels natural
  setTimeout(showToast, 5000);
  setInterval(showToast, 45000);

  /* -----------------------------------------------------------
     CURSOR SPARKLE GLOW (desktop only, purely decorative)
  ----------------------------------------------------------- */
  var cursorGlow = document.getElementById("cursorGlow");
  var isFinePointer = window.matchMedia("(pointer: fine)").matches;
  if (cursorGlow && isFinePointer && !prefersReducedMotion) {
    window.addEventListener("mousemove", function (e) {
      cursorGlow.style.left = e.clientX + "px";
      cursorGlow.style.top = e.clientY + "px";
    });
  }

  /* -----------------------------------------------------------
     HEADER SHADOW ON SCROLL (subtle, cheap)
  ----------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  window.addEventListener("scroll", function () {
    if (!header) return;
    if (window.scrollY > 10) {
      header.style.boxShadow = "0 4px 12px rgba(28,43,74,0.08)";
    } else {
      header.style.boxShadow = "none";
    }
  }, { passive: true });

})();
