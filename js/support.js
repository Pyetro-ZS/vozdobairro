document.addEventListener("DOMContentLoaded", () => {
    const supportTab = document.getElementById("support-tab");
    const supportModal = document.getElementById("support-modal");
    const closeSupportModal = document.querySelector(".close-support-modal");

    // Abrir o modal ao clicar na aba de suporte
    supportTab.addEventListener("click", () => {
        supportModal.style.display = "flex";
    });

    // Fechar o modal ao clicar no botão de fechar
    closeSupportModal.addEventListener("click", () => {
        supportModal.style.display = "none";
    });

    // Fechar o modal ao clicar fora do conteúdo
    window.addEventListener("click", (event) => {
        if (event.target === supportModal) {
            supportModal.style.display = "none";
        }
    });
});
