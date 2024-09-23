import { Scene } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
    this.map = null;
    this.stages = [];
    this.score = 0;
    this.timer = null;
    this.timeLeft = 45;
    this.gameOver = false;
    this.isPaused = false;
    this.isDragging = false;
    this.lastPointerPosition = { x: 0, y: 0 };
    this.pointers = [];
    this.initialPinchDistance = 0;
    this.initialZoom = 0.5;
  }

  preload() {
    // Load assets
    this.load.setPath("assets");
    this.load.image("background", "Map3k.jpg");
    for (let i = 1; i <= 5; i++) {
      this.load.image(`stag${i}`, `Stag${i}.png`);
      // this.load.image(`stag${i}_found`, `Stag${i}_found.png`);
      this.load.image(`stag1`, `Stag1.png`);
    }
  }

  create() {
    console.log("Game scene created");
    this.setupMap();
    this.setupCamera();
    this.setupInput();
    this.addStages();
    // this.setupTimer();

    this.events.on('pause', this.onPause, this);
    this.events.on('resume', this.onResume, this);
  }

  setupMap() {
    this.map = this.add.image(0, 0, "background").setOrigin(0, 0);
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, this.map.width, this.map.height);
    this.cameras.main.centerOn(this.map.width / 2, this.map.height / 2);
    this.cameras.main.zoom = this.initialZoom;
  }

  setupInput() {
    // Enable camera panning
    this.input.on('pointerdown', this.startDrag, this);
    this.input.on('pointerup', this.stopDrag, this);
    this.input.on('pointermove', this.onDrag, this);

    // Enable camera zooming with mouse wheel
    this.input.on('wheel', this.handleZoom, this);

    // Add support for multi-touch pinch-to-zoom
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointermove', this.onPointerMove, this);
  }

  addStages() {
    const stageData = [
      { x: 2742, y: 694, scale: 0.3 },
      { x: 321, y: 671, scale: 0.4 },
      { x: 1255, y: 916, scale: 0.4 },
      { x: 1174, y: 1535, scale: 0.29 },
      { x: 2866, y: 1738, scale: 0.3 },
    ];

    for (let i = 1; i <= 5; i++) {
      const data = stageData[i - 1];
      const stage = this.add.image(data.x, data.y, `stag${i}`);
      stage.setScale(data.scale);
      stage.setInteractive();
      stage.on("pointerdown", () => this.onStageClick(stage, i - 1));
      this.stages.push(stage);
    }
  }

  onStageClick(stage, index) {
    if (this.gameOver || stage.texture.key.includes('found')) return;

    this.score += 1;
    this.updateUIOnStageFound(index);
    // stage.setTexture(`stag${index + 1}_found`);

     // Animate the stag
     this.tweens.add({
      targets: stage,
      scaleX: stage.scaleX * 1.2,
      scaleY: stage.scaleY * 1.2,
      duration: 200,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        stage.setTexture(`stag${index + 1}_found`);
      }
    });
    if (this.score === this.stages.length) {
      this.endGame(true);
    }
  }

  updateUIOnStageFound(index) {
    const stagIcon = document.getElementById(`stag-icon-${index + 1}`);
    if (stagIcon) {
      stagIcon.classList.add('found', 'score-animate');
      stagIcon.addEventListener('animationend', () => {
        stagIcon.classList.remove('score-animate');
      });
    }
  }

  // setupTimer() {
  //   this.timer = this.time.addEvent({
  //     delay: 1000,
  //     callback: this.updateTimer,
  //     callbackScope: this,
  //     loop: true,
  //   });
  // }
  setupTimer() {
    this.timer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
    this.updateTimerDisplay(); // Initial display update
  }

  // updateTimer() {
  //   if (this.gameOver || this.isPaused) return;

  //   let timeElement = document.getElementById("time");
  //   let timeLeft = parseInt(timeElement.innerText) - 1;
  //   timeElement.innerText = timeLeft.toString().padStart(2, "0");

  //   if (timeLeft <= 0) {
  //     this.endGame(false);
  //     timeElement.innerText = "Game Over";
  //   }
  // }

  updateTimer() {
    if (this.gameOver || this.isPaused) return;

    this.timeLeft--;
    this.updateTimerDisplay();

    if (this.timeLeft <= 0) {
      this.endGame(false);
    }
  }

  updateTimerDisplay() {
    let timeElement = document.getElementById("time");
    let minutes = Math.floor(this.timeLeft / 60);
    let seconds = this.timeLeft % 60;
    timeElement.innerText = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  endGame(userWon) {
    this.gameOver = true;
    this.timer.remove();

    const modal = document.getElementById('game-over-modal');
    const message = document.getElementById('game-over-message');
    const details = document.getElementById('game-over-details');

    if (userWon) {
      message.textContent = "Congratulations!";
      details.textContent = "You've found all the stags!";
    } else {
      message.textContent = "Game Over";
      details.textContent = "Time's up!";
    }

    modal.style.display = 'flex'; // Show the modal
    this.pauseGame();
  }

  pauseGame() {
    if (!this.isPaused) {
      this.scene.pause();
      this.isPaused = true;
      console.log("Game paused");
    }
  }

  resumeGame() {
    if (this.isPaused) {
      this.scene.resume();
      this.isPaused = false;
      console.log("Game resumed");
    }
  }

  onPause() {
    this.isPaused = true;
    console.log("Pause event received");
  }

  onResume() {
    this.isPaused = false;
    console.log("Resume event received");
  }

  // Dragging Methods
  startDrag(pointer) {
    if (this.isPaused) return;
    this.isDragging = true;
    this.lastPointerPosition = { x: pointer.x, y: pointer.y };
  }

  stopDrag() {
    this.isDragging = false;
  }

  onDrag(pointer) {
    if (!this.isDragging || this.isPaused) return;

    const dx = pointer.x - this.lastPointerPosition.x;
    const dy = pointer.y - this.lastPointerPosition.y;

    this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
    this.cameras.main.scrollY -= dy / this.cameras.main.zoom;

    this.lastPointerPosition = { x: pointer.x, y: pointer.y };
  }

  // Zoom Methods
  handleZoom(pointer, gameObjects, deltaX, deltaY) {
    if (this.isPaused) return;

    const zoomStep = 0.1;
    const zoomFactor = deltaY > 0 ? -zoomStep : zoomStep;
    this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom + zoomFactor, 0.5, 2);
  }

  // Multi-touch pinch-to-zoom methods
  onPointerDown(pointer) {
    this.pointers.push(pointer);
    if (this.pointers.length === 2) {
      const distance = Phaser.Math.Distance.Between(
        this.pointers[0].x, this.pointers[0].y,
        this.pointers[1].x, this.pointers[1].y
      );
      this.initialPinchDistance = distance;
      this.initialZoom = this.cameras.main.zoom;
    }
  }

  onPointerUp(pointer) {
    this.pointers = this.pointers.filter(p => p.id !== pointer.id);
  }

  onPointerMove(pointer) {
    if (this.pointers.length === 2) {
      const p1 = this.pointers[0];
      const p2 = this.pointers[1];

      const currentDistance = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
      const scaleFactor = currentDistance / this.initialPinchDistance;
      let newZoom = this.initialZoom * scaleFactor;

      newZoom = Phaser.Math.Clamp(newZoom, 0.5, 2);
      this.cameras.main.zoom = newZoom;
    }
  }
}
