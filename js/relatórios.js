document.addEventListener("DOMContentLoaded", () => {
  console.log("Página de relatórios carregada")

  // Elementos da página
  const allReportsList = document.getElementById("all-reports-list")
  const filterType = document.getElementById("filter-type")
  const filterSeverity = document.getElementById("filter-severity")
  const filterStatus = document.getElementById("filter-status")
  const btnApplyFilters = document.getElementById("btn-apply-filters")
  const prevPageBtn = document.getElementById("prev-page")
  const nextPageBtn = document.getElementById("next-page")
  const pageInfo = document.getElementById("page-info")
  const reportModal = document.getElementById("report-modal")
  const closeModal = document.querySelector(".close-modal")
  const commentForm = document.getElementById("comment-form")

  // Variáveis para o mapa no modal
  let modalMap = null
  let modalMarker = null

  // Estado da aplicação
  let currentPage = 1
  let totalPages = 1
  let currentFilters = {
    tipo: "",
    gravidade: "",
    status: "",
  }

  // Carregar relatórios
  carregarRelatorios()

  // Event listeners
  btnApplyFilters.addEventListener("click", () => {
    currentFilters = {
      tipo: filterType.value,
      gravidade: filterSeverity.value,
      status: filterStatus.value,
    }
    currentPage = 1
    carregarRelatorios()
  })

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--
      carregarRelatorios()
    }
  })

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++
      carregarRelatorios()
    }
  })

  closeModal.addEventListener("click", () => {
    reportModal.style.display = "none"
  })

  window.addEventListener("click", (event) => {
    if (event.target === reportModal) {
      reportModal.style.display = "none"
    }
  })

  commentForm.addEventListener("submit", (e) => {
    e.preventDefault()
    enviarComentario()
  })

  // Função para carregar relatórios
  function carregarRelatorios() {
    if (!allReportsList) {
      console.error("Elemento all-reports-list não encontrado")
      return
    }

    console.log("Carregando relatórios...")
    allReportsList.innerHTML = '<p class="loading-text">Carregando relatórios...</p>'

    // Construir URL com parâmetros
    const params = new URLSearchParams({
      pagina: currentPage,
      por_pagina: 9,
    })

    if (currentFilters.tipo) params.append("tipo", currentFilters.tipo)
    if (currentFilters.gravidade) params.append("gravidade", currentFilters.gravidade)
    if (currentFilters.status) params.append("status", currentFilters.status)

    // Adicionar timestamp para evitar cache
    const timestamp = new Date().getTime()
    params.append("t", timestamp)

    // Carregar os relatórios
    fetch(`./php/obt_relatórios.php?${params.toString()}`)
      .then((response) => {
        console.log("Status da resposta:", response.status)
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`)
        }
        return response.text()
      })
      .then((text) => {
        console.log("Resposta recebida")

        // Tentar converter para JSON
        try {
          const data = JSON.parse(text)
          processarRelatorios(data)
        } catch (e) {
          console.error("Erro ao processar JSON:", e)
          allReportsList.innerHTML = `
            <div class="no-reports">
              <p>Erro ao processar dados dos relatórios.</p>
              <p>Por favor, tente novamente mais tarde.</p>
            </div>
          `
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar relatórios:", error)
        allReportsList.innerHTML = `
          <div class="no-reports">
            <p>Erro ao carregar relatórios.</p>
            <p>Por favor, tente novamente mais tarde.</p>
          </div>
        `
      })
  }

  // Função para processar relatórios
  function processarRelatorios(data) {
    console.log("Processando relatórios")

    if (!data || !data.relatorios) {
      console.error("Dados inválidos:", data)
      allReportsList.innerHTML = `
        <div class="no-reports">
          <p>Formato de dados inválido.</p>
        </div>
      `
      return
    }

    const relatorios = data.relatorios
    const paginacao = data.paginacao || { pagina_atual: 1, total_paginas: 1 }

    // Atualizar estado da paginação
    currentPage = paginacao.pagina_atual
    totalPages = paginacao.total_paginas
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`
    prevPageBtn.disabled = currentPage <= 1
    nextPageBtn.disabled = currentPage >= totalPages

    if (relatorios.length === 0) {
      console.log("Nenhum relatório encontrado")
      allReportsList.innerHTML = `
        <div class="no-reports">
          <p>Nenhum relatório encontrado.</p>
          <p>Tente ajustar os filtros ou seja o primeiro a reportar um problema!</p>
        </div>
      `
      return
    }

    // Criar HTML para cada relatório
    let html = ""

    relatorios.forEach((relatorio) => {
      // Traduzir tipo e gravidade
      const tipoTraduzido = traduzirTipo(relatorio.tipo)
      const gravidadeInfo = traduzirGravidade(relatorio.gravidade)
      const statusInfo = traduzirStatus(relatorio.status)

      // Verificar se há coordenadas válidas
      const temLocalizacao =
        relatorio.latitude &&
        relatorio.longitude &&
        !isNaN(Number.parseFloat(relatorio.latitude)) &&
        !isNaN(Number.parseFloat(relatorio.longitude))

      // Criar card do relatório
      html += `
        <div class="report-card" data-id="${relatorio.id}" 
             ${temLocalizacao ? `data-lat="${relatorio.latitude}" data-lng="${relatorio.longitude}"` : ""}>
          <div class="report-header">
            <h3>${tipoTraduzido}</h3>
            <div class="report-meta">
              <span class="severity ${gravidadeInfo.classe}">${gravidadeInfo.texto}</span>
              <span class="status ${statusInfo.classe}">${statusInfo.texto}</span>
              <span class="report-date">${relatorio.data_criacao}</span>
            </div>
          </div>
          <p class="report-description">${limitarTexto(relatorio.descricao, 100)}</p>
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
            <span class="report-author">Por: ${relatorio.nome_usuario || "Usuário"}</span>
            <button class="btn-small btn-details" data-id="${relatorio.id}">Ver detalhes</button>
          </div>
        </div>
      `
    })

    allReportsList.innerHTML = html

    // Adicionar event listeners para os botões de detalhes
    document.querySelectorAll(".btn-details").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const reportId = e.target.getAttribute("data-id")
        abrirModalDetalhes(reportId)
      })
    })

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

        // Inicializar o mapa
        const map = L.map(mapId).setView([lat, lng], 15)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        // Adicionar marcador
        const markerIcon = L.divIcon({
          className: `map-marker ${relatorios.find((r) => r.id === mapId.split("-")[1])?.tipo || "default"}`,
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
      }
    }
  }

  // Função para abrir modal de detalhes
  function abrirModalDetalhes(reportId) {
    console.log("Abrindo modal para relatório ID:", reportId)

    // Limpar e mostrar o modal
    document.getElementById("modal-report-title").textContent = "Carregando..."
    document.getElementById("modal-report-description").textContent = "Carregando..."
    document.getElementById("modal-report-author").textContent = "Carregando..."
    document.getElementById("modal-report-date").textContent = "Carregando..."
    document.getElementById("modal-report-severity").textContent = "Carregando..."
    document.getElementById("modal-report-status").textContent = "Carregando..."
    document.getElementById("comments-list").innerHTML = '<p class="loading-text">Carregando comentários...</p>'
    document.getElementById("report-id").value = reportId

    reportModal.style.display = "block"

    // Buscar detalhes do relatório
    const relatorioCard = document.querySelector(`.report-card[data-id="${reportId}"]`)
    if (relatorioCard) {
      const titulo = relatorioCard.querySelector("h3").textContent
      const descricao = relatorioCard.querySelector(".report-description").textContent
      const autor = relatorioCard.querySelector(".report-author").textContent.replace("Por: ", "")
      const data = relatorioCard.querySelector(".report-date").textContent
      const gravidade = relatorioCard.querySelector(".severity").textContent
      const status = relatorioCard.querySelector(".status").textContent

      document.getElementById("modal-report-title").textContent = titulo
      document.getElementById("modal-report-description").textContent = descricao
      document.getElementById("modal-report-author").textContent = autor
      document.getElementById("modal-report-date").textContent = data
      document.getElementById("modal-report-severity").textContent = gravidade
      document.getElementById("modal-report-status").textContent = status

      // Verificar se há coordenadas válidas
      const temLocalizacao = relatorioCard.hasAttribute("data-lat") && relatorioCard.hasAttribute("data-lng")
      const lat = temLocalizacao ? Number.parseFloat(relatorioCard.getAttribute("data-lat")) : null
      const lng = temLocalizacao ? Number.parseFloat(relatorioCard.getAttribute("data-lng")) : null

      // Inicializar o mapa no modal
      if (temLocalizacao && !isNaN(lat) && !isNaN(lng)) {
        inicializarMapaModal(lat, lng, relatorioCard.getAttribute("data-id"))
      } else {
        document.querySelector(".report-location-container").style.display = "none"
      }
    }

    // Carregar comentários
    carregarComentarios(reportId)
  }

  // Função para inicializar o mapa no modal
  function inicializarMapaModal(lat, lng, reportId) {
    const modalMapContainer = document.getElementById("modal-map")
    document.querySelector(".report-location-container").style.display = "block"

    // Limpar mapa anterior se existir
    if (modalMap) {
      modalMap.remove()
      modalMap = null
    }

    // Inicializar novo mapa
    modalMap = L.map("modal-map").setView([lat, lng], 15)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(modalMap)

    // Adicionar marcador
    const markerIcon = L.divIcon({
      className: "map-marker user-location-marker",
      html: `<div class="marker-inner"></div><div class="user-location-pulse"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    modalMarker = L.marker([lat, lng], { icon: markerIcon }).addTo(modalMap)

    // Obter endereço aproximado usando Nominatim (OpenStreetMap)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.display_name) {
          modalMarker
            .bindPopup(`
              <div class="map-popup">
                <div class="map-popup-title">Localização do Problema</div>
                <div class="map-popup-description">${data.display_name}</div>
              </div>
            `)
            .openPopup()
        }
      })
      .catch((error) => console.error("Erro ao obter endereço:", error))

    // Atualizar o tamanho do mapa após a renderização
    setTimeout(() => {
      modalMap.invalidateSize()
    }, 100)
  }

  // Função para carregar comentários
  function carregarComentarios(reportId) {
    const commentsList = document.getElementById("comments-list")

    fetch(`./php/ob_comentários.php?relatorio_id=${reportId}&t=${new Date().getTime()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        if (data.status === "sucesso") {
          if (data.comentarios.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>'
          } else {
            let html = ""
            data.comentarios.forEach((comentario) => {
              html += `
                <div class="comment">
                  <div class="comment-header">
                    <span class="comment-author">${comentario.nome_usuario}</span>
                    <span class="comment-date">${comentario.data_criacao}</span>
                  </div>
                  <p class="comment-text">${comentario.comentario}</p>
                </div>
              `
            })
            commentsList.innerHTML = html
          }
        } else {
          commentsList.innerHTML = `<p class="no-comments">Erro ao carregar comentários: ${data.mensagem}</p>`
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar comentários:", error)
        commentsList.innerHTML = '<p class="no-comments">Erro ao carregar comentários. Tente novamente mais tarde.</p>'
      })
  }

  // Função para enviar comentário
  function enviarComentario() {
    const reportId = document.getElementById("report-id").value
    const commentText = document.getElementById("comment-text").value
    const submitButton = commentForm.querySelector("button[type='submit']")

    if (!reportId || !commentText.trim()) {
      showToast("Por favor, escreva um comentário antes de enviar.", "warning")
      return
    }

    // Desabilitar o botão durante o envio
    submitButton.disabled = true
    submitButton.textContent = "Enviando..."

    // Verificar se o usuário está logado
    fetch("./php/verificar_login.php")
      .then((response) => response.json())
      .then((data) => {
        if (!data.logado) {
          showToast("Você precisa estar logado para adicionar um comentário.", "warning")
          setTimeout(() => {
            window.location.href = "login.html"
          }, 2000)
          return Promise.reject("Usuário não logado")
        }

        // Enviar o comentário
        const formData = new FormData()
        formData.append("relatorio_id", reportId)
        formData.append("comentario", commentText)

        return fetch(".php/add_comentário.php", {
          method: "POST",
          body: formData,
        })
      })
      .then((response) => {
        if (!response || !response.ok) {
          throw new Error("Erro ao enviar comentário")
        }
        return response.json()
      })
      .then((data) => {
        if (data.status === "sucesso") {
          // Limpar o formulário
          document.getElementById("comment-text").value = ""
          showToast("Comentário enviado com sucesso!", "success")

          // Recarregar comentários
          carregarComentarios(reportId)
        } else {
          showToast(`Erro: ${data.mensagem}`, "error")
        }
      })
      .catch((error) => {
        if (error !== "Usuário não logado") {
          console.error("Erro ao enviar comentário:", error)
          showToast("Erro ao enviar comentário. Tente novamente mais tarde.", "error")
        }
      })
      .finally(() => {
        // Reativar o botão
        submitButton.disabled = false
        submitButton.textContent = "Enviar Comentário"
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
    }

    return tipos[tipo] || tipo
  }

  // Corrigir a função traduzirTipo para garantir que ela traduza corretamente todos os tipos
  function traduzirTipo(tipo) {
    const tipos = {
      pothole: "Buraco",
      damaged_sidewalk: "Calçada Danificada",
      street_light: "Luz de Rua Apagada",
      graffiti: "Pichação",
      flooding: "Inundação",
      other: "Outro",
    }

    // Se o tipo estiver no nosso dicionário, retornar a tradução
    if (tipos[tipo]) {
      return tipos[tipo]
    }

    // Se não estiver no dicionário, pode ser um valor personalizado (quando o usuário escolheu "Outro")
    // Nesse caso, retornamos o próprio valor, pois já deve estar em formato legível
    return tipo
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
      case "pendente":
        return { classe: "status-pendente", texto: "Pendente" }
      case "em_analise":
        return { classe: "status-em_analise", texto: "Em Análise" }
      case "resolvido":
        return { classe: "status-resolvido", texto: "Resolvido" }
      default:
        return { classe: "status-pendente", texto: "Pendente" }
    }
  }

  function limitarTexto(texto, limite) {
    if (!texto) return ""
    return texto.length > limite ? texto.substring(0, limite) + "..." : texto
  }

  // Função para exibir Toastify com barra de progresso
  function showToast(message, type = "info") {
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

    const toast = Toastify({
      text: message,
      duration: 5000,
      close: true,
      gravity: "top", // `top` ou `bottom`
      position: "right", // `left`, `center` ou `right`
      backgroundColor: backgroundColor,
      stopOnFocus: true, // Parar o tempo quando o usuário passar o mouse
      style: {
        color: textColor,
        borderRadius: "4px",
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
      },
      onClick: () => {}, // Callback quando o toast é clicado
    })

    toast.showToast()

    // Adicionar barra de progresso
    const toastElement = document.querySelector(".toastify")
    if (toastElement) {
      const progressBar = document.createElement("div")
      progressBar.style.position = "absolute"
      progressBar.style.bottom = "0"
      progressBar.style.left = "0"
      progressBar.style.height = "4px"
      progressBar.style.width = "100%"
      progressBar.style.backgroundColor = "#ffffff"
      progressBar.style.animation = "progressBar 5s linear forwards"
      toastElement.appendChild(progressBar)
    }
  }

  // Adicionar animação para a barra de progresso
  const style = document.createElement("style")
  style.textContent = `
    @keyframes progressBar {
      from {
        width: 100%;
      }
      to {
        width: 0;
      }
    }
  `
  document.head.appendChild(style)
})

// Import Leaflet
var L = require("leaflet")

// Import Toastify
var Toastify = require("toastify-js")
