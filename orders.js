
/*
 * ЭЛЕКТРОЗАПАС РФ
 * Заказы через MAX — v7.4
 * GitHub Pages → Yandex Cloud → MAX
 *
 * Токен бота здесь НЕ хранится.
 */

(() => {
  "use strict";

  const ENDPOINT =
    "https://functions.yandexcloud.net/d4envi5lp4mfp49n1p8r";

  const form = document.getElementById("leadForm");
  const dialog = document.getElementById("leadDialog");
  const feedback = document.getElementById("leadFeedback");

  const button = form?.querySelector(
    'button[type="submit"]'
  );

  if (!form || !dialog || !feedback || !button) {
    return;
  }

  let sending = false;
  let sent = false;

  button.textContent = "Отправить заявку";

  // Обновляем старые пояснения в форме
  const privacyText = form.querySelector(
    ".privacy-check span"
  );

  if (privacyText) {
    privacyText.textContent =
      "Согласен(на) на обработку моего телефона " +
      "и сведений о заявке для связи со мной";
  }

  const note = form.querySelector(".lead-honesty");

  if (note) {
    note.textContent =
      "Заявка поступит менеджеру в MAX. " +
      "Монтаж рассчитывается индивидуально.";
  }

  function showStatus(message, isError = false) {
    feedback.textContent = message;
    feedback.classList.toggle("error", isError);
  }

  // Получаем подписанные данные запуска MAX
  function getMaxInitData() {
    const bridgeData = window.WebApp?.initData;

    if (
      typeof bridgeData === "string" &&
      bridgeData.length > 0
    ) {
      return bridgeData;
    }

    // Резервный вариант без дополнительной
    // загрузки библиотеки MAX Bridge
    const fragment = new URLSearchParams(
      window.location.hash.slice(1)
    );

    return fragment.get("WebAppData") || "";
  }

  // Перехватываем отправку раньше старого
  // обработчика копирования текста из app.js
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (sending || sent) return;

    showStatus("");

    const phoneField =
      document.getElementById("leadPhone");

    const consentField =
      document.getElementById("leadConsent");

    const phone = (phoneField?.value || "").trim();
    const digits = phone.replace(/\D/g, "");

    if (
      !/^[+0-9() -]{10,23}$/.test(phone) ||
      digits.length < 10 ||
      digits.length > 15
    ) {
      phoneField?.setAttribute(
        "aria-invalid", "true"
      );

      showStatus(
        "Проверьте номер телефона: " +
        "нужно от 10 до 15 цифр.",
        true
      );

      phoneField?.focus();
      return;
    }

    phoneField?.setAttribute(
      "aria-invalid", "false"
    );

    if (!consentField?.checked) {
      showStatus(
        "Подтвердите согласие на обработку данных.",
        true
      );

      consentField?.focus();
      return;
    }

    const initData = getMaxInitData();

    if (!initData) {
      showStatus(
        "Для отправки заявки откройте каталог " +
        "через бота «Электрозапас РФ» внутри MAX.",
        true
      );
      return;
    }

    const selected = Array.from(
      form.querySelectorAll(
        'input[name="appliance"]:checked'
      )
    ).map(item => item.value);

    const payload = {
      init_data: initData,
      phone: phone,
      consent: true,

      model:
        document.getElementById("leadModel")
          ?.value || "Нужен подбор",

      object:
        form.querySelector(
          'input[name="object"]:checked'
        )?.value || "Не указан",

      city:
        document.getElementById("leadCity")
          ?.value.trim() || "Не указан",

      appliances: selected
    };

    sending = true;
    button.disabled = true;
    button.textContent = "Отправляем...";

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

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

      const data = await response.json()
        .catch(() => ({}));

      if (
        !response.ok ||
        data.ok !== true ||
        data.message_sent !== true
      ) {
        throw new Error(
          data.error ||
          "Сервер не подтвердил отправку заявки."
        );
      }

      sent = true;

      button.textContent = "Заявка отправлена";

      showStatus(
        "Заявка передана менеджеру. " +
        "С вами свяжутся по указанному номеру."
      );

    } catch (error) {

      let message;

      if (error.name === "AbortError") {
        message =
          "Не удалось подтвердить отправку: " +
          "связь нестабильна. Проверьте соединение.";
      } else if (error instanceof TypeError) {
        message =
          "Нет связи с сервером заявок. " +
          "Проверьте интернет и повторите попытку.";
      } else {
        message =
          error.message ||
          "Не удалось отправить заявку.";
      }

      showStatus(message, true);

      button.disabled = false;
      button.textContent = "Повторить отправку";

    } finally {
      clearTimeout(timeout);
      sending = false;
    }

  }, true);

  // Позволяем оформить следующую заявку
  // после закрытия формы
  dialog.addEventListener("close", () => {
    sent = false;
    button.disabled = false;
    button.textContent = "Отправить заявку";
  });

})();
