(() => {
  const cast = [
    { id: "mira", name: "Мира Вельвет", age: 29, genre: "romance", label: "Романтика", x: 0, rate: 6,
      description: "Коллекционирует винил и взгляды через стол. Даже кофейное свидание превращает в финал сезона." },
    { id: "luna", name: "Луна Поп", age: 28, genre: "comedy", label: "Комедия", x: 50, rate: 5,
      description: "Королева караоке. Пообещает спеть одну песню, а через пять минут весь зал уже знает ваш дуэт." },
    { id: "ren", name: "Рэн Найт", age: 32, genre: "drama", label: "Драма", x: 100, rate: 7,
      description: "Владеет многозначительным молчанием. Каждый его тост звучит как монолог злодея перед титрами." },
  ];
  const scenarios = [
    { id: "coffee", title: "Кофе с подтекстом", duration: "30 минут", extra: 0 },
    { id: "walk", title: "Прогулка под неоном", duration: "60 минут", extra: 4 },
    { id: "plot", title: "Вечер с поворотом сюжета", duration: "90 минут", extra: 8 },
  ];
  const slots = { evening: "Сегодня вечером", tomorrow: "Завтра вечером", credits: "После титров" };
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const gallery = document.querySelector("#gallery");
  const order = document.querySelector("#order");
  const cards = document.querySelector("#cards");
  const search = document.querySelector("#search");
  const empty = document.querySelector("#empty");
  const historyList = document.querySelector("#order-history");
  const profile = byProfile();
  const announcement = document.querySelector("#announcement");
  const byId = (id) => cast.find((character) => character.id === id);
  const scenarioById = (id) => scenarios.find((scenario) => scenario.id === id);
  const points = (price) => `${price} ♥`;
  const storageKey = "flirt-bureau-v1";

  function oldState() {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
    catch { return {}; }
  }
  const saved = oldState();
  const favorites = new Set(Array.isArray(saved.favorites) ? saved.favorites.filter(byId) : []);
  const photos = Object.fromEntries(cast.map(({ id }) => [id, saved.photos?.[id] === 1 ? 1 : 0]));
  const orders = Array.isArray(saved.orders) ? saved.orders.filter((item) =>
    item && byId(item.character) && scenarioById(item.scenario) && Object.hasOwn(slots, item.slot)).slice(0, 20) : [];
  let genre = "all";
  let onlyFavorites = new URLSearchParams(location.search).get("view") === "favorites";
  let galleryCharacter = null;
  let galleryCover = 0;

  function byProfile() {
    return cast.find((character) => character.id === document.body.dataset.character);
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ favorites: [...favorites], photos, orders })); }
    catch { /* Состояние доступно до закрытия страницы. */ }
    document.querySelectorAll("[data-favorite-count]").forEach((node) => { node.textContent = favorites.size; });
    document.querySelectorAll("[data-orders-count]").forEach((node) => { node.textContent = orders.length; });
  }

  function imagePosition(character, photo) {
    return `--x:${character.x}%;--y:${photo * 100}%`;
  }

  function updateHeart(button) {
    const active = favorites.has(button.dataset.favorite);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", `${active ? "Убрать из избранного" : "Добавить в избранное"} · ${byId(button.dataset.favorite).name}`);
    button.textContent = active ? "♥" : "♡";
  }

  function renderCards() {
    if (!cards) return;
    const query = search.value.trim().toLocaleLowerCase("ru");
    const visible = cast.filter((person) =>
      (!onlyFavorites || favorites.has(person.id)) &&
      (genre === "all" || genre === person.genre) &&
      person.name.toLocaleLowerCase("ru").includes(query));
    cards.innerHTML = visible.map((person) => `
      <article class="character">
        <div class="portrait-area">
          <button type="button" class="portrait" data-gallery="${person.id}" style="${imagePosition(person, photos[person.id])}"
                  aria-label="Галерея · ${person.name}"><span class="photo-count" aria-hidden="true">2 фото ↗</span></button>
          <button type="button" class="favorite" data-favorite="${person.id}"></button>
        </div>
        <div class="card-copy">
          <div class="card-meta"><span>${person.label}</span><span>${person.age} лет</span></div>
          <h3><a href="${person.id}.html">${person.name}</a></h3>
          <p>${person.description}</p>
          <div class="card-bottom"><p class="card-price" style="margin:0">от ${person.rate} <span>♥</span></p>
            <a class="button button-outline" href="${person.id}.html">Профиль <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </article>`).join("");
    cards.querySelectorAll("[data-favorite]").forEach(updateHeart);
    document.querySelectorAll("[data-genre]").forEach((button) => button.setAttribute("aria-pressed", String(genre === button.dataset.genre)));
    document.querySelectorAll(".favorite-toggle").forEach((button) => button.setAttribute("aria-pressed", String(onlyFavorites)));
    empty.hidden = visible.length > 0;
    document.querySelector("#empty-title").textContent = onlyFavorites && favorites.size === 0 ? "Избранное пока пусто" : "По этому запросу никого нет";
    document.querySelector("#catalog-title").textContent = onlyFavorites ? "Избранное" : "Ночная смена";
  }

  function animate(element, vars) {
    if (window.gsap && !motion.matches) gsap.from(element, { ...vars, ease: "power2.out", clearProps: "transform,opacity" });
  }

  function header(id, title) {
    return `<div class="dialog-header"><h2 id="${id}">${title}</h2><form method="dialog">
      <button class="icon-button" aria-label="Закрыть" type="submit">×</button></form></div>`;
  }

  function openDialog(dialog, content) {
    const body = dialog.querySelector(".dialog-body");
    body.innerHTML = content;
    if (!dialog.open) dialog.showModal();
    animate(body, { y: 13, opacity: 0, duration: .22 });
  }

  function selectPhoto(index) {
    galleryCover = index;
    const photo = gallery.querySelector(".gallery-photo");
    photo.style.cssText = imagePosition(galleryCharacter, index);
    photo.setAttribute("aria-label", `${galleryCharacter.name} · образ ${index + 1}`);
    gallery.querySelectorAll("[data-photo]").forEach((button) =>
      button.setAttribute("aria-pressed", String(Number(button.dataset.photo) === index)));
  }

  function showGallery(person) {
    galleryCharacter = person;
    openDialog(gallery, `${header("gallery-title", person.name)}
      <div class="gallery-photo" role="img"></div>
      <div class="gallery-actions">
        <div class="thumbs" role="group" aria-label="Выбор образа">
          ${[0, 1].map((index) => `<button class="thumbnail" type="button" data-photo="${index}" style="${imagePosition(person, index)}"
            aria-label="Образ ${index + 1}" aria-pressed="false"></button>`).join("")}
        </div>
        <button type="button" class="button button-berry" id="use-photo">На обложку</button>
      </div>`);
    selectPhoto(photos[person.id]);
  }

  function showOrder(id = profile?.id || cast[0].id, scenarioId = scenarios[0].id) {
    openDialog(order, `${header("order-title", "Быстрый заказ")}
      <p class="dialog-description">Выберите игровой сценарий. Цены указаны в сердечках.</p>
      <form class="booking" id="booking">
        <label class="field">Персонаж<select name="character">${cast.map((person) => `<option value="${person.id}" ${person.id === id ? "selected" : ""}>${person.name}</option>`).join("")}</select></label>
        <fieldset class="scenario-list"><legend>Сценарий</legend>
          ${scenarios.map((scenario) => `<label class="scenario">
            <input type="radio" name="scenario" value="${scenario.id}" ${scenario.id === scenarioId ? "checked" : ""}>
            <span>${scenario.title}<small>${scenario.duration}</small></span><b data-rate="${scenario.id}"></b>
          </label>`).join("")}
        </fieldset>
        <label class="field">Когда по сценарию<select name="slot">${Object.entries(slots).map(([key, title]) => `<option value="${key}">${title}</option>`).join("")}</select></label>
        <div class="confirm"><span class="total">Итого <output id="total"></output></span><button class="button button-berry" type="submit">Забронировать</button></div>
      </form>`);
    updatePrice();
  }

  function updatePrice() {
    const data = new FormData(order.querySelector("#booking"));
    const rate = byId(data.get("character")).rate;
    for (const scenario of scenarios) {
      order.querySelector(`[data-rate="${scenario.id}"]`).textContent = points(rate + scenario.extra);
    }
    order.querySelector("#total").value = points(rate + scenarioById(data.get("scenario")).extra);
  }

  function renderOrders() {
    if (!historyList) return;
    const entries = orders.map((item, index) => {
      const person = byId(item.character);
      const scenario = scenarioById(item.scenario);
      return `<li class="history-item">
        <div><p class="history-status ${item.cancelled ? "cancelled" : ""}">${item.cancelled ? "Отменён" : "Забронирован"}</p>
        <h2><a href="${person.id}.html">${person.name}</a></h2>
        <p>${scenario.title} · ${slots[item.slot]}</p></div>
        <div class="history-actions"><strong>${points(person.rate + scenario.extra)}</strong>
        <button type="button" class="button button-outline" data-toggle-order="${index}">${item.cancelled ? "Восстановить" : "Отменить"}</button></div>
      </li>`;
    });
    historyList.innerHTML = entries.length ? entries.join("") : `<li class="empty">
      <h2>Пока заказов нет</h2><p>Выберите героя и сценарий, чтобы создать первый.</p>
      <a class="button button-outline" href="index.html#catalog">Открыть каталог</a></li>`;
  }

  function updateCover(person, index) {
    photos[person.id] = index;
    const portrait = document.querySelector(`[data-gallery="${person.id}"]`);
    if (portrait) portrait.style.cssText = imagePosition(person, index);
    document.querySelectorAll("[data-cover]").forEach((button) =>
      button.setAttribute("aria-pressed", String(Number(button.dataset.cover) === index)));
  }

  function renderPagePrices() {
    document.querySelectorAll("[data-profile-rates]").forEach((target) => {
      target.innerHTML = scenarios.map((scenario) => `<li><div><strong>${scenario.title}</strong><small>${scenario.duration}</small></div>
        <b>${points(profile.rate + scenario.extra)}</b><button type="button" class="button button-outline"
          data-book="${profile.id}" data-scenario="${scenario.id}">Выбрать</button></li>`).join("");
    });
    document.querySelectorAll("[data-price-table]").forEach((target) => {
      target.innerHTML = scenarios.map((scenario) => `<tr><th scope="row">${scenario.title}<small>${scenario.duration}</small></th>
        ${cast.map((person) => `<td><button class="button button-outline price-cell" type="button" data-book="${person.id}" data-scenario="${scenario.id}"
          aria-label="${person.name} — ${scenario.title} — ${person.rate + scenario.extra} сердечек">${points(person.rate + scenario.extra)}</button></td>`).join("")}</tr>`).join("");
    });
  }

  document.addEventListener("click", (event) => {
    const control = event.target.closest("button");
    if (!control) return;
    if (control.dataset.genre) {
      genre = control.dataset.genre;
      renderCards();
    } else if (control.classList.contains("favorite-toggle") && cards) {
      onlyFavorites = !onlyFavorites;
      genre = "all";
      search.value = "";
      renderCards();
      document.querySelector("#catalog").scrollIntoView();
    } else if (control.dataset.favorite) {
      const id = control.dataset.favorite;
      if (!favorites.delete(id)) favorites.add(id);
      save();
      if (onlyFavorites && cards) renderCards();
      else {
        updateHeart(control);
        animate(control, { scale: .84, duration: .16 });
      }
    } else if (control.dataset.gallery) showGallery(byId(control.dataset.gallery));
    else if (control.dataset.photo) selectPhoto(Number(control.dataset.photo));
    else if (control.id === "use-photo") {
      updateCover(galleryCharacter, galleryCover);
      save();
      gallery.close();
      announcement.textContent = "Фото карточки обновлено";
    } else if (control.hasAttribute("data-cover")) {
      updateCover(profile, Number(control.dataset.cover));
      save();
    } else if (control.dataset.book || control.classList.contains("quick-order")) showOrder(control.dataset.book, control.dataset.scenario);
    else if (control.hasAttribute("data-toggle-order")) {
      const index = Number(control.dataset.toggleOrder);
      orders[index].cancelled = !orders[index].cancelled;
      save();
      renderOrders();
      historyList.querySelector(`[data-toggle-order="${index}"]`).focus();
      announcement.textContent = orders[index].cancelled ? "Заказ отменён" : "Заказ восстановлен";
    }
    else if (control.id === "clear-filters") {
      genre = "all";
      onlyFavorites = false;
      search.value = "";
      renderCards();
    }
  });
  for (const dialog of [gallery, order]) dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  search?.addEventListener("input", renderCards);
  order.addEventListener("change", (event) => { if (event.target.form?.id === "booking") updatePrice(); });
  order.addEventListener("submit", (event) => {
    if (event.target.id !== "booking") return;
    event.preventDefault();
    const data = new FormData(event.target);
    const character = byId(data.get("character"));
    const scenario = scenarioById(data.get("scenario"));
    const slot = data.get("slot");
    orders.unshift({ character: character.id, scenario: scenario.id, slot });
    orders.length = Math.min(20, orders.length);
    save();
    openDialog(order, `${header("order-title", "Встреча в сценарии")}
      <div class="success-mark" aria-hidden="true">♥</div>
      <p class="dialog-description"><strong>${character.name}</strong><br>${scenario.title} · ${slots[slot]}<br>${points(character.rate + scenario.extra)}</p>
      <a href="orders.html" class="button button-berry" id="show-orders">Мои заказы</a>`);
    order.querySelector("#show-orders").focus();
    announcement.textContent = "Игровой заказ сохранён";
  });
  renderCards();
  renderPagePrices();
  renderOrders();
  if (profile) {
    updateCover(profile, photos[profile.id]);
    document.querySelectorAll("[data-favorite]").forEach(updateHeart);
  }
  save();
  if (window.gsap && !motion.matches && document.querySelector(".hero")) {
    gsap.timeline({ defaults: { ease: "power3.out", clearProps: "transform,opacity" } })
      .from(".hero .eyebrow, .hero h1", { y: 25, opacity: 0, stagger: .13, duration: .73 })
      .from(".hero-copy p:not(.eyebrow), .hero .button", { y: 12, opacity: 0, stagger: .09, duration: .53 }, "-=.38");
  }
})();
