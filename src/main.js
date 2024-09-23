import Phaser from 'phaser';
import { Game as MainGame } from './scenes/Game';

const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    backgroundColor: '#66464',
    scale: {
        mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MainGame]
};

const gameInstance = new Phaser.Game(config);

// Function to check orientation and show/hide warning GIF
function checkOrientation() {
    const warningDiv = document.getElementById('orientation-warning');
    if (window.innerHeight > window.innerWidth) {
        warningDiv.style.display = 'flex';
        if (gameInstance.scene.isActive('Game')) {
            gameInstance.scene.pause('Game');
        }
    } else {
        warningDiv.style.display = 'none';
        if (gameInstance.scene.isPaused('Game')) {
            gameInstance.scene.resume('Game');
        }
    }
}

// Function to show the Game Over modal with final score and motivational message
function showGameOverModal(finalScore) {
    const modal = document.getElementById('game-over-modal');
    const finalScoreElement = document.getElementById('final-score');
    const motivationalMessage = document.getElementById('motivational-message');

    modal.style.display = 'block'; // Show the modal
    finalScoreElement.textContent = `Final Score: ${finalScore}`; // Display final score

    // Display a motivational message based on the score
    if (finalScore >= 100) {
        motivationalMessage.textContent = 'Amazing job! You are a true stag master!';
    } else if (finalScore >= 50) {
        motivationalMessage.textContent = 'Great effort! You found most of the stags!';
    } else {
        motivationalMessage.textContent = 'Keep practicing, you can do better next time!';
    }
}

// Function to check game over condition and handle final actions
function checkGameOver() {
    const gameScene = gameInstance.scene.getScene('Game');

    if (gameScene && gameScene.gameOver) {
        const finalScore = gameScene.score || 0; // Get the score from the Game scene
        showGameOverModal(finalScore);

        setTimeout(() => {
            window.location.href = 'https://google.com'; // Replace with desired URL
        }, 2000);
    }
}


// Set up modal behavior for closing
function setupGameOverModal() {
    const modal = document.getElementById('game-over-modal');
    const closeModal = document.getElementById('close-modal');

    if (modal && closeModal) {
        closeModal.onclick = () => {
            modal.style.display = 'none'; // Close the modal when 'x' is clicked
        };

        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none'; // Close when clicking outside modal
            }
        };
    }
}

// Set up fullscreen functionality
function goFullScreen() {
    const fullscreenButton = document.getElementById('fullscreen-button');

    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error enabling fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen().catch(err => {
                    console.error(`Error exiting fullscreen: ${err.message}`);
                });
            }
        });
    }
}

// Initialize everything when the page loads
window.addEventListener('load', () => {
    goFullScreen();
    setupGameOverModal();
    checkOrientation();

    // Check the game over condition every second
    setInterval(checkOrientation, 1000);
    setInterval(checkGameOver, 1000);
});

// Recheck orientation on window resize or device orientation change
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
