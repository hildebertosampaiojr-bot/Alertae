
const screens = [...document.querySelectorAll(".screen")];

const pageNames = {
  login: "index.html",
  signup: "cadastro.html",
  map: "mapa.html",
  sos: "socorro.html",
  samu: "samu.html",
  chat: "chatbot.html",
  faq: "duvidas-frequentes.html",
  settings: "configuracoes.html",
  forgot: "recuperar-senha.html",
  accessibility: "acessibilidade.html",
  profile: "perfil.html",
  permissions: "permissoes.html",
};

const toast = document.getElementById("toast");
let toastTimer;

const occurrences = [
  {
    id: "acidente",
    icon: "!",
    color: "red",
    title: "Acidente de trânsito",
    address: "Av. das Nações, 320",
    time: "Agora",
    urgent: true,
    latitude: -23.5631,
    longitude: -46.6544,
  },
  {
    id: "incendio",
    icon: "♨",
    color: "amber",
    title: "Incêndio",
    address: "R. Minas Gerais, 150",
    time: "12 min",
    latitude: -23.5521,
    longitude: -46.6592,
  },
  {
    id: "policial",
    icon: "★",
    color: "blue",
    title: "Ocorrência policial",
    address: "Av. Brasil, 780",
    time: "28 min",
    latitude: -23.5745,
    longitude: -46.6701,
  },
  {
    id: "medica",
    icon: "＋",
    color: "green",
    title: "Emergência médica",
    address: "R. das Flores, 420",
    time: "35 min",
    latitude: -23.5502,
    longitude: -46.6407,
  },
  {
    id: "alagamento",
    icon: "!",
    color: "red",
    title: "Alagamento",
    address: "Rua do Mercado, 40",
    time: "48 min",
    latitude: -23.5486,
    longitude: -46.6328,
  },
  {
    id: "risco",
    icon: "♧",
    color: "purple",
    title: "Área de risco",
    address: "Praça da Estação",
    time: "1 h",
    latitude: -23.5597,
    longitude: -46.6425,
  },
];

const faqItems = [
  {
    icon: "!",
    color: "red",
    title: "Sobre o Alertaê",
    summary: "O que é, como funciona e quais são os objetivos.",
    answer: "O Alertaê conecta moradores e serviços públicos para compartilhar ocorrências e informações de segurança em tempo real. Consulte o mapa, receba alertas próximos e peça ajuda em uma emergência.",
  },
  {
    icon: "●",
    color: "blue",
    title: "Cadastro e Login",
    summary: "Como criar sua conta, recuperar senha e atualizar dados.",
    answer: "Crie uma conta com seu nome e e-mail. Caso esqueça sua senha, use a opção “Esqueci minha senha?” na tela de entrada. Mantenha seus dados de contato atualizados.",
  },
  {
    icon: "⌖",
    color: "green",
    title: "Denúncias e Alertas",
    summary: "Como enviar uma denúncia e acompanhar depois.",
    answer: "Use o mapa para consultar ocorrências na região. Se identificar uma situação de risco, compartilhe a localização e uma descrição objetiva. Não se exponha para registrar uma ocorrência.",
  },
  {
    icon: "◇",
    color: "amber",
    title: "Privacidade e Segurança",
    summary: "Como seus dados são protegidos e quem pode acessá-los.",
    answer: "A localização serve para exibir informações próximas e orientar pedidos de ajuda. Nas configurações, você pode ajustar as permissões do aparelho.",
  },
  {
    icon: "⚙",
    color: "purple",
    title: "Funcionamento do App",
    summary: "Recursos, notificações, mapa e personalizações.",
    answer: "Ative as notificações e a localização para receber alertas relevantes. Você pode rever favoritos, histórico e preferências na tela de configurações.",
  },
];

const settings = [
  { icon: "♿", title: "Acessibilidade", state: "Ajustar" },
  { icon: "☼", title: "Aparência", state: "Claro" },
  { icon: "♡", title: "Favoritos", state: "" },
  { icon: "◷", title: "Histórico", state: "" },
  { icon: "♧", title: "Notificações", state: "Ativadas" },
  { icon: "♙", title: "Perfil", state: "" },
  { icon: "◎", title: "Permissões", state: "" },
];

