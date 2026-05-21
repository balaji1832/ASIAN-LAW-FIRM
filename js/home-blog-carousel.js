document.addEventListener("DOMContentLoaded", function () {
  const track = document.getElementById("blogCarouselTrack");
  const dotsWrap = document.getElementById("blogDots");
  const cards = Array.from(document.querySelectorAll(".blog-card"));

  let currentIndex = 0;
  let visibleCards = getVisibleCards();
  let maxIndex = Math.max(cards.length - visibleCards, 0);
  let autoSlide;

  function getVisibleCards() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 4;
  }

  function getCardStep() {
    const card = cards[0];
    const trackStyle = window.getComputedStyle(track);
    const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || 0);
    return card.offsetWidth + gap;
  }

  function createDots() {
    dotsWrap.innerHTML = "";

    maxIndex = Math.max(cards.length - visibleCards, 0);

    for (let i = 0; i <= maxIndex; i++) {
      const dot = document.createElement("button");
      dot.className = "blog-dot";
      dot.setAttribute("aria-label", "Go to blog slide " + (i + 1));

      dot.addEventListener("click", function () {
        currentIndex = i;
        updateCarousel();
        restartAutoSlide();
      });

      dotsWrap.appendChild(dot);
    }
  }

  function updateCarousel() {
    visibleCards = getVisibleCards();
    maxIndex = Math.max(cards.length - visibleCards, 0);

    if (currentIndex > maxIndex) {
      currentIndex = 0;
    }

    const moveX = getCardStep() * currentIndex;
    track.style.transform = `translateX(-${moveX}px)`;

    const dots = dotsWrap.querySelectorAll(".blog-dot");
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });
  }

  function nextSlide() {
    currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    updateCarousel();
  }

  function startAutoSlide() {
    autoSlide = setInterval(nextSlide, 3000);
  }

  function stopAutoSlide() {
    clearInterval(autoSlide);
  }

  function restartAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
  }

  window.addEventListener("resize", function () {
    visibleCards = getVisibleCards();
    createDots();
    updateCarousel();
  });

  track.addEventListener("mouseenter", stopAutoSlide);
  track.addEventListener("mouseleave", startAutoSlide);

  createDots();
  updateCarousel();
  startAutoSlide();
});