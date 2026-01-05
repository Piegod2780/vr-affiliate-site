/*
 * Custom interactive features for the VR Gear & Accessories site.
 *
 * - Applies a 3D tilt effect to each product card using the VanillaTilt library.
 * - Implements a live search filter for the accessories section to help users
 *   quickly find specific items.
 */

// Wait for the DOM to load before running scripts
document.addEventListener('DOMContentLoaded', function () {
    // Initialize vanilla tilt on all cards for subtle 3D hover effects
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll('.card'), {
            max: 15,
            speed: 400,
            glare: true,
            'max-glare': 0.2,
        });
    }

    // Live search filter for accessories
    const searchInput = document.getElementById('search-input');
    const accessoryCards = Array.from(document.querySelectorAll('#accessories-grid .card'));

    if (searchInput) {
        searchInput.addEventListener('input', function (event) {
            const query = event.target.value.trim().toLowerCase();
            accessoryCards.forEach((card) => {
                const text = card.textContent.toLowerCase();
                if (text.includes(query)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});