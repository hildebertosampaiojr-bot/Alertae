"use strict";

let faqs;
let occurrences;
let pages;

/* ========================================
   MAPA E GEOLOCALIZAÇÃO AUTOMÁTICA
======================================== */

let mapInstance;
const occurrenceMarkers = new Map();
let userLocationMarker;
let sheetDragStart = null;
let sheetWasDragged = false;
let alertsVisible = false;

let toastTimer;
let modalReturnFocus;

function readStored(key, fallback = {}) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
  }
catch { return fallback; }
}

function saveStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
catch { showToast("O navegador não permitiu salvar os dados neste aparelho."); return false; }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 6000);
}

function navigate(screen) {
  if (Object.prototype.hasOwnProperty.call(pages, screen)) window.location.assign(pages[screen]);
}

function textElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function renderFaq(query = "") {
  const list = document.getElementById("faq-list");
  if (!list) return;
  list.replaceChildren();
  const normalize = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  faqs.forEach(([question, answer], index) => {
    if (!normalize(question + " " + answer).includes(normalize(query))) return;
    const item = textElement("div", "", "faq-item");
    const button = textElement("button", question, "faq-question");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", `faq-answer-${index}`);
    const body = textElement("p", answer, "faq-answer");
    body.id = `faq-answer-${index}`;
    body.hidden = true;
    button.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
      body.hidden = !open;
    });
    item.append(button, body);
    list.append(item);
  });
  if (!list.children.length) list.append(textElement("p", "Nenhuma dúvida encontrada."));
}

function renderSettings() {
  const list = document.getElementById("settings-list");
  if (!list) return;
  list.replaceChildren();
  const groups = [
    ["Conta e privacidade", [
      ["profile", "Meu perfil", "Nome, e-mail e telefone", "♙"],
      ["permissions", "Permissões", "Localização e preferências de notificações", "⌖"]
    ]],
    ["Conforto e leitura", [
      ["accessibility", "Acessibilidade", "Tamanho do texto, contraste e animações", "Aa"]
    ]],
    ["Ajuda e atendimento", [
      ["faq", "Dúvidas frequentes", "Encontre respostas sobre o aplicativo", "?"],
      ["chat", "Assistente do Alertaê", "Converse com o assistente demonstrativo", "…"],
      ["emergency", "Canais de emergência", "SAMU, Bombeiros, Polícia e Defesa Civil", "+"]
    ]]
  ];
  groups.forEach(([title, rows], index) => {
    const section = textElement("section", "", "settings-section");
    const heading = textElement("h2", title);
    heading.id = `settings-group-${index}`;
    section.setAttribute("aria-labelledby", heading.id);
    section.append(heading);
    const card = textElement("div", "", "settings-card");
    rows.forEach(([screen, label, description, symbol]) => {
      const button = textElement("button", "", "setting-row");
      button.type = "button";
      button.dataset.screen = screen;
      const icon = textElement("span", symbol, "setting-icon");
      icon.setAttribute("aria-hidden", "true");
      const copy = textElement("span", "", "setting-copy");
      copy.append(textElement("strong", label), textElement("small", description));
      const arrow = textElement("span", "›", "setting-arrow");
      arrow.setAttribute("aria-hidden", "true");
      button.append(icon, copy, arrow);
      card.append(button);
    });
    section.append(card);
    list.append(section);
  });
  const profile = readStored("alertae-profile");
  const name = typeof profile.name === "string" && profile.name.trim() ? profile.name.trim() : "Seu perfil";
  document.getElementById("settings-profile-name").textContent = name;
  document.getElementById("settings-profile-email").textContent = typeof profile.email === "string" && profile.email ? profile.email : "Personalize seus dados de contato";
  document.getElementById("settings-avatar").textContent = name === "Seu perfil" ? "A" : [...name][0].toUpperCase();
  const styleSelect = document.querySelector("[data-default-map-style]");
  let style;
  try { style = localStorage.getItem(MAP_STYLE_KEY); }
catch { /* Usa o estilo padrão. */ }
  if (styleSelect) styleSelect.value = Object.hasOwn(mapStyles, style) ? style : "claro";
  const autoLocation = document.querySelector("[data-auto-location]");
  if (autoLocation) autoLocation.checked = readStored("alertae-map-preferences").autoLocation !== false;
}

