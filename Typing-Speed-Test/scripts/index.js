/* =========================
   DOM References
========================= */

/* Test Area */
const textContainer = document.querySelector(".text-container");
const textBoxContainer = document.querySelector(".text-box");
const textBox = document.getElementById("text-box");
const inputField = document.getElementById("text-input");

/* Controls */
const startButton = document.getElementById("start-button");
const restartTestButton = document.querySelector(".restart-test-button");

/* Live Stats */
const statsContainer = document.querySelector(".stats-container");
const timeValue = document.getElementById("time-value");
const wpmValue = document.getElementById("wpm-value");
const accuracyValue = document.getElementById("accuracy-value");
const scoreDisplay = document.getElementById("score");

/* Settings */
const easyButton = document.getElementById("easy-button");
const mediumButton = document.getElementById("medium-button");
const hardButton = document.getElementById("hard-button");
const timedButton = document.getElementById("timed-mode");
const passageButton = document.getElementById("passage-mode");

/* Mobile Settings */
const mobileSelects = document.querySelectorAll(".mobile-select");
const mobileSelectButtons = document.querySelectorAll(".mobile-select-button");
const mobileDifficultyRadios = document.querySelectorAll('input[name="difficulty"]');
const mobileModeRadios = document.querySelectorAll('input[name="mode"]');
const mobileDifficultyLabel = document.querySelector(".difficulty-select")
.querySelector(".mobile-select-label");
const mobileModeLabel = document.querySelector(".mode-select")
.querySelector(".mobile-select-label");

/* Results */
const resultsScreens = document.querySelectorAll(".results-screen");
const resultsWpm = document.querySelectorAll(".results-wpm-value");
const resultsAccuracy = document.querySelectorAll(".results-accuracy-value");
const resultsCorrect = document.querySelectorAll(".results-correct");
const resultsIncorrect = document.querySelectorAll(".results-incorrect");
const resultCharacterValues = document.querySelectorAll(".results-character-count-value");
const actionButtons = document.querySelectorAll(".action-button");

/* Footer */
const testFooter = document.querySelector(".test-footer");

/* =========================
   Application State
========================= */

/* Passage Data */
let currentText = "";
let passages = null;

/* User Settings */
let testMode = localStorage.getItem("testMode") || "timed";
let difficulty = localStorage.getItem("difficulty") || "hard";

/* Timer */
let timeRemaining = 60;
let elapsedTime = 0;

/* Test Status */
let timerStarted = false;
let timerInterval = null;
let startTime = null;
let testEnded = false;

/* High Score */
let highScore = Number(localStorage.getItem("highScore")) || 0;
let hasCompletedTest = localStorage.getItem("hasCompletedTest") === "true";

/* =========================
   Initialization
========================= */

function initializeApp() {
    
    updateTimerDisplay();

    scoreDisplay.textContent = `${highScore} WPM`;
    
    updateSettingsUI();

    loadPassages();

}

initializeApp();

function loadPassages() {
    
    fetch("scripts/data.json")
        .then((response) => response.json())
        .then((data) => {
    
            passages = data;

            loadPassage();

            inputField.addEventListener("input", () => {
        
                if (!timerStarted) {
                beginTest();
                }
        
                const characters = document.querySelectorAll("#text-box span");
        
                const typedText = inputField.value;
        
                characters.forEach((character, index) => {
                    character.classList.remove("correct", "incorrect", "current");
                    
                    if (typedText[index] === character.textContent) {
                        
                        character.classList.add("correct");
                        
                    } else if (typedText[index]) {
                        
                        character.classList.add("incorrect");
                        
                    }
            
                });
        
                if (characters[typedText.length]) {
                    characters[typedText.length].classList.add("current");
                }
        
                updateStats();
        
                if (typedText.length === currentText.length) {
                    endTest();
                }
        
            });
        })
    .catch((err) => console.error(err));  
}

/* =========================
   Event Listeners
========================= */

/* Desktop Controls */
easyButton.addEventListener("click", () => {
    difficulty = "easy";
    localStorage.setItem("difficulty", difficulty);
    updateSettingsUI();
    resetTest(false);
});

mediumButton.addEventListener("click", () => {
    difficulty = "medium";
    localStorage.setItem("difficulty", difficulty);
    updateSettingsUI();
    resetTest(false);
});

