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
     "NOW PLAYING" MUSIC PLAYER
     Tries to play a real track from assets/audio/corner-radio.mp3
     first. If that file isn't there (or fails to load), it falls
     back automatically to a tiny original synth loop generated in
     code (soft chords + a gentle tick) — so the button always does
     something, whether or not you've added your own track.
  ----------------------------------------------------------- */
  var playToggle = document.getElementById("playToggle");
  var iconPlay = document.getElementById("iconPlay");
  var iconPause = document.getElementById("iconPause");
  var progressBar = document.getElementById("nowPlayingProgress");
  var cornerAudio = document.getElementById("cornerAudio");
  var isPlaying = false;
  var usingRealAudio = false;
  var progress = 0;
  var progressTimer = null;

  var audioCtx = null;
  var loopTimer = null;
  var LOOP_SECONDS = 8;

  function ensureAudioCtx() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    return audioCtx;
  }

  // one soft sine "note" with a gentle fade in/out, so nothing clicks or pops
  function playNote(ctx, freq, startTime, duration, peakGain) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  // a tiny soft "tick", like a sticker being sorted into a pile
  function playTick(ctx, startTime) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 1100;
    gain.gain.setValueAtTime(0.09, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.08);
  }

  // one 8-second phrase: four soft chords, two ticks per chord
  function scheduleLoop(ctx) {
    var base = ctx.currentTime + 0.05;
    var chords = [
      [261.63, 329.63, 392.0],   // C major — warm, mid-range
      [246.94, 293.66, 369.99],  // B dim-ish passing chord
      [220.0, 277.18, 329.63],   // A minor
      [233.08, 293.66, 349.23]   // gentle resolve
    ];
    chords.forEach(function (freqs, i) {
      var chordStart = base + i * (LOOP_SECONDS / 4);
      freqs.forEach(function (freq) {
        playNote(ctx, freq, chordStart, LOOP_SECONDS / 4 + 0.3, 0.11);
      });
      playTick(ctx, chordStart);
      playTick(ctx, chordStart + LOOP_SECONDS / 8);
    });
  }

  function startSynthLoop() {
    var ctx = ensureAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    scheduleLoop(ctx);
    loopTimer = setInterval(function () { scheduleLoop(ctx); }, LOOP_SECONDS * 1000);
    startFakeProgress();
  }
  function stopSynthLoop() {
    if (loopTimer) clearInterval(loopTimer);
    loopTimer = null;
    if (audioCtx) audioCtx.suspend();
    stopProgress();
  }

  function tickFakeProgress() {
    progress += 100 / (LOOP_SECONDS / 0.2);
    if (progress > 100) progress = 0;
    if (progressBar) progressBar.style.width = progress + "%";
  }
  function startFakeProgress() {
    if (prefersReducedMotion) return;
    stopProgress();
    progressTimer = setInterval(tickFakeProgress, 200);
  }
  function stopProgress() {
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = null;
  }

  // keep the progress bar in sync with the real track when one is playing
  if (cornerAudio) {
    cornerAudio.addEventListener("timeupdate", function () {
      if (!usingRealAudio || !progressBar || !cornerAudio.duration) return;
      progressBar.style.width = (cornerAudio.currentTime / cornerAudio.duration) * 100 + "%";
    });
  }

  if (playToggle) {
    playToggle.addEventListener("click", function () {
      isPlaying = !isPlaying;
      if (iconPlay && iconPause) {
        iconPlay.style.display = isPlaying ? "none" : "block";
        iconPause.style.display = isPlaying ? "block" : "none";
      }

      if (isPlaying) {
        if (cornerAudio) {
          var playAttempt = cornerAudio.play();
          if (playAttempt && typeof playAttempt.then === "function") {
            playAttempt.then(function () {
              usingRealAudio = true;
              if (!prefersReducedMotion) progressBar && (progressBar.style.transition = "width 0.15s linear");
            }).catch(function (err) {
              // no track file present (or it failed to load) — fall back to the synth loop
              console.warn("Kono Corner: couldn't play assets/audio/corner-radio.mp3, falling back to synth loop.", err, cornerAudio.error);
              usingRealAudio = false;
              startSynthLoop();
            });
          } else {
            // very old browsers without a Promise-based play() — assume it worked
            usingRealAudio = true;
          }
        } else {
          startSynthLoop();
        }
      } else {
        if (usingRealAudio && cornerAudio) {
          cornerAudio.pause();
        } else {
          stopSynthLoop();
        }
        stopProgress();
      }
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
    "Currently decorating a binder...",
    "Sorting stickers by colour ✧",
    "Wrapping a preloved photocard ♡",
    "Sketching a new digital design...",
    "Answering DMs between decos ♡"
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
    "Someone just added a photocard to their binder ♡",
    "A new preloved item was just picked up ♡",
    "A binder deco slot just got booked ✧",
    "Someone said hi in the DMs just now ♡"
  ];

  var toastShownCount = 0;
  var toastMaxShows = 3; // a little easter egg, not a nag — it stops on its own
  var toastDismissedByUser = false;
  var toastHideTimer = null;
  var toastNextTimer = null;

  function scheduleNextToast(delay) {
    if (toastDismissedByUser || toastShownCount >= toastMaxShows) return;
    toastNextTimer = setTimeout(showToast, delay);
  }
  function showToast() {
    if (!toast || toastDismissedByUser || toastShownCount >= toastMaxShows) return;
    toastText.textContent = toastMessages[Math.floor(Math.random() * toastMessages.length)];
    toast.classList.add("is-visible");
    toastShownCount += 1;
    toastHideTimer = setTimeout(hideToast, 6000);
    scheduleNextToast(50000);
  }
  function hideToast() {
    if (toast) toast.classList.remove("is-visible");
  }
  if (toastClose) {
    toastClose.addEventListener("click", function () {
      // once someone closes it themselves, don't bring it back this visit
      toastDismissedByUser = true;
      if (toastHideTimer) clearTimeout(toastHideTimer);
      if (toastNextTimer) clearTimeout(toastNextTimer);
      hideToast();
    });
  }

  // first appearance after a little delay, so it feels natural
  scheduleNextToast(6000);

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
