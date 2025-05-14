/**
 * Utilitário para exibir toasts consistentes em toda a aplicação
 * Este arquivo deve ser incluído após a biblioteca Toastify
 */

// Verificar se Toastify está disponível
const toastifyAvailable = typeof Toastify === "function"

if (!toastifyAvailable) {
  console.error("Toastify não está disponível. Certifique-se de incluir a biblioteca Toastify antes deste script.")
}

/**
 * Exibe uma notificação toast
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de toast: "success", "error", "warning" ou "info"
 */
function showToast(message, type = "info") {
  if (!toastifyAvailable) {
    console.error("Toastify não está disponível")
    alert(message)
    return
  }

  let backgroundColor, textColor
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

// Adicionar animação para a barra de progresso
if (!document.getElementById("toast-progress-animation")) {
  const style = document.createElement("style")
  style.id = "toast-progress-animation"
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
}

// Garantir que a função showToast esteja disponível globalmente
window.showToast = showToast

