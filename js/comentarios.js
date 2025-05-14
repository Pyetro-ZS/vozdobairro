document.addEventListener("DOMContentLoaded", () => {
  // Elementos
  const commentForm = document.getElementById("comment-form")
  const commentText = document.getElementById("comment-text")
  const commentsList = document.getElementById("comments-list")

  // Verificar se a função showToast está disponível
  if (typeof window.showToast !== "function") {
    console.error("A função showToast não está disponível. Definindo uma função alternativa.")
    // Definir uma função de fallback
    window.showToast = (message, type) => {
      console.log(`Toast (${type}): ${message}`)
      alert(message)
    }
  }

  // Event listeners
  if (commentForm) {
    commentForm.addEventListener("submit", handleCommentSubmit)
  }

  // Função para enviar comentário
  function handleCommentSubmit(e) {
    e.preventDefault()

    if (!commentText || !commentText.value.trim()) {
      window.showToast("Por favor, escreva um comentário antes de enviar.", "warning")
      return
    }

    // Verificar se o usuário está logado
    const userLoggedIn = localStorage.getItem("userLoggedIn") === "true"

    if (!userLoggedIn) {
      window.showToast("Você precisa estar logado para adicionar um comentário.", "error")

      // Salvar o comentário no localStorage para recuperar após login
      const reportId = document.getElementById("report-id").value
      if (reportId) {
        localStorage.setItem("pendingComment", commentText.value)
        localStorage.setItem("pendingCommentReportId", reportId)
      }

      // Redirecionar para a página de login
      setTimeout(() => {
        const currentUrl = encodeURIComponent(window.location.href)
        window.location.href = `./login.html?redirect=${currentUrl}`
      }, 2000)
      return
    }

    // Mostrar indicador de carregamento
    const submitBtn = commentForm.querySelector('button[type="submit"]')
    const originalBtnText = submitBtn.textContent
    submitBtn.disabled = true
    submitBtn.textContent = "Enviando..."

    // Obter dados do formulário
    const reportId = document.getElementById("report-id").value

    // Preparar dados para envio
    const formData = new FormData()
    formData.append("relatorio_id", reportId)
    formData.append("comentario", commentText.value)

    // Enviar comentário para o servidor
    fetch("./php/add_comentário.php", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro na resposta do servidor")
        }
        return response.json()
      })
      .then((data) => {
        // Restaurar botão
        submitBtn.disabled = false
        submitBtn.textContent = originalBtnText

        if (data.status === "sucesso") {
          // Limpar o campo de comentário
          commentText.value = ""

          // Adicionar o novo comentário à lista
          if (data.comentario) {
            adicionarNovoComentario(data.comentario)
          } else {
            // Se não receber o comentário de volta, recarregar todos
            carregarComentarios(reportId)
          }

          window.showToast("Comentário adicionado com sucesso!", "success")
        } else {
          window.showToast(data.mensagem || "Erro ao adicionar comentário.", "error")
        }
      })
      .catch((error) => {
        // Restaurar botão
        submitBtn.disabled = false
        submitBtn.textContent = originalBtnText

        console.error("Erro:", error)
        window.showToast("Erro ao enviar comentário. Tente novamente mais tarde.", "error")
      })
  }

  // Função para adicionar novo comentário à lista
  function adicionarNovoComentario(comentario) {
    // Verificar se a lista de comentários existe
    if (!commentsList) return

    // Verificar se há mensagem de "nenhum comentário"
    const noCommentsMsg = commentsList.querySelector(".no-comments")
    if (noCommentsMsg) {
      commentsList.innerHTML = ""
    }

    // Criar elemento do comentário
    const commentElement = document.createElement("div")
    commentElement.className = "comment"
    commentElement.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${comentario.nome_usuario}</span>
        <span class="comment-date">${comentario.data_criacao}</span>
      </div>
      <p class="comment-text">${comentario.comentario}</p>
    `

    // Adicionar classe para animação
    commentElement.classList.add("new-comment")

    // Adicionar no início da lista
    commentsList.insertBefore(commentElement, commentsList.firstChild)

    // Remover classe de animação após 3 segundos
    setTimeout(() => {
      commentElement.classList.remove("new-comment")
    }, 3000)
  }

  // Função para carregar comentários de um relatório
  window.carregarComentarios = function(reportId) {
    if (!commentsList) return

    commentsList.innerHTML = '<p class="loading-text">Carregando comentários...</p>'

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

          // Verificar se há um comentário pendente após login
          const pendingComment = localStorage.getItem("pendingComment")
          const pendingCommentReportId = localStorage.getItem("pendingCommentReportId")

          if (pendingComment && pendingCommentReportId === reportId) {
            // Preencher o campo de comentário com o texto pendente
            if (commentText) {
              commentText.value = pendingComment
              commentText.focus()
            }

            // Limpar os dados pendentes
            localStorage.removeItem("pendingComment")
            localStorage.removeItem("pendingCommentReportId")
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

  // Verificar se há um ID de relatório na URL para carregar comentários
  const urlParams = new URLSearchParams(window.location.search)
  const reportId = urlParams.get("id")

  if (reportId && commentsList) {
    carregarComentarios(reportId)
  }
})