hardButton.addEventListener("click", () => {
    difficulty = "hard";
    localStorage.setItem("difficulty", difficulty);
    updateSettingsUI();
    resetTest(false);
});

timedButton.addEventListener("click", () => {
    testMode = "timed";
    localStorage.setItem("testMode", testMode);
    updateSettingsUI();
    resetTest(false);
});

passageButton.addEventListener("click", () => {
    testMode = "passage";
    localStorage.setItem("testMode", testMode);
    updateSettingsUI();
    resetTest(false);
});

/* Test Controls */
startButton.addEventListener("click", beginTest);

textBox.addEventListener("click", beginTest);

restartTestButton.addEventListener("click", () => {
    resetTest();
});

actionButtons.forEach((button) => {

    button.addEventListener("click", () => {

        resultsScreens.forEach((screen) => {
            screen.classList.add("hidden");
        });

        resetTest();

    });

});

/* Mobile Controls */
mobileSelectButtons.forEach((button) => {

    button.addEventListener("click", (event) => {
        
        event.stopPropagation();

        const parent = button.closest(".mobile-select");

        mobileSelects.forEach((select) => {
            if (select !== parent) {
                select.classList.remove("open");
            }
        });

        parent.classList.toggle("open");

    });
    
});

mobileSelects.forEach((select) => {

    select.addEventListener("click", (event) => {
        event.stopPropagation();
    });

});

mobileDifficultyRadios.forEach((radio) => {

    radio.addEventListener("change", () => {

        difficulty = radio.value;
        
        localStorage.setItem("difficulty", difficulty);

        updateSettingsUI();

        resetTest(false);

        radio.closest(".mobile-select")
            .classList.remove("open");
        
        mobileDifficultyLabel.textContent =
            radio.value.charAt(0).toUpperCase() + radio.value.slice(1);

    });

});

mobileModeRadios.forEach((radio) => {

    radio.addEventListener("change", () => {

        testMode = radio.value;
        
        localStorage.setItem("testMode", testMode);

        mobileModeLabel.textContent =
            radio.value === "timed"
                ? "Timed (60s)"
                : "Passage";

        updateSettingsUI();
        
        resetTest(false);

        radio.closest(".mobile-select")
            .classList.remove("open");

    });

});

/* Global Events */
document.addEventListener("click", (event) => {

    const clickedInsideDropdown = event.target.closest(".mobile-select");

    if (!clickedInsideDropdown) {

        mobileSelects.forEach((select) => {
            select.classList.remove("open");
        });

    }

});

/* =========================
   Test Logic
========================= */

function loadPassage() {
    
    const difficultyPassages = passages[difficulty];
    
    const randomIndex = Math.floor(
        Math.random() * difficultyPassages.length
    );

    currentText = difficultyPassages[randomIndex].text;

    textBox.innerHTML = "";

    currentText.split("").forEach((character) => {
        
        const span = document.createElement("span");
        
        span.textContent = character;

        textBox.appendChild(span);
    });
    
    inputField.focus();
}

function beginTest() {

    if (timerStarted) {
        return;
    }
    
    testFooter.classList.remove("hidden");

    textBoxContainer.classList.remove("inactive");
    textBoxContainer.classList.add("active");

    document.querySelector(".button-container").classList.add("hidden");
    
    showTestFooter();

    startTime = Date.now();

    startTimer();

    timerStarted = true;

    updateActionButton("restart");

    inputField.focus();
    
}

function resetTest(showTypingArea = false) {
    
    statsContainer.classList.remove("hidden");
    textContainer.classList.remove("hidden");
    
    if (showTypingArea) {
        textBoxContainer.classList.remove("inactive");
        textBoxContainer.classList.add("active");
    }
    
    clearInterval(timerInterval);
    timerInterval = null;
    
    resultsScreens.forEach((screen) => {
        screen.classList.add("hidden");
    });

    inputField.disabled = false;
    inputField.value = "";

    timerStarted = false;
    startTime = null;
    testEnded = false;

    if (testMode === "timed") {
        timeRemaining = 60;
    } else {
        elapsedTime = 0;
    }

    timeValue.classList.remove("active");

    updateTimerDisplay();

    loadPassage();

    resetStats();
    
    updateActionButton("restart");
    
    inputField.focus();
    
    testFooter.classList.add("hidden");
    
    testFooter.classList.remove("visible");
    
}

