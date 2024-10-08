const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const BATCH_SIZE = 5; // Adjust this number as needed

// Initialize SQLite database
const db = new sqlite3.Database(path.resolve(__dirname, 'public/videos.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Function to generate thumbnail
function generateThumbnail(videoUrl, videoId) {
    const thumbnailPath = path.resolve(__dirname, 'public/thumbnail', `${videoId}.webp`);

    // Check if the thumbnail already exists
    if (fs.existsSync(thumbnailPath)) {
        console.log(`Thumbnail already exists for ${videoId}: ${thumbnailPath}`);
        return; // Skip thumbnail generation
    }

    // Use ffmpeg to generate thumbnail
    const command = `ffmpeg -i "${videoUrl}" -ss 00:00:01.000 -vframes 1 -y "${thumbnailPath}"`;

    exec(command, (error) => {
        if (error) {
            console.error(`Error generating thumbnail for ${videoId}:`, error);
        } else {
            console.log(`Thumbnail generated for ${videoId}: ${thumbnailPath}`);
        }
    });
}

// Fetch all videos and generate thumbnails in batches
function processVideos(offset = 0) {
    db.all('SELECT embed, id FROM videos LIMIT ? OFFSET ?', [BATCH_SIZE, offset], (err, rows) => {
        if (err) {
            console.error('Error fetching videos:', err);
            return;
        }

        if (rows.length === 0) {
            console.log('All videos processed.');
            db.close();
            return;
        }

        rows.forEach(row => {
            generateThumbnail(row.embed, row.id);
        });

        // Process the next batch
        setTimeout(() => processVideos(offset + BATCH_SIZE), 1000); // Wait 1 second before processing the next batch
    });
}

// Start processing videos
processVideos();
