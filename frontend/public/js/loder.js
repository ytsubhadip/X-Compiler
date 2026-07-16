
(function () {
    const loginLoader = document.querySelector('.login-loder');
    const loader = loginLoader ? loginLoader.querySelector('.loader') : (document.querySelector('.loader-wrapper') || document.querySelector('.loader'));
    const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
    const authContainer = document.getElementById('authContainer') || document.querySelector('.auth-container');

    if (authContainer) {
        authContainer.style.display = 'block';
        authContainer.style.opacity = '1';
    }

    if (authWrapper) {
        authWrapper.classList.remove('is-visible');
    }

    if (loginLoader) {
        loginLoader.classList.remove('is-hidden');
    }

    if (!loader) return;

    loader.style.display = 'block';

    const hideLoader = () => {
        if (loginLoader) {
            loginLoader.classList.add('is-hidden');
        }
        if (authWrapper) {
            authWrapper.classList.add('is-visible');
        }
        loader.style.display = 'none';
    };

    if (document.readyState === 'complete') {
        setTimeout(hideLoader, 1500);
    } else {
        window.addEventListener('load', () => {
            setTimeout(hideLoader, 1500);
        });
    }
})();