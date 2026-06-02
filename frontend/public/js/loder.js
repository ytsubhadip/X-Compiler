  // show loader for 1.5 seconds on page load, then reveal auth box
        (function(){
            const loader = document.querySelector('.loader');
            const authContainer = document.getElementById('authContainer') || document.querySelector('.auth-container');
            if (authContainer) authContainer.style.display = 'none';
            if(!loader) {
                if (authContainer) authContainer.style.display = '';
                return;
            }
            loader.style.display = 'block';
            window.addEventListener('load', () => {
                setTimeout(() => {
                    loader.style.display = 'none';
                    if (authContainer) authContainer.style.display = '';
                }, 2000);
            });
        })();