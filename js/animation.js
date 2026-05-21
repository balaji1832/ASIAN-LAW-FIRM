document.addEventListener("DOMContentLoaded", function () {
  const animatedElements = document.querySelectorAll(
    ".fade-in, .fade-left, .fade-right, .fade-up, .fade-down, .letter-reveal"
  );

  /* Letter Reveal Split */
  document.querySelectorAll(".letter-reveal").forEach((element) => {
    if (element.dataset.letterReady === "true") return;

    const text = element.textContent.trim();
    element.innerHTML = "";

    [...text].forEach((char, index) => {
      const span = document.createElement("span");
      span.className = "letter";
      span.style.animationDelay = `${index * 0.035}s`;

      if (char === " ") {
        span.innerHTML = "&nbsp;";
      } else {
        span.textContent = char;
      }

      element.appendChild(span);
    });

    element.dataset.letterReady = "true";
  });

  /* Scroll Observer */
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");

          /* Animate only once */
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -60px 0px",
    }
  );

  animatedElements.forEach((element) => {
    observer.observe(element);
  });
});