  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const menuIcon = document.getElementById("menuIcon");
  const closeIcon = document.getElementById("closeIcon");

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      menuIcon.classList.toggle("hidden");
      closeIcon.classList.toggle("hidden");
    });
  }

  const dropdownButtons = document.querySelectorAll(".mobileDropdownBtn");

  dropdownButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const dropdown = button.nextElementSibling;
      const arrow = button.querySelector(".dropdownArrow");

      dropdown.classList.toggle("hidden");
      arrow.classList.toggle("rotate-180");
    });
  });

  /* ✅ Active Page Indicator */
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const allLinks = document.querySelectorAll("header a[href]");

  allLinks.forEach((link) => {
    const href = link.getAttribute("href");

    if (href === currentPage || (currentPage === "index.html" && href === "/")) {
      /* Active child/page link */
      link.classList.add(
        "text-[#c59a35]",
        "font-bold",
        "bg-[#f8f4ea]",
        "rounded-lg"
      );

      /* ✅ Desktop dropdown parent active */
      const desktopDropdown = link.closest(".relative.group");

      if (desktopDropdown) {
        const parentButton = desktopDropdown.querySelector("button");

        if (parentButton) {
          parentButton.classList.add("text-[#c59a35]", "font-bold");
        }
      }

      /* ✅ Mobile dropdown parent active + open */
      const mobileDropdown = link.closest(".mobileDropdown");

      if (mobileDropdown) {
        mobileDropdown.classList.remove("hidden");

        const mobileParentButton = mobileDropdown.previousElementSibling;
        const arrow = mobileParentButton?.querySelector(".dropdownArrow");

        mobileParentButton.classList.add("text-[#c59a35]", "font-bold");

        if (arrow) {
          arrow.classList.add("rotate-180");
        }
      }
    }
  });