function renderOccurrences() {
  const list = document.getElementById("occurrence-list");
  if (!list) return;
  occurrences.forEach(item => {
    const button = textElement("button", "", "occurrence-card");
    button.type = "button";
    const copy = textElement("span", "", "occurrence-copy");
    copy.append(textElement("strong", item.title), textElement("small", item.address));
    const icon = textElement("span", item.icon, `category-icon ${item.color}`);
    icon.setAttribute("aria-hidden", "true");
    button.append(icon, copy, textElement("span", item.time, item.urgent ? "occurrence-meta now" : "occurrence-meta"));
    button.addEventListener("click", () => {
      if (!mapInstance) return showToast("Mapa indisponível. Verifique sua conexão.");
      setOccurrencesExpanded(false);
      mapInstance.setView([item.latitude, item.longitude], 16);
      occurrenceMarkers.get(item.id)?.openPopup();
    });
    list.append(button);
  });
}

function setModalOpen(open) {
  const backdrop = document.getElementById("modal-backdrop");
  if (!backdrop) return;
  backdrop.hidden = !open;
  const screen = document.querySelector(".screen.active");
  if (screen) screen.inert = open;
  if (open) {
    modalReturnFocus = document.activeElement;
    backdrop.querySelector("[data-close-modal]")?.focus();
  }
else modalReturnFocus?.focus();
}