function endTest() {
    
    if (testEnded) {
        return;
    }
    
    testEnded = true;
    
    clearInterval(timerInterval);
    timerInterval = null;
    
    timeValue.classList.remove("active");
    
    inputField.disabled = true;
    
    statsContainer.classList.add("hidden");
    textContainer.classList.add("hidden");

    calculateResults();
    
    testFooter.classList.add("hidden");
    
}

/* =========================
   Typing Stats
========================= */

function updateStats() {

    const typedCharacters = inputField.value.length;

    const correctCharacters = document.querySelectorAll(".correct").length;

    const accuracy = typedCharacters > 0
    ? Math.round((correctCharacters / typedCharacters) * 100)
    : 100;

    const elapsedSeconds = (Date.now() - startTime) / 1000;

    if (elapsedSeconds < 1) {
        wpmValue.textContent = "0";
        accuracyValue.textContent = accuracy + "%";
        return;
    }

    const minutes = elapsedSeconds / 60;

    const wpm = Math.round((typedCharacters / 5) / minutes);

    wpmValue.textContent = wpm;
    
    accuracyValue.textContent = accuracy + "%";
    
}


/* =========================
   Timer
========================= */

function startTimer() {

    timeValue.classList.add("active");
    
    timerInterval = setInterval(() => {
        
        if (testMode === "timed") {

            timeRemaining--;

            updateTimerDisplay();

            if (timeRemaining === 0) {
                endTest();
            }

        } else if (testMode === "passage") {

            elapsedTime++;

            updateTimerDisplay();

        }

    }, 1000);
    
}

function updateTimerDisplay() {

    if (testMode === "timed") {

        const seconds = timeRemaining.toString().padStart(2, "0");

        timeValue.textContent = `0:${seconds}`;

    } else {

        const seconds = elapsedTime.toString().padStart(2, "0");

        timeValue.textContent = `0:${seconds}`;

    }
}

/* =========================
   Results & Scoring
========================= */

/* Results Calculation */
function calculateResults() {
    
    const typedCharacters = inputField.value.length;
    
    const correctCharacters = document.querySelectorAll(".correct").length;
    
    const accuracy = typedCharacters > 0
    ? Math.round((correctCharacters / typedCharacters) * 100)
    : 0;

    const elapsedSeconds = Math.max(
    (Date.now() - startTime) / 1000,
    1
    );

    const minutes = elapsedSeconds / 60;

    const wpm = minutes > 0
    ? Math.round((typedCharacters / 5) / minutes)
    : 0;

    resultsWpm.forEach((element) => {
        element.textContent = wpm;
    });

    resultsAccuracy.forEach((element) => {

        element.textContent = accuracy + "%";

        element.classList.remove(
            "accuracy-value-red",
            "accuracy-value-yellow",
            "accuracy-value-green"
        );

        if (accuracy < 85) {

            element.classList.add("accuracy-value-red");

        } else if (accuracy <= 90) {

            element.classList.add("accuracy-value-yellow");

        } else {

            element.classList.add("accuracy-value-green");
            
        }

    });
    
    resultsCorrect.forEach((element) => {
        element.textContent = correctCharacters;
    });
    
    resultsIncorrect.forEach((element) => {
        element.textContent = typedCharacters - correctCharacters;
    });

    if (accuracy >= 85) {
        updateResultMessage(wpm);
        updateHighScore(wpm);
    } else {
        updateCheatMessage();
    }

    resultsWpm.forEach((element) => {
        element.textContent = wpm;
    });

    resultsAccuracy.forEach((element) => {
        element.textContent = accuracy + "%";
    });

    resultCharacterValues.forEach((element) => {
        element.innerHTML = `
            <span class="cc-green">${correctCharacters}</span>
            <span class="cc-gray">/</span>
            <span class="cc-red">${typedCharacters - correctCharacters}</span>
        `;
    });
    
}

function resetStats() {

    wpmValue.textContent = "0";
    
    accuracyValue.textContent = "100%";
    
}

