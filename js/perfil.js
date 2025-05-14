document.addEventListener("DOMContentLoaded", () => {
  console.log("Página de perfil carregada")

  // Verificar se o usuário está logado
  fetch("./php/verificar_login.php")
    .then((response) => {
      console.log("Resposta de verificar_login.php recebida")
      return response.json()
    })
    .then((data) => {
      console.log("Dados de verificar_login.php:", data)

      if (!data.logado) {
        console.log("Usuário não está logado, redirecionando para login.html")
        window.location.href = "login.html"
        return
      }

      // Carregar dados do perfil
      carregarPerfil()
    })
    .catch((error) => {
      console.error("Erro ao verificar login:", error)
      showToast("Erro ao carregar informações do perfil", "error")
    })

  // Função para carregar os dados do perfil
  function carregarPerfil() {
    console.log("Iniciando carregamento do perfil")

    fetch("./php/perfil.php")
      .then((response) => {
        console.log("Resposta de perfil.php recebida")
        return response.json()
      })
      .then((data) => {
        console.log("Dados de perfil.php:", data)

        if (data.status === "sucesso") {
          const usuario = data.usuario
          console.log("Dados do usuário:", usuario)

          // Atualizar informações básicas
          const profileName = document.getElementById("profile-name")
          const profileEmail = document.getElementById("profile-email")
          const infoName = document.getElementById("info-name")
          const infoEmail = document.getElementById("info-email")
          const infoDate = document.getElementById("info-date")
          const profileInitials = document.getElementById("profile-initials")

          // Verificar se os elementos existem antes de atualizar
          if (profileName) profileName.textContent = usuario.nome
          if (profileEmail) profileEmail.textContent = usuario.email
          if (infoName) infoName.textContent = usuario.nome
          if (infoEmail) infoEmail.textContent = usuario.email
          if (infoDate) infoDate.textContent = usuario.data_cadastro
          if (profileInitials) {
            const initials = usuario.nome.charAt(0).toUpperCase()
            profileInitials.textContent = initials
          }

          // Atualizar lista de relatórios
          const userReports = document.getElementById("user-reports")

          if (userReports) {
            if (usuario.relatorios && usuario.relatorios.length > 0) {
              // Limpar conteúdo atual
              userReports.innerHTML = ""

              // Adicionar cada relatório com a estrutura consistente
              usuario.relatorios.forEach((relatorio, index) => {
                // Traduzir tipo de problema
                const tipoTraduzido = traduzirTipo(relatorio.tipo)
                const gravidadeInfo = traduzirGravidade(relatorio.gravidade)
                const statusInfo = traduzirStatus(relatorio.status)

                // Verificar se há coordenadas válidas
                const temLocalizacao =
                  relatorio.latitude &&
                  relatorio.longitude &&
                  !isNaN(Number.parseFloat(relatorio.latitude)) &&
                  !isNaN(Number.parseFloat(relatorio.longitude))

                const reportCard = document.createElement("div")
                reportCard.className = "report-card"
                reportCard.setAttribute("data-id", relatorio.id)
                reportCard.style.display = index < 2 ? "block" : "none"

                reportCard.innerHTML = `
                  <div class="report-header">
                    <h3>${tipoTraduzido}</h3>
                    <div class="report-meta">
                      <span class="severity ${gravidadeInfo.classe}">${gravidadeInfo.texto}</span>
                      <span class="status ${statusInfo.classe}">${statusInfo.texto}</span>
                    </div>
                  </div>
                  <p class="report-description">${relatorio.descricao}</p>
                  ${
                    temLocalizacao
                      ? `
                    <div class="location-toggle" onclick="toggleMap('map-${relatorio.id}')">
                      <i class="fas fa-map-marker-alt"></i> Mostrar localização
                    </div>
                    <div id="map-${relatorio.id}" class="report-location-map" style="display: none;" 
                        data-lat="${relatorio.latitude}" data-lng="${relatorio.longitude}"></div>
                  `
                      : ""
                  }
                  <div class="report-footer">
                    <span class="report-date">${relatorio.data_criacao}</span>
                    <a href="./relatórios.html?id=${relatorio.id}" class="btn-details">Ver detalhes</a>
                  </div>
                `

                userReports.appendChild(reportCard)
              })

              // Configurar botão "Ver mais/menos"
              const toggleReportsButton = document.getElementById("toggle-reports")
              if (toggleReportsButton && usuario.relatorios.length > 2) {
                toggleReportsButton.style.display = "block"
                toggleReportsButton.textContent = "Ver mais"
                toggleReportsButton.addEventListener("click", () => {
                  const isCollapsed = toggleReportsButton.textContent === "Ver mais"
                  document.querySelectorAll(".report-card").forEach((card, index) => {
                    card.style.display = isCollapsed || index < 2 ? "block" : "none"
                  })
                  toggleReportsButton.textContent = isCollapsed ? "Ver menos" : "Ver mais"
                })
              }

              // Adicionar função para alternar a exibição do mapa
              window.toggleMap = (mapId) => {
                const mapDiv = document.getElementById(mapId)
                if (!mapDiv) return

                const isVisible = mapDiv.style.display !== "none"

                // Se estiver visível, esconder
                if (isVisible) {
                  mapDiv.style.display = "none"
                  mapDiv.previousElementSibling.innerHTML = '<i class="fas fa-map-marker-alt"></i> Mostrar localização'
                  return
                }

                // Se estiver escondido, mostrar e inicializar o mapa
                mapDiv.style.display = "block"
                mapDiv.previousElementSibling.innerHTML = '<i class="fas fa-map-marker-alt"></i> Ocultar localização'

                // Verificar se o mapa já foi inicializado
                if (!mapDiv.hasAttribute("data-initialized")) {
                  const lat = Number.parseFloat(mapDiv.getAttribute("data-lat"))
                  const lng = Number.parseFloat(mapDiv.getAttribute("data-lng"))

                  if (isNaN(lat) || isNaN(lng)) return

                  // Verificar se a biblioteca Leaflet está disponível
                  if (typeof L !== 'undefined') {
                    // Inicializar o mapa
                    const map = L.map(mapId).setView([lat, lng], 15)

                    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                      attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                      maxZoom: 19,
                    }).addTo(map)

                    // Adicionar marcador
                    const markerIcon = L.divIcon({
                      className: `map-marker ${usuario.relatorios.find((r) => r.id === mapId.split("-")[1])?.tipo || "default"}`,
                      html: `<div class="marker-inner"></div>`,
                      iconSize: [20, 20],
                      iconAnchor: [10, 10],
                    })

                    L.marker([lat, lng], { icon: markerIcon }).addTo(map)

                    // Marcar como inicializado
                    mapDiv.setAttribute("data-initialized", "true")

                    // Atualizar o tamanho do mapa após a renderização
                    setTimeout(() => {
                      map.invalidateSize()
                    }, 100)
                  } else {
                    // Leaflet não está disponível
                    mapDiv.innerHTML = '<div style="padding: 10px; text-align: center;">Mapa não disponível. Biblioteca Leaflet não carregada.</div>'
                  }
                }
              }
            } else {
              userReports.innerHTML = '<p class="no-reports">Você ainda não reportou nenhum problema.</p>'
            }
          }
        } else {
          console.error("Erro ao carregar perfil:", data.mensagem)
          showToast(data.mensagem, "error")
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar perfil:", error)
        showToast("Erro ao carregar dados do perfil", "error")
      })
  }

  // Funções auxiliares
  function traduzirTipo(tipo) {
    const tipos = {
      pothole: "Buraco",
      damaged_sidewalk: "Calçada Danificada",
      street_light: "Luz de Rua Apagada",
      graffiti: "Pichação",
      flooding: "Inundação",
      other: "Outro",
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

  function traduzirStatus(status) {
    switch (status) {
      case "resolvido":
        return { classe: "status-resolvido", texto: "Resolvido" }
      case "em_analise":
        return { classe: "status-em_analise", texto: "Em análise" }
      default:
        return { classe: "status-pendente", texto: "Pendente" }
    }
  }

  // Função para exibir Toastify com estilos personalizados
  function showToast(message, type = "info") {
    let backgroundColor, textColor, icon

    switch (type) {
      case "success":
        backgroundColor = "#4caf50" // Verde
        textColor = "#ffffff"
        icon = "✔️"
        break
      case "error":
        backgroundColor = "#f44336" // Vermelho
        textColor = "#ffffff"
        icon = "❌"
        break
      case "warning":
        backgroundColor = "#ff9800" // Laranja
        textColor = "#ffffff"
        icon = "⚠️"
        break
      default: // info
        backgroundColor = "#2196f3" // Azul
        textColor = "#ffffff"
        icon = "ℹ️"
    }

    // Verificar se Toastify está disponível
    if (typeof Toastify !== 'undefined') {
      Toastify({
        text: `${icon} ${message}`,
        duration: 4000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        backgroundColor: backgroundColor,
        stopOnFocus: true, // Prevents dismissing on hover
        style: {
          color: textColor,
          borderRadius: "8px",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          padding: "10px 20px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
      }).showToast()
    } else {
      // Fallback se Toastify não estiver disponível
      console.log(`${type.toUpperCase()}: ${message}`)
      alert(message)
    }
  }
})