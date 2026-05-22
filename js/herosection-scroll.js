  
document.addEventListener("DOMContentLoaded", function () {
  const revealSpace = document.querySelector(".trusted-reveal-space");
  const revealText = document.getElementById("trustedRevealText");
  const revealImage = document.getElementById("trustedRevealImage");

  if (!revealSpace || !revealText || !revealImage) return;

  let currentProgress = 0;
  let targetProgress = 0;
  let rafId = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function calculateProgress() {
    const rect = revealSpace.getBoundingClientRect();
    const totalScroll = revealSpace.offsetHeight - window.innerHeight;

    if (totalScroll <= 0) return 0;

    let progress = -rect.top / totalScroll;
    return clamp(progress, 0, 1);
  }

  function animateTrustedReveal() {
    targetProgress = calculateProgress();

    /*
      Smooth follow:
      Lower value = smoother/slower
      Higher value = faster
    */
    currentProgress += (targetProgress - currentProgress) * 0.08;

    const smooth = easeOutQuart(currentProgress);

    /* TEXT */
    const textMove = window.innerWidth <= 640 ? -95 : -150;

    const fadeStart = 0.05;
    const fadeEnd = 0.34;

    const fadeProgress = clamp(
      (currentProgress - fadeStart) / (fadeEnd - fadeStart),
      0,
      1
    );

    revealText.style.transform =
      `translate3d(-50%, ${smooth * textMove}px, 0)`;

    revealText.style.opacity = 1 - fadeProgress;

    /* IMAGE */
    const imageStart = 118;
    const imageEnd = 0;

    const imageY = imageStart + (imageEnd - imageStart) * smooth;

    revealImage.style.transform =
      `translate3d(-50%, ${imageY}%, 0)`;

    /*
      Keep animation running only while movement is still catching up
    */
    if (Math.abs(targetProgress - currentProgress) > 0.001) {
      rafId = requestAnimationFrame(animateTrustedReveal);
    } else {
      currentProgress = targetProgress;
      rafId = null;
    }
  }

  function startAnimation() {
    if (!rafId) {
      rafId = requestAnimationFrame(animateTrustedReveal);
    }
  }

  window.addEventListener("scroll", startAnimation, { passive: true });
  window.addEventListener("resize", function () {
    currentProgress = calculateProgress();
    startAnimation();
  });

  currentProgress = calculateProgress();
  targetProgress = currentProgress;
  startAnimation();
});
