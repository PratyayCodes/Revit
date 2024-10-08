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
    const formMessage = document.getElementById('form-message');

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

            // Use the pre-generated thumbnail from public/thumbnail/
            const thumbnailSrc = `/thumbnail/${video.id}.webp`;

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

            fragment.appendChild(card);
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
            // Reload the page after adding video
            window.location.reload();
        } catch (error) {
            console.error('Error adding video:', error);
            formMessage.textContent = 'Error adding video. Please try again.';
        }
    };

    // Function to delete a video
    const deleteVideo = async (id) => {
        try {
            await fetch(`/delete_video/${id}`, { method: 'DELETE' });
            // Reload the page after deleting video
            window.location.reload();
        } catch (error) {
            console.error('Error deleting video:', error);
        }
    };

    // Function to show the modal
    function showModal(modal) {
        modal.style.display = 'flex';
    }

    // Function to hide the modal
    function hideModal(modal) {
        modal.style.display = 'none';
    }

    // Function to show the confirmation modal
    const showConfirmModal = (id) => {
        videoToDelete = id;
        showModal(confirmModal);
    };

    // Function to hide the confirmation modal
    const hideConfirmModal = () => {
        hideModal(confirmModal);
        videoToDelete = null;
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
    successModalClose.addEventListener('click', () => {
        hideModal(successModal);
        // Refresh the page after closing the success modal
        window.location.reload();
    });

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

    // Function to handle scroll event
    window.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

        if (scrollTop + clientHeight >= scrollHeight - 5) { // Load more videos when nearing the bottom
            loadMoreVideos();
        }
    });

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

    // Debounce function to limit the rate of input events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize the app by fetching videos
    fetchAllVideos();
});
