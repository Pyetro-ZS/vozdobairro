document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Obter os dados do formulário
      const formData = new FormData(loginForm);

      // Mostrar indicador de carregamento
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Entrando...";

      // Limpar mensagens anteriores
      const messageContainer = document.getElementById("login-message");
      if (messageContainer) {
        messageContainer.innerHTML = "";
        messageContainer.className = "";
      }

      // Enviar requisição
      fetch("./php/login.php", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          // Restaurar botão
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;

          if (data.status === "sucesso") {
            // Salvar estado de login no localStorage
            localStorage.setItem("userLoggedIn", "true");

            // Redirecionar para a página especificada
            window.location.href = data.redirect;
          } else {
            // Mostrar mensagem de erro
            if (messageContainer) {
              messageContainer.innerHTML = data.mensagem;
              messageContainer.className = "mensagem-erro";
            }
          }
        })
        .catch((error) => {
          console.error("Erro:", error);

          // Restaurar botão
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;

          // Mostrar mensagem de erro
          if (messageContainer) {
            messageContainer.innerHTML = "Erro ao processar o login. Tente novamente mais tarde.";
            messageContainer.className = "mensagem-erro";
          }
        });
    });
  }
});
