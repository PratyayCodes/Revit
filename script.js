document.addEventListener('DOMContentLoaded', function() {
    let page = 0;
    const limit = 5; // Number of videos to load at once
    let loading = false;
    let allVideos = [];
    let filteredVideos = [];
    let searchQuery = '';

    function fetchAllVideos() {
        return fetch('/get_videos')
            .then(response => response.json())
            .then(data => {
                allVideos = data.videos;
                filteredVideos = allVideos;
                displayVideos(filteredVideos.slice(0, limit));
            });
    }

    function displayVideos(videos, append = false) {
        const videoCardsContainer = document.getElementById('video-cards');
        const fragment = document.createDocumentFragment();

        if (!append) {
            videoCardsContainer.innerHTML = '';
        }

        videos.forEach(video => {
            const card = document.createElement('div');
            card.className = 'video-card';

            // Thumbnail image
            const thumbnailImg = document.createElement('img');
            thumbnailImg.src = `thumbnail/${video.id}.webp`; // Path to the thumbnail image
            thumbnailImg.alt = video.title;
            thumbnailImg.className = 'thumbnail-image';
            thumbnailImg.loading = 'lazy'; // Optimize loading

            // Handle thumbnail load error
            thumbnailImg.onerror = () => {
                console.error(`Thumbnail not found for video ID: ${video.id}`);
                thumbnailImg.src = 'path/to/default-thumbnail.webp'; // Use a default thumbnail if needed
            };

            // Append thumbnail and video info to the card
            card.innerHTML += `
                <div class="thumbnail">
                    ${thumbnailImg.outerHTML}
                </div>
                <div class="card-info">
                    <h3>${video.title}</h3>
                    <p>${video.tags}</p>
                </div>
            `;

            // Hide the loading spinner once the thumbnail is loaded
            thumbnailImg.onload = () => {
                // No spinner to hide here, as it's moved below
            };

            // Redirect to video page on click
            card.addEventListener('click', () => {
                window.location.href = `video.html?title=${encodeURIComponent(video.title)}&tags=${encodeURIComponent(video.tags)}&embed=${encodeURIComponent(video.embed)}`;
            });

            fragment.appendChild(card);
        });

        videoCardsContainer.appendChild(fragment);
        
        // Hide global loading spinner after videos are loaded
        loading = false;
        document.getElementById('loading').style.display = 'none'; // Hide loading spinner at the bottom
    }

    function loadMoreVideos() {
        if (loading) return;

        loading = true;
        document.getElementById('loading').style.display = 'block'; // Show loading spinner at the bottom

        const start = page * limit;
        const end = start + limit;
        const currentEntries = filteredVideos.slice(start, end);

        if (currentEntries.length > 0) {
            displayVideos(currentEntries, true);
            page++;
        } else {
            document.getElementById('loading').style.display = 'none'; // Hide loading spinner if no more videos
        }

        loading = false;
    }

    function searchVideos(query) {
        searchQuery = query;
        filteredVideos = allVideos.filter(video => {
            return video.title.toLowerCase().includes(query.toLowerCase()) ||
                   video.tags.toLowerCase().includes(query.toLowerCase());
        });

        page = 0;
        displayVideos(filteredVideos.slice(0, limit));
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    const handleScroll = debounce(() => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200) {
            loadMoreVideos();
        }
    }, 200);

    window.addEventListener('scroll', handleScroll);

    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', debounce((event) => {
        const query = event.target.value;
        searchVideos(query);
    }, 300));

    fetchAllVideos();
});
