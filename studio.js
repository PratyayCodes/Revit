document.addEventListener('DOMContentLoaded', function() {
    let page = 0;
    const limit = 10;
    let loading = false;
    let allVideos = [];
    let filteredVideos = [];
    let searchQuery = '';
    let isSearchActive = false;
    let videoToDelete = null;

    const videoList = document.getElementById('video-list');
    const searchInput = document.getElementById('search');
    const videoForm = document.getElementById('video-form');
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const filtersDropdownButton = document.querySelector('.dropdown-button[data-dropdown="filters"]');
    const sortDropdownButton = document.querySelector('.dropdown-button[data-dropdown="sort"]');
    const filtersDropdown = document.getElementById('filters-dropdown');
    const sortDropdown = document.getElementById('sort-dropdown');
    const confirmModal = document.getElementById('confirm-modal');
    const successModal = document.getElementById('success-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmModalClose = document.getElementById('confirm-modal-close');
    const successModalClose = document.getElementById('success-modal-close');

    // Fetch all videos from the server
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

    // Function to display videos
    function displayVideos(videos, append = false) {
        const videoCardsContainer = document.getElementById('video-list');
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
                            <button class="delete-button" data-id="${video.id}">🗑️ Delete</button>
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

            fragment.appendChild(card);
            card.appendChild(videoElement); // Ensure the video element is added to the DOM
            videoElement.load(); // Load the video element
        });

        videoCardsContainer.appendChild(fragment);
        loading = false;
        document.getElementById('loading').style.display = 'none';
    }

    // Function to add a video
    const addVideo = async (data) => {
        try {
            const response = await fetch('/add_video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(data)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            await fetchAllVideos(); // Reload videos after addition
        } catch (error) {
            console.error('Error adding video:', error);
            document.getElementById('form-message').innerText = 'Error adding video. Please try again.';
        }
    };

    // Function to delete a video
    const deleteVideo = async (id) => {
        try {
            await fetch(`/delete_video/${id}`, { method: 'DELETE' });
            await fetchAllVideos(); // Reload videos after deletion
            showSuccessModal();
        } catch (error) {
            console.error('Error deleting video:', error);
        }
    };

    // Function to show the confirmation modal
    const showConfirmModal = (id) => {
        videoToDelete = id;
        confirmModal.style.display = 'block';
    };

    // Function to hide the confirmation modal
    const hideConfirmModal = () => {
        confirmModal.style.display = 'none';
        videoToDelete = null;
    };

    // Function to show the success modal
    const showSuccessModal = () => {
        successModal.style.display = 'block';
    };

    // Function to hide the success modal
    const hideSuccessModal = () => {
        successModal.style.display = 'none';
    };

    // Event listener for delete buttons
    videoList.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-button')) {
            const id = event.target.getAttribute('data-id');
            showConfirmModal(id);
        }
    });

    // Event listener for confirm delete button
    confirmDeleteBtn.addEventListener('click', async () => {
        if (videoToDelete) {
            await deleteVideo(videoToDelete);
            hideConfirmModal();
        }
    });

    // Event listener for cancel delete button
    cancelDeleteBtn.addEventListener('click', hideConfirmModal);

    // Event listener for close button on confirmation modal
    confirmModalClose.addEventListener('click', hideConfirmModal);

    // Event listener for close button on success modal
    successModalClose.addEventListener('click', hideSuccessModal);

    // Event listener for search input
    if (searchInput) {
        searchInput.addEventListener('input', debounce((event) => {
            const query = event.target.value;
            searchVideos(query);
        }, 300));
    }

    // Event listener for video form submission
    if (videoForm) {
        videoForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(videoForm);
            const data = {
                title: formData.get('title'),
                tags: formData.get('tags'),
                embed: formData.get('embed')
            };
            addVideo(data);
        });
    }

    // Event listener for tab navigation
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');

            tabs.forEach(btn => btn.classList.remove('active'));
            tab.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === target) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Event listener for filters dropdown button
    if (filtersDropdownButton) {
        filtersDropdownButton.addEventListener('click', () => {
            filtersDropdown.classList.toggle('active');
        });
    }

    // Event listener for sort dropdown button
    if (sortDropdownButton) {
        sortDropdownButton.addEventListener('click', () => {
            sortDropdown.classList.toggle('active');
        });
    }

    // Event listener for clicking outside of dropdowns
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-content.active').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });

    // Event listener for filter button inside the dropdown
    if (filtersDropdown) {
        filtersDropdown.addEventListener('click', (event) => {
            if (event.target.id === 'filter-button') {
                const filterInput = document.getElementById('filter-tags').value;
                filteredVideos = allVideos.filter(video => 
                    video.tags.toLowerCase().includes(filterInput.toLowerCase())
                );
                displayVideos(filteredVideos.slice(0, limit));
                filtersDropdown.classList.remove('active'); // Hide dropdown after selection
            }
        });
    }

    // Event listener for sort button inside the dropdown
    if (sortDropdown) {
        sortDropdown.addEventListener('change', (event) => {
            const sortBy = event.target.value;
            if (sortBy === 'title') {
                filteredVideos.sort((a, b) => a.title.localeCompare(b.title));
            } else if (sortBy === 'tags') {
                filteredVideos.sort((a, b) => a.tags.localeCompare(b.tags));
            } else if (sortBy === 'date') {
                filteredVideos.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
            displayVideos(filteredVideos.slice(0, limit));
            sortDropdown.classList.remove('active'); // Hide dropdown after selection
        });
    }

    // Function to load more videos when scrolling
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

    // Function to search videos
    function searchVideos(query) {
        searchQuery = query;
        isSearchActive = query.length > 0;
        filteredVideos = allVideos.filter(video => {
            return video.title.toLowerCase().includes(query.toLowerCase()) ||
                   video.tags.toLowerCase().includes(query.toLowerCase());
        });

        page = 0;
        displayVideos(filteredVideos.slice(0, limit));
    }

    // Debounce function to limit frequency of function calls
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Event listener for scroll to load more videos
    window.addEventListener('scroll', debounce(() => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200) {
            loadMoreVideos();
        }
    }, 200));

    // Initial fetch of videos
    fetchAllVideos();
});
