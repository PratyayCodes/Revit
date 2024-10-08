document.addEventListener('DOMContentLoaded', () => {
    const { title, tags, embed, id } = getQueryParams();

    if (title && tags && embed) {
        document.getElementById('video-player').innerHTML = `
            <div class="video-embed">
                <iframe src="${embed}" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
        document.getElementById('video-info').innerHTML = `
            <h1>${title}</h1>
            <p>${tags}</p>
        `;

        // Fetch related videos
        fetchRelatedVideos(tags, id).then(videos => {
            displayRelatedVideos(videos);
        });
    } else {
        document.getElementById('video-info').innerHTML = '<p>Video information not available.</p>';
    }
});

// Function to get query parameters from the URL
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        title: params.get('title'),
        tags: params.get('tags'),
        embed: params.get('embed'),
        id: params.get('id') // Ensure that the video ID is part of the query parameters
    };
}

// Function to fetch related videos based on tags, excluding the current video
async function fetchRelatedVideos(tags, excludeId) {
    try {
        const response = await fetch(`/get_related_videos?tags=${encodeURIComponent(tags)}&excludeId=${encodeURIComponent(excludeId)}`);
        const data = await response.json();
        if (response.ok) {
            return data.videos;
        } else {
            console.error('Error fetching related videos:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Error fetching related videos:', error);
        return [];
    }
}

// Function to display related videos
function displayRelatedVideos(videos) {
    const relatedVideosContainer = document.getElementById('related-videos');
    relatedVideosContainer.innerHTML = ''; // Clear existing content

    if (videos.length === 0) {
        relatedVideosContainer.innerHTML = '<p>No related videos found.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';

        // Create thumbnail image element
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
        videoCard.innerHTML = `
            <div class="thumbnail">
                ${thumbnailImg.outerHTML}
            </div>
            <div class="card-info">
                <h3>${video.title}</h3>
                <p>${video.tags}</p>
            </div>
        `;

        // Add click event to redirect to video.html with video details
        videoCard.addEventListener('click', () => {
            window.location.href = `video.html?id=${video.id}&title=${encodeURIComponent(video.title)}&tags=${encodeURIComponent(video.tags)}&embed=${encodeURIComponent(video.embed)}`;
        });

        fragment.appendChild(videoCard);
    });

    relatedVideosContainer.appendChild(fragment);
}
