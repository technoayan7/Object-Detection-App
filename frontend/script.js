
const themeSwitch = document.getElementById('theme-switch');
const themeLabel = document.getElementById('theme-label');

// Check local storage for theme preference on page load
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') {
        enableLightTheme();
        themeSwitch.checked = true;
        themeLabel.textContent = 'Light Mode';
    } else {
        enableDarkTheme();
        themeLabel.textContent = 'Dark Mode';
    }
});

// Event listener for theme toggle
themeSwitch.addEventListener('change', () => {
    if (themeSwitch.checked) {
        enableLightTheme();
        themeLabel.textContent = 'Light Mode';
        localStorage.setItem('theme', 'light');
    } else {
        enableDarkTheme();
        themeLabel.textContent = 'Dark Mode';
        localStorage.setItem('theme', 'dark');
    }
});

// Functions to enable light and dark themes
function enableLightTheme() {
    document.body.classList.add('light-theme');
    document.querySelector('.container').classList.add('light-theme');
    document.getElementById('theme-label').classList.add('light-theme');
    document.getElementById('uploaded-image').classList.add('light-theme');
    document.getElementById('bounding-canvas').classList.add('light-theme');
}

function enableDarkTheme() {
    document.body.classList.remove('light-theme');
    document.querySelector('.container').classList.remove('light-theme');
    document.getElementById('theme-label').classList.remove('light-theme');
    document.getElementById('uploaded-image').classList.remove('light-theme');
    document.getElementById('bounding-canvas').classList.remove('light-theme');
}

// Existing code for image upload and detection below...
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('image-input');
    if (fileInput.files.length === 0) {
        alert('Please select an image file.');
        return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    // Display loading message
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Detecting objects...</p>';

    try {
        const response = await fetch('/api/detect', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            resultsDiv.innerHTML = `<p>Error: ${errorData.error}</p>`;
            return;
        }

        const data = await response.json();

        // Display the original image
        const imageElement = document.getElementById('uploaded-image');
        const imageURL = URL.createObjectURL(fileInput.files[0]);

        console.log('Setting image source to:', imageURL); // Debugging log
        imageElement.src = imageURL;

        // Once the image is loaded, draw bounding boxes
        imageElement.onload = () => {
            console.log('Image loaded successfully. Drawing bounding boxes.');
            const canvas = document.getElementById('bounding-canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions to match the image's displayed size
            canvas.width = imageElement.clientWidth;
            canvas.height = imageElement.clientHeight;

            // Clear any previous drawings
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Define a color map for different classes
            const classColors = {
                'person': '#FF0000',
                'car': '#00FF00',
                'bicycle': '#0000FF',
                // Add more classes and colors as needed
            };

            // Calculate scaling factors based on displayed image size vs original image size
            const scaleX = imageElement.clientWidth / data.image.width;
            const scaleY = imageElement.clientHeight / data.image.height;

            // Draw bounding boxes
            data.predictions.forEach(prediction => {
                const { x, y, width, height, confidence, class: className } = prediction;

                // Calculate top-left corner with scaling
                const rectX = (x - width / 2) * scaleX;
                const rectY = (y - height / 2) * scaleY;
                const rectWidth = width * scaleX;
                const rectHeight = height * scaleY;

                // Choose color based on class
                const color = classColors[className] || '#00FF00'; // Default to green if class not defined

                // Set styles
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.font = '16px Arial';
                ctx.fillStyle = 'rgba(0, 255, 198, 0.7)'; // Semi-transparent for background

                // Draw rectangle
                ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

                // Draw label background
                const label = `${className} (${(confidence * 100).toFixed(1)}%)`;
                const textWidth = ctx.measureText(label).width;
                const textHeight = 16; // Approximate height

                ctx.fillRect(rectX, rectY - textHeight, textWidth + 4, textHeight);

                // Draw label text
                ctx.fillStyle = '#000000'; // Black text
                ctx.fillText(label, rectX + 2, rectY - 4);
                ctx.fillStyle = 'rgba(0, 255, 198, 0.7)'; // Reset fill style for next box
            });

            // Create and display a download button for the annotated image
            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'Download Annotated Image';
            downloadButton.style.marginTop = '10px';
            downloadButton.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = 'annotated-image.png';
                link.href = canvas.toDataURL();
                link.click();
            });

            // Clear previous content and add the download button
            resultsDiv.innerHTML = ''; // Clear loading message
            resultsDiv.appendChild(downloadButton);
        };

        // Handle image loading errors
        imageElement.onerror = () => {
            console.error('Failed to load the image.');
            resultsDiv.innerHTML = '<p>Error: Failed to load the image.</p>';
        };
    } catch (error) {
        console.error(error);
        resultsDiv.innerHTML = `<p>An error occurred while detecting objects.</p>`;
    }
});

