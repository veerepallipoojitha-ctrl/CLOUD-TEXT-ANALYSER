let db;
let firebaseFunctions;


// Wait for Firebase
window.addEventListener("firebaseReady", () => {

    db = window.firebaseDB;
    firebaseFunctions = window.firebaseFunctions;

    loadDocuments();

});


// Get HTML elements

const titleInput = document.getElementById("documentTitle");
const textInput = document.getElementById("textInput");

const analyzeBtn = document.getElementById("analyzeBtn");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const loadBtn = document.getElementById("loadBtn");

const wordCount = document.getElementById("wordCount");
const characterCount = document.getElementById("characterCount");
const sentenceCount = document.getElementById("sentenceCount");
const paragraphCount = document.getElementById("paragraphCount");

const keywordsBox = document.getElementById("keywords");
const documentsBox = document.getElementById("documents");


// Stop words

const stopWords = new Set([
    "the",
    "is",
    "a",
    "an",
    "and",
    "or",
    "but",
    "of",
    "to",
    "in",
    "on",
    "for",
    "with",
    "as",
    "at",
    "by",
    "from",
    "this",
    "that",
    "it",
    "are",
    "was",
    "were",
    "be",
    "been",
    "has",
    "have",
    "had",
    "i",
    "you",
    "he",
    "she",
    "we",
    "they",
    "my",
    "your",
    "our",
    "their"
]);


// Analyze text

function analyzeText() {

    const text = textInput.value.trim();

    if (!text) {

        alert("Please enter some text.");

        return;
    }


    // Words

    const words = text.match(/\b[\w'-]+\b/g) || [];

    // Characters

    const characters = text.length;

    // Sentences

    const sentences = text
        .split(/[.!?]+/)
        .filter(sentence => sentence.trim().length > 0);

    // Paragraphs

    const paragraphs = text
        .split(/\n+/)
        .filter(paragraph => paragraph.trim().length > 0);


    wordCount.textContent = words.length;

    characterCount.textContent = characters;

    sentenceCount.textContent = sentences.length;

    paragraphCount.textContent = paragraphs.length;


    // Keyword extraction

    const frequency = {};

    words.forEach(word => {

        const cleanWord = word
            .toLowerCase()
            .replace(/[^a-z0-9'-]/g, "");

        if (
            cleanWord.length > 2 &&
            !stopWords.has(cleanWord)
        ) {

            frequency[cleanWord] =
                (frequency[cleanWord] || 0) + 1;

        }

    });


    const keywords = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);


    keywordsBox.innerHTML = "";


    if (keywords.length === 0) {

        keywordsBox.innerHTML =
            "<span>No keywords found.</span>";

        return;
    }


    keywords.forEach(([word, count]) => {

        const span = document.createElement("span");

        span.className = "keyword";

        span.textContent = `${word} (${count})`;

        keywordsBox.appendChild(span);

    });

}


// Save document to Firebase

async function saveToCloud() {

    if (!db) {

        alert("Firebase is not ready yet.");

        return;
    }


    const title = titleInput.value.trim();

    const text = textInput.value.trim();


    if (!title) {

        alert("Please enter a document title.");

        return;
    }


    if (!text) {

        alert("Please enter some text.");

        return;
    }


    try {

        const words =
            text.match(/\b[\w'-]+\b/g) || [];

        const sentences =
            text
                .split(/[.!?]+/)
                .filter(s => s.trim().length > 0);


        await firebaseFunctions.addDoc(
            firebaseFunctions.collection(
                db,
                "documents"
            ),
            {
                title: title,
                text: text,
                wordCount: words.length,
                characterCount: text.length,
                sentenceCount: sentences.length,
                createdAt: new Date().toISOString()
            }
        );


        alert("✅ Document saved to cloud!");

        loadDocuments();

    }

    catch (error) {

        console.error(error);

        alert(
            "Error saving document: " +
            error.message
        );

    }

}


// Load cloud documents

async function loadDocuments() {

    if (!db) {
        return;
    }


    documentsBox.innerHTML =
        "<p class='empty'>Loading...</p>";


    try {

        const querySnapshot =
            await firebaseFunctions.getDocs(
                firebaseFunctions.collection(
                    db,
                    "documents"
                )
            );


        documentsBox.innerHTML = "";


        if (querySnapshot.empty) {

            documentsBox.innerHTML =
                "<p class='empty'>No cloud documents found.</p>";

            return;
        }


        querySnapshot.forEach((documentSnapshot) => {

            const data =
                documentSnapshot.data();

            const div =
                document.createElement("div");

            div.className = "document";


            const title =
                document.createElement("h3");

            title.textContent =
                "📄 " + data.title;


            const preview =
                document.createElement("p");

            preview.textContent =
                data.text.length > 150
                    ? data.text.substring(0, 150) + "..."
                    : data.text;


            const info =
                document.createElement("small");

            info.textContent =
                `Words: ${data.wordCount} | ` +
                `Characters: ${data.characterCount} | ` +
                `Sentences: ${data.sentenceCount}`;


            const deleteButton =
                document.createElement("button");

            deleteButton.textContent =
                "Delete";


            deleteButton.onclick = () => {

                deleteDocument(
                    documentSnapshot.id
                );

            };


            div.appendChild(title);

            div.appendChild(preview);

            div.appendChild(info);

            div.appendChild(
                document.createElement("br")
            );

            div.appendChild(deleteButton);


            documentsBox.appendChild(div);

        });

    }

    catch (error) {

        console.error(error);

        documentsBox.innerHTML =
            "<p class='empty'>Unable to load documents.</p>";

    }

}


// Delete document

async function deleteDocument(id) {

    if (!confirm("Delete this document?")) {
        return;
    }


    try {

        await firebaseFunctions.deleteDoc(
            firebaseFunctions.doc(
                db,
                "documents",
                id
            )
        );


        alert("Document deleted.");

        loadDocuments();

    }

    catch (error) {

        console.error(error);

        alert(
            "Error deleting document: " +
            error.message
        );

    }

}


// Buttons

analyzeBtn.addEventListener(
    "click",
    analyzeText
);


saveBtn.addEventListener(
    "click",
    saveToCloud
);


clearBtn.addEventListener(
    "click",
    () => {

        titleInput.value = "";

        textInput.value = "";

        wordCount.textContent = "0";

        characterCount.textContent = "0";

        sentenceCount.textContent = "0";

        paragraphCount.textContent = "0";

        keywordsBox.innerHTML =
            "No keywords yet.";

    }
);


loadBtn.addEventListener(
    "click",
    loadDocuments
);