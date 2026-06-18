  document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menuBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    const menuIcon = document.getElementById("menuIcon");
    const closeIcon = document.getElementById("closeIcon");

    if (menuBtn && mobileMenu && menuIcon && closeIcon) {
      menuBtn.addEventListener("click", () => {
        mobileMenu.classList.toggle("hidden");
        menuIcon.classList.toggle("hidden");
        closeIcon.classList.toggle("hidden");
      });
    }

    document.querySelectorAll(".mobileDropdownBtn").forEach((button) => {
      button.addEventListener("click", () => {
        const dropdown = button.nextElementSibling;
        const arrow = button.querySelector(".dropdownArrow");

        if (dropdown) dropdown.classList.toggle("hidden");
        if (arrow) arrow.classList.toggle("rotate-180");
      });
    });

    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll("header nav a[href]").forEach((link) => {
      const href = link.getAttribute("href");

      if (
        href === currentPage ||
        href === `./${currentPage}` ||
        (currentPage === "index.html" && (href === "/" || href === "index.html"))
      ) {
        link.classList.add(
          "text-[#c59a35]",
          "font-bold",
          "bg-[#f8f4ea]",
          "rounded-lg",
          "px-2"
        );

        const desktopDropdown = link.closest(".relative.group");

        if (desktopDropdown) {
          const parentButton = desktopDropdown.querySelector("button");
          if (parentButton) {
            parentButton.classList.add("text-[#c59a35]", "font-bold");
          }
        }

        const mobileDropdown = link.closest(".mobileDropdown");

        if (mobileDropdown) {
          mobileDropdown.classList.remove("hidden");

          const mobileParentButton = mobileDropdown.previousElementSibling;
          const arrow = mobileParentButton?.querySelector(".dropdownArrow");

          if (mobileParentButton) {
            mobileParentButton.classList.add("text-[#c59a35]", "font-bold");
          }

          if (arrow) {
            arrow.classList.add("rotate-180");
          }
        }
      }
    });
  });
