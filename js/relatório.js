document.addEventListener("DOMContentLoaded", () => {
  // Elementos
  const formRelatorio = document.getElementById("report-form")
  const listaRelatorios = document.getElementById("recent-reports-list")
  const useCurrentLocationBtn = document.getElementById("use-current-location")
  const selectOnMapBtn = document.getElementById("select-on-map")
  const mapContainer = document.getElementById("map-container")
  const reportMapElement = document.getElementById("report-map")
  const confirmLocationBtn = document.getElementById("confirm-location")
  const locationStatus = document.getElementById("location-status")
  let reportMap, marker

  // Adicionar este código após a definição das variáveis no início do DOMContentLoaded
  const issueTypeSelect = document.getElementById("issue-type")
  const otherIssueContainer = document.getElementById("other-issue-container")

  // Declarar iniciarRelatoriosDemo para evitar o erro de "undeclared"
  const iniciarRelatoriosDemo =
    window.iniciarRelatoriosDemo ||
    (() => {
      console.warn("Função iniciarRelatoriosDemo não definida.")
    })

  // Inicializar relatórios demo
  if (typeof iniciarRelatoriosDemo === "function") {
    iniciarRelatoriosDemo()
  }

  // Carregar relatórios recentes
  if (listaRelatorios) {
    carregarRelatoriosRecentes()
  }

  // Exibir popup
  function showPopup(message) {
    const popup = document.getElementById("popup")
    const popupMessage = document.getElementById("popup-message")
    if (popup && popupMessage) {
      popupMessage.textContent = message
      popup.style.display = "block"
    } else {
      showToast(message, "info")
    }
  }

  // Fechar popup
  document.querySelector(".close-popup")?.addEventListener("click", () => {
    document.getElementById("popup").style.display = "none"
  })

  // Inicializar o mapa para seleção de localização
  function initMap() {
    if (!reportMapElement) return

    // Verificar se o mapa já foi inicializado
    if (!reportMap) {
      reportMap = L.map("report-map").setView([-23.55052, -46.633308], 13) // São Paulo como ponto inicial

      // Adicionar camada de mapa do OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(reportMap)

      // Adicionar evento de clique no mapa
      reportMap.on("click", (e) => {
        const { lat, lng } = e.latlng
        setMarker(lat, lng)
      })
    }

    // Garantir que o mapa seja renderizado corretamente após ser exibido
    setTimeout(() => {
      reportMap.invalidateSize()
    }, 300)
  }

  // Atualizar a função setMarker para usar os mesmos estilos de marcador que a página de relatórios

  function setMarker(lat, lng) {
    // Remover marcador existente se houver
    if (marker) {
      reportMap.removeLayer(marker)
    }

    // Criar ícone personalizado para o marcador
    const markerIcon = L.divIcon({
      className: "map-marker user-location-marker",
      html: `<div class="marker-inner"></div><div class="user-location-pulse"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    // Criar novo marcador
    marker = L.marker([lat, lng], {
      icon: markerIcon,
      draggable: true, // Permitir arrastar o marcador para ajustar a posição
    }).addTo(reportMap)

    // Adicionar evento para atualizar as coordenadas quando o marcador for arrastado
    marker.on("dragend", (e) => {
      const position = marker.getLatLng()
      document.getElementById("latitude").value = position.lat
      document.getElementById("longitude").value = position.lng
      locationStatus.textContent = `Localização selecionada: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
      locationStatus.classList.add("has-location")

      // Obter endereço aproximado usando Nominatim (OpenStreetMap)
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`,
      )
        .then((response) => response.json())
        .then((data) => {
          if (data && data.display_name) {
            marker
              .bindPopup(`
            <div class="map-popup">
              <div class="map-popup-title">Localização Selecionada</div>
              <div class="map-popup-description">${data.display_name}</div>
            </div>
          `)
              .openPopup()
          }
        })
        .catch((error) => console.error("Erro ao obter endereço:", error))
    })

    // Atualizar campos de formulário com as coordenadas
    document.getElementById("latitude").value = lat
    document.getElementById("longitude").value = lng
    locationStatus.textContent = `Localização selecionada: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    locationStatus.classList.add("has-location")

    // Centralizar o mapa na posição do marcador
    reportMap.setView([lat, lng], 16)

    // Obter endereço aproximado usando Nominatim (OpenStreetMap)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.display_name) {
          marker
            .bindPopup(`
          <div class="map-popup">
            <div class="map-popup-title">Localização Selecionada</div>
            <div class="map-popup-description">${data.display_name}</div>
          </div>
        `)
            .openPopup()
        }
      })
      .catch((error) => console.error("Erro ao obter endereço:", error))
  }

  // Obter localização atual do usuário
  function useCurrentLocation() {
    if (!navigator.geolocation) {
      showToast("Geolocalização não é suportada pelo seu navegador.", "error")
      return
    }

    // Mostrar toast de carregamento
    showToast("Obtendo sua localização...", "info")

    // Desabilitar o botão enquanto obtém a localização
    if (useCurrentLocationBtn) {
      useCurrentLocationBtn.disabled = true
      useCurrentLocationBtn.innerHTML = "Obtendo localização..."
    }

    // Exibir o mapa antes de obter a localização
    mapContainer.classList.remove("hidden")
    if (!reportMap) {
      initMap()
    } else {
      setTimeout(() => reportMap.invalidateSize(), 300)
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        // Definir marcador com a localização atual
        setMarker(latitude, longitude)

        // Mostrar mensagem de sucesso
        showToast("Localização atual definida com sucesso!", "success")

        // Restaurar o botão
        if (useCurrentLocationBtn) {
          useCurrentLocationBtn.disabled = false
          useCurrentLocationBtn.innerHTML = "Usar Minha Localização Atual"
        }
      },
      (error) => {
        console.error("Erro ao obter localização:", error)

        // Mensagens de erro mais específicas
        let errorMessage = "Erro ao obter localização. "
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Você negou a permissão de geolocalização."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Informações de localização indisponíveis."
            break
          case error.TIMEOUT:
            errorMessage += "Tempo esgotado ao obter sua localização."
            break
          default:
            errorMessage += "Erro desconhecido."
        }

        showToast(errorMessage, "error")

        // Restaurar o botão
        if (useCurrentLocationBtn) {
          useCurrentLocationBtn.disabled = false
          useCurrentLocationBtn.innerHTML = "Usar Minha Localização Atual"
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  // Enviar o formulário de relatório
  function submitReport(e) {
    e.preventDefault()

    const issueType = document.getElementById("issue-type").value
    const issueSeverity = document.getElementById("issue-severity").value

    if (!issueType || !issueSeverity) {
      showToast("Por favor, preencha todos os campos obrigatórios", "warning")
      return
    }

    // Verificar se a localização foi selecionada
    if (!document.getElementById("latitude").value || !document.getElementById("longitude").value) {
      showToast("Por favor, selecione uma localização antes de enviar o relatório", "warning")
      return
    }

    // Verificar se os campos obrigatórios estão preenchidos
    const issueDescription = document.getElementById("issue-description").value

    // Se o tipo for "other", verificar se o campo de especificação está preenchido
    if (issueType === "other") {
      const otherIssue = document.getElementById("other-issue").value
      if (!otherIssue) {
        showToast("Por favor, especifique o tipo de problema", "warning")
        return
      }
    }

    // Verificar se todos os campos obrigatórios estão preenchidos
    if (!issueType || !issueDescription || !issueSeverity) {
      showToast("Por favor, preencha todos os campos obrigatórios", "warning")
      return
    }

    // Criar FormData e adicionar os campos manualmente com os nomes corretos
    const formData = new FormData()

    // Adicionar os campos com os nomes exatos que o PHP espera
    formData.append("issue-type", issueType)
    formData.append("descricao", issueDescription) // Não codificar, enviar como texto puro
    formData.append("issue-severity", issueSeverity)
    formData.append("latitude", document.getElementById("latitude").value)
    formData.append("longitude", document.getElementById("longitude").value)

    // Se for "other", adicionar o campo de especificação
    if (issueType === "other") {
      formData.append("other-issue", document.getElementById("other-issue").value)
    }

    // Mostrar mensagem de carregamento
    showToast("Enviando relatório...", "info")

    fetch("./php/add_relatório.php", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        // Verificar se a resposta é válida
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("Resposta do servidor:", data) // Log para depuração

        if (data.status === "erro") {
          showToast(data.mensagem, "error")
        } else {
          showToast(data.mensagem, "success")

          // Limpar o formulário apenas em caso de sucesso
          formRelatorio.reset()
          locationStatus.textContent = "Nenhuma localização selecionada"
          locationStatus.classList.remove("has-location")
          if (marker) {
            reportMap.removeLayer(marker)
            marker = null
          }
          mapContainer.classList.add("hidden")
        }
      })
      .catch((error) => {
        console.error("Erro ao enviar relatório:", error)
        showToast("Erro ao enviar relatório. Tente novamente mais tarde.", "error")
      })
  }

  // Inicializar mapa ao clicar no botão "Selecionar no Mapa"
  selectOnMapBtn.addEventListener("click", () => {
    mapContainer.classList.remove("hidden")
    if (!reportMap) {
      initMap()
    } else {
      setTimeout(() => reportMap.invalidateSize(), 300)
    }
    showToast("Clique no mapa para selecionar uma localização", "info")
  })

  // Mostrar o mapa ao clicar em "Usar Minha Localização Atual"
  useCurrentLocationBtn.addEventListener("click", () => {
    mapContainer.classList.remove("hidden")
    if (!reportMap) {
      initMap()
    } else {
      setTimeout(() => reportMap.invalidateSize(), 300)
    }
    useCurrentLocation()
  })

  // Confirmar localização selecionada
  confirmLocationBtn.addEventListener("click", () => {
    if (!document.getElementById("latitude").value || !document.getElementById("longitude").value) {
      showToast("Por favor, selecione uma localização primeiro", "warning")
      return
    }

    mapContainer.classList.add("hidden")
    showToast("Localização confirmada!", "success")
  })

  // Submeter o formulário
  if (formRelatorio) {
    formRelatorio.addEventListener("submit", submitReport)
  }

  // Função para exibir Toastify
  function showToast(message, type = "info") {
    if (typeof Toastify !== "function") {
      console.error("Toastify não está disponível")
      alert(message)
      return
    }

    let backgroundColor
    switch (type) {
      case "success":
        backgroundColor = "#4caf50" // Verde
        break
      case "error":
        backgroundColor = "#f44336" // Vermelho
        break
      case "warning":
        backgroundColor = "#ff9800" // Laranja
        break
      default:
        backgroundColor = "#2196f3" // Azul
    }

    Toastify({
      text: message,
      duration: 5000,
      close: true,
      gravity: "top",
      position: "right",
      backgroundColor: backgroundColor,
      stopOnFocus: true,
      style: {
        borderRadius: "4px",
        fontFamily: "inherit",
      },
    }).showToast()
  }

  // Carregar relatórios recentes
  function carregarRelatoriosRecentes() {
    const relatorios = JSON.parse(localStorage.getItem("problemas") || "[]")

    if (relatorios.length === 0) {
      listaRelatorios.innerHTML = "<p>Nenhum relatório encontrado.</p>"
      return
    }

    // Ordenar e pegar os 3 primeiros
    const recentes = relatorios.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)).slice(0, 3)

    // Criar HTML
    let html = ""
    recentes.forEach((relatorio) => {
      html += `
        <div class="report-card">
          <div class="report-image" style="background-color: #eee;"></div>
          <div class="report-content">
            <span class="report-type">${relatorio.tipo || "Tipo não especificado"}</span>
            <span class="report-severity severity-${relatorio.severidade || "indefinida"}">${relatorio.severidade || "Gravidade não especificada"}</span>
            <p class="report-date">${new Date(relatorio.dataCriacao).toLocaleDateString()}</p>
            <p class="report-description">${relatorio.descricao.substring(0, 100)}...</p>
            <div class="report-actions">
              <a href="map.html" class="btn btn-secondary">Ver no Mapa</a>
            </div>
          </div>
        </div>
      `
    })

    listaRelatorios.innerHTML = html
  }

  // Mostrar/ocultar o campo "other-issue" quando o tipo for alterado
  if (issueTypeSelect) {
    issueTypeSelect.addEventListener("change", function () {
      if (this.value === "other") {
        otherIssueContainer.style.display = "block"
      } else {
        otherIssueContainer.style.display = "none"
      }
    })
  }

  // Certifique-se de que L está definido globalmente antes de usar Leaflet
  if (typeof L === "undefined") {
    console.error("Leaflet (L) is not loaded. Make sure you have included the Leaflet library.")
  }

  // Certifique-se de que Toastify está definido globalmente antes de usar Toastify
  if (typeof Toastify === "undefined") {
    console.error("Toastify is not loaded. Make sure you have included the Toastify library.")
  }
})

function carregarRelatorios() {
  fetch("./php/ob_relatórios.php")
    .then(response => response.json())
    .then(data => {
      const relatorios = data.relatorios;
      relatorios.forEach(relatorio => {
        // Traduzir tipo e gravidade
        const tipoTraduzido = traduzirTipo(relatorio.tipo);
        const gravidadeInfo = traduzirGravidade(relatorio.gravidade);

        // Criar o card do relatório
        const reportCard = document.createElement("div");
        reportCard.className = "report-card";
        reportCard.innerHTML = `
          <div class="report-header">
            <h3>${tipoTraduzido}</h3>
            <div class="report-meta">
              <span class="severity ${gravidadeInfo.classe}">${gravidadeInfo.texto}</span>
            </div>
          </div>
          <p class="report-description">${relatorio.descricao}</p>
          <div class="report-footer">
            <span class="report-date">${relatorio.data_criacao}</span>
            <a href="./relatórios.html?id=${relatorio.id}" class="btn-details">Ver detalhes</a>
          </div>
        `;
        // Adicionar o card ao contêiner de relatórios
        document.getElementById("all-reports-list").appendChild(reportCard);
      });
    });
}

