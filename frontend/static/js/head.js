// Runs before the page renders: marks that JavaScript is available, so the CSS can
// collapse the mobile menu and show interactive controls only when they will work.
document.documentElement.classList.replace('no-js', 'js');
