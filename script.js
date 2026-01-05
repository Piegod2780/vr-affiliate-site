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
            // Award points for using voice search
            try {
                if (typeof addPoints === 'function') {
                    addPoints(1);
                }
            } catch (e) {}
            // Record voice search usage and check achievements
            try {
                if (typeof incrementStat === 'function' && typeof checkAchievements === 'function') {
                    incrementStat('voiceSearches');
                    checkAchievements();
                }
            } catch (e) {}
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
        categoryFilter.addEventListener('change', () => {
            filterCards();
            // Record a category change and check achievements
            try {
                if (typeof incrementStat === 'function' && typeof checkAchievements === 'function') {
                    incrementStat('categoryChanges');
                    checkAchievements();
                }
            } catch (e) {}
        });
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

    // ================================
    // Scoreboard, Accent Color & Sorting
    // ================================
    const scoreValueEl = document.getElementById('score-value');
    const achievementDisplay = document.getElementById('achievement-display');
    const colorPickerEl = document.getElementById('color-picker');
    const sortFilter = document.getElementById('sort-filter');

    // Adjust the brightness of a hex color by a factor (0.0–1.0)
    function adjustBrightness(hex, factor) {
        let h = hex.replace('#', '');
        if (h.length === 3) {
            h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        }
        let r = parseInt(h.substring(0, 2), 16);
        let g = parseInt(h.substring(2, 4), 16);
        let b = parseInt(h.substring(4, 6), 16);
        r = Math.min(255, Math.max(0, Math.floor(r * factor)));
        g = Math.min(255, Math.max(0, Math.floor(g * factor)));
        b = Math.min(255, Math.max(0, Math.floor(b * factor)));
        const hr = r.toString(16).padStart(2, '0');
        const hg = g.toString(16).padStart(2, '0');
        const hb = b.toString(16).padStart(2, '0');
        return '#' + hr + hg + hb;
    }
    function getPoints() {
        const pts = parseInt(localStorage.getItem('userPoints'), 10);
        return isNaN(pts) ? 0 : pts;
    }
    function savePoints(value) {
        localStorage.setItem('userPoints', value);
    }
    function updateScoreboard() {
        const pts = getPoints();
        if (scoreValueEl) scoreValueEl.textContent = pts;
        if (achievementDisplay) {
            let badge = '';
            if (pts >= 100) badge = '🏆 VR Master';
            else if (pts >= 50) badge = '🎮 VR Pro';
            else if (pts >= 20) badge = '✨ Enthusiast';
            achievementDisplay.textContent = badge;
        }
    }
    function addPoints(amount) {
        const newPts = getPoints() + amount;
        savePoints(newPts);
        updateScoreboard();
    }
    function setAccentColor(color) {
        const hoverColor = adjustBrightness(color, 0.85);
        document.documentElement.style.setProperty('--accent-color', color);
        document.documentElement.style.setProperty('--accent-color-hover', hoverColor);
        if (colorPickerEl) colorPickerEl.value = color;
        localStorage.setItem('accentColor', color);
    }
    // Initialize accent color from storage or default
    (function initAccentColor() {
        const saved = localStorage.getItem('accentColor');
        if (saved) {
            setAccentColor(saved);
        } else {
            // Use current CSS variable as default
            const computed = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#0077ff';
            setAccentColor(computed);
        }
        if (colorPickerEl) {
            colorPickerEl.addEventListener('input', (e) => {
                setAccentColor(e.target.value);
                // Record a color change and check achievements
                try {
                    if (typeof incrementStat === 'function' && typeof checkAchievements === 'function') {
                        incrementStat('colorsChanged');
                        checkAchievements();
                    }
                } catch (err) {}
            });
        }
    })();
    // Initialize scoreboard display
    updateScoreboard();

    // ============================
    // Achievements and Stats
    // ============================

    // Define achievement requirements and metadata
    const achievementDefs = [
        { key: 'shopper', metric: 'shopClicks', threshold: 10, title: 'Shopper', icon: '🛍️', desc: 'Clicked 10 Shop Now buttons' },
        { key: 'collector', metric: 'favoritesAdded', threshold: 5, title: 'Collector', icon: '⭐', desc: 'Added 5 favorites' },
        { key: 'explorer', metric: 'quickViews', threshold: 10, title: 'Explorer', icon: '🔍', desc: 'Opened 10 Quick Views' },
        { key: 'quizMaster', metric: 'quizCompleted', threshold: 1, title: 'Quiz Master', icon: '🎓', desc: 'Completed the quiz' },
        { key: 'voiceSearcher', metric: 'voiceSearches', threshold: 1, title: 'Voice Searcher', icon: '🎤', desc: 'Used voice search' },
        { key: 'stylist', metric: 'colorsChanged', threshold: 1, title: 'Custom Stylist', icon: '🎨', desc: 'Changed the accent color' },
        { key: 'categoryExplorer', metric: 'categoryChanges', threshold: 5, title: 'Category Explorer', icon: '🗂️', desc: 'Explored 5 categories' },
        { key: 'sortMaster', metric: 'sortChanges', threshold: 1, title: 'Sort Master', icon: '↕️', desc: 'Used sorting options' },
        { key: 'randomExplorer', metric: 'surprises', threshold: 1, title: 'Random Explorer', icon: '🎲', desc: 'Used the Surprise Me button' },
        { key: 'memoryMaster', metric: 'memoryGamesCompleted', threshold: 1, title: 'Memory Master', icon: '🧠', desc: 'Completed the Memory Match Game' }
    ];

    // Retrieve persistent statistics from localStorage
    function getStats() {
        try {
            return JSON.parse(localStorage.getItem('userStats')) || {};
        } catch (e) {
            return {};
        }
    }
    // Save stats to storage
    function saveStats(stats) {
        localStorage.setItem('userStats', JSON.stringify(stats));
    }
    // Increment a specific stat counter
    function incrementStat(metric) {
        const stats = getStats();
        stats[metric] = (stats[metric] || 0) + 1;
        saveStats(stats);
    }
    // Retrieve unlocked achievements mapping
    function getUnlockedAchievements() {
        try {
            return JSON.parse(localStorage.getItem('achievementsUnlocked')) || {};
        } catch (e) {
            return {};
        }
    }
    // Save unlocked achievements
    function saveUnlockedAchievements(data) {
        localStorage.setItem('achievementsUnlocked', JSON.stringify(data));
    }
    // Update the achievement board display
    function updateAchievementBoard() {
        const board = document.getElementById('achievement-board');
        const section = document.getElementById('achievements-section');
        if (!board || !section) return;
        const unlocked = getUnlockedAchievements();
        // If there are any achievements defined, always show the section
        section.style.display = 'block';
        board.innerHTML = '';
        achievementDefs.forEach(def => {
            const item = document.createElement('div');
            item.className = 'achievement';
            // Add locked class if not yet unlocked
            if (!unlocked[def.key]) {
                item.classList.add('locked');
            }
            item.innerHTML = `<span>${def.icon}</span><span>${def.title}</span>`;
            // Optionally add title attribute for description
            item.title = def.desc;
            board.appendChild(item);
        });
    }
    // Trigger confetti celebration when unlocking an achievement
    function triggerConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#845EC2'];
        const count = 50;
        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = (Math.random() * 0.5) + 's';
            piece.style.opacity = (0.6 + Math.random() * 0.4).toString();
            container.appendChild(piece);
            // Remove after animation ends
            setTimeout(() => {
                piece.remove();
            }, 3500);
        }
    }
    // Check whether any achievements have been unlocked
    function checkAchievements() {
        const stats = getStats();
        const unlocked = getUnlockedAchievements();
        let unlockedNew = false;
        achievementDefs.forEach(def => {
            if (!unlocked[def.key]) {
                const value = stats[def.metric] || 0;
                if (value >= def.threshold) {
                    unlocked[def.key] = true;
                    unlockedNew = true;
                }
            }
        });
        if (unlockedNew) {
            saveUnlockedAchievements(unlocked);
            updateAchievementBoard();
            // Celebrate unlocking one or more achievements
            triggerConfetti();
            // Optionally award bonus points per achievement unlocked
            try {
                if (typeof addPoints === 'function') {
                    addPoints(5);
                }
            } catch (e) {}
        }
    }
    // Initialize the achievements board on page load
    updateAchievementBoard();

    // Sorting functionality for accessories
    (function initSorting() {
        if (!sortFilter) return;
        // Assign original index to each accessory card
        const accessoryList = Array.from(document.querySelectorAll('#accessories-grid .card'));
        accessoryList.forEach((card, idx) => {
            card.dataset.index = idx;
        });
        function sortCards() {
            const grid = document.getElementById('accessories-grid');
            if (!grid) return;
            let cards = Array.from(grid.children);
            const mode = sortFilter.value;
            // Retrieve trending counts for popularity sort
            const counts = typeof getTrendingCounts === 'function' ? getTrendingCounts() : {};
            cards.sort((a, b) => {
                if (mode === 'alphabetical') {
                    return a.dataset.name.localeCompare(b.dataset.name);
                } else if (mode === 'popularity') {
                    return (counts[b.dataset.name] || 0) - (counts[a.dataset.name] || 0);
                } else if (mode === 'category') {
                    return a.dataset.category.localeCompare(b.dataset.category);
                } else {
                    return parseInt(a.dataset.index, 10) - parseInt(b.dataset.index, 10);
                }
            });
            cards.forEach(card => grid.appendChild(card));
        }
        sortFilter.addEventListener('change', () => {
            sortCards();
            // Reapply filtering after sorting
            if (typeof filterCards === 'function') filterCards();
            // Record a sort change and check achievements
            try {
                if (typeof incrementStat === 'function' && typeof checkAchievements === 'function') {
                    incrementStat('sortChanges');
                    checkAchievements();
                }
            } catch (e) {}
        });
    })();

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
            // Award points for clicking a Shop Now button
            try {
                if (typeof addPoints === 'function') {
                    addPoints(1);
                }
            } catch (e) {}
            // Record a shop click in stats and check achievements
            try {
                if (typeof incrementStat === 'function' && typeof checkAchievements === 'function') {
                    incrementStat('shopClicks');
                    checkAchievements();
                }
            } catch (e) {}
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
            // Award points for adding a new favorite
            try {
                if (typeof addPoints === 'function') {
                    addPoints(5);
                }
            } catch (e) {}
            // Record a favorite addition and check achievements
            try {
                if (typeof incrementStat === 'function' && typeof checkAchievements === 'function') {
                    incrementStat('favoritesAdded');
                    checkAchievements();
                }
            } catch (e) {}
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
            // Award points for surprise pick
            try {
                if (typeof addPoints === 'function') {
                    addPoints(2);
                }
            } catch (e) {}
            // Record a surprise use and check achievements
            try {
                if (typeof incrementStat === 'function' && typeof checkAchievements === 'function') {
                    incrementStat('surprises');
                    checkAchievements();
                }
            } catch (e) {}
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
                // Award points for viewing details
                try {
                    if (typeof addPoints === 'function') {
                        addPoints(1);
                    }
                } catch (e) {}
                    // Record quick view and check achievements
                    try {
                        if (typeof incrementStat === 'function' && typeof checkAchievements === 'function') {
                            incrementStat('quickViews');
                            checkAchievements();
                        }
                    } catch (e) {}
            });
        }
    });
    // After injecting icons and buttons, update their states based on saved favorites
    updateCardFavoriteIcons();
    updateFavoritesList();

    /**
     * COMPARISON MODE
     *
     * Adds a compare icon to each card. Users can select multiple items (up to 3) to compare
     * side by side in a modal. A bottom bar appears when items are selected, showing the
     * current count and a button to launch the comparison.
     */
    function getCompareList() {
        try {
            return JSON.parse(localStorage.getItem('compareList')) || [];
        } catch (e) {
            return [];
        }
    }
    function saveCompareList(list) {
        localStorage.setItem('compareList', JSON.stringify(list));
    }
    function toggleCompare(name) {
        let list = getCompareList();
        const index = list.indexOf(name);
        if (index >= 0) {
            list.splice(index, 1);
        } else {
            // Limit to 3 items to prevent cluttered comparisons
            if (list.length >= 3) {
                list.shift();
            }
            list.push(name);
        }
        saveCompareList(list);
        updateCompareIcons();
        updateCompareBar();
    }
    function updateCompareIcons() {
        const list = getCompareList();
        document.querySelectorAll('.compare-icon').forEach(icon => {
            const card = icon.closest('.card');
            const name = card ? card.dataset.name : null;
            if (name && list.includes(name)) {
                icon.classList.add('selected');
                icon.textContent = '✅';
            } else {
                icon.classList.remove('selected');
                icon.textContent = '⬜';
            }
        });
    }
    function updateCompareBar() {
        const compareBar = document.getElementById('compare-bar');
        const compareCount = document.getElementById('compare-count');
        const list = getCompareList();
        if (!compareBar || !compareCount) return;
        if (list.length === 0) {
            compareBar.style.display = 'none';
        } else {
            compareBar.style.display = 'flex';
            compareCount.textContent = `${list.length} item${list.length > 1 ? 's' : ''} selected for comparison`;
        }
    }
    function openCompareModal() {
        const list = getCompareList();
        const compareModal = document.getElementById('compare-modal');
        const compareContent = document.getElementById('compare-content');
        if (!compareModal || !compareContent) return;
        compareContent.innerHTML = '';
        list.forEach(name => {
            const card = Array.from(document.querySelectorAll('.card-grid > .card')).find(c => c.dataset.name === name);
            if (card) {
                const clone = card.cloneNode(true);
                // Remove interactive elements (favorite icon, quick view, compare icon, details button)
                const favIcon = clone.querySelector('.favorite-icon');
                if (favIcon) favIcon.remove();
                const detBtn = clone.querySelector('.details-btn');
                if (detBtn) detBtn.remove();
                const compIcon = clone.querySelector('.compare-icon');
                if (compIcon) compIcon.remove();
                compareContent.appendChild(clone);
            }
        });
        compareModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    function closeCompareModal() {
        const compareModal = document.getElementById('compare-modal');
        if (compareModal) {
            compareModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    // Add compare icons and update state
    allCards.forEach((card) => {
        if (!card.querySelector('.compare-icon')) {
            const compIcon = document.createElement('span');
            compIcon.className = 'compare-icon';
            compIcon.textContent = '⬜';
            card.appendChild(compIcon);
            compIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = card.dataset.name;
                if (name) {
                    toggleCompare(name);
                }
            });
        }
    });
    // Initialize compare icons and bar
    updateCompareIcons();
    updateCompareBar();
    // Compare bar events
    const compareNowBtn = document.getElementById('compare-now-btn');
    if (compareNowBtn) {
        compareNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCompareModal();
        });
    }
    const closeCompareBtn = document.querySelector('.close-compare');
    if (closeCompareBtn) {
        closeCompareBtn.addEventListener('click', closeCompareModal);
    }
    const compareModal = document.getElementById('compare-modal');
    if (compareModal) {
        compareModal.addEventListener('click', (e) => {
            if (e.target === compareModal) {
                closeCompareModal();
            }
        });
    }

    /**
     * RECOMMENDATION QUIZ
     *
     * Presents a multi-step quiz to help visitors choose products based on their use case,
     * budget and priorities. Recommendations are displayed at the end of the quiz.
     */
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const quizModal = document.getElementById('quiz-modal');
    const quizContent = document.getElementById('quiz-content');
    const closeQuizBtn = document.querySelector('.close-quiz');
    const quizQuestions = [
        {
            question: 'What do you primarily use VR for?',
            answers: ['Gaming', 'Fitness', 'Productivity', 'Social']
        },
        {
            question: 'What is your budget?',
            answers: ['Low', 'Medium', 'High']
        },
        {
            question: 'Which feature matters most to you?',
            answers: ['Comfort', 'Audio', 'Haptics', 'Battery']
        }
    ];
    function showQuizQuestion(index, responses) {
        if (!quizContent) return;
        quizContent.innerHTML = '';
        if (index >= quizQuestions.length) {
            // Compute and display recommendations
            displayRecommendations(responses);
            return;
        }
        const qObj = quizQuestions[index];
        const qElem = document.createElement('h3');
        qElem.textContent = qObj.question;
        quizContent.appendChild(qElem);
        const answersContainer = document.createElement('div');
        answersContainer.style.display = 'flex';
        answersContainer.style.flexDirection = 'column';
        answersContainer.style.marginTop = '1rem';
        qObj.answers.forEach(ans => {
            const btn = document.createElement('button');
            btn.textContent = ans;
            btn.style.margin = '0.5rem 0';
            btn.style.padding = '0.65rem 1rem';
            // Use accent color for answer buttons
            btn.style.backgroundColor = 'var(--accent-color)';
            btn.style.color = '#fff';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.fontWeight = '600';
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', () => {
                responses.push(ans);
                showQuizQuestion(index + 1, responses);
            });
            answersContainer.appendChild(btn);
        });
        quizContent.appendChild(answersContainer);
    }
    function displayRecommendations(responses) {
        if (!quizContent) return;
        // Award points for completing the quiz
        try {
            if (typeof addPoints === 'function') {
                addPoints(10);
            }
        } catch (e) {}
        // Record quiz completion and check achievements
        try {
            if (typeof incrementStat === 'function' && typeof checkAchievements === 'function') {
                incrementStat('quizCompleted');
                checkAchievements();
            }
        } catch (e) {}
        quizContent.innerHTML = '';
        const [useCase, budget, priority] = responses;
        // Determine recommended product names based on responses
        let recs = [];
        function addUnique(name) {
            if (!recs.includes(name)) recs.push(name);
        }
        // Use case mapping
        if (useCase === 'Gaming') {
            addUnique('VR Gun Stock (AMVR)');
            addUnique('Shadow Shot VR Bow');
            addUnique('Weighted Golf Club Attachment (DriVR Elite)');
        } else if (useCase === 'Fitness') {
            addUnique('Ringside Weighted Exercise Gloves');
            addUnique('Skywin VR Mat');
            addUnique('Weighted Golf Club Attachment (DriVR Elite)');
        } else if (useCase === 'Productivity') {
            addUnique('Meta Quest Link Cable');
            addUnique('Syntech 16 ft Link Cable');
            addUnique('Casematix Hard Case');
        } else if (useCase === 'Social') {
            addUnique('SteelSeries Arctis Nova 4 Headphones');
            addUnique('PRISMXR Low-Latency Earphones');
            addUnique('KIWI Design K4 Duo Audio & Battery Strap');
        }
        // Priority mapping
        if (priority === 'Comfort') {
            addUnique('KIWI Design K4 Mini Head Strap');
            addUnique('BOBOVR M3 Pro Head Strap');
        } else if (priority === 'Audio') {
            addUnique('SteelSeries Arctis Nova 4 Headphones');
            addUnique('PRISMXR Low-Latency Earphones');
        } else if (priority === 'Haptics') {
            addUnique('Woojer Vest 3 Haptic Vest');
            addUnique('bHaptics TactSuit X16');
        } else if (priority === 'Battery') {
            addUnique('BOBOVR S3 Pro Battery Strap');
            addUnique('YOGES Charging Station');
            addUnique('PRISMXR Carina D1 Charging Dock');
        }
        // Budget mapping (adjust recs order or add items for high budgets)
        if (budget === 'High') {
            addUnique('Roto VR Explorer Chair');
            addUnique('VIVE Ultimate Tracker');
        }
        // Create header
        const header = document.createElement('h3');
        header.textContent = 'Recommended for you';
        quizContent.appendChild(header);
        const container = document.createElement('div');
        container.className = 'compare-content';
        recs.slice(0, 4).forEach(name => {
            const card = Array.from(document.querySelectorAll('.card-grid > .card')).find(c => c.dataset.name === name);
            if (card) {
                const clone = card.cloneNode(true);
                // Remove interactive elements
                const favIcon = clone.querySelector('.favorite-icon');
                if (favIcon) favIcon.remove();
                const detBtn = clone.querySelector('.details-btn');
                if (detBtn) detBtn.remove();
                const compIcon = clone.querySelector('.compare-icon');
                if (compIcon) compIcon.remove();
                clone.style.flex = '1 1 45%';
                container.appendChild(clone);
            }
        });
        quizContent.appendChild(container);
        const restartBtn = document.createElement('button');
        restartBtn.textContent = 'Retake Quiz';
        restartBtn.style.marginTop = '1rem';
        restartBtn.style.padding = '0.65rem 1rem';
        // Use accent color for the restart button
        restartBtn.style.backgroundColor = 'var(--accent-color)';
        restartBtn.style.color = '#fff';
        restartBtn.style.border = 'none';
        restartBtn.style.borderRadius = '4px';
        restartBtn.style.fontWeight = '600';
        restartBtn.style.cursor = 'pointer';
        restartBtn.addEventListener('click', () => {
            quizResponses = [];
            showQuizQuestion(0, []);
        });
        quizContent.appendChild(restartBtn);
    }
    let quizResponses = [];
    if (startQuizBtn && quizModal && quizContent) {
        startQuizBtn.addEventListener('click', () => {
            quizResponses = [];
            showQuizQuestion(0, []);
            quizModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    if (closeQuizBtn) {
        closeQuizBtn.addEventListener('click', () => {
            quizModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    if (quizModal) {
        quizModal.addEventListener('click', (e) => {
            if (e.target === quizModal) {
                quizModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }

    /** MEMORY MATCH GAME **/
    // Variables to track memory game state
    let firstMemoryCard = null;
    let memoryLock = false;
    let memoryPairsMatched = 0;

    // Start a new memory game: create shuffled card grid
    function startMemoryGame() {
        firstMemoryCard = null;
        memoryLock = false;
        memoryPairsMatched = 0;
        const board = document.getElementById('memory-game-board');
        const restartBtn = document.getElementById('restart-memory-game');
        if (board) board.innerHTML = '';
        if (restartBtn) restartBtn.style.display = 'none';
        // Define VR-themed icons (duplicate each for pairs)
        const icons = ['🎮','🔫','🧤','🎧','🧠','🎒','🕶️','🪀'];
        const pairs = icons.concat(icons).sort(() => Math.random() - 0.5);
        pairs.forEach(icon => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.icon = icon;
            // Use a span to hold the icon and hide it initially
            const span = document.createElement('span');
            span.textContent = icon;
            span.style.visibility = 'hidden';
            card.appendChild(span);
            card.addEventListener('click', () => handleMemoryCardClick(card));
            if (board) board.appendChild(card);
        });
    }

    // Handle card click logic
    function handleMemoryCardClick(card) {
        if (memoryLock || card.classList.contains('flip')) return;
        const span = card.querySelector('span');
        if (!span) return;
        span.style.visibility = 'visible';
        card.classList.add('flip');
        if (!firstMemoryCard) {
            firstMemoryCard = card;
            return;
        }
        if (card.dataset.icon === firstMemoryCard.dataset.icon) {
            // Match found
            memoryPairsMatched++;
            addPoints(5);
            incrementStat('memoryMatches');
            firstMemoryCard = null;
            if (memoryPairsMatched === 8) {
                // Game completed
                incrementStat('memoryGamesCompleted');
                checkAchievements();
                const restartBtn = document.getElementById('restart-memory-game');
                if (restartBtn) restartBtn.style.display = 'block';
            }
        } else {
            // Not a match: flip both cards back after delay
            memoryLock = true;
            setTimeout(() => {
                card.classList.remove('flip');
                firstMemoryCard.classList.remove('flip');
                card.querySelector('span').style.visibility = 'hidden';
                firstMemoryCard.querySelector('span').style.visibility = 'hidden';
                firstMemoryCard = null;
                memoryLock = false;
            }, 800);
        }
    }

    // Open the memory game modal and start a game
    function openMemoryGame() {
        const modal = document.getElementById('memory-game-modal');
        if (!modal) return;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        startMemoryGame();
    }

    // Close the memory game modal
    function closeMemoryGame() {
        const modal = document.getElementById('memory-game-modal');
        if (!modal) return;
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Hook up memory game buttons
    const startMemoryBtn = document.getElementById('start-memory-game');
    const closeMemoryBtn = document.getElementById('close-memory-game');
    const restartMemoryBtn = document.getElementById('restart-memory-game');
    if (startMemoryBtn) {
        startMemoryBtn.addEventListener('click', () => {
            openMemoryGame();
        });
    }
    if (closeMemoryBtn) {
        closeMemoryBtn.addEventListener('click', () => {
            closeMemoryGame();
        });
    }
    if (restartMemoryBtn) {
        restartMemoryBtn.addEventListener('click', () => {
            startMemoryGame();
        });
    }
});