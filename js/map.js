document.addEventListener("DOMContentLoaded", () => {
    console.log("Página do mapa carregada")
  
    // Elementos da página
    const mapElement = document.getElementById("map")
    const mapLoading = document.getElementById("map-loading")
    const filterType = document.getElementById("filter-type")
    const filterSeverity = document.getElementById("filter-severity")
    const applyFiltersBtn = document.getElementById("apply-filters")
    const useMyLocationBtn = document.getElementById("use-my-location")
  
    // Verificar se Toastify está disponível
    const toastifyAvailable = typeof Toastify === "function"
  
    // Verificar se o elemento do mapa existe
    if (!mapElement) {
      console.error("Elemento do mapa não encontrado")
      return
    }
  
    // Variáveis globais
    let map
    let allMarkers = []
    let markersGroup
    let userLocationMarker
    let currentFilters = {
      tipo: "",
      gravidade: "",
    }
  
    // Inicializar o mapa
    initMap()
  
    // Event listeners
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", () => {
        currentFilters = {
          tipo: filterType ? filterType.value : "",
          gravidade: filterSeverity ? filterSeverity.value : "",
        }
        filterMarkers()
      })
    }
  
    if (useMyLocationBtn) {
      useMyLocationBtn.addEventListener("click", getUserLocation)
    }
  
    // Função para inicializar o mapa
    function initMap() {
      // Coordenadas iniciais (São Paulo)
      const initialCoords = [-23.55052, -46.633308]
  
      // Criar o mapa
      map = L.map("map").setView(initialCoords, 13)
  
      // Adicionar camada de mapa base (OpenStreetMap)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)
  
      // Criar grupo de marcadores
      markersGroup = L.featureGroup().addTo(map)
  
      // Carregar relatórios
      carregarRelatorios()
    }
  
    // Função para obter a localização do usuário
    function getUserLocation() {
      if (!navigator.geolocation) {
        showToast("Geolocalização não é suportada pelo seu navegador.", "error")
        return
      }
  
      // Mostrar indicador de carregamento
      if (useMyLocationBtn) {
        useMyLocationBtn.disabled = true
        useMyLocationBtn.innerHTML =
          '<img src="./img/location-icon.png" alt="Localização" class="location-icon"> Obtendo localização...'
      }
  
      showToast("Obtendo sua localização...", "info")
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Sucesso
          const latitude = position.coords.latitude
          const longitude = position.coords.longitude
  
          // Centralizar o mapa na localização do usuário
          map.setView([latitude, longitude], 16)
  
          // Adicionar marcador na localização do usuário
          addUserLocationMarker(latitude, longitude)
  
          showToast("Localização obtida com sucesso!", "success")
  
          // Restaurar botão
          if (useMyLocationBtn) {
            useMyLocationBtn.disabled = false
            useMyLocationBtn.innerHTML =
              '<img src="./img/location-icon.png" alt="Localização" class="location-icon"> Utilizar minha localização atual'
          }
        },
        (error) => {
          // Erro
          console.error("Erro ao obter localização:", error)
  
          let errorMessage = "Erro ao obter sua localização."
  
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Você negou a permissão para obter sua localização."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Informações de localização indisponíveis."
              break
            case error.TIMEOUT:
              errorMessage = "Tempo esgotado ao tentar obter sua localização."
              break
          }
  
          showToast(errorMessage, "error")
  
          // Restaurar botão
          if (useMyLocationBtn) {
            useMyLocationBtn.disabled = false
            useMyLocationBtn.innerHTML =
              '<img src="./img/location-icon.png" alt="Localização" class="location-icon"> Utilizar minha localização atual'
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    }
  
    // Função para adicionar marcador na localização do usuário
    function addUserLocationMarker(latitude, longitude) {
      // Remover marcador anterior se existir
      if (userLocationMarker) {
        map.removeLayer(userLocationMarker)
      }
  
      // Criar ícone personalizado para a localização do usuário
      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: `<div class="marker-inner"></div><div class="user-location-pulse"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })
  
      // Adicionar marcador
      userLocationMarker = L.marker([latitude, longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup("Sua localização atual")
        .openPopup()
    }
  
    // Função para carregar relatórios
    function carregarRelatorios() {
      console.log("Carregando relatórios para o mapa...")
  
      // Mostrar indicador de carregamento
      if (mapLoading) {
        mapLoading.style.display = "flex"
      }
  
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime()
  
      // Carregar os relatórios
      fetch(`./php/ob_relatórios.php?t=${timestamp}`)
        .then((response) => {
          console.log("Status da resposta:", response.status)
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`)
          }
          return response.json()
        })
        .then((data) => {
          console.log("Dados recebidos")
  
          // Esconder o indicador de carregamento
          if (mapLoading) {
            mapLoading.style.display = "none"
          }
  
          // Verificar se há relatórios
          if (!data.relatorios || data.relatorios.length === 0) {
            console.log("Nenhum relatório encontrado")
            showToast("Nenhum relatório encontrado no sistema.", "warning")
            return
          }
  
          // Adicionar marcadores ao mapa
          adicionarMarcadores(data.relatorios)
        })
        .catch((error) => {
          console.error("Erro ao carregar relatórios:", error)
  
          // Esconder o indicador de carregamento
          if (mapLoading) {
            mapLoading.style.display = "none"
          }
  
          showToast("Erro ao carregar relatórios. Tente novamente mais tarde.", "error")
        })
    }
  
    // Função para adicionar marcadores ao mapa
    function adicionarMarcadores(relatorios) {
      console.log("Adicionando marcadores ao mapa")
  
      // Limpar marcadores existentes
      markersGroup.clearLayers()
      allMarkers = []
  
      relatorios.forEach((relatorio) => {
        // Verificar se as coordenadas são válidas
        if (!relatorio.latitude || !relatorio.longitude) {
          console.warn("Relatório sem coordenadas válidas:", relatorio)
          return
        }
  
        // Traduzir tipo e gravidade
        const tipoTraduzido = traduzirTipo(relatorio.tipo)
        const gravidadeInfo = traduzirGravidade(relatorio.gravidade)
  
        // Criar ícone personalizado baseado no tipo de problema
        const icone = L.divIcon({
          className: `map-marker ${relatorio.tipo}`,
          html: `<div class="marker-inner"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
  
        // Criar marcador
        const marcador = L.marker([relatorio.latitude, relatorio.longitude], { icon: icone }).bindPopup(`
            <div class="map-popup">
              <div class="map-popup-title">${tipoTraduzido}</div>
              <div class="map-popup-description">${relatorio.descricao}</div>
              <div class="map-popup-meta">
                <span>Por: ${relatorio.nome_usuario}</span>
                <span class="map-popup-severity ${gravidadeInfo.classe}">${gravidadeInfo.texto}</span>
              </div>
              <a href="./relatórios.html" class="map-popup-link">Ver detalhes</a>
            </div>
          `)
  
        // Adicionar dados do relatório ao marcador para filtros
        marcador.relatorioData = {
          id: relatorio.id,
          tipo: relatorio.tipo,
          gravidade: relatorio.gravidade,
        }
  
        // Adicionar ao array de todos os marcadores
        allMarkers.push(marcador)
  
        // Adicionar ao grupo de marcadores
        markersGroup.addLayer(marcador)
      })
  
      // Ajustar o zoom para mostrar todos os marcadores
      if (markersGroup.getLayers().length > 0) {
        map.fitBounds(markersGroup.getBounds(), { padding: [50, 50] })
      }
    }
  
    // Função para filtrar marcadores
    function filterMarkers() {
      console.log("Filtrando marcadores:", currentFilters)
  
      // Limpar grupo de marcadores
      markersGroup.clearLayers()
  
      // Filtrar marcadores
      allMarkers.forEach((marker) => {
        const matchesTipo = !currentFilters.tipo || marker.relatorioData.tipo === currentFilters.tipo
        const matchesGravidade = !currentFilters.gravidade || marker.relatorioData.gravidade === currentFilters.gravidade
  
        if (matchesTipo && matchesGravidade) {
          markersGroup.addLayer(marker)
        }
      })
  
      // Ajustar o zoom para mostrar os marcadores filtrados
      if (markersGroup.getLayers().length > 0) {
        map.fitBounds(markersGroup.getBounds(), { padding: [50, 50] })
      } else {
        showToast("Nenhum relatório encontrado com os filtros selecionados.", "warning")
      }
    }
  
    // Funções auxiliares
    function traduzirTipo(tipo) {
      const tipos = {
        pothole: "Buraco",
        damaged_sidewalk: "Calçada Danificada",
        street_light: "Luz de Rua Apagada",
        graffiti: "Pichação",
        flooding: "Inundação",
      }
  
      return tipos[tipo] || "Outro"
    }
  
    function traduzirGravidade(gravidade) {
      switch (gravidade) {
        case "high":
          return { classe: "severity-high", texto: "Alta" }
        case "medium":
          return { classe: "severity-medium", texto: "Média" }
        default:
          return { classe: "severity-low", texto: "Baixa" }
      }
    }
  
    // Função para mostrar toast
    function showToast(message, type = "info") {
      // Verificar se Toastify está disponível
      if (!toastifyAvailable) {
        console.error("Toastify não está disponível")
        alert(message)
        return
      }
  
      // Definir cores baseadas no tipo
      let backgroundColor, textColor
  
      switch (type) {
        case "success":
          backgroundColor = "#4caf50" // Verde
          textColor = "#ffffff"
          break
        case "error":
          backgroundColor = "#f44336" // Vermelho
          textColor = "#ffffff"
          break
        case "warning":
          backgroundColor = "#ff9800" // Laranja
          textColor = "#ffffff"
          break
        default: // info
          backgroundColor = "#2196f3" // Azul
          textColor = "#ffffff"
      }
  
      // Criar toast
      Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top", // `top` ou `bottom`
        position: "right", // `left`, `center` ou `right`
        backgroundColor: backgroundColor,
        stopOnFocus: true, // Parar o tempo quando o usuário passar o mouse
        style: {
          color: textColor,
          borderRadius: "4px",
          fontFamily: "inherit",
        },
        onClick: () => {}, // Callback quando o toast é clicado
      }).showToast()
    }
  })
  
  