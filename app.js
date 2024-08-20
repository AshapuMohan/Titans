const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const scanButton = document.getElementById('scanButton');
const typeButton = document.getElementById('typeButton');
const barcodeInput = document.getElementById('barcodeInput');
const resultsElement = document.getElementById('results');
const context = canvas.getContext('2d');

// Request access to the device's camera
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => {
        console.error('Error accessing the camera', error);
        resultsElement.textContent = 'Error accessing the camera.';
    });

// Event listener for the scan button
scanButton.addEventListener('click', async () => {
    // Draw the current frame from the video feed onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');
    const imageBase64 = imageData.split(',')[1];

    // Detect barcode from the captured image
    const barcode = await getBarcodeFromImage(imageBase64);
    if (barcode) {
        fetchProductDetailsFromUPCItemDB(barcode);
    } else {
        resultsElement.textContent = 'No barcode found. Please try again.';
    }
});

// Event listener for the type button
typeButton.addEventListener('click', () => {
    const typedBarcode = barcodeInput.value.trim();
    if (typedBarcode) {
        fetchProductDetailsFromUPCItemDB(typedBarcode);
    } else {
        resultsElement.textContent = 'Please enter a valid barcode.';
    }
});

// Function to extract barcode from the image using Google Vision API
async function getBarcodeFromImage(imageBase64) {
    const apiKey = 'YOUR_GOOGLE_CLOUD_VISION_API_KEY'; // Replace with your Vision API key

    try {
        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { content: imageBase64 },
                    features: [{ type: 'TEXT_DETECTION' }]
                }]
            })
        });

        const data = await response.json();
        const textAnnotations = data.responses[0].textAnnotations;

        if (textAnnotations && textAnnotations.length > 0) {
            const barcode = textAnnotations[0].description.trim().match(/\d+/)[0];
            return barcode;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error with Vision API:', error);
        return null;
    }
}

// Function to fetch product details using UPCItemDB API
async function fetchProductDetailsFromUPCItemDB(barcode) {
    resultsElement.textContent = `Fetching details for barcode: ${barcode}...`;

    try {
        const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Error fetching product details:', response.status, response.statusText);
            resultsElement.textContent = 'Error fetching product details. Please try again later.';
            return;
        }

        const data = await response.json();
        console.log('UPCItemDB API Response:', data);

        if (data && data.items && data.items.length > 0) {
            const item = data.items[0];
            const productName = item.title || 'Unknown Product';
            const brandName = item.brand || 'Unknown Brand';
            const description = item.description || 'No description available';
            const imageURL = item.images && item.images.length > 0 ? item.images[0] : '';

            resultsElement.innerHTML = `
                <strong>Product Name:</strong> ${productName}<br>
                <strong>Brand:</strong> ${brandName}<br>
                <strong>Description:</strong> ${description}<br>
                ${imageURL ? `<img src="${imageURL}" alt="${productName}" width="100"><br>` : ''}
                Checking recyclability...
            `;

            checkRecyclability(barcode);
        } else {
            resultsElement.textContent = `Barcode: ${barcode} - Product not found in UPCItemDB database`;
        }
    } catch (error) {
        console.error('Error fetching product details from UPCItemDB:', error);
        resultsElement.textContent = 'Error fetching product details. Please try again later.';
    }
}


// Updated function to check if the product packaging is recyclable
function checkRecyclability(barcode) {
    // Here you can reuse the fetchProductDetailsFromUPCItemDB function
    // or call an additional API for recyclability information.
    // For simplicity, we're reusing the function here.

    fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.items && data.items.length > 0) {
            const item = data.items[0];
            const description = item.description || '';

            if (description.toLowerCase().includes('recyclable')) {
                resultsElement.innerHTML += `<strong>Recyclability:</strong> Recyclable packaging`;
            } else {
                resultsElement.innerHTML += `<strong>Recyclability:</strong> Not Recyclable packaging`;
            }
        } else {
            resultsElement.innerHTML += `<strong>Recyclability:</strong> Product not found in recyclability database`;
        }
    })
    .catch(error => {
        console.error('Error fetching recyclability:', error);
        resultsElement.innerHTML += 'Error checking recyclability. Please try again later.';
    });
}
