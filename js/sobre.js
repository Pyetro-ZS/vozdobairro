document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const toggle = item.querySelector('.faq-toggle');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            // Fechar outros itens abertos
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-toggle').textContent = '+';
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                }
            });
            
            // Alternar o item atual
            item.classList.toggle('active');
            
            if (item.classList.contains('active')) {
                toggle.textContent = '-';
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                toggle.textContent = '+';
                answer.style.maxHeight = null;
            }
        });
    });

    
});  