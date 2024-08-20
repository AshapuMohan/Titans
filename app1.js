// Replace with the actual API endpoint
const apiEndpoint = 'https://api.example.com/recyclability';

function checkRecyclability() {
    const barcode = document.getElementById('barcode').value;

    if (barcode) {
        fetch(`${apiEndpoint}?barcode=${barcode}`)
            .then(response => response.json())
            .then(data => {
                displayResult(data);
            })
            .catch(error => {
                console.error('Error:', error);
                displayResult({ error: 'Could not retrieve information.' });
            });
    } else {
        alert('Please enter a barcode.');
    }
}

function scanBarcode() {
    const scanner = document.getElementById('scanner').files[0];

    if (scanner) {
        const formData = new FormData();
        formData.append('file', scanner);

        fetch(apiEndpoint, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            displayResult(data);
        })
        .catch(error => {
            console.error('Error:', error);
            displayResult({ error: 'Could not retrieve information.' });
        });
    }
}

function displayResult(data) {
    const resultDiv = document.getElementById('result');

    if (data.error) {
        resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
    } else if (data.recyclable) {
        resultDiv.innerHTML = `
            <p>This item is recyclable.</p>
            <p>Recycling Instructions: ${data.instructions}</p>
        `;
    } else {
        resultDiv.innerHTML = `<p>This item is not recyclable.</p>`;
    }
}
//backend
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const mockDatabase = {
    '123456789012': { recyclable: true, instructions: 'Place in the blue recycling bin.' },
    '987654321098': { recyclable: false }
};

app.get('/recyclability', (req, res) => {
    const { barcode } = req.query;

    if (mockDatabase[barcode]) {
        res.json(mockDatabase[barcode]);
    } else {
        res.json({ error: 'Barcode not found.' });
    }
});

app.listen(port, () => {
    console.log(`API listening at http://localhost:${port}`);
});
