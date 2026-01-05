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

    // Elements for search and category filtering
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const accessoryCards = Array.from(document.querySelectorAll('#accessories-grid .card'));

    // Voice search button
    const voiceBtn = document.getElementById('voice-search-btn');
    // Font size slider
    const fontSizeSlider = document.getElementById('font-size-slider');

    // Initialize voice search using Web Speech API
    (function initVoiceSearch() {
        if (!voiceBtn) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
        if (!SpeechRecognition) {
            // Hide voice button if not supported
            voiceBtn.style.display = 'none';
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.lang = 'en-US';
        // Start recognition on click
        voiceBtn.addEventListener('click', () => {
            try {
                voiceBtn.textContent = '🎤 Listening…';
                recognition.start();
            } catch (e) {
                console.error('Speech recognition error', e);
                voiceBtn.textContent = '🎤 Voice Search';
            }
        });
        // On successful result, set search input and filter
        recognition.addEventListener('result', (event) => {
            const transcript = event.results[0][0].transcript;
            if (searchInput) {
                searchInput.value = transcript;
                filterCards();
            }
        });
        recognition.addEventListener('end', () => {
            voiceBtn.textContent = '🎤 Voice Search';
        });
        recognition.addEventListener('error', (e) => {
            console.error('Speech recognition error', e);
            voiceBtn.textContent = '🎤 Voice Search';
        });
    })();

    // Initialize font size slider
    (function initFontSlider() {
        if (!fontSizeSlider) return;
        // Load saved scale from localStorage or default to 1
        let savedScale = parseFloat(localStorage.getItem('fontScale'));
        if (!savedScale || isNaN(savedScale)) savedScale = 1;
        fontSizeSlider.value = savedScale;
        document.documentElement.style.fontSize = (savedScale * 100) + '%';
        // Update font size on slider input
        fontSizeSlider.addEventListener('input', () => {
            const scale = parseFloat(fontSizeSlider.value);
            document.documentElement.style.fontSize = (scale * 100) + '%';
            localStorage.setItem('fontScale', scale);
        });
    })();

    // Combined filter function
    function filterCards() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : 'All';
        accessoryCards.forEach((card) => {
            const text = card.textContent.toLowerCase();
            const cardCategory = card.dataset.category;
            const matchesCategory = selectedCategory === 'All' || cardCategory === selectedCategory;
            const matchesQuery = text.includes(query);
            card.style.display = (matchesCategory && matchesQuery) ? '' : 'none';
        });
    }
    if (searchInput) {
        searchInput.addEventListener('input', filterCards);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterCards);
    }

    // Theme toggling
    const themeToggleBtn = document.getElementById('theme-toggle');
    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
        // Update button icon
        if (themeToggleBtn) {
            themeToggleBtn.textContent = theme === 'light' ? '🌞' : '🌓';
        }
    }
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    // Trending items tracking
    const trendingSection = document.getElementById('trending-section');
    const trendingListContainer = document.getElementById('trending-list');
    // Elements for category popularity chart
    const categoryChartHeading = document.getElementById('category-chart-heading');
    const categoryChartContainer = document.querySelector('.chart-container');
    const categoryCtx = document.getElementById('category-chart') ? document.getElementById('category-chart').getContext('2d') : null;
    let categoryChart = null;
    function getTrendingCounts() {
        try {
            return JSON.parse(localStorage.getItem('trendingCounts')) || {};
        } catch (e) {
            return {};
        }
    }
    function saveTrendingCounts(counts) {
        localStorage.setItem('trendingCounts', JSON.stringify(counts));
    }
    function updateTrendingList() {
        const counts = getTrendingCounts();
        const entries = Object.entries(counts);
        // Sort by descending click count
        entries.sort((a, b) => b[1] - a[1]);
        // Clear existing trending cards
        trendingListContainer.innerHTML = '';
        if (entries.length > 0) {
            trendingSection.style.display = 'block';
        } else {
            trendingSection.style.display = 'none';
            return;
        }
        // Display top 3 trending items
        entries.slice(0, 3).forEach(([name, count]) => {
            const itemCard = document.createElement('div');
            itemCard.className = 'card';
            const heading = document.createElement('h3');
            heading.textContent = name;
            const info = document.createElement('p');
            info.textContent = `Popular: ${count} clicks`;
            itemCard.appendChild(heading);
            itemCard.appendChild(info);
            trendingListContainer.appendChild(itemCard);
        });

        // After updating trending items, update the category popularity chart
        updateCategoryChart();
    }
    // Attach click handlers to each Shop Now button to track clicks
    const shopButtons = document.querySelectorAll('.card .btn');
    shopButtons.forEach((btn) => {
        btn.addEventListener('click', function () {
            const card = this.closest('.card');
            const name = card ? card.dataset.name : null;
            if (name) {
                const counts = getTrendingCounts();
                counts[name] = (counts[name] || 0) + 1;
                saveTrendingCounts(counts);
                updateTrendingList();
            }
        });
    });
    // Initialize trending list on page load
    updateTrendingList();

    /**
     * FAVORITES, QUICK VIEW & SURPRISE
     *
     * The following section adds functionality for users to mark products as favorites,
     * view a detailed quick‑view modal of any item, discover a random accessory,
     * and scroll back to the top of the page. Favorites persist in localStorage and
     * are displayed in a dedicated section. A star icon and Quick View button are
     * dynamically added to each card to support these interactions.
     */
    // Favorites helpers
    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('favorites')) || [];
        } catch (e) {
            return [];
        }
    }
    function saveFavorites(list) {
        localStorage.setItem('favorites', JSON.stringify(list));
    }
    // Elements for favorites
    const favoritesSection = document.getElementById('favorites-section');
    const favoritesList = document.getElementById('favorites-list');
    // Update the favorites list display
    function updateFavoritesList() {
        const favorites = getFavorites();
        favoritesList.innerHTML = '';
        if (favorites.length === 0) {
            favoritesSection.style.display = 'none';
            return;
        }
        favoritesSection.style.display = 'block';
        favorites.forEach((name) => {
            // Find the first matching card in the document
            const card = Array.from(document.querySelectorAll('.card-grid > .card')).find(c => c.dataset.name === name);
            if (card) {
                const clone = card.cloneNode(true);
                // Remove interactive elements from favorites clone
                const favIcon = clone.querySelector('.favorite-icon');
                if (favIcon) favIcon.remove();
                const detailsBtn = clone.querySelector('.details-btn');
                if (detailsBtn) detailsBtn.remove();
                favoritesList.appendChild(clone);
            }
        });
    }

    // Function to update the category popularity bar chart
    function updateCategoryChart() {
        if (!categoryCtx || typeof Chart === 'undefined') return;
        const counts = getTrendingCounts();
        // Aggregate click counts by category
        const categoryCounts = {};
        for (const [name, count] of Object.entries(counts)) {
            const card = document.querySelector(`.card[data-name="${CSS.escape(name)}"]`);
            if (card) {
                const cat = card.dataset.category || 'Other';
                categoryCounts[cat] = (categoryCounts[cat] || 0) + count;
            }
        }
        const labels = Object.keys(categoryCounts);
        const data = Object.values(categoryCounts);
        // Show or hide the chart and heading based on data
        if (labels.length === 0) {
            if (categoryChartHeading) categoryChartHeading.style.display = 'none';
            if (categoryChartContainer) categoryChartContainer.style.display = 'none';
            return;
        } else {
            if (categoryChartHeading) categoryChartHeading.style.display = 'block';
            if (categoryChartContainer) categoryChartContainer.style.display = 'block';
        }
        if (categoryChart) {
            categoryChart.data.labels = labels;
            categoryChart.data.datasets[0].data = data;
            categoryChart.update();
        } else {
            categoryChart = new Chart(categoryCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Clicks by Category',
                            data: data,
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
    // Toggle a product as a favorite
    function toggleFavorite(name) {
        let favs = getFavorites();
        const index = favs.indexOf(name);
        if (index >= 0) {
            favs.splice(index, 1);
        } else {
            favs.push(name);
        }
        saveFavorites(favs);
        updateCardFavoriteIcons();
        updateFavoritesList();
    }
    // Update star icons on all cards based on favorites list
    function updateCardFavoriteIcons() {
        const favs = getFavorites();
        document.querySelectorAll('.favorite-icon').forEach(icon => {
            const card = icon.closest('.card');
            const name = card ? card.dataset.name : null;
            if (name && favs.includes(name)) {
                icon.classList.add('favorited');
                icon.textContent = '★';
            } else {
                icon.classList.remove('favorited');
                icon.textContent = '☆';
            }
        });
    }
    // Quick view modal elements
    const modal = document.getElementById('quick-view-modal');
    const modalContent = document.getElementById('quick-view-content');
    const closeModalBtn = document.querySelector('.close-modal');
    function openQuickView(card) {
        if (!modal || !modalContent) return;
        const clone = card.cloneNode(true);
        // Remove interactive elements from clone
        const favIcon = clone.querySelector('.favorite-icon');
        if (favIcon) favIcon.remove();
        const detailsBtn = clone.querySelector('.details-btn');
        if (detailsBtn) detailsBtn.remove();
        // Replace the content
        modalContent.innerHTML = '';
        modalContent.appendChild(clone);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    function closeQuickView() {
        if (!modal) return;
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeQuickView);
    }
    // Close modal when clicking outside the modal content
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeQuickView();
            }
        });
    }
    // Scroll to top button
    const scrollTopBtn = document.getElementById('scroll-top');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.style.display = 'flex';
            } else {
                scrollTopBtn.style.display = 'none';
            }
        });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    // Surprise me button
    const surpriseBtn = document.getElementById('surprise-btn');
    if (surpriseBtn) {
        surpriseBtn.addEventListener('click', () => {
            // Filter visible cards based on current filters
            const visibleCards = accessoryCards.filter(card => card.style.display !== 'none');
            if (visibleCards.length === 0) return;
            const randomIndex = Math.floor(Math.random() * visibleCards.length);
            const randomCard = visibleCards[randomIndex];
            openQuickView(randomCard);
        });
    }
    // Dynamically add favorite icons and quick view buttons to each card
    const allCards = document.querySelectorAll('.card-grid > .card');
    allCards.forEach((card) => {
        // Ensure card is positioned relative for absolute icon placement
        card.style.position = card.style.position || 'relative';
        // Create favorite icon if not already present
        if (!card.querySelector('.favorite-icon')) {
            const favIcon = document.createElement('span');
            favIcon.className = 'favorite-icon';
            favIcon.textContent = '☆';
            card.appendChild(favIcon);
            favIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = card.dataset.name;
                if (name) {
                    toggleFavorite(name);
                }
            });
        }
        // Create Quick View button if not present
        if (!card.querySelector('.details-btn')) {
            const detailsBtn = document.createElement('button');
            detailsBtn.className = 'details-btn';
            detailsBtn.textContent = 'Quick View';
            card.appendChild(detailsBtn);
            detailsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openQuickView(card);
            });
        }
    });
    // After injecting icons and buttons, update their states based on saved favorites
    updateCardFavoriteIcons();
    updateFavoritesList();
});