function showScreen(name) {
  const page = pageNames[name];

  if (page) {
    window.location.href = page;
    return;
  }

  const target = document.getElementById(`screen-${name}`);
  if (!target) return;

  screens.forEach((screen) => {
    const active = screen === target;
    screen.classList.toggle("active", active);
    screen.setAttribute("aria-hidden", String(!active));
    if (active) screen.scrollTop = 0;
  });

  const backdrop = document.getElementById("modal-backdrop");
  if (backdrop) backdrop.hidden = true;
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => toast.classList.remove("show"),
    2800
  );
}

function renderOccurrences(items = occurrences.slice(0, 4)) {
  const list = document.getElementById("occurrence-list");
  if (!list) return;

  list.innerHTML = items.map((item) => `
    <button
      class="occurrence-card"
      type="button"
      data-occurrence="${item.title}"
      data-occurrence-id="${item.id}"
    >
      <i class="category-icon ${item.color}" aria-hidden="true">
        ${item.icon}
      </i>
      <div class="occurrence-copy">
        <strong>${item.title}</strong>
        <small>${item.address}</small>
      </div>
      <span class="occurrence-meta ${item.urgent ? "now" : ""}">
        ${item.time} &nbsp;›
      </span>
    </button>
  `).join("");
}

// ========================================
// MAPA E GEOLOCALIZACAO AUTOMATICA
// ========================================

let mapInstance;
const occurrenceMarkers = new Map();
let userLocationMarker;
let sheetDragStart = null;
let sheetWasDragged = false;

function setOccurrencesExpanded(expanded) {
  const sheet = document.getElementById("occurrences-sheet");
  const handle = sheet?.querySelector(".sheet-handle");

  if (!sheet) return;

  sheet.classList.toggle("expanded", expanded);
  handle?.setAttribute("aria-expanded", String(expanded));
  handle?.setAttribute(
    "aria-label",
    expanded ? "Recolher ocorrências" : "Expandir ocorrências"
  );

  window.setTimeout(
    () => mapInstance?.invalidateSize({ pan: false }),
    280
  );
}

function toggleOccurrences() {
  const sheet = document.getElementById("occurrences-sheet");
  setOccurrencesExpanded(!sheet?.classList.contains("expanded"));
}

function initializeMap() {
  const element = document.getElementById("mapa-interativo");

  if (!element || !window.L) return;

  // Visao inicial do Brasil enquanto o GPS carrega
  mapInstance = L.map(element, {
    zoomControl: false
  }).setView([-14.235, -51.9253], 4);

  L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  ).addTo(mapInstance);

  L.control.zoom({
    position: "topright"
  }).addTo(mapInstance);

  // Marcadores demonstrativos
  occurrences.forEach((item) => {
    const marker = L.marker(
      [item.latitude, item.longitude],
      {
        title: item.title,
        alt: item.title
      }
    ).addTo(mapInstance);

    marker.bindPopup(`
      <strong>${item.title}</strong>
      <br>${item.address}
      <br><small>${item.time}</small>
    `);

    occurrenceMarkers.set(item.id, marker);
  });

  // Iniciar GPS automaticamente
  centerOnUser();
}

function centerOnUser() {
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

      // Centralizar na localizacao encontrada
      mapInstance.setView(point, 16);

      // Criar marcador azul
      if (!userLocationMarker) {
        userLocationMarker = L.circleMarker(point, {
          radius: 8,
          color: "#fff",
          weight: 3,
          fillColor: "#1687e8",
          fillOpacity: 1
        })
          .addTo(mapInstance)
          .bindPopup("Você está aqui");
      } else {
        userLocationMarker.setLatLng(point);
      }

      showToast(
        "Mapa centralizado na sua localização"
      );
    },

    (erro) => {
      const mensagens = {
        1: "Localização não autorizada. Ative a permissão do navegador para usar o GPS.",
        2: "Localização indisponível. Verifique o GPS ou a conexão do aparelho.",
        3: "A busca pela localização demorou demais. Tente novamente."
      };

      showToast(
        mensagens[erro.code] ||
        "Não foi possível obter sua localização."
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    }
  );
}

// ========================================
// PERGUNTAS FREQUENTES
// ========================================