function applyPreferences() {
  const prefs = readStored("alertae-accessibility");
  document.body.classList.toggle("high-contrast", prefs.contrast === true);
  document.body.classList.toggle("reduce-motion", prefs.motion === true);
  document.body.classList.toggle("text-small", prefs.textSize === "small");
  document.body.classList.toggle("text-large", prefs.textSize === "large");
  document.querySelectorAll("[data-accessibility]").forEach(input => { input.checked = prefs[input.dataset.accessibility] === true; });
  document.querySelectorAll("[data-text-size]").forEach(button => {
    const selected = button.dataset.textSize === (prefs.textSize || "normal");
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function sendChat(message) {
  const list = document.getElementById("chat-messages");
  message = message.trim();
  if (!list || !message) return;
  const normalized = message.toLowerCase();
  const answer = /risco|região|regiao|pontos/.test(normalized) ? faqs[2][1]
    : /denunci/.test(normalized) ? faqs[1][1]
    : /sos|socorro|emerg/.test(normalized) ? faqs[3][1]
    : /senha/.test(normalized) ? faqs[5][1]
    : /localiza|gps/.test(normalized) ? faqs[4][1]
    : "Sou um assistente demonstrativo com respostas locais. " + faqs[0][1];
  list.append(textElement("div", message, "chat-bubble user"), textElement("div", answer, "chat-bubble bot"));
  list.lastElementChild.scrollIntoView({ block: "nearest" });
}

async function initializeApplication() {
  try {
    ({ faqs, occurrences, pages } = await import("./dados.js"));
  } catch (error) {
    console.error("Falha ao carregar os dados do protótipo.", error);
    showToast("Não foi possível iniciar o protótipo. Recarregue a página.");
    return;
  }
  document.querySelectorAll(".online-strip span:last-child").forEach(label => { label.textContent = "Protótipo demonstrativo"; });
  applyPreferences();
  renderSettings();
  renderFaq();
  renderOccurrences();
  const profile = readStored("alertae-profile");
  ["name", "email", "phone"].forEach(field => {
    const input = document.getElementById(`profile-${field}`);
    if (input) input.value = typeof profile[field] === "string" ? profile[field] : "";
  });
  const permissions = readStored("alertae-permissions");
  document.querySelectorAll("[data-permission]").forEach(input => { input.checked = permissions[input.dataset.permission] !== false; });

  document.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.screen) navigate(button.dataset.screen);
    if (button.dataset.togglePassword) {
      const input = document.getElementById(button.dataset.togglePassword);
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
        button.setAttribute("aria-label", input.type === "password" ? "Mostrar senha" : "Ocultar senha");
        button.setAttribute("aria-pressed", String(input.type === "text"));
      }
    }
    if (button.dataset.action === "signout") { navigate("login"); }
    if (["toggle-sheet", "see-all"].includes(button.dataset.action)) toggleOccurrences();
    if (button.dataset.action === "alerts") setAlertsVisible(!alertsVisible);
    if (button.dataset.action === "dismiss-alerts") setAlertsVisible(false);
    if (button.matches(".locate-button")) centerOnUser();
    if (button.id === "sos-trigger") setModalOpen(true);
    if (button.hasAttribute("data-close-modal")) setModalOpen(false);
    if (button.id === "confirm-sos") {
      setModalOpen(false);
      showToast("Simulação concluída. Nenhum pedido foi enviado e nenhuma central foi acionada.");
    }
    if (button.dataset.prompt) sendChat(button.dataset.prompt);
    if (button.dataset.textSize) {
      const prefs = readStored("alertae-accessibility");
      prefs.textSize = button.dataset.textSize;
      if (saveStored("alertae-accessibility", prefs)) applyPreferences();
    }
  });
  document.addEventListener("change", event => {
    const input = event.target;
    if (input.hasAttribute("data-default-map-style")) {
      if (!Object.hasOwn(mapStyles, input.value)) return;
      try {
        localStorage.setItem(MAP_STYLE_KEY, input.value);
        showToast("Estilo do mapa salvo. Será aplicado ao abrir o mapa.");
      }
catch { showToast("Não foi possível salvar o estilo neste navegador."); }
      return;
    }
    if (input.hasAttribute("data-auto-location")) {
      const prefs = readStored("alertae-map-preferences");
      prefs.autoLocation = input.checked;
      if (saveStored("alertae-map-preferences", prefs)) showToast("Preferência de centralização salva.");
      return;
    }
    const accessibility = input.dataset.accessibility;
    const permission = input.dataset.permission;
    if (!accessibility && !permission) return;
    const key = accessibility ? "alertae-accessibility" : "alertae-permissions";
    const prefs = readStored(key);
    prefs[accessibility || permission] = input.checked;
    if (saveStored(key, prefs)) {
      applyPreferences();
      if (permission) showToast("Preferência demonstrativa salva. As permissões do navegador não foram alteradas.");
    }
  });
  document.getElementById("faq-search")?.addEventListener("input", event => renderFaq(event.target.value));
  document.querySelectorAll("form").forEach(form => form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.id === "login-form") { form.reset(); navigate("map"); }
    if (form.id === "signup-form") {
      const password = document.getElementById("signup-password");
      const confirm = document.getElementById("signup-confirm");
      if (password.value !== confirm.value) { showToast("As senhas precisam ser iguais."); confirm.focus(); return; }
      const saved = saveStored("alertae-profile", {
        name: document.getElementById("signup-name").value.trim(),
        email: document.getElementById("signup-email").value.trim(),
        phone: document.getElementById("signup-phone").value.trim()
      });
      // Senhas nunca são persistidas no protótipo.
      if (saved) { form.reset(); navigate("map"); }
    }
    if (form.id === "forgot-form") showToast("Demonstração: nenhum e-mail foi enviado. Não há contas reais neste protótipo.");
    if (form.id === "profile-form") {
      const data = Object.fromEntries(new FormData(form));
      if (saveStored("alertae-profile", data)) showToast("Perfil salvo neste navegador.");
    }
    if (form.id === "chat-form") {
      const input = document.getElementById("chat-input");
      sendChat(input.value);
      input.value = "";
    }
  }));
  document.addEventListener("keydown", event => {
    const backdrop = document.getElementById("modal-backdrop");
    if (!backdrop || backdrop.hidden) return;
    if (event.key === "Escape") setModalOpen(false);
    if (event.key === "Tab") {
      const buttons = [...backdrop.querySelectorAll("button")];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  const handle = document.querySelector(".sheet-handle");
  handle?.addEventListener("pointerdown", event => { sheetDragStart = event.clientY; handle.setPointerCapture(event.pointerId); });
  handle?.addEventListener("pointerup", event => {
    if (sheetDragStart !== null && Math.abs(event.clientY - sheetDragStart) > 25) {
      setOccurrencesExpanded(event.clientY < sheetDragStart);
      sheetWasDragged = true;
    }
    sheetDragStart = null;
  });
  handle?.addEventListener("pointercancel", () => { sheetDragStart = null; });
  handle?.addEventListener("click", event => {
    if (sheetWasDragged) { event.stopPropagation(); sheetWasDragged = false; }
  });
  initializeMap();
}

/* ========================================
   PAINEL DE OCORRÊNCIAS
======================================== */

function setAlertsVisible(visible) {
  alertsVisible = visible;
  const sheet = document.getElementById("occurrences-sheet");
  if (sheet) sheet.hidden = !visible;
  occurrenceMarkers.forEach(marker => {
    if (visible) marker.addTo(mapInstance);
    else mapInstance?.removeLayer(marker);
  });
  document.querySelectorAll('[data-action="alerts"]').forEach(button => {
    button.setAttribute("aria-pressed", String(visible));
    button.setAttribute("aria-expanded", String(visible));
  });
  setOccurrencesExpanded(visible);
  document.querySelector(visible ? '[data-action="dismiss-alerts"]' : '[data-action="alerts"]')?.focus();
}

function setOccurrencesExpanded(expanded) {
  const sheet = document.getElementById("occurrences-sheet");
  const handle = sheet?.querySelector(".sheet-handle");

  if (!sheet) return;

  sheet.classList.toggle("expanded", expanded);

  handle?.setAttribute(
    "aria-expanded",
    String(expanded)
  );

  handle?.setAttribute(
    "aria-label",
    expanded
      ? "Recolher ocorrências"
      : "Expandir ocorrências"
  );

  window.setTimeout(() => {
    mapInstance?.invalidateSize({
      pan: false
    });
  }, 280);
}

function toggleOccurrences() {
  const sheet = document.getElementById("occurrences-sheet");

  setOccurrencesExpanded(
    !sheet?.classList.contains("expanded")
  );
}

/* ========================================
   ESTILOS DO MAPA
======================================== */

const MAP_STYLE_KEY = "alertae-map-style";

const mapStyles = {
  claro: {
    name: "Claro",
    url:
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },

  escuro: {
    name: "Escuro",
    url:
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: "alertae-dark-tiles"
  },

  satelite: {
    name: "Satélite",
    url:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      'Tiles &copy; Esri'
  },

  hibrido: {
    name: "Híbrido",
    url:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      'Tiles &copy; Esri'
  }
};

let activeMapLayer = null;
let hybridLabelsLayer = null;

/* ========================================
   TROCAR ESTILO DO MAPA
======================================== */

function changeMapStyle(style) {
  if (!mapInstance || !Object.hasOwn(mapStyles, style)) {
    return;
  }

  // Remove o mapa anterior
  if (activeMapLayer) {
    mapInstance.removeLayer(activeMapLayer);
  }

  // Remove os nomes do mapa híbrido anterior
  if (hybridLabelsLayer) {
    mapInstance.removeLayer(hybridLabelsLayer);
    hybridLabelsLayer = null;
  }

  const selected = mapStyles[style];

  // Adiciona o novo mapa
  activeMapLayer = L.tileLayer(selected.url, {
    attribution: selected.attribution,
    maxZoom: 19,
    className: selected.className || ""
  }).addTo(mapInstance);

  // Adiciona nomes de ruas e lugares ao satélite
  if (style === "hibrido") {
    hybridLabelsLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Labels &copy; Esri",
        maxZoom: 19,
        zIndex: 450
      }
    ).addTo(mapInstance);
  }

  // Salva a preferência do usuário
  try { localStorage.setItem(MAP_STYLE_KEY, style); }
catch { showToast("Estilo aplicado sem salvar a preferência neste navegador."); }

  // Atualiza os botões do seletor
  document
    .querySelectorAll("[data-map-style]")
    .forEach((button) => {
      const isSelected =
        button.dataset.mapStyle === style;

      button.setAttribute("aria-pressed", String(isSelected));
      button.classList.toggle("selected", isSelected);

      button.classList.toggle("selected", isSelected);
    });
}

