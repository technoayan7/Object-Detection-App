require('dotenv').config();
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route to handle image upload and object detection
app.post('/api/detect', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded.' });
        }

        // Convert image buffer to base64
        const imageBase64 = req.file.buffer.toString('base64');

        // Send POST request to Roboflow API
        const response = await axios({
            method: 'POST',
            url: process.env.ROBOFLOW_MODEL_URL,
            params: {
                api_key: process.env.ROBOFLOW_API_KEY
            },
            data: imageBase64,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // Return detection results
        res.json(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'An error occurred during detection.' });
    }
});

// Serve frontend URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
