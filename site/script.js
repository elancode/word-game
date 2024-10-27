// site/script.js

document.addEventListener('DOMContentLoaded', () => {
    const currentWordElement = document.getElementById('current-word');
    const userInputElement = document.getElementById('user-input');
    const submitButton = document.getElementById('submit-word');
    const restartButton = document.getElementById('restart-game');
    const messagesElement = document.getElementById('messages');
    const turnCountElement = document.getElementById('turn-count');
    const wordListElement = document.getElementById('word-list');

    let turnCount = 0;
    let wordsPlayed = [];

    // Function to fetch a random 4-character word from the Random Word API
    const fetchRandomWord = () => {
        fetch('https://random-word-api.herokuapp.com/word?length=4&number=1') // Requesting a single 4-character word
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const randomWord = data[0].toLowerCase(); // Convert to lowercase
                startGame(randomWord);
            })
            .catch(error => {
                messagesElement.textContent = 'Error fetching random word: ' + error.message;
            });
    };

    // Function to start the game with the given word
    const startGame = (word) => {
        currentWordElement.textContent = word;
        turnCountElement.textContent = turnCount;
        wordsPlayed.push(word);
        updateWordList();
    };

    // Function to validate if a word is an English word using the Datamuse API
    const isValidWord = (word) => {
        // Check if the word contains only letters a-z
        const regex = /^[a-z]+$/; // Only allow lowercase letters a-z
        if (!regex.test(word)) {
            return Promise.resolve(false); // Immediately return false if invalid
        }

        return fetch(`https://api.datamuse.com/words?sp=${word}&max=1`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                return data.length > 0; // If the response has any words, it's valid
            })
            .catch(error => {
                messagesElement.textContent = 'Error validating word: ' + error.message;
                return false; // Assume invalid if there's an error
            });
    };

    // Function to validate the move
    const isValidMove = (currentWord, newWord) => {
        // Check if the new word has already been played
        if (wordsPlayed.includes(newWord)) {
            return false;
        }

        // Check if the new word is one letter different or one letter longer
        if (newWord.length === currentWord.length) {
            // Check for one letter change
            let differences = 0;
            for (let i = 0; i < currentWord.length; i++) {
                if (currentWord[i] !== newWord[i]) {
                    differences++;
                }
            }
            return differences === 1; // Must differ by exactly one letter
        } else if (newWord.length === currentWord.length + 1) {
            // Check for one letter addition
            for (let i = 0; i <= newWord.length; i++) {
                const modifiedWord = newWord.slice(0, i) + newWord.slice(i + 1);
                if (modifiedWord === currentWord) {
                    return true; // Valid addition
                }
            }
        }
        return false; // Not a valid move
    };

    // Function to submit a new word
    const submitWord = () => {
        const userInput = userInputElement.value.trim().toLowerCase(); // Convert user input to lowercase
        if (userInput) {
            // Validate user input
            isValidWord(userInput).then(valid => {
                if (!valid) {
                    messagesElement.textContent = 'Please enter a valid English word using letters a-z only.';
                    userInputElement.value = ''; // Clear input field
                    return; // Exit the function
                }

                // Validate the move
                if (!isValidMove(currentWordElement.textContent, userInput)) {
                    messagesElement.textContent = 'Please enter a valid move (change one letter or add one letter).';
                    userInputElement.value = ''; // Clear input field
                    return; // Exit the function
                }

                turnCount++;
                currentWordElement.textContent = userInput;
                turnCountElement.textContent = turnCount;
                wordsPlayed.push(userInput);
                updateWordList();
                messagesElement.textContent = 'Word submitted successfully!';
                userInputElement.value = ''; // Clear input field

                // Generate computer's turn using the API
                generateComputerTurn(userInput);
            });
        } else {
            messagesElement.textContent = 'Please enter a word.';
        }
    };

    // Function to generate the computer's turn using the API
    const generateComputerTurn = (currentWord) => {
        fetch('http://35.226.57.73:3000/generate-word/api', {
            method: 'POST', // Use POST method
            headers: {
                'Content-Type': 'application/json' // Set the content type to JSON
            },
            body: JSON.stringify({ currentWord: currentWord }) // Send the current word in the request body
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const computerWord = data.newWord.toLowerCase(); // Convert computer's word to lowercase
            console.log('Generated word by computer:', computerWord); // Print the generated word to the console

            // Validate computer's word
            isValidWord(computerWord).then(valid => {
                if (valid && isValidMove(currentWord, computerWord)) {
                    turnCount++;
                    currentWordElement.textContent = computerWord;
                    turnCountElement.textContent = turnCount;
                    wordsPlayed.push(computerWord);
                    updateWordList();
                    messagesElement.textContent = 'Computer submitted: ' + computerWord;
                } else {
                    // If the computer's word is invalid, generate a new word
                    generateComputerTurn(currentWord); // Recursively call to generate a new word
                }
            });
        })
        .catch(error => {
            messagesElement.textContent = 'Error generating computer word: ' + error.message;
        });
    };

    // Function to update the word list display
    const updateWordList = () => {
        wordListElement.innerHTML = ''; // Clear existing list
        wordsPlayed.forEach(word => {
            const listItem = document.createElement('li');
            listItem.textContent = word;
            wordListElement.appendChild(listItem);
        });
    };

    // Function to restart the game
    const restartGame = () => {
        turnCount = 0;
        wordsPlayed = [];
        messagesElement.textContent = 'Game restarted!';
        fetchRandomWord(); // Fetch a new random word when restarting
    };

    // Event listeners
    submitButton.addEventListener('click', submitWord);
    restartButton.addEventListener('click', restartGame);

    // Start the game with a random 4-character word
    fetchRandomWord();
});
