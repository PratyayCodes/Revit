document.addEventListener('DOMContentLoaded', () => {
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

    let page = 0;
    const limit = 10;
    let loading = false;
    let allVideos = [];
    let filteredVideos = [];
    let videoToDelete = null;

    // Function to fetch and display videos
    const loadVideos = async () => {
        try {
            const response = await fetch('/get_videos');
            const data = await response.json();
            allVideos = data.videos;
            filteredVideos = allVideos;
            displayVideos(filteredVideos.slice(0, limit));
        } catch (error) {
            console.error('Error fetching videos:', error);
        }
    };

    // Function to display videos
    const displayVideos = (videos, append = false) => {
        const fragment = document.createDocumentFragment();

        if (!append) {
            videoList.innerHTML = '';
        }

        videos.forEach(video => {
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.innerHTML = `
                <h3>${video.title}</h3>
                <iframe src="${video.embed}" frameborder="0" allowfullscreen></iframe>
                <button class="delete-button" data-id="${video.id}">🗑️ Delete</button>
            `;
            fragment.appendChild(videoItem);
        });

        videoList.appendChild(fragment);
        loading = false;
        const loadingElement = document.getElementById('loading');
        if (loadingElement) loadingElement.style.display = 'none';
    };

    // Function to add a video
    const addVideo = async (data) => {
        try {
            const response = await fetch('/add_video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(data)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            await loadVideos(); // Reload videos after addition
        } catch (error) {
            console.error('Error adding video:', error);
            document.getElementById('form-message').innerText = 'Error adding video. Please try again.';
        }
    };

    // Function to delete a video
    const deleteVideo = async (id) => {
        try {
            await fetch(`/delete_video/${id}`, { method: 'DELETE' });
            await loadVideos(); // Reload videos after deletion
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
        searchInput.addEventListener('input', debounce(handleSearch, 300));
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

    // Event listener for sort dropdown change
    if (sortDropdown) {
        sortDropdown.addEventListener('change', () => {
            const sortBy = sortDropdown.value;
            filteredVideos = applySort(filteredVideos, sortBy);
            displayVideos(filteredVideos.slice(0, limit));
            sortDropdown.classList.remove('active'); // Hide dropdown after selection
        });
    }

    // Apply sort logic
    function applySort(videos, sortBy) {
        switch (sortBy) {
            case 'title':
                return videos.sort((a, b) => a.title.localeCompare(b.title));
            case 'date':
                return videos.sort((a, b) => new Date(b.date) - new Date(a.date));
            default:
                return videos;
        }
    }

    // Initial load of videos
    loadVideos();

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Function to handle search input
    const handleSearch = () => {
        const searchTerm = searchInput.value.toLowerCase();
        filteredVideos = allVideos.filter(video => 
            video.title.toLowerCase().includes(searchTerm) ||
            video.tags.toLowerCase().includes(searchTerm)
        );
        page = 0;
        displayVideos(filteredVideos.slice(0, limit));
    };

    // Function to handle scroll event
    const handleScroll = debounce(() => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200) {
            loadMoreVideos();
        }
    }, 200);

    // Function to load more videos
    const loadMoreVideos = () => {
        if (loading) return;

        loading = true;
        const start = page * limit;
        const end = start + limit;
        const currentEntries = filteredVideos.slice(start, end);

        if (currentEntries.length > 0) {
            displayVideos(currentEntries, true);
            page++;
        } else {
            const loadingElement = document.getElementById('loading');
            if (loadingElement) loadingElement.style.display = 'none';
        }

        loading = false;
    };

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
});
