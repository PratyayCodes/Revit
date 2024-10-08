const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize SQLite database
const db = new sqlite3.Database(path.resolve(__dirname, 'public/videos.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database.');
        // Create the videos table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            tags TEXT NOT NULL,
            embed TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err);
            } else {
                console.log('Table "videos" ready.');
            }
        });
    }
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Route to add a new video
app.post('/add_video', (req, res) => {
    const { title, tags, embed } = req.body;

    if (!title || !tags || !embed) {
        return res.status(400).send('All fields are required.');
    }

    const query = 'INSERT INTO videos (title, tags, embed) VALUES (?, ?, ?)';
    db.run(query, [title, tags, embed], function(err) {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).send('Error inserting data');
        }
        res.status(200).send('Video added successfully');
    });
});

// Route to get all videos
app.get('/get_videos', (req, res) => {
    db.all('SELECT * FROM videos', [], (err, rows) => {
        if (err) {
            console.error('Error fetching videos:', err);
            return res.status(500).send('Error fetching videos');
        }
        res.json({ videos: rows });
    });
});

// Route to delete a video
app.delete('/delete_video/:id', (req, res) => {
    const videoId = req.params.id;
    const query = 'DELETE FROM videos WHERE id = ?';

    db.run(query, [videoId], function(err) {
        if (err) {
            console.error('Error deleting video:', err);
            return res.status(500).send('Error deleting video');
        }
        res.status(200).send('Video deleted successfully');
    });
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});
