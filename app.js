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
    { id: "coffee", title: "Кофе с подтекстом", duration: "30 минут", extra: 0, hero: "mira",
      description: "Столик у окна, неожиданный вопрос и право выбрать последнюю реплику." },
    { id: "walk", title: "Прогулка под неоном", duration: "60 минут", extra: 4, hero: "luna",
      description: "Закрытый кинотеатр, дождь и маршрут, который вы меняете по ходу сюжета." },
    { id: "plot", title: "Вечер с поворотом сюжета", duration: "90 минут", extra: 8, hero: "ren",
      description: "Завязка, загадочный конверт и финал, в котором можно сменить жанр." },
  ];
  const slots = { evening: "Сегодня вечером", tomorrow: "Завтра вечером", credits: "После титров" };
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const gallery = document.querySelector("#gallery");
  const order = document.querySelector("#order");
  const cartDialog = document.querySelector("#cart");
  const featureStage = document.querySelector(".feature-stage");
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
  function readBookings(items, limit) {
    return Array.isArray(items) ? items.filter((item) =>
      item && byId(item.character) && scenarioById(item.scenario) && Object.hasOwn(slots, item.slot)).slice(0, limit) : [];
  }
  const favorites = new Set();
  const photos = {};
  let orders = [];
  let cart = [];
  let genre = "all";
  let onlyFavorites = new URLSearchParams(location.search).get("view") === "favorites";
  let galleryCharacter = null;
  let galleryCover = 0;
  let featureCut = null;
  load();

  function byProfile() {
    return cast.find((character) => character.id === document.body.dataset.character);
  }

  function load() {
    const saved = oldState();
    favorites.clear();
    (Array.isArray(saved.favorites) ? saved.favorites : []).filter(byId).forEach((id) => favorites.add(id));
    for (const { id } of cast) photos[id] = saved.photos?.[id] === 1 ? 1 : 0;
    orders = readBookings(saved.orders, 20);
    cart = readBookings(saved.cart, 12);
  }

  function updateCounts() {
    document.querySelectorAll("[data-favorite-count]").forEach((node) => { node.textContent = favorites.size; });
    document.querySelectorAll("[data-orders-count]").forEach((node) => { node.textContent = orders.length; });
    document.querySelectorAll("[data-cart-count]").forEach((node) => { node.textContent = cart.length; });
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ favorites: [...favorites], photos, orders, cart })); }
    catch { /* Состояние доступно до закрытия страницы. */ }
    updateCounts();
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
      <article class="character ${person.id === "mira" ? "featured-character" : ""}" data-tone="${person.genre}">
        <div class="portrait-area">
          <button type="button" class="portrait" data-gallery="${person.id}" style="${imagePosition(person, photos[person.id])}"
                  aria-label="Галерея · ${person.name}"><span class="photo-count" aria-hidden="true">2 фото</span></button>
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
    document.querySelector("#catalog-title").textContent = onlyFavorites ? "Избранное" : "Герои вечера";
  }

  function renderProducts() {
    const cheapestRate = Math.min(...cast.map((person) => person.rate));
    for (const target of document.querySelectorAll("[data-products]")) {
      target.innerHTML = scenarios.map((scenario, index) => `<article class="product">
        <div class="product-art" aria-hidden="true" style="--scene-x:${index * 50}%"></div>
        <div class="product-copy">
          <div class="product-meta"><span>${scenario.duration}</span><span>от ${points(cheapestRate + scenario.extra)}</span></div>
          <h3>${scenario.title}</h3><p>${scenario.description}</p>
          <button type="button" class="button button-pink" data-book="${scenario.hero}" data-scenario="${scenario.id}">Выбрать <span aria-hidden="true">→</span></button>
        </div></article>`).join("");
    }
  }

  function selectFeature(id) {
    const person = byId(id);
    const buttons = featureStage.querySelectorAll("[data-feature]");
    if (featureStage.querySelector(`[data-feature="${id}"]`).getAttribute("aria-pressed") === "true") return;
    featureCut?.progress(1);
    const art = featureStage.querySelector(".feature-art");
    const name = featureStage.querySelector(".feature-name");
    const position = imagePosition(person, 1);
    featureStage.querySelector(".feature-genre").textContent = person.label;
    name.href = `${person.id}.html`;
    name.firstChild.textContent = person.name + " ";
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.feature === id)));
    if (!window.gsap || motion.matches) {
      art.style.cssText = position;
      return;
    }
    const incoming = art.cloneNode(false);
    incoming.style.cssText = position;
    art.after(incoming);
    featureCut = gsap.fromTo(incoming,
      { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)", scale: 1.07 },
      {
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", scale: 1, duration: .55, ease: "power3.inOut",
        onComplete: () => {
          art.style.cssText = position;
          incoming.remove();
          featureCut = null;
        },
      });
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
    animate(body, { ...(dialog === cartDialog && innerWidth > 520 ? { x: 16 } : { y: 13 }), opacity: 0, duration: .24 });
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
        <div class="confirm"><span class="total">Итого <output id="total"></output></span>
          <div class="bag-actions"><button class="button button-outline" type="submit">Сразу забронировать</button>
          <button class="button button-berry" type="button" id="add-to-cart">В корзину</button></div>
        </div>
        <p id="add-feedback" class="add-feedback" role="status" hidden></p>
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

  function bookingValues() {
    const data = new FormData(order.querySelector("#booking"));
    return { character: data.get("character"), scenario: data.get("scenario"), slot: data.get("slot") };
  }

  function priceFor(item) {
    return byId(item.character).rate + scenarioById(item.scenario).extra;
  }

  function showCart() {
    const body = cartDialog.querySelector(".dialog-body");
    const items = cart.map((item, index) => `<li>
      <div><strong>${scenarioById(item.scenario).title}</strong><p>${byId(item.character).name} · ${slots[item.slot]}</p></div>
      <b>${points(priceFor(item))}</b>
      <button type="button" data-remove-cart="${index}" aria-label="Убрать ${scenarioById(item.scenario).title}">Убрать</button></li>`);
    const content = `${header("cart-title", "Корзина")}
      ${items.length ? `<ul class="cart-list">${items.join("")}</ul><div class="cart-confirm">
        <p class="total">Итого <span>${points(cart.reduce((sum, item) => sum + priceFor(item), 0))}</span></p>
        <p class="dialog-description">Игровые брони сохранятся в «Моих заказах».</p>
        <button type="button" class="button button-berry" id="checkout">Оформить заказ</button></div>`
        : `<p class="dialog-description">Корзина пуста. Добавьте сценарий, чтобы собрать заказ.</p>
          <a class="button button-berry" href="scenarios.html">К сценариям</a>`}`;
    if (cartDialog.open) body.innerHTML = content;
    else openDialog(cartDialog, content);
  }

  function addToCart() {
    if (cart.length >= 12) {
      const feedback = order.querySelector("#add-feedback");
      feedback.hidden = false;
      feedback.textContent = "В корзине уже 12 сценариев. Оформите заказ или уберите лишние.";
      return;
    }
    cart.push(bookingValues());
    save();
    order.close();
    showCart();
    announcement.textContent = "Сценарий добавлен в корзину";
  }

  function finishCheckout() {
    if (!cart.length) return;
    const amount = cart.reduce((sum, item) => sum + priceFor(item), 0);
    orders.unshift(...cart);
    orders.length = Math.min(20, orders.length);
    cart = [];
    save();
    renderOrders();
    openDialog(cartDialog, `${header("cart-title", "Заказ оформлен")}
      <div class="success-mark" aria-hidden="true">♥</div>
      <p class="dialog-description">Сценарии сохранены в истории. Итог ${points(amount)}.</p>
      <a href="orders.html" class="button button-berry" id="cart-orders">Мои заказы</a>`);
    cartDialog.querySelector("#cart-orders").focus();
    announcement.textContent = "Игровой заказ сохранён";
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
    } else if (control.dataset.feature) selectFeature(control.dataset.feature);
    else if (control.classList.contains("open-cart")) showCart();
    else if (control.id === "add-to-cart") addToCart();
    else if (control.id === "checkout") finishCheckout();
    else if (control.hasAttribute("data-remove-cart")) {
      const index = Number(control.dataset.removeCart);
      cart.splice(index, 1);
      save();
      showCart();
      const next = cartDialog.querySelectorAll("[data-remove-cart]")[Math.min(index, cart.length - 1)];
      (next || cartDialog.querySelector(".icon-button")).focus();
      announcement.textContent = "Сценарий убран из корзины";
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
  for (const dialog of [gallery, order, cartDialog]) dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  search?.addEventListener("input", renderCards);
  order.addEventListener("change", (event) => { if (event.target.form?.id === "booking") updatePrice(); });
  order.addEventListener("submit", (event) => {
    if (event.target.id !== "booking") return;
    event.preventDefault();
    const item = bookingValues();
    const character = byId(item.character);
    const scenario = scenarioById(item.scenario);
    orders.unshift(item);
    orders.length = Math.min(20, orders.length);
    save();
    renderOrders();
    openDialog(order, `${header("order-title", "Встреча в сценарии")}
      <div class="success-mark" aria-hidden="true">♥</div>
      <p class="dialog-description"><strong>${character.name}</strong><br>${scenario.title} · ${slots[item.slot]}<br>${points(priceFor(item))}</p>
      <a href="orders.html" class="button button-berry" id="show-orders">Мои заказы</a>`);
    order.querySelector("#show-orders").focus();
    announcement.textContent = "Игровой заказ сохранён";
  });
  renderCards();
  renderProducts();
  renderPagePrices();
  renderOrders();
  if (profile) {
    updateCover(profile, photos[profile.id]);
    document.querySelectorAll("[data-favorite]").forEach(updateHeart);
  }
  updateCounts();
  const refresh = () => {
    load();
    renderCards();
    renderOrders();
    updateCounts();
    if (profile) {
      updateCover(profile, photos[profile.id]);
      document.querySelectorAll("[data-favorite]").forEach(updateHeart);
    }
  };
  window.addEventListener("pageshow", ({ persisted }) => { if (persisted) refresh(); });
  window.addEventListener("storage", (event) => { if (event.key === storageKey) refresh(); });
  if (window.gsap && !motion.matches && document.querySelector(".hero")) {
    gsap.timeline({ defaults: { ease: "power3.out", clearProps: "transform,opacity" } })
      .from(".feature-art", { scale: 1.13, duration: 1 }, 0)
      .from(".hero .eyebrow, .hero h1", { y: 25, opacity: .46, stagger: .1, duration: .68 }, .04)
      .from(".hero-copy p:not(.eyebrow), .hero-actions", { y: 10, opacity: .72, stagger: .08, duration: .43 }, .31);
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      const responsiveMotion = gsap.matchMedia();
      responsiveMotion.add("(min-width: 641px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.to(".feature-picture", { scale: 1.16, yPercent: 6, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .5 } });
      });
      responsiveMotion.add("(prefers-reduced-motion: no-preference)", () => {
        ScrollTrigger.batch("[data-reveal], .product", {
          start: "top 94%", once: true,
          onEnter: (elements) => gsap.from(elements, { y: 16, opacity: .36, stagger: .06, duration: .4, clearProps: "transform,opacity" }),
        });
      });
    }
  }
})();
