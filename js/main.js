/**
 * Earth View - Main Application
 * WebGL Earth Simulator main entry point
 */

class EarthViewApp {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.earthRenderer = null;
        this.controls = {};
        this.stats = {
            fps: 0,
            frameCount: 0,
            lastTime: 0
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.setupCanvas();
            this.setupWebGL();
            this.setupControls();
            
            // Initialize Earth renderer
            this.earthRenderer = new EarthRenderer(this.gl);
            await this.earthRenderer.init();
            
            // Hide loading screen
            document.getElementById('loading').style.display = 'none';
            
            // Start render loop
            this.startRenderLoop();
            
            console.log('Earth View initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Earth View:', error);
            this.showError('Failed to initialize WebGL. Please check browser compatibility.');
        }
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('canvas');
        
        // Handle canvas resizing
        const resizeCanvas = () => {
            const displayWidth = this.canvas.clientWidth;
            const displayHeight = this.canvas.clientHeight;
            
            if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
                this.canvas.width = displayWidth;
                this.canvas.height = displayHeight;
                
                if (this.gl) {
                    this.gl.viewport(0, 0, displayWidth, displayHeight);
                }
                
                if (this.earthRenderer) {
                    this.earthRenderer.updateProjection(displayWidth / displayHeight);
                }
            }
        };
        
        // Initial resize
        resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', resizeCanvas);
        
        // Mouse controls
        this.setupMouseControls();
    }
    
    setupWebGL() {
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // WebGL settings
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        
        console.log('WebGL initialized');
        console.log('WebGL Version:', this.gl.getParameter(this.gl.VERSION));
        console.log('Vendor:', this.gl.getParameter(this.gl.VENDOR));
        console.log('Renderer:', this.gl.getParameter(this.gl.RENDERER));
    }
    
    setupMouseControls() {
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!isDragging || !this.earthRenderer) return;
            
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            
            this.earthRenderer.rotate(deltaX * 0.01, deltaY * 0.01);
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });
        
        window.addEventListener('mouseup', () => {
            isDragging = false;
            this.canvas.style.cursor = 'grab';
        });
        
        // Zoom with mouse wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (this.earthRenderer) {
                const zoomDelta = e.deltaY > 0 ? 1.1 : 0.9;
                this.earthRenderer.zoom(zoomDelta);
                this.updateZoomControl();
            }
        });
        
        this.canvas.style.cursor = 'grab';
    }
    
    setupControls() {
        // Rotation speed control
        const rotationSpeed = document.getElementById('rotationSpeed');
        const rotationSpeedValue = document.getElementById('rotationSpeedValue');
        
        rotationSpeed.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            rotationSpeedValue.textContent = value.toFixed(1);
            if (this.earthRenderer) {
                this.earthRenderer.setRotationSpeed(value);
            }
        });
        
        // Zoom level control
        const zoomLevel = document.getElementById('zoomLevel');
        const zoomLevelValue = document.getElementById('zoomLevelValue');
        
        zoomLevel.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            zoomLevelValue.textContent = value.toFixed(1);
            if (this.earthRenderer) {
                this.earthRenderer.setZoom(value);
            }
        });
        
        // Atmosphere toggle
        const showAtmosphere = document.getElementById('showAtmosphere');
        showAtmosphere.addEventListener('change', (e) => {
            if (this.earthRenderer) {
                this.earthRenderer.setAtmosphereVisible(e.target.checked);
            }
        });
        
        // Clouds toggle
        const showClouds = document.getElementById('showClouds');
        showClouds.addEventListener('change', (e) => {
            if (this.earthRenderer) {
                this.earthRenderer.setCloudsVisible(e.target.checked);
            }
        });
        
        // Night lights toggle
        const nightLights = document.getElementById('nightLights');
        nightLights.addEventListener('change', (e) => {
            if (this.earthRenderer) {
                this.earthRenderer.setNightLightsVisible(e.target.checked);
            }
        });
        
        this.controls = {
            rotationSpeed,
            zoomLevel,
            showAtmosphere,
            showClouds,
            nightLights
        };
    }
    
    updateZoomControl() {
        if (this.earthRenderer && this.controls.zoomLevel) {
            const currentZoom = this.earthRenderer.getZoom();
            this.controls.zoomLevel.value = currentZoom;
            document.getElementById('zoomLevelValue').textContent = currentZoom.toFixed(1);
        }
    }
    
    startRenderLoop() {
        const render = (currentTime) => {
            // Calculate FPS
            this.stats.frameCount++;
            if (currentTime - this.stats.lastTime >= 1000) {
                this.stats.fps = Math.round(this.stats.frameCount * 1000 / (currentTime - this.stats.lastTime));
                this.stats.frameCount = 0;
                this.stats.lastTime = currentTime;
                document.getElementById('fps').textContent = this.stats.fps;
            }
            
            // Clear canvas
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            
            // Render Earth
            if (this.earthRenderer) {
                this.earthRenderer.render(currentTime);
            }
            
            // Continue render loop
            requestAnimationFrame(render);
        };
        
        requestAnimationFrame(render);
    }
    
    showError(message) {
        const loading = document.getElementById('loading');
        loading.innerHTML = `
            <div style="color: #ff4444;">
                <h3>Error</h3>
                <p>${message}</p>
                <p>Please try refreshing the page or using a different browser.</p>
            </div>
        `;
    }
}

// Initialize app when page loads
window.addEventListener('load', () => {
    new EarthViewApp();
});

// Handle page visibility changes to optimize performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden - reducing performance');
    } else {
        console.log('Page visible - resuming full performance');
    }
});