/* ========================================
   BOTÃO CAMADAS
======================================== */

function addMapStyleControl() {
  if (!mapInstance) return;

  const control = L.control({
    position: "topleft"
  });

  control.onAdd = function () {
    const container = L.DomUtil.create(
      "div",
      "leaflet-bar alertae-map-styles"
    );

    // Botão principal
    const toggle = document.createElement("button");
    toggle.className = "map-style-toggle";

    toggle.type = "button";
    toggle.textContent = "☷ Camadas";

    toggle.setAttribute(
      "aria-label",
      "Escolher estilo do mapa"
    );

    toggle.setAttribute(
      "aria-expanded",
      "false"
    );

    // Painel das opções
    const options = document.createElement("div");
    options.className = "map-style-options";

    options.hidden = true;

    // Cria os quatro botões
    Object.entries(mapStyles).forEach(
      ([key, value]) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "map-style-option";
        button.dataset.mapStyle = key;
        button.textContent = value.name;

        button.addEventListener("click", () => {
          changeMapStyle(key);

          options.hidden = true;

          toggle.setAttribute(
            "aria-expanded",
            "false"
          );

          showToast(
            `Mapa ${value.name.toLowerCase()} ativado`
          );
        });

        options.appendChild(button);
      }
    );

    // Abre e fecha o painel
    toggle.addEventListener("click", () => {
      const opening = options.hidden;

      options.hidden = !opening;

      toggle.setAttribute(
        "aria-expanded",
        String(opening)
      );
    });

    container.append(toggle, options);

    // Impede que cliques nos botões movam o mapa
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    return container;
  };

  control.addTo(mapInstance);
}

