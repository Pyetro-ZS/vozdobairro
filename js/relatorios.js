function carregarRelatorios() {
  fetch('/api/relatorios')
    .then((response) => response.json())
    .then((data) => {
      const reportsList = document.getElementById('reportsList');
      if (data && data.length > 0) {
        let html = '';
        data.forEach((report) => {
          html += `
            <div class="report-card">
              <h3>${report.titulo || 'Título não disponível'}</h3>
              <p>Localização: ${report.localizacao || 'Não disponível'}</p>
              <p>${report.descricao || 'Descrição não disponível'}</p>
            </div>
          `;
        });
        reportsList.innerHTML = html;
      } else {
        reportsList.innerHTML = `
          <div class="no-reports">
            Nenhum relatório encontrado.
          </div>
        `;
      }
    })
    .catch((error) => {
      console.error("Erro ao carregar relatórios:", error);
      const reportsList = document.getElementById('reportsList');
      reportsList.innerHTML = `
        <div class="error-message">
          Erro ao carregar relatórios. Tente novamente mais tarde.
        </div>
      `;
    });
}

carregarRelatorios();
