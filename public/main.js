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

    async init() {
        this.setupCanvas();
        this.setupLoadingIndicator();
        await this.setupRenderer();
        this.setupControls();
        this.setupTimeDisplay();
        this.hideLoadingIndicator();
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

    async setupRenderer() {
        try {
            this.renderer = new EarthRenderer(this.canvas);
            await this.renderer.init();
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

    setupLoadingIndicator() {
        // Create loading overlay
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.id = 'loading-overlay';
        this.loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            font-family: Arial, sans-serif;
        `;

        // Loading text
        this.loadingText = document.createElement('div');
        this.loadingText.style.cssText = `
            font-size: 24px;
            margin-bottom: 20px;
        `;
        this.loadingText.textContent = 'Loading NASA Earth Textures...';

        // Progress bars container
        this.progressContainer = document.createElement('div');
        this.progressContainer.style.cssText = `
            width: 300px;
        `;

        // Create progress bars for each texture
        this.progressBars = {};
        ['day', 'night', 'clouds'].forEach(type => {
            const container = document.createElement('div');
            container.style.cssText = `
                margin-bottom: 10px;
            `;

            const label = document.createElement('div');
            label.style.cssText = `
                font-size: 14px;
                margin-bottom: 5px;
                text-transform: capitalize;
            `;
            label.textContent = `${type} Texture: 0%`;

            const progressBg = document.createElement('div');
            progressBg.style.cssText = `
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                overflow: hidden;
            `;

            const progressBar = document.createElement('div');
            progressBar.style.cssText = `
                width: 0%;
                height: 100%;
                background: #4CAF50;
                transition: width 0.3s ease;
            `;

            progressBg.appendChild(progressBar);
            container.appendChild(label);
            container.appendChild(progressBg);
            this.progressContainer.appendChild(container);

            this.progressBars[type] = { label, bar: progressBar };
        });

        this.loadingOverlay.appendChild(this.loadingText);
        this.loadingOverlay.appendChild(this.progressContainer);
        document.body.appendChild(this.loadingOverlay);

        // Listen for texture loading progress
        window.addEventListener('textureLoadProgress', (event) => {
            this.updateProgress(event.detail);
        });
    }

    updateProgress(detail) {
        const { type, progress, totalProgress } = detail;

        if (this.progressBars[type]) {
            this.progressBars[type].label.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Texture: ${Math.round(progress)}%`;
            this.progressBars[type].bar.style.width = `${progress}%`;
        }

        // Update overall loading text
        if (totalProgress === 100) {
            this.loadingText.textContent = 'Textures loaded! Initializing Earth...';
        } else {
            this.loadingText.textContent = `Loading NASA Earth Textures... ${Math.round(totalProgress)}%`;
        }
    }

    hideLoadingIndicator() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
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