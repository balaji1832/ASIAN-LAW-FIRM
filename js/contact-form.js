document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("alfContactForm");
  const toast = document.getElementById("alfToast");

  if (!form || !toast) {
    return;
  }

  const submitButton = form.querySelector(".alf-submit-btn");
  const submitText = form.querySelector(".alf-submit-text");
  const closeToastButton = toast.querySelector(".alf-toast-close");

  let toastTimer = null;

  function clearErrors() {
    form.querySelectorAll(".alf-field-error").forEach((element) => {
      element.textContent = "";
    });

    form.querySelectorAll(".alf-input-error").forEach((element) => {
      element.classList.remove("alf-input-error");
    });
  }

  function showFieldErrors(errors = {}) {
    Object.entries(errors).forEach(([fieldName, message]) => {
      const input = form.elements[fieldName];

      const errorElement = form.querySelector(
        `[data-error-for="${fieldName}"]`
      );

      if (input) {
        input.classList.add("alf-input-error");
      }

      if (errorElement) {
        errorElement.textContent = message;
      }
    });

    const firstInvalidField = form.querySelector(".alf-input-error");

    if (firstInvalidField) {
      firstInvalidField.focus();
    }
  }

  function showToast(type, title, message) {
    window.clearTimeout(toastTimer);

    toast.classList.remove(
      "alf-toast-success",
      "alf-toast-error",
      "alf-toast-visible"
    );

    toast.classList.add(
      type === "success"
        ? "alf-toast-success"
        : "alf-toast-error"
    );

    toast.querySelector(".alf-toast-title").textContent = title;
    toast.querySelector(".alf-toast-message").textContent = message;

    requestAnimationFrame(() => {
      toast.classList.add("alf-toast-visible");
    });

    toastTimer = window.setTimeout(() => {
      hideToast();
    }, 5000);
  }

  function hideToast() {
    toast.classList.remove("alf-toast-visible");
  }

  function setSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting;
    submitButton.classList.toggle("alf-is-loading", isSubmitting);

    submitText.textContent = isSubmitting
      ? "Submitting..."
      : "Submit";
  }

  closeToastButton.addEventListener("click", hideToast);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearErrors();
    hideToast();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData(form);

      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !result.success) {
        if (result.errors) {
          showFieldErrors(result.errors);
        }

        throw new Error(
          result.message ||
            "Unable to submit the form."
        );
      }

      form.reset();

      showToast(
        "success",
        "Message Sent",
        result.message
      );
    } catch (error) {
      console.error(error);

      showToast(
        "error",
        "Submission Failed",
        error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  });
});