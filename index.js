const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

const serviceAccount = require('./credentials.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://guess-the-card-4d016.firebaseio.com"
});

const db = admin.firestore();

app.use(express.json());


app.get('/attempts', async (req, res) => {
    try {
        //get score number and average attempts
        const { collection } = req.params;
        const snapshot = await db.collection("winners").get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No documents found.' });
        }

        const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'Failed to fetch documents.', error: error.message });
    }
});

app.post('/winner', async (req, res) => {
    try {
        // add ip, date, attempts
        const { collection, data } = req.body;
        if (!collection || !data) {
            return res.status(400).json({ message: 'Collection and data are required.' });
        }

        const docRef = await db.collection(collection).add(data);
        res.status(201).json({ message: 'Document added successfully.', id: docRef.id });
    } catch (error) {
        console.error('Error adding document:', error);
        res.status(500).json({ message: 'Failed to add document.', error: error.message });
    }
});

app.get('/daily', async (req, res) => {

    const date = getDate();
    res.status(200).json({ cardId: getRandomNumberForDate(date) });

});



function getRandomNumberForDate(date) {
    const hash = crypto.createHash('sha256').update(date).digest('hex');

    const randomNumber = parseInt(hash, 16) % 163 + 1;
    return randomNumber;
}


function getDate() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(now);
}



//usage
const date = "2024-12-29";
console.log(`Random number for ${date}: ${getRandomNumberForDate(date)}`);




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
