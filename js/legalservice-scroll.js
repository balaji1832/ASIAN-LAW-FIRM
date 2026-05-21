    document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".legal-service-card");

  function updateLegalCards() {
    const triggerPoint = window.innerHeight * 0.45;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();

      card.classList.remove("is-active", "is-before", "is-after");

      if (rect.top <= triggerPoint && rect.bottom > triggerPoint) {
        card.classList.add("is-active");
      } else if (rect.bottom <= triggerPoint) {
        card.classList.add("is-before");
      } else {
        card.classList.add("is-after");
      }
    });
  }

  window.addEventListener("scroll", updateLegalCards, { passive: true });
  window.addEventListener("resize", updateLegalCards);
  updateLegalCards();
});
