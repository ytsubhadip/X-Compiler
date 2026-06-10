/**
 * @file loder.js
 * @description Manages page load transition overlay and handles fading out of loader spinner.
 */
(function() {
    const loader = document.querySelector('.loader-wrapper') || document.querySelector('.loader');
    const authContainer = document.getElementById('authContainer') || document.querySelector('.auth-container');
    
    // Show the auth container immediately so it can be seen (blurred) behind the loader
    if (authContainer) {
        authContainer.style.display = 'block';
        authContainer.style.opacity = '1';
    }

    if (!loader) return;

    loader.style.display = 'block';
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.style.display = 'none';
        }, 2000);
    });
})();