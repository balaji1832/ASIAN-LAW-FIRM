  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const menuIcon = document.getElementById("menuIcon");
  const closeIcon = document.getElementById("closeIcon");

  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
    menuIcon.classList.toggle("hidden");
    closeIcon.classList.toggle("hidden");
  });

  const dropdownButtons = document.querySelectorAll(".mobileDropdownBtn");

  dropdownButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const dropdown = button.nextElementSibling;
      const arrow = button.querySelector(".dropdownArrow");

      dropdown.classList.toggle("hidden");
      arrow.classList.toggle("rotate-180");
    });
  });
