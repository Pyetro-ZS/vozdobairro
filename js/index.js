document.addEventListener("DOMContentLoaded", () => {
  console.log("Página inicial carregada")

  // Carregar relatórios recentes
  carregarRelatoriosRecentes()

  function carregarRelatoriosRecentes() {
    const recentReportsList = document.getElementById("recent-reports-list")
    if (!recentReportsList) {
      console.error("Elemento recent-reports-list não encontrado")
      return
    }

    console.log("Carregando relatórios recentes...")
    recentReportsList.innerHTML = '<p class="loading-text">Carregando relatórios recentes...</p>'

    // Adicionar timestamp para evitar cache
    const timestamp = new Date().getTime()

    // Carregar os relatórios
    fetch(`./php/obr_relatórios.php?t=${timestamp}`)
      .then((response) => {
        console.log("Status da resposta:", response.status)
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("Resposta recebida:", data)

        if (data.status === "sucesso" && Array.isArray(data.relatorios)) {
          exibirRelatoriosRecentes(data.relatorios, recentReportsList)
        } else {
          throw new Error("Formato de dados inválido")
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar relatórios:", error)
        recentReportsList.innerHTML = `
          <div class="no-reports">
            <p>Erro ao carregar relatórios.</p>
            <p>Por favor, tente novamente mais tarde.</p>
          </div>
        `
      })
  }

  function exibirRelatoriosRecentes(relatorios, container) {
    console.log("Exibindo relatórios:", relatorios);

    if (relatorios.length === 0) {
      console.log("Nenhum relatório encontrado");
      container.innerHTML = `
        <div class="no-reports">
          <p>Nenhum relatório encontrado.</p>
          <p>Seja o primeiro a reportar um problema!</p>
        </div>
      `;
      return;
    }

    let html = "";

    relatorios.forEach((relatorio) => {
      const tipoTraduzido = traduzirTipo(relatorio.tipo);
      const gravidadeInfo = traduzirGravidade(relatorio.gravidade);

      html += `
        <div class="report-card">
          <div class="report-header">
            <h3>${tipoTraduzido}</h3>
            <div class="report-meta">
              <span class="severity ${gravidadeInfo.classe}">${gravidadeInfo.texto}</span>
            </div>
          </div>
          <p class="report-description">${limitarTexto(relatorio.descricao, 100)}</p>
          <div class="report-footer">
            <span class="report-date">${relatorio.data_criacao}</span>
            <a href="./relatórios.html?id=${relatorio.id}" class="btn-details">Ver detalhes</a>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
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

  function limitarTexto(texto, limite) {
    if (!texto) return ""
    return texto.length > limite ? texto.substring(0, limite) + "..." : texto
  }
})