function renderFaq(filter = "") {
  const list = document.getElementById("faq-list");
  if (!list) return;

  const query = filter.trim().toLocaleLowerCase("pt-BR");

  const filtered = faqItems.filter((item) =>
    `${item.title} ${item.summary} ${item.answer}`
      .toLocaleLowerCase("pt-BR")
      .includes(query)
  );

  list.innerHTML = filtered.length
    ? filtered.map((item) => `
      <article class="faq-item">
        <button
          class="faq-question"
          type="button"
          aria-expanded="false"
        >
          <i class="category-icon ${item.color}">
            ${item.icon}
          </i>
          <div class="faq-question-copy">
            <strong>${item.title}</strong>
            <small>${item.summary}</small>
          </div>
          <b>›</b>
        </button>
        <p class="faq-answer">${item.answer}</p>
      </article>
    `).join("")
    : '<p class="empty-state">Nenhuma dúvida encontrada.</p>';
}

function renderSettings() {
  const list = document.getElementById("settings-list");
  if (!list) return;

  list.innerHTML = settings.map((item) => `
    <button
      class="setting-row"
      type="button"
      data-setting="${item.title}"
    >
      <i class="setting-icon" aria-hidden="true">
        ${item.icon}
      </i>
      <strong>${item.title}</strong>
      <small class="setting-state">${item.state}</small>
      <b>›</b>
    </button>
  `).join("");
}

// ========================================
// EVENTOS E NAVEGACAO
// ========================================

document.addEventListener("click", (event) => {
  const screenButton = event.target.closest("[data-screen]");

  if (screenButton) {
    showScreen(screenButton.dataset.screen);
  }

  const action = event.target.closest("[data-action]")?.dataset.action;

  if (action === "alerts") {
    toggleOccurrences();
    showToast("Ocorrências demonstrativas (São Paulo)");
  }

  if (action === "see-all" || action === "toggle-sheet") {
    if (sheetWasDragged) {
      sheetWasDragged = false;
      return;
    }

    toggleOccurrences();
  }

  if (action === "locate") {
    centerOnUser();
  }

  if (action === "signout") {
    showScreen("login");
  }

  const passwordToggle = event.target.closest(
    "[data-toggle-password]"
  );

  if (passwordToggle) {
    const input = document.getElementById(
      passwordToggle.dataset.togglePassword
    );

    if (input) {
      input.type =
        input.type === "password" ? "text" : "password";
    }
  }

  const occurrence = event.target.closest("[data-occurrence]");

  if (occurrence) {
    const marker = occurrenceMarkers.get(
      occurrence.dataset.occurrenceId
    );

    if (marker && mapInstance) {
      mapInstance.setView(marker.getLatLng(), 16);
      marker.openPopup();
    }

    showToast(
      `${occurrence.dataset.occurrence} — detalhes da ocorrência`
    );
  }

  const faqQuestion = event.target.closest(".faq-question");

  if (faqQuestion) {
    const item = faqQuestion.closest(".faq-item");

    item.classList.toggle("open");

    faqQuestion.setAttribute(
      "aria-expanded",
      String(item.classList.contains("open"))
    );
  }

  const settingButton = event.target.closest("[data-setting]");

  if (settingButton) {
    const name = settingButton.dataset.setting;

    const preferencePages = {
      Acessibilidade: "accessibility",
      Perfil: "profile",
      Permissões: "permissions"
    };

    if (preferencePages[name]) {
      showScreen(preferencePages[name]);
      return;
    }

    if (name === "Aparência") {
      const dark = document.body.classList.toggle(
        "dark-preview"
      );

      settingButton.querySelector(
        ".setting-state"
      ).textContent = dark ? "Escuro" : "Claro";

      showToast(
        `Aparência ${dark ? "escura" : "clara"} ativada`
      );
    } else if (name === "Notificações") {
      const state = settingButton.querySelector(
        ".setting-state"
      );

      state.textContent =
        state.textContent === "Ativadas"
          ? "Desativadas"
          : "Ativadas";

      showToast(
        `Notificações ${state.textContent.toLocaleLowerCase("pt-BR")}`
      );
    } else if (name === "Favoritos") {
      showToast("Você ainda não salvou favoritos");
    } else if (name === "Histórico") {
      showToast("Seu histórico aparecerá aqui");
    } else if (name === "Perfil") {
      showToast("Área de perfil em demonstração");
    } else if (name === "Permissões") {
      showToast("Gerencie localização e notificações no aparelho");
    } else {
      showToast("Opções de acessibilidade em demonstração");
    }
  }

  const prompt = event.target.closest("[data-prompt]");

  if (prompt) {
    sendChat(prompt.dataset.prompt);
  }

  const backdrop = document.getElementById("modal-backdrop");

  if (event.target.closest("[data-close-modal]") && backdrop) {
    backdrop.hidden = true;
  }

  if (event.target.closest("#sos-trigger") && backdrop) {
    backdrop.hidden = false;
  }

  if (event.target.closest("#confirm-sos")) {
    if (backdrop) backdrop.hidden = true;

    showToast(
      "Pedido de ajuda registrado. Mantenha-se em local seguro."
    );
  }

  if (event.target.closest(".map-marker")) {
    showToast(
      "Toque em uma ocorrência para ver os detalhes"
    );
  }
});

