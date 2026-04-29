// Update copyright year
(function () {
  var el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();

// Hamburger nav toggle
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
})();

// Slideshow — only initialises if a .slide exists on the page
(function () {
  var slides = document.querySelectorAll(".slide");
  if (!slides.length) return;
  var dots  = document.querySelectorAll("#slideshowDots .dot");
  var prev  = document.getElementById("prevBtn");
  var next  = document.getElementById("nextBtn");
  var idx   = 0;
  var timer;

  function show(i) {
    slides.forEach(function (s) { s.classList.remove("active"); });
    dots.forEach(function (d)   { d.classList.remove("active"); });
    slides[i].classList.add("active");
    if (dots[i]) dots[i].classList.add("active");
  }

  function goTo(i) {
    idx = (i + slides.length) % slides.length;
    show(idx);
    restart();
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(function () { goTo(idx + 1); }, 3800);
  }

  if (prev) prev.addEventListener("click", function () { goTo(idx - 1); });
  if (next) next.addEventListener("click", function () { goTo(idx + 1); });
  dots.forEach(function (d, i) {
    d.addEventListener("click", function () { goTo(i); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft")  goTo(idx - 1);
    if (e.key === "ArrowRight") goTo(idx + 1);
  });

  show(idx);
  restart();
})();
