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

            // Loading spinner while the video is being loaded
            const loadingSpinner = document.createElement('div');
            loadingSpinner.className = 'loading-spinner';
            card.appendChild(loadingSpinner);

            // Create video element
            const videoElement = document.createElement('video');
            videoElement.src = video.embed;
            videoElement.crossOrigin = 'anonymous';
            videoElement.muted = true;
            videoElement.playsInline = true;
            videoElement.preload = 'auto'; // Ensures compatibility across mobile devices

            // Hide the video initially
            videoElement.style.display = 'none';

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Function to create video thumbnail
            function createThumbnail() {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                const thumbnailSrc = canvas.toDataURL('image/jpeg');

                card.innerHTML = `
                    <div class="thumbnail">
                        <img src="${thumbnailSrc}" alt="${video.title}" loading="lazy" />
                    </div>
                    <div class="card-info">
                        <h3>${video.title}</h3>
                        <p>${video.tags}</p>
                    </div>
                `;

                // Hide spinner when thumbnail is created
                loadingSpinner.style.display = 'none';
            }

            // Lazy load the video preview only when it enters the viewport
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        videoElement.load(); // Load video data
                        observer.unobserve(entry.target); // Stop observing after it's loaded
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(card); // Start observing the card

            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.currentTime = 1; // Capture a frame for the thumbnail
            });

            videoElement.addEventListener('seeked', () => {
                createThumbnail(); // Create the thumbnail after seeking
            });

            // Redirect to video page on click
            card.addEventListener('click', () => {
                window.location.href = `video.html?title=${encodeURIComponent(video.title)}&tags=${encodeURIComponent(video.tags)}&embed=${encodeURIComponent(video.embed)}`;
            });

            fragment.appendChild(card);
            card.appendChild(videoElement); // Ensure video is part of the DOM
        });

        videoCardsContainer.appendChild(fragment);
        loading = false;
        document.getElementById('loading').style.display = 'none';
    }

    function loadMoreVideos() {
        if (loading) return;

        loading = true;
        document.getElementById('loading').style.display = 'block';

        const start = page * limit;
        const end = start + limit;
        const currentEntries = filteredVideos.slice(start, end);

        if (currentEntries.length > 0) {
            displayVideos(currentEntries, true);
            page++;
        } else {
            document.getElementById('loading').style.display = 'none';
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
