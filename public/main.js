class EarthViewApp {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.animationId = null;
        this.isRunning = false;

        this.fpsCounter = {
            lastTime: 0,
            frameCount: 0,
            fps: 0
        };

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupRenderer();
        this.setupControls();
        this.setupTimeDisplay();
        this.start();

        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    setupCanvas() {
        this.canvas = document.getElementById('canvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
    }

    setupRenderer() {
        try {
            this.renderer = new EarthRenderer(this.canvas);
        } catch (error) {
            this.showError('WebGL initialization failed: ' + error.message);
            throw error;
        }
    }

    setupControls() {
        const rotationSpeed = document.getElementById('rotation-speed');
        const zoomLevel = document.getElementById('zoom-level');
        const atmosphere = document.getElementById('atmosphere');
        const clouds = document.getElementById('clouds');
        const nightLights = document.getElementById('night-lights');

        if (rotationSpeed) {
            rotationSpeed.addEventListener('input', (e) => {
                this.renderer.updateRotationSpeed(parseFloat(e.target.value));
            });
        }

        if (zoomLevel) {
            zoomLevel.addEventListener('input', (e) => {
                this.renderer.updateZoom(parseFloat(e.target.value));
            });
        }

        const updateSettings = () => {
            this.renderer.updateSettings({
                atmosphere: atmosphere ? atmosphere.checked : true,
                clouds: clouds ? clouds.checked : true,
                nightLights: nightLights ? nightLights.checked : true
            });
        };

        if (atmosphere) atmosphere.addEventListener('change', updateSettings);
        if (clouds) clouds.addEventListener('change', updateSettings);
        if (nightLights) nightLights.addEventListener('change', updateSettings);
    }

    setupTimeDisplay() {
        this.updateTimeDisplay();
        setInterval(() => this.updateTimeDisplay(), 1000);
    }

    updateTimeDisplay() {
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const dateString = now.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            timeDisplay.textContent = `${timeString} - ${dateString}`;
        }
    }

    handleResize() {
        if (this.renderer) {
            this.renderer.resize();
        }
    }

    updateFPS(currentTime) {
        this.fpsCounter.frameCount++;

        if (currentTime - this.fpsCounter.lastTime >= 1000) {
            this.fpsCounter.fps = Math.round(this.fpsCounter.frameCount * 1000 / (currentTime - this.fpsCounter.lastTime));
            this.fpsCounter.frameCount = 0;
            this.fpsCounter.lastTime = currentTime;

            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = `FPS: ${this.fpsCounter.fps}`;
            }
        }
    }

    render(currentTime) {
        if (!this.isRunning) return;

        this.updateFPS(currentTime);

        if (this.renderer) {
            this.renderer.render(currentTime);
        }

        this.animationId = requestAnimationFrame((time) => this.render(time));
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.fpsCounter.lastTime = performance.now();
            this.render(this.fpsCounter.lastTime);
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
    }

    showError(message) {
        console.error(message);

        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 1000;
            text-align: center;
            font-family: Arial, sans-serif;
        `;
        errorDiv.innerHTML = `
            <h3>Error</h3>
            <p>${message}</p>
            <p>Please check your browser's WebGL support.</p>
        `;

        document.body.appendChild(errorDiv);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        new EarthViewApp();
    } catch (error) {
        console.error('Application initialization failed:', error);
    }
});