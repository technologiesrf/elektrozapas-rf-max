/* Электрозапас РФ — интерфейс каталога и карточек товаров.
   Отправка заявок выполняется отдельным модулем orders.js через серверный обработчик.
   Секреты и токены не хранятся в клиентском коде. */
(() => {
  'use strict';
  const PRODUCTS = [
    {
      id: 'start36', name: 'СТАРТ 3.6', segment: 'Для дома и дачи', power: '3,6 кВт', capacity: '5,12 кВт·ч', price: 121300,
      image: 'assets/start36.webp', intro: 'Резерв для самого важного',
      short: 'Свет, интернет и выбранные домашние приборы.',
      benefits: ['Сохраните освещение в важных комнатах', 'Оставайтесь на связи при отключении сети', 'Подбираем нагрузку, чтобы не переплачивать за лишнюю мощность']
    },
    {
      id: 'home5', name: 'ДОМ 5', segment: 'Для дома', power: '5 кВт', capacity: '5,12 кВт·ч', price: 170000,
      image: 'assets/home5.webp', intro: 'Домашняя система, которая сама включает резерв при отключении электричества',
      short: 'Автоматически переводит подключённую домашнюю сеть на аккумулятор — без ручного запуска.',
      benefits: ['Инвертор 5 кВт и аккумулятор LiFePO₄ 5,12 кВт·ч уже объединены в одном корпусе', 'Заряжается от обычной электросети; солнечные панели для резервной работы не обязательны', 'При отключении автоматически переходит на аккумулятор, после восстановления возвращается на сеть', 'Питает приборы, подключённые к резервируемой домашней сети, в пределах возможностей системы', 'Освещение, холодильник, интернет, котёл, насосы и бытовая техника — по суммарной нагрузке и пусковым токам', 'Монтаж, защитная автоматика и подключение к домашней сети рассчитываются отдельно']
    },
    {
      id: 'home6', name: 'ДОМ 6', segment: 'Для дома и малого бизнеса', power: '6 кВт', capacity: '10,24 кВт·ч', price: 210000,
      image: 'assets/home6.webp', intro: 'Больше запас энергии для дома',
      short: 'Больше времени для важных приборов при отключении.',
      benefits: ['Больший запас энергии, чем у базовых домашних систем', 'Подходит для нескольких приоритетных линий после расчёта', 'Может поддерживать работу связи, освещения и выбранной техники']
    },
    {
      id: 'home6plus', name: 'ДОМ 6+', segment: 'Для дома', power: '6 кВт', capacity: '16 кВт·ч', price: 255900,
      image: 'assets/home6plus.webp', intro: 'Когда отключения затягиваются',
      short: 'Увеличенный аккумулятор для длительных отключений.',
      benefits: ['Больше запас энергии для тех же выбранных нагрузок', 'Помогает переживать более длительные отключения', 'Подбираем по реальному расходу и желаемому времени работы']
    },
    {
      id: 'start36plus', name: 'СТАРТ 3.6+', segment: 'Для дома и дачи', power: '3,6 кВт', capacity: '7,68 кВт·ч', price: 142800,
      image: 'assets/start36plus.webp', intro: 'Дольше работает важное',
      short: 'Та же мощность, но больше энергии в аккумуляторе.',
      benefits: ['Продлевает работу важных приборов при умеренной нагрузке', 'Сохраняет класс мощности 3,6 кВт', 'Подходит, когда продолжительность важнее числа приборов']
    },
    {
      id: 'business12', name: 'БИЗНЕС 12', segment: 'Для бизнеса', power: '12 кВт', capacity: '20 кВт·ч', price: 339200,
      image: 'assets/business12.webp', intro: 'Резерв для рабочих процессов',
      short: 'Подбор для магазинов, мастерских и офисов.',
      benefits: ['Подберём резерв для важных линий вашего объекта', 'Рассчитаем работу холодильного и кассового оборудования', 'Заранее согласуем мощность и требования к подключению']
    },
    {
      id: 'business12plus', name: 'БИЗНЕС 12+', segment: 'Для бизнеса', power: '12 кВт', capacity: '32 кВт·ч', price: 494200,
      image: 'assets/business12plus.webp', intro: 'Больше энергии для бизнеса',
      short: 'Решение для объектов с продолжительными отключениями.',
      benefits: ['Более ёмкий аккумулятор для приоритетных нагрузок', 'Рассчитаем питание касс, связи и части оборудования', 'Технические условия фиксируются после обследования объекта']
    },
  ];
  // Временно не показываем базовые комплекты СТАРТ; их карточки и цены сохранены в PRODUCTS.
  const CATALOG_PRODUCTS = PRODUCTS.filter(product => !['start36', 'start36plus'].includes(product.id));
  const $ = id => document.getElementById(id);
  const money = number => `${new Intl.NumberFormat('ru-RU').format(number)} ₽`;
  const grid = $('modelsGrid');
  const landing = $('landing-view');
  const detail = $('product-view');
  const dialog = $('leadDialog');
  let showAll = false;
  let current = null;
  let leadProduct = null;

  function createCard(product) {
    const card = document.createElement('article');
    card.className = product.id === 'home5' ? 'model-card model-card-featured' : 'model-card';
    card.dataset.product = product.id;
    card.innerHTML = `
      <div class="model-art"><img src="${product.image}" alt="Внешний вид системы ${product.name}" loading="lazy" decoding="async" /></div>
      <div class="model-body">
        <p class="model-category">${product.segment}</p>
        <h3 class="model-title">${product.name}</h3>
        <p class="model-details">${product.power} · ${product.capacity}</p>
        <p class="model-simple">${product.short}</p>
        <p class="model-price">${money(product.price)}</p>
        <p class="model-price-note">Стоимость оборудования · монтаж отдельно</p>
        <button type="button" class="model-more" data-product="${product.id}" aria-label="Подробнее о модели ${product.name}">${product.id === 'home5' ? 'Подробнее и купить' : 'Посмотреть'} <span aria-hidden="true">→</span></button>
      </div>`;
    // PRICING_STOCK_STAKHANOV_20261112
    if (product.id === 'home5') {
      const availability = document.createElement('p');
      availability.className = 'catalog-availability';
      availability.innerHTML = '<strong>В наличии · г. Стаханов</strong><small>Можно обсудить покупку сейчас</small>';
      card.querySelector('.model-price')?.insertAdjacentElement('afterend', availability);
    }
    return card;
  }

  function renderCards() {
    grid.replaceChildren();
    const visible = showAll ? CATALOG_PRODUCTS : CATALOG_PRODUCTS.slice(0, 3);
    visible.forEach(product => grid.append(createCard(product)));
    $('moreModels').setAttribute('aria-expanded', showAll ? 'true' : 'false');
    $('moreModels').innerHTML = showAll ? 'Свернуть каталог <span aria-hidden="true">↑</span>' : `Показать все ${CATALOG_PRODUCTS.length} моделей <span aria-hidden="true">↓</span>`;
  }

  function scrollTop() {
    window.scrollTo({top: 0, behavior: 'instant'});
  }
  function showProduct(id) {
    const product = CATALOG_PRODUCTS.find(p => p.id === id);
    if (!product) return;
    current = product;
    landing.hidden = true;
    detail.hidden = false;
    $('detailImg').src = product.image;
    $('detailImg').alt = `Внешний вид системы ${product.name}`;
    $('detailName').textContent = product.name;
    $('detailType').textContent = product.id === 'home5' ? 'ИНВЕРТОР И АККУМУЛЯТОР В ОДНОМ КОРПУСЕ' : 'СИСТЕМА РЕЗЕРВНОГО ПИТАНИЯ';
    $('detailAio').hidden = product.id !== 'home5';
    $('detailSubtitle').textContent = product.intro;
    $('detailSpecs').innerHTML = `${product.power} <span aria-hidden="true"></span> ${product.capacity}`;
    $('detailPrice').textContent = money(product.price);
    // Availability is deliberately shown for DOM 5 only.
    let detailAvailability = $('detailAvailability');
    if (!detailAvailability) {
      detailAvailability = document.createElement('p');
      detailAvailability.id = 'detailAvailability';
      detailAvailability.className = 'detail-availability';
      $('detailPrice').insertAdjacentElement('afterend', detailAvailability);
    }
    detailAvailability.innerHTML = '<strong>В наличии · г. Стаханов</strong><small>Оборудование можно приобрести без ожидания поставки</small>';
    detailAvailability.hidden = product.id !== 'home5';
    $('mobileProductPrice').textContent = money(product.price);
    $('mobileProductBar').hidden = false;
    $('mobileProductOrder').onclick = () => openLead(product);
    $('detailBenefits').replaceChildren();
    product.benefits.forEach(item => {const li = document.createElement('li'); li.textContent = item; $('detailBenefits').append(li);});
    $('detailPhotoCaption').textContent = product.id === 'home5' ? 'Фото устройства ДОМ 5 из предоставленного видеоматериала.' : 'Вариант внешнего исполнения. Корпус и артикул уточняются до заказа.';
    $('detailOrder').textContent = product.id === 'home5' ? 'Обсудить покупку' : 'Оставить заявку';
    $('detailOrder').onclick = () => openLead(product);
    document.title = `${product.name} — ${money(product.price)} | Электрозапас РФ`;
    scrollTop();
    $('backToCatalog').focus({preventScroll:true});
  }
  function showLanding(scrollToCatalog = false) {
    detail.hidden = true;
    $('mobileProductBar').hidden = true;
    landing.hidden = false;
    current = null;
    document.title = 'Электрозапас РФ — когда свет отключают, у вас он остаётся';
    requestAnimationFrame(() => {
      if (scrollToCatalog) $('systems').scrollIntoView({behavior:'instant',block:'start'});
      else scrollTop();
    });
  }

  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-product]');
    if (button) showProduct(button.dataset.product);
  });
  $('moreModels').addEventListener('click', () => {
    showAll = !showAll;
    renderCards();
  });
  $('backToCatalog').addEventListener('click', () => showLanding(true));
  $('logoHome').addEventListener('click', event => {event.preventDefault();showLanding(false);});
  document.querySelectorAll('.desktop-nav a').forEach(link => {
    link.addEventListener('click', event => {
      if (detail.hidden) return;
      event.preventDefault();
      const to = link.getAttribute('href').replace('#', '');
      showLanding(false);
      requestAnimationFrame(() => $(to)?.scrollIntoView({behavior:'smooth'}));
    });
  });

  function openLead(product = null, presetModel = null) {
    leadProduct = product || null;
    $('leadModel').value = product ? product.name : (presetModel || 'Нужен подбор');
    $('leadFeedback').textContent = '';
    $('leadFeedback').classList.remove('error');
    $('leadPhone').setAttribute('aria-invalid','false');
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
  }
  document.querySelectorAll('[data-open-lead]').forEach(button => button.addEventListener('click', () => openLead(current, button.dataset.leadModel || null)));
  $('closeDialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  dialog.addEventListener('click', event => {if (event.target === dialog) dialog.close();});

  function makeRequest() {
    const segment = $('leadForm').elements['object'].value;
    const selected = [...document.querySelectorAll('input[name="appliance"]:checked')].map(el => el.value);
    const city = $('leadCity').value.trim() || 'не указан';
    const phone = $('leadPhone').value.trim();
    return `Здравствуйте! Хочу подобрать резервное питание «Электрозапас РФ».\nОбъект: ${segment}.\nМодель: ${$('leadModel').value}.\nЧто должно работать: ${selected.join(', ') || 'требуется консультация'}.\nГород / посёлок: ${city}.\nТелефон для связи: ${phone}.\nНужен индивидуальный расчёт оборудования и монтажа.`;
  }
  function oldCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position:fixed;top:0;left:-99999px;';
    document.body.append(area);
    area.focus(); area.select();
    let okay = false;
    try { okay = document.execCommand('copy'); } catch (error) { okay = false; }
    area.remove();
    return okay;
  }
  $('leadForm').addEventListener('submit', async event => {
    event.preventDefault();
    const feedback = $('leadFeedback');
    feedback.classList.remove('error');
    const phone = $('leadPhone').value.trim();
    if (!/^[+\d\s()\-]{10,21}$/.test(phone) || phone.replace(/\D/g,'').length < 10) {
      $('leadPhone').setAttribute('aria-invalid','true');
      feedback.textContent = 'Проверьте номер телефона — нужно не менее 10 цифр.';
      feedback.classList.add('error');
      $('leadPhone').focus();
      return;
    }
    if (!$('leadConsent').checked) {
      feedback.textContent = 'Подтвердите согласие на подготовку обращения.';
      feedback.classList.add('error');
      $('leadConsent').focus();
      return;
    }
    $('leadPhone').setAttribute('aria-invalid','false');
    const request = makeRequest();
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {await navigator.clipboard.writeText(request);copied=true;} catch (error) {copied=oldCopy(request);}
    } else {copied=oldCopy(request);}
    feedback.textContent = copied
      ? 'Текст обращения скопирован. Для реальной отправки заявки необходимо подключить контакт или сервер.'
      : 'Заявка подготовлена. Автоматическое копирование недоступно в этом браузере; для приёма заявок понадобится подключить контакт или сервер.';
    feedback.classList.toggle('error', !copied);
  });

  const hero = $('heroVisual');
  const animatedEls = () => hero.querySelectorAll('.window-light,.window-reflection,.house-aura,.neighborhood-light,.pole-light,.scene-status');
  $('replayHero').addEventListener('click', () => {
    hero.classList.remove('snapshot','phase-0','phase-1','phase-2','phase-3');
    animatedEls().forEach(el => {el.style.animation='none';void el.offsetWidth;el.style.animation='';});
  });
  // deterministic frame setting for storyboard and visual QA
  window.setHeroPhase = function (phase) {
    const idx = Math.max(0,Math.min(3,Number(phase)||0));
    hero.classList.remove('phase-0','phase-1','phase-2','phase-3');
    hero.classList.add('snapshot',`phase-${idx}`);
    $('sceneStatus').textContent = idx < 2 ? 'Нет питания от сети' : 'Резерв работает';
    return idx;
  };
  window.__electrozapasTest = {showProduct,showLanding,openLead,products:PRODUCTS};
  renderCards();
})();