/* Results Display */
function showResultsScreen(type) {

    resultsScreens.forEach((screen) => {
        screen.classList.add("hidden");
    });

    if (type === "baseline") {
        document.querySelector(".results-baseline").classList.remove("hidden");
    }

    if (type === "complete") {
        document.querySelector(".results-test-complete").classList.remove("hidden");
    }

    if (type === "high-score") {
        document.querySelector(".results-high-score").classList.remove("hidden");
    }

    if (type === "try-again") {
        document.querySelector(".results-try-again").classList.remove("hidden");
    }
    
}

function updateResultMessage(wpm) {

    const activeResultScreen = document.querySelector(".results-baseline");

    const resultTitle = activeResultScreen.querySelector(".result-title");
    const resultMessage = activeResultScreen.querySelector(".result-message");


    if (!hasCompletedTest) {

        resultTitle.textContent = "Baseline Established!";

        resultMessage.textContent =
            "You've set the bar. Now the real challenge begins - time to beat it.";
        
        showResultsScreen("baseline");

        updateActionButton("high-score");


    } else if (wpm > highScore) {

        resultTitle.textContent = "High Score Smashed!";

        resultMessage.textContent =
            "You're getting faster. That was incredible typing.";
        
        showResultsScreen("high-score");

        updateActionButton("high-score");


    } else {

        resultTitle.textContent = "Test Complete!";

        resultMessage.textContent =
            "Solid run. Keep pushing to beat your high score.";
        
        showResultsScreen("complete");

        updateActionButton("again");

    }
}

function updateCheatMessage() {

    showResultsScreen("try-again");

    const activeResult = document.querySelector(".results-screen:not(.hidden)");

    const title = activeResult.querySelector(".result-title");
    const message = activeResult.querySelector(".result-message");

    title.textContent = "Try Again!";

    message.textContent =
        "Your accuracy was too low. Try typing the passage instead of skipping characters.";

    updateActionButton("again");
    
}

function updateActionButton(state) {

    const visibleScreen = document.querySelector(
        ".results-screen:not(.hidden)"
    );

    if (!visibleScreen) {
        return;
    }

    const button = visibleScreen.querySelector(".action-button");

    if (!button) {
        return;
    }

    button.className = "action-button";

    if (state === "restart") {

        button.querySelector(".action-text").textContent = "Restart Test";
        button.classList.add("restart");

    } else if (state === "again") {

        button.querySelector(".action-text").textContent = "Go Again";
        button.classList.add("go-again");

    } else if (state === "high-score") {

        button.querySelector(".action-text").textContent = "Beat This Score";
        button.classList.add("high-score");

    }

}

/* High Score */
function updateHighScore(wpm) {
    
    if (!hasCompletedTest) {

        highScore = wpm;

        localStorage.setItem("highScore", highScore);

        scoreDisplay.textContent = `${highScore} WPM`;

        hasCompletedTest = true;

        localStorage.setItem("hasCompletedTest", "true");

        return;
    }
    
    if (wpm > highScore) {
        highScore = wpm;
        
        localStorage.setItem("highScore", highScore);

        scoreDisplay.textContent = `${highScore} WPM`;
    }

    hasCompletedTest = true;
    
    localStorage.setItem("hasCompletedTest", "true");
    
}

/* =========================
   UI Updates
========================= */


function updateSettingsUI() {

    easyButton.classList.toggle(
        "active",
        difficulty === "easy"
    );

    mediumButton.classList.toggle(
        "active",
        difficulty === "medium"
    );

    hardButton.classList.toggle(
        "active",
        difficulty === "hard"
    );

    mobileDifficultyLabel.textContent =
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1);


    document.querySelector(
        `input[name="difficulty"][value="${difficulty}"]`
    ).checked = true;

    timedButton.classList.toggle(
        "active",
        testMode === "timed"
    );

    passageButton.classList.toggle(
        "active",
        testMode === "passage"
    );

    mobileModeLabel.textContent =
        testMode === "timed"
            ? "Timed (60s)"
            : "Passage";

    document.querySelector(
        `input[name="mode"][value="${testMode}"]`
    ).checked = true;
    
}

function showTestFooter() {

    setTimeout(() => {
        testFooter.classList.add("visible");
    }, 600);

}
