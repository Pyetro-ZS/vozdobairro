document.addEventListener("DOMContentLoaded", () => {
  // Menu móvel
  const menuHamburguer = document.querySelector(".hamburger")
  const linksNav = document.querySelector(".nav-links")
  const toastifyAvailable = typeof Toastify === "function"

  if (menuHamburguer) {
    menuHamburguer.addEventListener("click", () => {
      linksNav.classList.toggle("active")
    })
  }

  // Verificar se o usuário está logado
  fetch('./php/verificar_login.php')
    .then(response => response.json())
    .then(data => {
      if (!data.logado) {
        showToast(data.mensagem, "error");
      }   
    });

  // Campo "outro" no formulário
  const tipoProblema = document.getElementById("issue-type")
  const outroProblema = document.getElementById("other-issue-container")

  if (tipoProblema && outroProblema) {
    tipoProblema.addEventListener("change", function () {
      outroProblema.style.display = this.value === "other" ? "block" : "none"
    })
  }

  // Cadastro
  const formCadastro = document.getElementById("register-form");
  if (formCadastro) {
    formCadastro.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(formCadastro);
      fetch('./php/cadastro.php', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        showToast(data.mensagem, data.status === 'sucesso' ? 'success' : 'error');
        if (data.status === 'sucesso') {
          window.location.href = 'index.html';
        }
      });
    });
  }

  

  // Função para exibir Toastify
  function showToast(message, type = "info") {
    if (!toastifyAvailable) {
      console.error("Toastify não está disponível");
      alert(message);
      return;
    }

    let backgroundColor, textColor;
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
    }).showToast();
  }

  // Adicionar animação para a barra de progresso
  const style = document.createElement("style");
  style.textContent = `
    @keyframes progressBar {
      from {
        width: 100%;
      }
      to {
        width: 0;
      }
    }
  `;
  document.head.appendChild(style);
})

function formatarData(dataString) {
  const data = new Date(dataString)
  return data.toLocaleDateString("pt-BR")
}