/* ========================================
   INICIALIZAÇÃO DO MAPA
======================================== */

function initializeMap() {
  const element = document.getElementById(
    "mapa-interativo"
  );

  if (!element || mapInstance) return;
  if (!window.L) {
    element.textContent = "Mapa indisponível. Verifique sua conexão e recarregue a página.";
    showToast("Não foi possível carregar o mapa.");
    return;
  }

  // Visão inicial do Brasil enquanto o GPS carrega
  mapInstance = L.map(element, {
    zoomControl: false
  }).setView(
    [-14.235, -51.9253],
    4
  );

  // Recupera o último estilo escolhido
  let savedStyle;
  try { savedStyle = localStorage.getItem(MAP_STYLE_KEY); }
catch { /* Usa o estilo padrão. */ }

  const initialStyle =
    Object.hasOwn(mapStyles, savedStyle) ? savedStyle : "claro";

  // Aplica o estilo
  changeMapStyle(initialStyle);

  // Botões de zoom
  L.control.zoom({
    position: "topright"
  }).addTo(mapInstance);

  // Adiciona o seletor de estilos
  addMapStyleControl();

  // Atualiza a seleção visual dos botões
  document
    .querySelectorAll("[data-map-style]")
    .forEach((button) => {
      const isSelected =
        button.dataset.mapStyle === initialStyle;

      button.setAttribute("aria-pressed", String(isSelected));
      button.classList.toggle("selected", isSelected);

      button.classList.toggle("selected", isSelected);
    });

  /* ========================================
     MARCADORES DAS OCORRÊNCIAS
  ======================================== */

  occurrences.forEach((item) => {
    const marker = L.marker(
      [item.latitude, item.longitude],
      {
        title: item.title,
        alt: item.title
      }
    );

    marker.bindPopup(`
      <strong>${item.title}</strong>
      <br>${item.address}
      <br><small>${item.time}</small>
      <br><small>
        Ocorrência fictícia para demonstração
      </small>
    `);

    occurrenceMarkers.set(item.id, marker);
  });

  // Centraliza na posição atual, mediante autorização do navegador.
  if (readStored("alertae-map-preferences").autoLocation !== false) centerOnUser();
}

/* ========================================
   GPS AUTOMÁTICO
======================================== */

function centerOnUser() {
  if (readStored("alertae-permissions").location === false) {
    showToast("Ative a preferência de localização em Configurações > Permissões para centralizar o mapa.");
    return;
  }
  if (!mapInstance) {
    showToast(
      "Não foi possível carregar o mapa. Verifique sua conexão."
    );
    return;
  }

  if (!navigator.geolocation) {
    showToast(
      "Este aparelho não oferece acesso à localização."
    );
    return;
  }

  showToast("Buscando sua localização…");

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const point = [
        coords.latitude,
        coords.longitude
      ];

      // Centraliza o mapa na posição encontrada
      mapInstance.setView(point, 16);

      // Cria ou atualiza o marcador azul
      if (!userLocationMarker) {
        userLocationMarker = L.circleMarker(
          point,
          {
            radius: 8,
            color: "#ffffff",
            weight: 3,
            fillColor: "#1687e8",
            fillOpacity: 1
          }
        )
          .addTo(mapInstance)
          .bindPopup("Você está aqui");
      }
else {
        userLocationMarker.setLatLng(point);
      }

      showToast(
        "Mapa centralizado na sua localização"
      );
    },

    (erro) => {
      const mensagens = {
        1:
          "Localização não autorizada. Ative a permissão do navegador para usar o GPS.",
        2:
          "Localização indisponível. Verifique o GPS ou a conexão do aparelho.",
        3:
          "A busca pela localização demorou demais. Tente novamente."
      };

      showToast(
        mensagens[erro.code] ||
          "Não foi possível obter sua localização."
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApplication, { once: true });
}
else {
  initializeApplication();
}
