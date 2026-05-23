  const propertySlides = document.querySelectorAll(".property-slide");
  const propertyPrev = document.getElementById("propertyPrev");
  const propertyNext = document.getElementById("propertyNext");
  const propertyDots = document.getElementById("propertyDots");
  const propertyProgress = document.getElementById("propertyProgress");
  const propertyCurrent = document.getElementById("propertyCurrent");

  let propertyIndex = 0;
  let propertyTimer;

  function createPropertyDots() {
    propertySlides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "property-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to service ${index + 1}`);

      dot.addEventListener("click", () => {
        showPropertySlide(index);
        resetPropertyAutoplay();
      });

      propertyDots.appendChild(dot);
    });
  }

  function showPropertySlide(index) {
    propertySlides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });

    document.querySelectorAll(".property-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });

    if (propertyProgress) {
      propertyProgress.style.width =
        ((index + 1) / propertySlides.length) * 100 + "%";
    }

    if (propertyCurrent) {
      propertyCurrent.textContent = String(index + 1).padStart(2, "0");
    }

    propertyIndex = index;
  }

  function nextPropertySlide() {
    const nextIndex = (propertyIndex + 1) % propertySlides.length;
    showPropertySlide(nextIndex);
  }

  function prevPropertySlide() {
    const prevIndex =
      (propertyIndex - 1 + propertySlides.length) % propertySlides.length;
    showPropertySlide(prevIndex);
  }

  function startPropertyAutoplay() {
    propertyTimer = setInterval(nextPropertySlide, 4500);
  }

  function resetPropertyAutoplay() {
    clearInterval(propertyTimer);
    startPropertyAutoplay();
  }

  if (propertySlides.length && propertyDots) {
    createPropertyDots();
    showPropertySlide(0);
    startPropertyAutoplay();
  }

  if (propertyNext) {
    propertyNext.addEventListener("click", () => {
      nextPropertySlide();
      resetPropertyAutoplay();
    });
  }

  if (propertyPrev) {
    propertyPrev.addEventListener("click", () => {
      prevPropertySlide();
      resetPropertyAutoplay();
    });
  }
