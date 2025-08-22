// common.js
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');

    // Function to set theme
    const setTheme = (theme) => {
        // Remove both classes first
        document.body.classList.remove('dark', 'light');
        document.documentElement.classList.remove('dark', 'light');
        
        // Add the appropriate class
        if (theme === 'dark') {
            document.body.classList.add('dark');
            document.documentElement.classList.add('dark');
        }
        
        // Update button icon
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = theme === 'dark' ? 
                '<span class="theme-icon">☀️</span>' : 
                '<span class="theme-icon">🌙</span>';
            themeToggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        }
        
        // Save to localStorage
        localStorage.setItem('theme', theme);
    };

    // Event listener for theme toggle
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
            setTheme(currentTheme);
        });
    }

    // Event listener for scroll-to-top
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Event listener for hamburger menu
    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        // Add accessibility
        hamburgerBtn.setAttribute('title', 'Toggle Navigation Menu');
        hamburgerBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
    }

    // Highlight active page link
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
});
