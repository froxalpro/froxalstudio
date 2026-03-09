// Simple interaction to add a bit of life
document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.glass-card');
    
    // Add a simple 3d tilt effect on the card
    document.addEventListener('mousemove', (e) => {
        if(!card) return;
        const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
        
        card.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });

    // Reset card on mouse leave the screen
    document.addEventListener('mouseleave', () => {
        if(!card) return;
        card.style.transform = `perspective(1000px) rotateY(-5deg) rotateX(5deg)`; // Default state
    });
});
