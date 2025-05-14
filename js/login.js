document.addEventListener("DOMContentLoaded", () => {
  // Verificar se estamos na página de login
  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const email = document.getElementById("email").value
      const password = document.getElementById("password").value

      // Criar objeto FormData
      const formData = new FormData()
      formData.append("email", email)    
      formData.append("password", password)

      // Enviar requisição AJAX
      fetch("./php/login.php", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          const mensagemElement = document.getElementById("mensagem")
          mensagemElement.style.display = "block"

          if (data.status === "sucesso") {
            mensagemElement.className = "mensagem-sucesso"
            mensagemElement.textContent = data.mensagem

            // Redirecionar após login bem-sucedido
            setTimeout(() => {
              window.location.href = "index.html"
            }, 1500)
          } else {
            mensagemElement.className = "mensagem-erro"
            mensagemElement.textContent = data.mensagem || "Erro desconhecido."
          }
        })
        .catch((error) => {
          console.error("Erro ao processar a requisição:", error);

          const mensagemElement = document.getElementById("mensagem");
          mensagemElement.style.display = "block";
          mensagemElement.className = "mensagem-erro";

          if (error instanceof SyntaxError) {
            mensagemElement.textContent = "Erro ao interpretar a resposta do servidor. Verifique se o servidor está retornando JSON válido.";
          } else if (error.message.includes("Failed to fetch")) {
            mensagemElement.textContent = "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
          } else {
            mensagemElement.textContent = "Erro ao processar a requisição. Tente novamente mais tarde.";
          }
        });
    })
  }

  // Verificar se estamos na página de cadastro
  const registerForm = document.getElementById("register-form")
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const name = document.getElementById("name").value
      const email = document.getElementById("email").value
      const password = document.getElementById("password").value
      const confirmPassword = document.getElementById("confirm-password").value

      // Verificar se as senhas coincidem
      if (password !== confirmPassword) {
        const mensagemElement = document.getElementById("mensagem")
        mensagemElement.style.display = "block"
        mensagemElement.className = "mensagem-erro"
        mensagemElement.textContent = "As senhas não coincidem."
        return
      }

      // Criar objeto FormData
      const formData = new FormData()
      formData.append("name", name)
      formData.append("email", email)
      formData.append("password", password)

      // Enviar requisição AJAX
      fetch("./php/cadastro.php", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          const mensagemElement = document.getElementById("mensagem")
          mensagemElement.style.display = "block"

          if (data.status === "sucesso") {
            mensagemElement.className = data.classe
            mensagemElement.textContent = data.mensagem

            // Redirecionar após cadastro bem-sucedido
            setTimeout(() => {
              window.location.href = "index.html"
            }, 1500)
          } else {
            mensagemElement.className = data.classe
            mensagemElement.textContent = data.mensagem
          }
        })
        .catch((error) => {
          console.error("Erro:", error)
          const mensagemElement = document.getElementById("mensagem")
          mensagemElement.style.display = "block"
          mensagemElement.className = "mensagem-erro"
          mensagemElement.textContent = "Erro ao processar a requisição."
        })
    })
  }

  // Verificar status de login e atualizar a interface
  function verificarLogin() {
    fetch("./php/verificar_login.php")
      .then((response) => response.json())
      .then((data) => {
        const loginStatus = document.getElementById("login-status")
        const userAvatar = document.getElementById("user-avatar")

        if (data.logado) {
          // Usuário está logado
          if (loginStatus) {
            loginStatus.style.display = "none"
          }

          if (userAvatar) {
            userAvatar.style.display = "flex"

            // Atualizar iniciais do avatar
            const initialsElement = userAvatar.querySelector(".initials")
            if (initialsElement && data.nome) {
              const initials = data.nome.charAt(0).toUpperCase()
              initialsElement.textContent = initials
            }
          }

          // Verificar se estamos na página de perfil e atualizar informações
          const profileName = document.getElementById("profile-name")
          const profileEmail = document.getElementById("profile-email")
          const profileInitials = document.getElementById("profile-initials")

          if (profileName && profileEmail && profileInitials) {
            // Aqui você pode fazer uma requisição adicional para obter mais detalhes do perfil
            // Por enquanto, vamos apenas exibir o nome
            profileName.textContent = data.nome

            // Atualizar iniciais
            const initials = data.nome.charAt(0).toUpperCase()
            profileInitials.textContent = initials
          }
        } else {
          // Usuário não está logado
          if (loginStatus) {
            loginStatus.style.display = "block"
            loginStatus.textContent = "Login"
          }

          if (userAvatar) {
            userAvatar.style.display = "none"
          }

          // Redirecionar para login se estiver em uma página protegida
          const currentPage = window.location.pathname.split("/").pop()
          if (currentPage === "perfil.html") {
            window.location.href = "login.html"
          }
        }
      })
      .catch((error) => {
        console.error("Erro ao verificar login:", error)
      })
  }

  // Verificar login ao carregar a página
  verificarLogin()

  // Configurar o botão de logout
  const logoutLink = document.getElementById("logout-link")
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault()

      fetch("./php/logout.php")
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "sucesso") {
            // Redirecionar para a página inicial após logout
            window.location.href = "index.html"
          }
        })
        .catch((error) => {
          console.error("Erro ao fazer logout:", error)
        })
    })
  }

  // Função para exibir Toastify com barra de progresso
  function showToast(message, type = "info") {
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
    });

    toast.showToast();

    // Adicionar barra de progresso
    const toastElement = document.querySelector(".toastify");
    if (toastElement) {
      const progressBar = document.createElement("div");
      progressBar.style.position = "absolute";
      progressBar.style.bottom = "0";
      progressBar.style.left = "0";
      progressBar.style.height = "4px";
      progressBar.style.width = "100%";
      progressBar.style.backgroundColor = "#ffffff";
      progressBar.style.animation = "progressBar 5s linear forwards";
      toastElement.appendChild(progressBar);
    }
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

