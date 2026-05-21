  const revealSection = document.querySelector(".trusted-reveal-section");
  const revealSpace = document.querySelector(".trusted-reveal-space");
  const revealText = document.getElementById("trustedRevealText");
  const revealImage = document.getElementById("trustedRevealImage");

  function trustedRevealAnimation() {
    const sectionTop = revealSection.offsetTop;
    const sectionHeight = revealSpace.offsetHeight;
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;

    let progress = (scrollY - sectionTop) / (sectionHeight - windowHeight);
    progress = Math.min(Math.max(progress, 0), 1);

    // Text moves slightly up and hides
    const textY = progress * -120;
    const textOpacity = 1 - progress * 1.35;

    revealText.style.transform = `translateX(-50%) translateY(${textY}px)`;
    revealText.style.opacity = Math.max(textOpacity, 0);

    // Image comes from bottom smoothly
    const imageY = progress * -470;
    revealImage.style.transform = `translateX(-50%) translateY(${imageY}px)`;
  }

  window.addEventListener("scroll", trustedRevealAnimation);
  window.addEventListener("resize", trustedRevealAnimation);
  trustedRevealAnimation();