// ========================================
// LOGIN E CADASTRO
// ========================================

document.getElementById("login-form")?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();
    showScreen("map");
    showToast("Bem-vindo ao Alertaê");
  }
);

document.getElementById("signup-form")?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const password = document.getElementById(
      "signup-password"
    ).value;

    const confirmation = document.getElementById(
      "signup-confirm"
    ).value;

    if (password !== confirmation) {
      showToast("As senhas não conferem.");

      document.getElementById(
        "signup-confirm"
      ).focus();

      return;
    }

    showScreen("map");
    showToast("Conta criada neste protótipo");
  }
);

document.getElementById("forgot-form")?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    showToast(
      "Se o e-mail estiver cadastrado, você receberá as instruções."
    );
  }
);

// ========================================
// CHATBOT
// ========================================

document.getElementById("faq-search")?.addEventListener(
  "input",
  (event) => renderFaq(event.target.value)
);

function sendChat(message) {
  const messages = document.getElementById("chat-messages");
  if (!messages) return;

  const userBubble = document.createElement("div");
  userBubble.className = "chat-bubble user";
  userBubble.textContent = message;

  messages.append(userBubble);

  const chatInput = document.getElementById("chat-input");
  if (chatInput) chatInput.value = "";

  const reply = document.createElement("div");
  reply.className = "chat-bubble bot";

  reply.textContent = /risco|denunci/i.test(message)
    ? "Se houver perigo imediato, use o botão SOS ou ligue para os serviços de emergência. Para ocorrências na região, consulte o mapa do Alertaê."
    : /ponto|região/i.test(message)
      ? "As ocorrências próximas aparecem no mapa. Toque em um marcador ou em uma ocorrência para ver mais informações."
      : "O Alertaê reúne alertas da comunidade e facilita o acesso a informações e canais de emergência. Posso ajudar você a explorar o mapa e os recursos do app.";

  window.setTimeout(() => messages.append(reply), 220);

  messages.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

document.getElementById("chat-form")?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const input = document.getElementById("chat-input");

    if (input?.value.trim()) {
      sendChat(input.value.trim());
    }
  }
);

// Botao para localizar novamente
document.querySelector(".locate-button")?.addEventListener(
  "click",
  centerOnUser
);

// ========================================
// PAINEL DE OCORRENCIAS
// ========================================

const occurrenceSheet = document.getElementById(
  "occurrences-sheet"
);

occurrenceSheet?.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".sheet-handle, .sheet-heading")) {
    return;
  }

  sheetDragStart = {
    y: event.clientY,
    height: occurrenceSheet.getBoundingClientRect().height
  };

  sheetWasDragged = false;
  occurrenceSheet.setPointerCapture(event.pointerId);
});

occurrenceSheet?.addEventListener("pointermove", (event) => {
  if (!sheetDragStart) return;

  const delta = sheetDragStart.y - event.clientY;

  if (Math.abs(delta) > 6) {
    sheetWasDragged = true;
  }

  if (!sheetWasDragged) return;

  const maximum = Math.min(
    window.innerHeight * 0.72,
    560
  );

  const height = Math.max(
    72,
    Math.min(maximum, sheetDragStart.height + delta)
  );

  occurrenceSheet.style.height = `${height}px`;

  occurrenceSheet.classList.toggle(
    "expanded",
    height > 100
  );
});

