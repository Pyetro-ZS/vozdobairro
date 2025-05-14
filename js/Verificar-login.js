document.addEventListener("DOMContentLoaded", () => {
  // Verificar status de login
  fetch("./php/verificar_login.php")
    .then((response) => response.json())
    .then((data) => {
      if (data.logado) {
        // Usuário está logado
        localStorage.setItem("userLoggedIn", "true")

        // Atualizar elementos da interface
        const loginStatus = document.getElementById("login-status")
        const userAvatar = document.getElementById("user-avatar")

        if (loginStatus) {
          loginStatus.style.display = "none"
        }

        if (userAvatar) {
          // Definir iniciais do usuário
          const initials = document.querySelector(".initials")
          if (initials && data.nome) {
            const nomes = data.nome.split(" ")
            if (nomes.length > 1) {
              initials.textContent = (nomes[0][0] + nomes[nomes.length - 1][0]).toUpperCase()
            } else {
              initials.textContent = nomes[0][0].toUpperCase()
            }
          }

          userAvatar.style.display = "flex"
        }
      } else {
        // Usuário não está logado
        localStorage.removeItem("userLoggedIn")

        // Atualizar elementos da interface
        const loginStatus = document.getElementById("login-status")
        const userAvatar = document.getElementById("user-avatar")

        if (loginStatus) {
          loginStatus.style.display = "block"
        }

        if (userAvatar) {
          userAvatar.style.display = "none"
        }
      }
    })
    .catch((error) => {
      console.error("Erro ao verificar login:", error)
    })
})
