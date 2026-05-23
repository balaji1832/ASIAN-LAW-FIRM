        const faqItems = document.querySelectorAll(".faq-item");

        faqItems.forEach((item, index) => {
          const button = item.querySelector(".faq-btn");
          const content = item.querySelector(".faq-content");
          const icon = item.querySelector(".faq-icon svg");

          if (index === 0) {
            content.style.maxHeight = content.scrollHeight + "px";
            item.classList.add("active");
            icon.style.transform = "rotate(45deg)";
          }

          button.addEventListener("click", () => {
            const isOpen = item.classList.contains("active");

            faqItems.forEach((otherItem) => {
              const otherContent = otherItem.querySelector(".faq-content");
              const otherIcon = otherItem.querySelector(".faq-icon svg");

              otherItem.classList.remove("active");
              otherContent.style.maxHeight = null;
              otherIcon.style.transform = "rotate(0deg)";
            });

            if (!isOpen) {
              item.classList.add("active");
              content.style.maxHeight = content.scrollHeight + "px";
              icon.style.transform = "rotate(45deg)";
            }
          });
        });
