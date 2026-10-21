
/* ========================================
   MAPA E GEOLOCALIZAÇÃO AUTOMÁTICA
======================================== */

let mapInstance;
const occurrenceMarkers = new Map();
let userLocationMarker;
let sheetDragStart = null;
let sheetWasDragged = false;

/* ========================================
   PAINEL DE OCORRÊNCIAS
======================================== */

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
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; OpenStreetMap &copy; CARTO'
  },

  escuro: {
    name: "Escuro",
    url:
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; OpenStreetMap &copy; CARTO'
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
  if (!mapInstance || !mapStyles[style]) {
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
    maxZoom: 19
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
  localStorage.setItem(MAP_STYLE_KEY, style);

  // Atualiza os botões do seletor
  document
    .querySelectorAll("[data-map-style]")
    .forEach((button) => {
      const isSelected =
        button.dataset.mapStyle === style;

      button.setAttribute(
        "aria-pressed",
        String(isSelected)
      );

      button.style.background =
        isSelected ? "#dbeafe" : "#ffffff";

      button.style.color =
        isSelected ? "#1d4ed8" : "#334155";
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

    container.style.cssText = `
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 3px 14px #0002;
      padding: 6px;
      max-width: 185px;
      font-family: Arial, sans-serif;
    `;

    // Botão principal
    const toggle = document.createElement("button");

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

    toggle.style.cssText = `
      display: block;
      width: 100%;
      border: 0;
      background: #ffffff;
      color: #1e293b;
      padding: 9px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      text-align: left;
    `;

    // Painel das opções
    const options = document.createElement("div");

    options.hidden = true;

    options.style.cssText = `
      padding-top: 5px;
      display: none;
    `;

    // Cria os quatro botões
    Object.entries(mapStyles).forEach(
      ([key, value]) => {
        const button = document.createElement("button");

        button.type = "button";
        button.dataset.mapStyle = key;
        button.textContent = value.name;

        button.style.cssText = `
          display: block;
          width: 100%;
          border: 0;
          border-radius: 7px;
          padding: 9px 12px;
          text-align: left;
          cursor: pointer;
          margin-top: 3px;
          background: #ffffff;
          color: #334155;
        `;

        button.addEventListener("click", () => {
          changeMapStyle(key);

          options.hidden = true;
          options.style.display = "none";

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

      options.style.display =
        opening ? "block" : "none";

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

  if (!element || !window.L || mapInstance) {
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
  const savedStyle =
    localStorage.getItem(MAP_STYLE_KEY);

  const initialStyle =
    mapStyles[savedStyle] ? savedStyle : "claro";

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

      button.setAttribute(
        "aria-pressed",
        String(isSelected)
      );

      button.style.background =
        isSelected ? "#dbeafe" : "#ffffff";

      button.style.color =
        isSelected ? "#1d4ed8" : "#334155";
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
    ).addTo(mapInstance);

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

  // Inicia o GPS automaticamente
  centerOnUser();
}

/* ========================================
   GPS AUTOMÁTICO
======================================== */

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
      } else {
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
      maximumAge: 60000
    }
  );
}








