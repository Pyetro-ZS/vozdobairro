// Função para inicializar o sistema de tema
function initThemeSystem() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const themeToggleButton = document.getElementById("theme-toggle");
  const sunIcon = document.querySelector(".theme-toggle-with-images .sun-icon");
  const moonIcon = document.querySelector(".theme-toggle-with-images .moon-icon");

  // Aplicar tema baseado na preferência salva ou na preferência do sistema
  if (savedTheme === "dark" || (!savedTheme && prefersDarkScheme.matches)) {
    document.documentElement.classList.add("dark-theme");
    updateThemeIcons(true, sunIcon, moonIcon);
  } else {
    document.documentElement.classList.remove("dark-theme");
    updateThemeIcons(false, sunIcon, moonIcon);
  }

  // Adicionar event listener para o botão de tema
  themeToggleButton.addEventListener("click", () => {
    const isDarkTheme = document.documentElement.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    updateThemeIcons(isDarkTheme, sunIcon, moonIcon);
  });
}

// Função para atualizar os ícones de tema
function updateThemeIcons(isDarkTheme, sunIcon, moonIcon) {
  if (isDarkTheme) {
    sunIcon.style.opacity = "1";
    sunIcon.style.transform = "scale(1) rotate(0)";
    moonIcon.style.opacity = "0";
    moonIcon.style.transform = "scale(0.5) rotate(180deg)";
  } else {
    sunIcon.style.opacity = "0";
    sunIcon.style.transform = "scale(0.5) rotate(-180deg)";
    moonIcon.style.opacity = "1";
    moonIcon.style.transform = "scale(1) rotate(0)";
  }
}

// Inicializar o sistema de tema quando o documento estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  initThemeSystem();
});
