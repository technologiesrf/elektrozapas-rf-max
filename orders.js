
/*
 * Электрозапас РФ — заявки v7.6
 * Работает через сайт и мини-приложение MAX.
 */

(() => {
  "use strict";

  const ENDPOINT =
    "https://functions.yandexcloud.net/d4envi5lp4mfp49n1p8r";

  const form = document.getElementById("leadForm");
  const dialog = document.getElementById("leadDialog");
  const feedback = document.getElementById("leadFeedback");
  const button = form?.querySelector('button[type="submit"]');

  if (!form || !button || !feedback) return;

  let sending = false;
  let sent = false;

  button.textContent = "Отправить заявку";

  const consentLabel = form.querySelector(".privacy-check span");

  if (consentLabel) {
    consentLabel.textContent =
      "Согласен(на) на обработку телефона и данных заявки " +
      "для связи со мной";
  }

  const note = form.querySelector(".lead-honesty");

  if (note) {
    note.textContent =
      "Заявка отправляется менеджеру в MAX. " +
      "Монтаж рассчитывается индивидуально.";
  }

  function status(message, error = false) {
    feedback.textContent = message;
    feedback.classList.toggle("error", error);
  }

  function getMaxData() {
    if (typeof window.WebApp?.initData === "string") {
      if (window.WebApp.initData) {
        return window.WebApp.initData;
      }
    }

    const fragment = new URLSearchParams(
      window.location.hash.slice(1)
    );

    return fragment.get("WebAppData") || "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Блокируем старый обработчик копирования
    event.stopImmediatePropagation();

    if (sending || sent) return;

    status("");

    const phoneField = document.getElementById("leadPhone");
    const phone = phoneField.value.trim();
    const digits = phone.replace(/\D/g, "");

    if (
      !/^[+0-9() \-]{10,23}$/.test(phone) ||
      digits.length < 10 ||
      digits.length > 15
    ) {
      status("Укажите правильный номер телефона.", true);
      phoneField.focus();
      return;
    }

    if (!document.getElementById("leadConsent").checked) {
      status("Подтвердите согласие на обработку данных.", true);
      return;
    }

    const appliances = Array.from(
      form.querySelectorAll(
        'input[name="appliance"]:checked'
      )
    ).map(input => input.value);

    const payload = {
      init_data: getMaxData(),
      phone,
      consent: true,
      model: document.getElementById("leadModel").value,
      object: form.querySelector(
        'input[name="object"]:checked'
      )?.value || "Не указан",
      city: document.getElementById("leadCity").value.trim(),
      appliances
    };

    sending = true;
    button.disabled = true;
    button.textContent = "Отправляем...";

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(), 15000
    );

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store"
      });

      const result = await response.json().catch(() => ({}));

      if (
        !response.ok ||
        result.ok !== true ||
        result.message_sent !== true
      ) {
        throw new Error(
          result.error || "Отправка не подтверждена"
        );
      }

      sent = true;
      button.textContent = "Заявка отправлена";
      status(
        "Заявка поступила менеджеру в MAX. " +
        "С вами свяжутся по указанному номеру."
      );

    } catch (error) {
      const message = error.name === "AbortError"
        ? "Нет подтверждения из-за слабой связи. " +
          "Перед повторной отправкой уточните, " +
          "не поступила ли заявка."
        : error instanceof TypeError
          ? "Не удалось связаться с сервером. " +
            "Проверьте интернет."
          : error.message || "Не удалось отправить заявку.";

      status(message, true);
      button.disabled = false;
      button.textContent = "Повторить отправку";

    } finally {
      clearTimeout(timeout);
      sending = false;
    }
  }, true);

  dialog?.addEventListener("close", () => {
    sent = false;
    button.disabled = false;
    button.textContent = "Отправить заявку";
  });
})();