occurrenceSheet?.addEventListener("pointerup", (event) => {
  if (!sheetDragStart) return;

  const delta = sheetDragStart.y - event.clientY;
  const wasDragged = sheetWasDragged;

  sheetDragStart = null;

  if (!wasDragged) return;

  occurrenceSheet.style.height = "";

  setOccurrencesExpanded(
    delta > 35 ||
    (
      Math.abs(delta) <= 35 &&
      occurrenceSheet.classList.contains("expanded")
    )
  );
});

occurrenceSheet?.addEventListener("pointercancel", () => {
  sheetDragStart = null;
  occurrenceSheet.style.height = "";

  setOccurrencesExpanded(
    occurrenceSheet.classList.contains("expanded")
  );
});

// ========================================
// INICIALIZACAO
// ========================================

renderOccurrences();
initializeMap();
renderFaq();
renderSettings();

// ========================================
// ACESSIBILIDADE
// ========================================

document.addEventListener("click", (event) => {
  const sizeButton = event.target.closest("[data-text-size]");
  if (!sizeButton) return;

  const size = sizeButton.dataset.textSize;

  document.body.classList.remove(
    "text-small",
    "text-large"
  );

  if (size !== "normal") {
    document.body.classList.add(`text-${size}`);
  }

  localStorage.setItem("alertaeTextSize", size);

  document.querySelectorAll("[data-text-size]").forEach(
    (button) => {
      button.classList.toggle(
        "selected",
        button === sizeButton
      );
    }
  );

  showToast("Tamanho do texto atualizado");
});

document.addEventListener("change", (event) => {
  const control = event.target;

  const accessibilityOption = control.closest(
    "[data-accessibility]"
  );

  const permissionOption = control.closest(
    "[data-permission]"
  );

  if (accessibilityOption) {
    const option = accessibilityOption.dataset.accessibility;

    const className =
      option === "contrast"
        ? "high-contrast"
        : "reduce-motion";

    document.body.classList.toggle(
      className,
      accessibilityOption.checked
    );

    localStorage.setItem(
      `alertae${option}`,
      String(accessibilityOption.checked)
    );

    showToast(
      "Preferência de acessibilidade atualizada"
    );
  }

  if (permissionOption) {
    const permission = permissionOption.dataset.permission;

    localStorage.setItem(
      `alertaePermission${permission}`,
      String(permissionOption.checked)
    );

    showToast("Permissão atualizada neste protótipo");
  }
});

// ========================================
// PERFIL
// ========================================

document.getElementById("profile-form")?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const profile = Object.fromEntries(formData.entries());

    localStorage.setItem(
      "alertaeProfile",
      JSON.stringify(profile)
    );

    showToast("Perfil salvo neste dispositivo");
  }
);

function loadSavedPreferences() {
  const size = localStorage.getItem(
    "alertaeTextSize"
  ) || "normal";

  if (size !== "normal") {
    document.body.classList.add(`text-${size}`);
  }

  document.querySelectorAll("[data-text-size]").forEach(
    (button) => {
      button.classList.toggle(
        "selected",
        button.dataset.textSize === size
      );
    }
  );

  ["contrast", "motion"].forEach((option) => {
    const saved = localStorage.getItem(
      `alertae${option}`
    ) === "true";

    const control = document.querySelector(
      `[data-accessibility="${option}"]`
    );

    if (control) {
      control.checked = saved;

      document.body.classList.toggle(
        option === "contrast"
          ? "high-contrast"
          : "reduce-motion",
        saved
      );
    }
  });

  ["location", "notifications"].forEach((permission) => {
    const control = document.querySelector(
      `[data-permission="${permission}"]`
    );

    const saved = localStorage.getItem(
      `alertaePermission${permission}`
    );

    if (control && saved !== null) {
      control.checked = saved === "true";
    }
  });

  const profileForm = document.getElementById("profile-form");
  const savedProfile = localStorage.getItem("alertaeProfile");

  if (profileForm && savedProfile) {
    const profile = JSON.parse(savedProfile);

    Object.entries(profile).forEach(([field, value]) => {
      const input = profileForm.elements.namedItem(field);

      if (input) {
        input.value = value;
      }
    });
  }
}

loadSavedPreferences();







