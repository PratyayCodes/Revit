document.addEventListener('DOMContentLoaded', function() {
    let page = 0;
    const limit = 10;
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
            })
            .catch(error => {
                console.error('Error fetching video data:', error);
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

            // Create video element and set up attributes
            const videoElement = document.createElement('video');
            videoElement.src = video.embed;
            videoElement.crossOrigin = 'anonymous';
            videoElement.muted = true; // Mute the video
            videoElement.style.display = 'none'; // Hide the video element
            videoElement.playsInline = true; // Necessary for some browsers to play video without user interaction

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            function createThumbnail() {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                const thumbnailSrc = canvas.toDataURL('image/jpeg');

                if (thumbnailSrc) {
                    card.innerHTML = `
                        <div class="thumbnail">
                            <img src="${thumbnailSrc}" alt="${video.title}" />
                        </div>
                        <div class="card-info">
                            <h3>${video.title}</h3>
                            <p>${video.tags}</p>
                        </div>
                    `;
                } else {
                    card.innerHTML = '<div class="error">Error generating thumbnail</div>';
                }
            }

            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.currentTime = 1; // Set time to 1 second to capture a frame
            });

            videoElement.addEventListener('seeked', () => {
                createThumbnail();
            });

            videoElement.addEventListener('error', (e) => {
                console.error('Error loading video:', e);
                card.innerHTML = '<div class="error">Error loading video</div>';
            });

            // Add click event to redirect to video.html with video details
            card.addEventListener('click', () => {
                window.location.href = `video.html?title=${encodeURIComponent(video.title)}&tags=${encodeURIComponent(video.tags)}&embed=${encodeURIComponent(video.embed)}`;
            });

            fragment.appendChild(card);
            card.appendChild(videoElement); // Ensure the video element is added to the DOM
            videoElement.load(); // Load the video element
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
