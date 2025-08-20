class PhysicsSandbox {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Grid system for efficient physics calculation
        this.gridWidth = Math.floor(this.width / 2);
        this.gridHeight = Math.floor(this.height / 2);
        this.grid = this.createGrid();
        
        // Element types with their physics properties (fixed densities and behaviors)
        this.elements = {
            empty: { color: [0, 0, 0, 0], density: 0, flammable: false, liquid: false, gas: false, solid: false },
            dirt: { color: [101, 67, 33, 255], density: 1.5, flammable: false, liquid: false, gas: false, solid: false },
            water: { color: [64, 164, 223, 200], density: 1.0, flammable: false, liquid: true, gas: false, solid: false },
            fire: { color: [255, 100, 0, 255], density: 0.01, flammable: false, liquid: false, gas: true, solid: false, lifetime: 8 },
            plant: { color: [34, 139, 34, 255], density: 0.8, flammable: true, liquid: false, gas: false, solid: true },
            stone: { color: [128, 128, 128, 255], density: 2.7, flammable: false, liquid: false, gas: false, solid: true },
            sand: { color: [238, 203, 173, 255], density: 1.6, flammable: false, liquid: false, gas: false, solid: false },
            steam: { color: [200, 200, 255, 150], density: 0.001, flammable: false, liquid: false, gas: true, solid: false, lifetime: 80 },
            oil: { color: [139, 69, 19, 220], density: 0.9, flammable: true, liquid: true, gas: false, solid: false },
            ice: { color: [173, 216, 230, 255], density: 0.92, flammable: false, liquid: false, gas: false, solid: true, meltPoint: 0 },
            lava: { color: [255, 69, 0, 255], density: 3.0, flammable: false, liquid: true, gas: false, solid: false, temperature: 1200 },
            acid: { color: [50, 255, 50, 200], density: 1.2, flammable: false, liquid: true, gas: false, solid: false, corrosive: true },
            metal: { color: [192, 192, 192, 255], density: 3.5, flammable: false, liquid: false, gas: false, solid: true, conductive: true },
            wood: { color: [139, 90, 43, 255], density: 0.6, flammable: true, liquid: false, gas: false, solid: true },
            gunpowder: { color: [64, 64, 64, 255], density: 1.7, flammable: false, liquid: false, gas: false, solid: false, explosive: true },
            electricity: { color: [255, 255, 0, 255], density: 0.001, flammable: false, liquid: false, gas: true, solid: false, lifetime: 8, conductive: true },
            virus: { color: [255, 0, 255, 200], density: 0.1, flammable: false, liquid: false, gas: false, solid: false, infectious: true, lifetime: 100 },
            magnet: { color: [139, 0, 0, 255], density: 7.5, flammable: false, liquid: false, gas: false, solid: true, magnetic: true },
            gas: { color: [144, 238, 144, 150], density: 0.002, flammable: true, liquid: false, gas: true, solid: false },
            plasma: { color: [255, 20, 147, 255], density: 0.0001, flammable: false, liquid: false, gas: true, solid: false, lifetime: 25, temperature: 10000 }
        };
        
        // Game state
        this.selectedElement = 'dirt';
        this.selectedTool = 'brush';
        this.brushSize = 3;
        this.gameSpeed = 5;
        this.pressure = 5;
        this.isMouseDown = false;
        this.isRightClick = false;
        this.isPaused = false;
        this.reverseGravity = false;
        this.timeDirection = 1;
        this.frameCount = 0;
        this.lastFpsTime = 0;
        this.fps = 60;
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.continuousPlace = false;
        this.placeInterval = null;
        this.lineStart = null;
        this.rectangleStart = null;
        this.particles = [];
        this.electricitySources = [];
        this.windForce = { x: 0, y: 0 };
        this.magneticField = false;
        this.randomMode = false;
        
        // Sound system
        this.sounds = {
            //place: this.createSound(200, 0.1),
            erase: this.createSound(100, 0.1),
            explosion: this.createSound(80, 0.3),
            electric: this.createSound(1000, 0.05)
        };
        
        this.initializeEventListeners();
        this.gameLoop();
    }
    
    createGrid() {
        const grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                grid[y][x] = {
                    type: 'empty',
                    lifetime: 0,
                    temperature: 20
                };
            }
        }
        return grid;
    }
    
    initializeEventListeners() {
        // Element selection
        document.querySelectorAll('.element-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedElement = btn.dataset.element;
            });
        });
        
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTool = btn.dataset.tool;
                if (this.selectedTool === 'brush') {
                    this.canvas.style.cursor = 'crosshair';
                } else if (this.selectedTool === 'eraser') {
                    this.canvas.style.cursor = 'grab';
                } else if (this.selectedTool === 'eyedropper') {
                    this.canvas.style.cursor = 'copy';
                } else if (this.selectedTool === 'line') {
                    this.canvas.style.cursor = 'crosshair';
                } else if (this.selectedTool === 'explosion') {
                    this.canvas.style.cursor = 'pointer';
                } else if (this.selectedTool === 'rectangle') {
                    this.canvas.style.cursor = 'crosshair';
                } else if (this.selectedTool === 'circle') {
                    this.canvas.style.cursor = 'crosshair';
                } else if (this.selectedTool === 'gravity') {
                    this.canvas.style.cursor = 'move';
                }
            });
        });
        
        // Set default tool
        document.querySelector('[data-tool="brush"]').classList.add('active');
        
        // Brush size
        const brushSizeSlider = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');
        brushSizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            brushSizeValue.textContent = this.brushSize;
        });
        
        // Speed control
        const speedSlider = document.getElementById('speedControl');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            this.gameSpeed = parseInt(e.target.value);
            speedValue.textContent = this.gameSpeed;
        });
        
        // Pressure control
        const pressureSlider = document.getElementById('pressureControl');
        const pressureValue = document.getElementById('pressureValue');
        pressureSlider.addEventListener('input', (e) => {
            this.pressure = parseInt(e.target.value);
            pressureValue.textContent = this.pressure;
        });
        
        // Wind strength control
        const windStrengthSlider = document.getElementById('windStrength');
        const windValue = document.getElementById('windValue');
        windStrengthSlider.addEventListener('input', (e) => {
            const strength = parseInt(e.target.value);
            this.windForce.x = strength / 5; // Convert to appropriate force
            windValue.textContent = strength;
        });
        
        // Wind control button
        document.getElementById('windControl').addEventListener('click', (e) => {
            this.windForce.x = this.windForce.x > 0 ? -this.windForce.x : Math.abs(this.windForce.x) || 2;
            e.target.textContent = this.windForce.x > 0 ? '💨 WIND →' : '💨 WIND ←';
        });
        
        // Magnetic field control
        document.getElementById('magneticField').addEventListener('click', (e) => {
            this.magneticField = !this.magneticField;
            e.target.style.backgroundColor = this.magneticField ? '#ff0066' : '#444';
        });
        
        // Random mode control
        document.getElementById('randomMode').addEventListener('click', (e) => {
            this.randomMode = !this.randomMode;
            e.target.style.backgroundColor = this.randomMode ? '#9966ff' : '#444';
        });
        
        // Reverse gravity
        document.getElementById('reverseGravity').addEventListener('click', (e) => {
            this.reverseGravity = !this.reverseGravity;
            e.target.style.backgroundColor = this.reverseGravity ? '#ff6600' : '#444';
        });
        
        // Time control
        document.getElementById('timeControl').addEventListener('click', (e) => {
            this.timeDirection *= -1;
            e.target.textContent = this.timeDirection > 0 ? '⏰ TIME' : '⏪ REVERSE';
            e.target.style.backgroundColor = this.timeDirection > 0 ? '#444' : '#0066ff';
        });
        
        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.grid = this.createGrid();
            this.particles = [];
        });
        
        // Pause button
        document.getElementById('pauseBtn').addEventListener('click', (e) => {
            this.isPaused = !this.isPaused;
            e.target.textContent = this.isPaused ? 'RESUME' : 'PAUSE';
        });
        
        // Save/Load buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveScene());
        document.getElementById('loadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.loadScene(e));
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.isRightClick = e.button === 2;
            this.updateMousePosition(e);
            this.handleMouseAction(e);
            
            // Continuous placement for brush and eraser
            if (this.selectedTool === 'brush' || this.selectedTool === 'eraser') {
                this.continuousPlace = true;
                this.startContinuousPlacement();
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.lastMouseX = this.mouseX;
            this.lastMouseY = this.mouseY;
            this.updateMousePosition(e);
            
            if (this.isMouseDown && !this.continuousPlace) {
                this.handleMouseAction(e);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            if (this.selectedTool === 'line' && this.lineStart) {
                this.drawLine();
                this.lineStart = null;
            } else if (this.selectedTool === 'rectangle' && this.rectangleStart) {
                this.drawRectangle();
                this.rectangleStart = null;
            } else if (this.selectedTool === 'circle' && this.rectangleStart) {
                this.drawCircle();
                this.rectangleStart = null;
            }
            this.isMouseDown = false;
            this.isRightClick = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.stopContinuousPlacement();
            this.isMouseDown = false;
            this.isRightClick = false;
            this.lineStart = null;
            this.rectangleStart = null;
        });
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isMouseDown = true;
            this.updateTouchPosition(e);
            this.handleMouseAction(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.updateTouchPosition(e);
            if (this.isMouseDown) {
                this.handleMouseAction(e);
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.selectedTool === 'line' && this.lineStart) {
                this.drawLine();
                this.lineStart = null;
            }
            this.isMouseDown = false;
        });
    }
    
    updateTouchPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mouseX = Math.floor((touch.clientX - rect.left) / 2);
        this.mouseY = Math.floor((touch.clientY - rect.top) / 2);
    }
    
    startContinuousPlacement() {
        if (this.placeInterval) return;
        
        this.placeInterval = setInterval(() => {
            if (this.isMouseDown && this.continuousPlace) {
                if (this.isRightClick) {
                    this.eraseElement();
                } else if (this.selectedTool === 'brush') {
                    this.placeElement();
                } else if (this.selectedTool === 'eraser') {
                    this.eraseElement();
                }
            }
        }, 50); // 20 FPS için continuous placement
    }
    
    stopContinuousPlacement() {
        this.continuousPlace = false;
        if (this.placeInterval) {
            clearInterval(this.placeInterval);
            this.placeInterval = null;
        }
    }
    
    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = Math.floor((e.clientX - rect.left) / 2);
        this.mouseY = Math.floor((e.clientY - rect.top) / 2);
    }
    
    gameLoop() {
        try {
            this.frameCount++;
            
            // Game speed control - skip physics updates based on speed setting
            const shouldUpdatePhysics = this.frameCount % Math.max(1, 12 - this.gameSpeed) === 0;
            
            // FPS calculation
            const now = performance.now();
            if (now - this.lastFpsTime > 1000) {
                this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsTime));
                this.frameCount = 0;
                this.lastFpsTime = now;
                
                // Update status bar
                this.updateStatusBar();
            }
            
            if (shouldUpdatePhysics && !this.isPaused) {
                this.updatePhysics();
            }
            this.render();
        } catch (error) {
            console.error('Game loop error:', error);
            // Continue running despite errors
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    handleMouseAction(e) {
        if (this.isRightClick) {
            this.eraseElement();
            return;
        }
        
        switch (this.selectedTool) {
            case 'brush':
                this.placeElement();
                break;
            case 'eraser':
                this.eraseElement();
                break;
            case 'eyedropper':
                this.pickElement();
                break;
            case 'line':
                if (!this.lineStart) {
                    this.lineStart = { x: this.mouseX, y: this.mouseY };
                }
                break;
            case 'rectangle':
                if (!this.rectangleStart) {
                    this.rectangleStart = { x: this.mouseX, y: this.mouseY };
                }
                break;
            case 'circle':
                if (!this.rectangleStart) {
                    this.rectangleStart = { x: this.mouseX, y: this.mouseY };
                }
                break;
            case 'explosion':
                this.createExplosion();
                break;
            case 'gravity':
                this.applyGravityPush();
                break;
            case 'wind':
                this.applyWind();
                break;
            case 'vacuum':
                this.applyVacuum();
                break;
            case 'heat':
                this.applyHeat();
                break;
            case 'cool':
                this.applyCool();
                break;
        }
    }
    
    createSound(frequency, duration) {
        return () => {
            if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
                const audioContext = new (AudioContext || webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'square';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            }
        };
    }
    
    placeElement() {
        const halfBrush = Math.floor(this.brushSize / 2);
        
        for (let dy = -halfBrush; dy <= halfBrush; dy++) {
            for (let dx = -halfBrush; dx <= halfBrush; dx++) {
                const x = this.mouseX + dx;
                const y = this.mouseY + dy;
                
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= halfBrush) {
                        const currentCell = this.grid[y][x];
                        
                        // Only place in empty areas or replaceable elements
                        if (currentCell.type === 'empty' || this.canReplace(currentCell.type, this.selectedElement)) {
                            // Random lifetime for fire - shorter duration
                            let lifetime = this.elements[this.selectedElement].lifetime || 0;
                            if (this.selectedElement === 'fire') {
                                lifetime = Math.random() * 5 + 3; // 3-8 random range (much shorter)
                            }
                            
                            this.grid[y][x] = {
                                type: this.selectedElement,
                                lifetime: lifetime,
                                temperature: this.getElementTemperature(this.selectedElement)
                            };
                        }
                    }
                }
            }
        }
        this.sounds.place();
    }
    
    canReplace(currentType, newType) {
        // Bazı elementler diğerlerini değiştirebilir
        const replaceRules = {
            'water': ['steam'], // Su buharı değiştirebilir
            'fire': ['plant', 'oil'], // Ateş bitki ve petrolü yakabilir
            'lava': ['plant', 'oil', 'ice', 'water'], // Lav çoğu şeyi eritebilir
            'acid': ['plant', 'metal'], // Asit bitki ve metali çözebilir
            'ice': [], // Buz hiçbir şeyi değiştirmez
            'steam': [], // Buhar hiçbir şeyi değiştirmez
            'sand': [], // Kum hiçbir şeyi değiştirmez
            'dirt': [], // Toprak hiçbir şeyi değiştirmez
            'stone': [], // Taş hiçbir şeyi değiştirmez
            'metal': [], // Metal hiçbir şeyi değiştirmez
            'oil': [], // Petrol hiçbir şeyi değiştirmez
            'plant': [] // Bitki hiçbir şeyi değiştirmez
        };
        
        return replaceRules[newType] && replaceRules[newType].includes(currentType);
    }
    
    eraseElement() {
        const halfBrush = Math.floor(this.brushSize / 2);
        
        for (let dy = -halfBrush; dy <= halfBrush; dy++) {
            for (let dx = -halfBrush; dx <= halfBrush; dx++) {
                const x = this.mouseX + dx;
                const y = this.mouseY + dy;
                
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= halfBrush) {
                        this.grid[y][x] = { type: 'empty', lifetime: 0, temperature: 20 };
                    }
                }
            }
        }
        this.sounds.erase();
    }
    
    pickElement() {
        if (this.mouseX >= 0 && this.mouseX < this.gridWidth && 
            this.mouseY >= 0 && this.mouseY < this.gridHeight) {
            const cell = this.grid[this.mouseY][this.mouseX];
            if (cell.type !== 'empty') {
                this.selectedElement = cell.type;
                // Update UI
                document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('active'));
                const btn = document.querySelector(`[data-element="${cell.type}"]`);
                if (btn) btn.classList.add('active');
            }
        }
    }
    
    drawLine() {
        if (!this.lineStart) return;
        
        const x0 = this.lineStart.x;
        const y0 = this.lineStart.y;
        const x1 = this.mouseX;
        const y1 = this.mouseY;
        
        // Bresenham's line algorithm
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        let x = x0;
        let y = y0;
        
        while (true) {
            // Place element at current position
            if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                this.grid[y][x] = {
                    type: this.selectedElement,
                    lifetime: this.elements[this.selectedElement].lifetime || 0,
                    temperature: this.getElementTemperature(this.selectedElement)
                };
            }
            
            if (x === x1 && y === y1) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        this.sounds.place();
    }
    
    createExplosion() {
        const explosionRadius = this.brushSize * 3;
        const explosionPower = this.brushSize * 2;
        
        // Create explosion particles
        for (let i = 0; i < explosionPower * 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const distance = Math.random() * explosionRadius;
            
            this.particles.push({
                x: this.mouseX + Math.cos(angle) * distance,
                y: this.mouseY + Math.sin(angle) * distance,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30,
                color: [255, Math.random() * 100 + 100, 0, 255]
            });
        }
        
        // Destroy elements in explosion radius
        for (let dy = -explosionRadius; dy <= explosionRadius; dy++) {
            for (let dx = -explosionRadius; dx <= explosionRadius; dx++) {
                const x = this.mouseX + dx;
                const y = this.mouseY + dy;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight && 
                    distance <= explosionRadius && Math.random() > distance / explosionRadius) {
                    
                    if (Math.random() > 0.7) {
                        this.grid[y][x] = { type: 'fire', lifetime: 8, temperature: 200 };
                    } else {
                        this.grid[y][x] = { type: 'empty', lifetime: 0, temperature: 20 };
                    }
                }
            }
        }
        
        this.sounds.explosion();
    }
    
    getElementTemperature(elementType) {
        switch (elementType) {
            case 'fire': return 200 + Math.random() * 100; // 200-300°C
            case 'lava': return 1000 + Math.random() * 200; // 1000-1200°C  
            case 'ice': return -10 + Math.random() * 10; // -10 to 0°C
            case 'steam': return 100 + Math.random() * 20; // 100-120°C
            case 'plasma': return 5000 + Math.random() * 5000; // 5000-10000°C
            case 'electricity': return 100 + Math.random() * 50; // 100-150°C
            default: return 20; // Room temperature
        }
    }
    
    drawRectangle() {
        if (!this.rectangleStart) return;
        
        const x1 = Math.min(this.rectangleStart.x, this.mouseX);
        const y1 = Math.min(this.rectangleStart.y, this.mouseY);
        const x2 = Math.max(this.rectangleStart.x, this.mouseX);
        const y2 = Math.max(this.rectangleStart.y, this.mouseY);
        
        for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    const currentCell = this.grid[y][x];
                    if (currentCell.type === 'empty' || this.canReplace(currentCell.type, this.selectedElement)) {
                        this.grid[y][x] = {
                            type: this.selectedElement,
                            lifetime: this.elements[this.selectedElement].lifetime || 0,
                            temperature: this.getElementTemperature(this.selectedElement)
                        };
                    }
                }
            }
        }
        this.sounds.place();
    }
    
    drawCircle() {
        if (!this.rectangleStart) return;
        
        const centerX = this.rectangleStart.x;
        const centerY = this.rectangleStart.y;
        const radius = Math.sqrt((this.mouseX - centerX) ** 2 + (this.mouseY - centerY) ** 2);
        
        for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y++) {
            for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x++) {
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                    if (distance <= radius) {
                        const currentCell = this.grid[y][x];
                        if (currentCell.type === 'empty' || this.canReplace(currentCell.type, this.selectedElement)) {
                            this.grid[y][x] = {
                                type: this.selectedElement,
                                lifetime: this.elements[this.selectedElement].lifetime || 0,
                                temperature: this.getElementTemperature(this.selectedElement)
                            };
                        }
                    }
                }
            }
        }
        this.sounds.place();
    }
    
    applyGravityPush() {
        const pushRadius = this.brushSize * 2;
        const pushStrength = this.pressure;
        
        for (let dy = -pushRadius; dy <= pushRadius; dy++) {
            for (let dx = -pushRadius; dx <= pushRadius; dx++) {
                const x = this.mouseX + dx;
                const y = this.mouseY + dy;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight && 
                    distance <= pushRadius && this.grid[y][x].type !== 'empty') {
                    
                    // Push elements away from cursor
                    const pushX = dx / distance * pushStrength;
                    const pushY = dy / distance * pushStrength;
                    
                    const newX = Math.round(x + pushX / 5);
                    const newY = Math.round(y + pushY / 5);
                    
                    if (newX >= 0 && newX < this.gridWidth && newY >= 0 && newY < this.gridHeight && 
                        this.grid[newY][newX].type === 'empty') {
                        this.grid[newY][newX] = this.grid[y][x];
                        this.grid[y][x] = { type: 'empty', lifetime: 0, temperature: 20 };
                    }
                }
            }
        }
    }
    
    applyWind() {
        const size = 20;
        for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size; dx <= size; dx++) {
                const nx = this.mouseX + dx;
                const ny = this.mouseY + dy;
                if (this.isValidPosition(nx, ny)) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= size) {
                        const force = 1 - distance / size;
                        const element = this.grid[ny][nx];
                        if (element.type !== 'empty' && !this.elements[element.type].solid) {
                            // Wind blows particles to the right
                            const targetX = Math.min(this.gridWidth - 1, nx + Math.floor(force * 3));
                            if (this.isValidPosition(targetX, ny) && this.grid[ny][targetX].type === 'empty') {
                                this.grid[ny][targetX] = { ...element };
                                this.grid[ny][nx] = { type: 'empty', lifetime: 0, temperature: 20 };
                            }
                        }
                    }
                }
            }
        }
    }

    applyVacuum() {
        const size = 15;
        for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size; dx <= size; dx++) {
                const nx = this.mouseX + dx;
                const ny = this.mouseY + dy;
                if (this.isValidPosition(nx, ny)) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= size && distance > 0) {
                        const element = this.grid[ny][nx];
                        if (element.type !== 'empty' && !this.elements[element.type].solid) {
                            // Pull towards center
                            const force = 1 - distance / size;
                            const dirX = dx > 0 ? -1 : (dx < 0 ? 1 : 0);
                            const dirY = dy > 0 ? -1 : (dy < 0 ? 1 : 0);
                            const targetX = nx + Math.floor(dirX * force);
                            const targetY = ny + Math.floor(dirY * force);
                            if (this.isValidPosition(targetX, targetY) && this.grid[targetY][targetX].type === 'empty') {
                                this.grid[targetY][targetX] = { ...element };
                                this.grid[ny][nx] = { type: 'empty', lifetime: 0, temperature: 20 };
                            }
                        }
                    }
                }
            }
        }
    }

    applyHeat() {
        const size = 10;
        for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size; dx <= size; dx++) {
                const nx = this.mouseX + dx;
                const ny = this.mouseY + dy;
                if (this.isValidPosition(nx, ny)) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= size) {
                        const element = this.grid[ny][nx];
                        if (element.type !== 'empty') {
                            element.temperature += 10;
                            // Heat transformations
                            if (element.type === 'ice' && element.temperature > 30) {
                                this.grid[ny][nx] = { type: 'water', lifetime: 0, temperature: element.temperature };
                            } else if (element.type === 'water' && element.temperature > 80) {
                                this.grid[ny][nx] = { type: 'steam', lifetime: 80, temperature: element.temperature };
                            } else if (this.elements[element.type].flammable && element.temperature > 60) {
                                this.grid[ny][nx] = { type: 'fire', lifetime: 15, temperature: element.temperature };
                            }
                        }
                    }
                }
            }
        }
    }

    applyCool() {
        const size = 10;
        for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size; dx <= size; dx++) {
                const nx = this.mouseX + dx;
                const ny = this.mouseY + dy;
                if (this.isValidPosition(nx, ny)) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= size) {
                        const element = this.grid[ny][nx];
                        if (element.type !== 'empty') {
                            element.temperature = Math.max(-10, element.temperature - 15);
                            // Cold transformations
                            if (element.type === 'water' && element.temperature < 5) {
                                this.grid[ny][nx] = { type: 'ice', lifetime: 0, temperature: element.temperature };
                            } else if (element.type === 'steam' && element.temperature < 50) {
                                this.grid[ny][nx] = { type: 'water', lifetime: 0, temperature: element.temperature };
                            } else if (element.type === 'fire') {
                                this.grid[ny][nx] = { type: 'empty', lifetime: 0, temperature: 20 };
                            } else if (element.type === 'lava' && element.temperature < 100) {
                                this.grid[ny][nx] = { type: 'stone', lifetime: 0, temperature: element.temperature };
                            }
                        }
                    }
                }
            }
        }
    }
    
    updatePhysics() {
        if (this.isPaused) return;
        
        // Create new grid - proper deep copy to avoid reference issues
        const newGrid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            newGrid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                // Ensure temperature property exists
                const originalCell = this.grid[y][x];
                newGrid[y][x] = { 
                    type: originalCell.type,
                    lifetime: originalCell.lifetime || 0,
                    temperature: originalCell.temperature || 20
                };
            }
        }
        
        // Create a processed grid to track which cells have been moved this frame
        const processed = [];
        for (let y = 0; y < this.gridHeight; y++) {
            processed[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                processed[y][x] = false;
            }
        }
        
        // Process elements with proper order based on gravity direction
        // For normal gravity (down), process from bottom to top so upper elements can fall
        // For reverse gravity (up), process from top to bottom so lower elements can rise
        const startY = this.reverseGravity ? this.gridHeight - 2 : 1;
        const endY = this.reverseGravity ? -1 : this.gridHeight - 1;
        const yStep = this.reverseGravity ? -1 : 1;
        
        // Process in random order for X to avoid patterns
        const xOrder = Array.from({length: this.gridWidth}, (_, i) => i);
        for (let i = xOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [xOrder[i], xOrder[j]] = [xOrder[j], xOrder[i]];
        }
        
        try {
            for (let y = startY; y !== endY; y += yStep) {
                for (const x of xOrder) {
                    // Skip if this cell has already been processed this frame
                    if (processed[y][x]) continue;
                    
                    // Safety check for valid coordinates
                    if (!this.isValidPosition(x, y)) continue;
                    
                    const cell = this.grid[y][x];
                    if (!cell || cell.type === 'empty') continue;
                    
                    const element = this.elements[cell.type];
                    if (!element) {
                        // Invalid element type, clear it
                        newGrid[y][x] = { type: 'empty', lifetime: 0, temperature: 20 };
                        continue;
                    }
                    
                    // Mark this cell as processed
                    processed[y][x] = true;
                    
                    // Handle lifetime for temporary elements
                    if (element.lifetime && cell.lifetime > 0) {
                        newGrid[y][x].lifetime = cell.lifetime - 1;
                        if (newGrid[y][x].lifetime <= 0) {
                            if (cell.type === 'fire') {
                                this.createSteam(x, y, newGrid);
                            } else if (cell.type === 'steam') {
                                // Steam condenses back to water when it cools down
                                if ((cell.temperature || 20) < 60) {
                                    newGrid[y][x] = { type: 'water', lifetime: 0, temperature: cell.temperature || 20 };
                                    continue;
                                }
                            }
                            newGrid[y][x] = { type: 'empty', lifetime: 0, temperature: 20 };
                            continue;
                        }
                    }
                    
                    // Temperature dissipation
                    this.updateTemperature(x, y, cell, newGrid);
                    
                    // Special interactions first
                    this.handleSpecialInteractions(x, y, cell, newGrid);
                    
                    // Skip if element was consumed in interactions
                    if (!newGrid[y] || !newGrid[y][x] || newGrid[y][x].type === 'empty') continue;
                    
                    // Physics based on element type
                    if (element.gas) {
                        this.updateGasPhysics(x, y, cell, newGrid, processed);
                    } else if (element.liquid) {
                        this.updateLiquidPhysics(x, y, cell, newGrid, processed);
                    } else if (!element.solid) {
                        // Powders like sand, dirt, gunpowder
                        this.updatePowderPhysics(x, y, cell, newGrid, processed);
                    }
                    
                    // Fire spreading (only if still fire after interactions)
                    if (newGrid[y] && newGrid[y][x] && newGrid[y][x].type === 'fire') {
                        this.spreadFire(x, y, newGrid);
                    }
                }
            }
        } catch (error) {
            console.warn('Physics update error:', error);
            // Continue with partial update rather than crashing
        }
        
        // Update particles
        this.updateParticles();
        
        // Apply global wind force if enabled
        if (Math.abs(this.windForce.x) > 0.1) {
            this.applyGlobalWind();
        }
        
        // Apply global magnetic field if enabled
        if (this.magneticField) {
            this.applyGlobalMagneticField();
        }
        
        this.grid = newGrid;
    }
    
    applyGlobalWind() {
        // Optimize wind calculation - only process every few frames
        if (this.frameCount % 3 !== 0) return; // Only run every 3 frames
        
        // Apply wind force across the grid (but limit processing)
        let processedCount = 0;
        const maxProcessPerFrame = 100; // Limit processed particles per frame
        
        for (let y = 0; y < this.gridHeight && processedCount < maxProcessPerFrame; y++) {
            for (let x = 0; x < this.gridWidth && processedCount < maxProcessPerFrame; x++) {
                const cell = this.grid[y][x];
                if (cell.type !== 'empty' && !this.elements[cell.type]?.solid) {
                    const element = this.elements[cell.type];
                    if (element?.gas || element?.liquid || (!element?.solid && Math.random() < 0.05)) { // Reduced chance
                        processedCount++;
                        
                        const windDirection = this.windForce.x > 0 ? 1 : -1;
                        const targetX = x + windDirection;
                        
                        if (this.isValidPosition(targetX, y) && 
                            this.grid[y][targetX].type === 'empty') {
                            this.grid[y][targetX] = { ...cell };
                            this.grid[y][x] = { type: 'empty', lifetime: 0, temperature: 20 };
                        }
                    }
                }
            }
        }
    }
    
    applyGlobalMagneticField() {
        // Optimize magnetic field calculation - only process every few frames
        if (this.frameCount % 5 !== 0) return; // Only run every 5 frames
        
        // First, collect all magnets (much more efficient)
        const magnets = [];
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x].type === 'magnet') {
                    magnets.push({ x, y });
                }
            }
        }
        
        // If no magnets, skip entirely
        if (magnets.length === 0) return;
        
        // Apply magnetic attraction to metals (but limit processing)
        let processedCount = 0;
        const maxProcessPerFrame = 50; // Limit processed metals per frame
        
        for (let y = 0; y < this.gridHeight && processedCount < maxProcessPerFrame; y++) {
            for (let x = 0; x < this.gridWidth && processedCount < maxProcessPerFrame; x++) {
                const cell = this.grid[y][x];
                if (cell.type === 'metal') {
                    processedCount++;
                    
                    // Find nearest magnet (much faster with pre-collected list)
                    let nearestMagnet = null;
                    let minDistance = 15; // Increased max distance slightly
                    
                    for (const magnet of magnets) {
                        const distance = Math.abs(magnet.x - x) + Math.abs(magnet.y - y); // Manhattan distance (faster)
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestMagnet = magnet;
                        }
                    }
                    
                    if (nearestMagnet && Math.random() < 0.15) { // Reduced frequency
                        const dx = nearestMagnet.x - x;
                        const dy = nearestMagnet.y - y;
                        const pullX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
                        const pullY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
                        
                        const targetX = x + pullX;
                        const targetY = y + pullY;
                        
                        if (this.isValidPosition(targetX, targetY) && 
                            this.grid[targetY][targetX].type === 'empty') {
                            this.grid[targetY][targetX] = { ...cell };
                            this.grid[y][x] = { type: 'empty', lifetime: 0, temperature: 20 };
                        }
                    }
                }
            }
        }
    }
    
    updateLiquidPhysics(x, y, cell, newGrid, processed) {
        try {
            // Safety checks
            if (!this.isValidPosition(x, y) || !cell || !newGrid[y] || !newGrid[y][x]) {
                return;
            }
            
            const gravityDirection = this.reverseGravity ? -1 : 1;
            const targetY = y + gravityDirection;
            
            // Try to fall down first
            if (this.canMoveTo(x, targetY, cell, newGrid)) {
                this.moveCellSafe(x, y, x, targetY, cell, newGrid, processed);
                return;
            }
            
            // If can't fall, check diagonally down - randomize direction for natural flow
            const directions = Math.random() > 0.5 ? [-1, 1] : [1, -1];
            for (const dx of directions) {
                if (this.canMoveTo(x + dx, targetY, cell, newGrid)) {
                    this.moveCellSafe(x, y, x + dx, targetY, cell, newGrid, processed);
                    return;
                }
            }
            
            // Improved horizontal flow - liquids should spread more naturally
            let bestDirection = 0;
            let bestPressure = this.calculateLiquidPressure(x, y);
            
            // Check both horizontal directions
            for (const dx of [-1, 1]) {
                const newX = x + dx;
                if (this.isValidPosition(newX, y)) {
                    const pressure = this.calculateLiquidPressure(newX, y);
                    // Lower threshold for better flow
                    if (pressure < bestPressure - 0.2) {
                        bestPressure = pressure;
                        bestDirection = dx;
                    }
                }
            }
            
            // Move towards lower pressure - increased probability for better flow
            if (bestDirection !== 0 && this.canMoveTo(x + bestDirection, y, cell, newGrid)) {
                if (Math.random() < 0.7) { // Increased from 0.4 to 0.7
                    this.moveCellSafe(x, y, x + bestDirection, y, cell, newGrid, processed);
                }
            }
            
            // If no pressure difference, try random horizontal movement for more dynamic liquids
            else if (Math.random() < 0.2) {
                const randomDirection = Math.random() > 0.5 ? 1 : -1;
                if (this.canMoveTo(x + randomDirection, y, cell, newGrid)) {
                    this.moveCellSafe(x, y, x + randomDirection, y, cell, newGrid, processed);
                }
            }
        } catch (error) {
            console.warn('Liquid physics error:', error);
        }
    }
    
    calculateLiquidPressure(x, y) {
        try {
            let pressure = 0;
            // Calculate pressure based on liquid height above this point
            // Improved calculation for more realistic pressure
            for (let checkY = y; checkY >= Math.max(0, y - 8); checkY--) {
                if (this.isValidPosition(x, checkY) && this.grid[checkY] && this.grid[checkY][x]) {
                    const cell = this.grid[checkY][x];
                    const element = this.elements[cell.type];
                    if (element?.liquid) {
                        // More realistic pressure calculation
                        const height = y - checkY + 1;
                        pressure += element.density * height * 0.1;
                    } else if (cell.type !== 'empty') {
                        break; // Solid blocking, stop counting
                    }
                }
            }
            
            // Also consider horizontal liquid mass for more natural flow
            let horizontalMass = 0;
            for (let checkX = Math.max(0, x - 3); checkX <= Math.min(this.gridWidth - 1, x + 3); checkX++) {
                if (this.isValidPosition(checkX, y) && this.grid[y] && this.grid[y][checkX]) {
                    const cell = this.grid[y][checkX];
                    const element = this.elements[cell.type];
                    if (element?.liquid) {
                        horizontalMass += element.density * 0.05;
                    }
                }
            }
            
            return pressure + horizontalMass;
        } catch (error) {
            console.warn('Pressure calculation error:', error);
            return 0;
        }
    }
    
    updatePowderPhysics(x, y, cell, newGrid, processed) {
        try {
            // Safety checks
            if (!this.isValidPosition(x, y) || !cell || !newGrid[y] || !newGrid[y][x]) {
                return;
            }
            
            const gravityDirection = this.reverseGravity ? -1 : 1;
            const targetY = y + gravityDirection;
            
            // Try to fall straight down
            if (this.canMoveTo(x, targetY, cell, newGrid)) {
                this.moveCellSafe(x, y, x, targetY, cell, newGrid, processed);
                return;
            }
            
            // Enhanced sliding physics for powders
            if (cell.type === 'sand' || cell.type === 'gunpowder' || cell.type === 'dirt') {
                const directions = Math.random() > 0.5 ? [-1, 1] : [1, -1];
                
                // Try diagonal sliding with improved physics
                for (const dx of directions) {
                    if (this.canMoveTo(x + dx, targetY, cell, newGrid)) {
                        // Different slide probabilities for different materials
                        let slideChance = 0.8; // Default high slide chance
                        if (cell.type === 'dirt') slideChance = 0.6; // Dirt is stickier
                        if (cell.type === 'sand') slideChance = 0.9; // Sand slides easily
                        if (cell.type === 'gunpowder') slideChance = 0.85; // Gunpowder flows well
                        
                        if (Math.random() < slideChance) {
                            this.moveCellSafe(x, y, x + dx, targetY, cell, newGrid, processed);
                            return;
                        }
                    }
                }
                
                // If can't slide diagonally, try to create avalanche effect
                // Check if there's a pile building up and try to slide horizontally
                const aboveCell = this.isValidPosition(x, y - gravityDirection) ? 
                    this.grid[y - gravityDirection][x] : null;
                
                if (aboveCell && (aboveCell.type === cell.type || 
                    this.elements[aboveCell.type]?.density > 1)) {
                    
                    // Try horizontal avalanche movement
                    for (const dx of directions) {
                        if (this.canMoveTo(x + dx, y, cell, newGrid)) {
                            if (Math.random() < 0.3) { // Avalanche chance
                                this.moveCellSafe(x, y, x + dx, y, cell, newGrid, processed);
                                return;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Powder physics error:', error);
        }
    }
    
    updateGasPhysics(x, y, cell, newGrid, processed) {
        try {
            // Safety checks
            if (!this.isValidPosition(x, y) || !cell || !newGrid[y] || !newGrid[y][x]) {
                return;
            }
            
            const gravityDirection = this.reverseGravity ? 1 : -1; // Gases go opposite to gravity
            
            // Gases should behave more realistically - they rise and disperse
            let moved = false;
            
            // Primary movement: try to move up/down first (gases rise)
            const targetY = y + gravityDirection;
            if (this.canMoveTo(x, targetY, cell, newGrid)) {
                // Higher chance for gases to rise, but not 100% for natural dispersion
                if (Math.random() < 0.85) {
                    this.moveCellSafe(x, y, x, targetY, cell, newGrid, processed);
                    moved = true;
                }
            }
            
            // Secondary movement: diagonal rise
            if (!moved) {
                const directions = Math.random() > 0.5 ? [-1, 1] : [1, -1];
                for (const dx of directions) {
                    if (this.canMoveTo(x + dx, targetY, cell, newGrid)) {
                        if (Math.random() < 0.7) {
                            this.moveCellSafe(x, y, x + dx, targetY, cell, newGrid, processed);
                            moved = true;
                            break;
                        }
                    }
                }
            }
            
            // Tertiary movement: horizontal dispersion (gases spread out)
            if (!moved && Math.random() < 0.5) { // Increased horizontal movement
                const dx = Math.random() > 0.5 ? 1 : -1;
                if (this.canMoveTo(x + dx, y, cell, newGrid)) {
                    this.moveCellSafe(x, y, x + dx, y, cell, newGrid, processed);
                    moved = true;
                }
            }
            
            // Special gas behaviors
            if (cell.type === 'fire') {
                // Fire rises more aggressively and spreads upward
                if (!moved && Math.random() < 0.4) {
                    for (let dy = 1; dy <= 2; dy++) {
                        const checkY = y - dy * (this.reverseGravity ? -1 : 1);
                        if (this.canMoveTo(x, checkY, cell, newGrid)) {
                            this.moveCellSafe(x, y, x, checkY, cell, newGrid, processed);
                            moved = true;
                            break;
                        }
                    }
                }
            } else if (cell.type === 'steam') {
                // Steam should condense when it cools or hits ceiling
                if (y <= 2 && !this.reverseGravity) { // Near ceiling
                    if (Math.random() < 0.1) {
                        newGrid[y][x] = { type: 'water', lifetime: 0, temperature: 80 };
                        return;
                    }
                }
            } else if (cell.type === 'gas') {
                // Combustible gas should accumulate in upper areas
                if (!moved && Math.random() < 0.3) {
                    // Try to move to empty spaces preferentially
                    for (let dy = 1; dy <= 3; dy++) {
                        const checkY = y - dy * (this.reverseGravity ? -1 : 1);
                        if (this.isValidPosition(x, checkY) && 
                            newGrid[checkY] && newGrid[checkY][x] && 
                            newGrid[checkY][x].type === 'empty') {
                            this.moveCellSafe(x, y, x, checkY, cell, newGrid, processed);
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Gas physics error:', error);
        }
    }
    
    canMoveTo(x, y, movingCell, grid = null) {
        // Use provided grid or default to current grid
        const targetGrid = grid || this.grid;
        
        // Boundary checks
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return false;
        }
        
        // Safety check for valid grid position
        if (!targetGrid[y] || !targetGrid[y][x]) {
            return false;
        }
        
        const targetCell = targetGrid[y][x];
        
        // Can move to empty space
        if (targetCell.type === 'empty' || targetCell.type === 'air') {
            return true;
        }
        
        // Safety check for valid moving cell
        if (!movingCell || !movingCell.type) {
            return false;
        }
        
        // Get element properties with safety checks
        const movingElement = this.elements[movingCell.type];
        const targetElement = this.elements[targetCell.type];
        
        if (!movingElement || !targetElement) {
            return false;
        }
        
        // Enhanced density-based displacement with proper physics
        const densityDifference = movingElement.density - targetElement.density;
        
        // Only allow displacement if density difference is significant enough
        if (densityDifference > 0.1) {
            return true;
        }
        
        // Special physics rules for realistic behavior
        
        // Liquids can displace gases (even if density is close)
        if (movingElement.liquid && targetElement.gas) {
            return true;
        }
        
        // Powders (non-liquid, non-gas, non-solid) can displace liquids and gases
        if (!movingElement.solid && !movingElement.liquid && !movingElement.gas && 
            (targetElement.liquid || targetElement.gas)) {
            return true;
        }
        
        // Solids can displace everything lighter
        if (movingElement.solid && densityDifference > 0) {
            return true;
        }
        
        // Fire special interactions
        if (movingCell.type === 'fire') {
            if (targetElement.flammable) return true;
            if (targetElement.gas) return true; // Fire can displace gases
        }
        
        // Acid interactions
        if (movingCell.type === 'acid') {
            if (targetCell.type === 'metal' || targetCell.type === 'plant' || 
                targetCell.type === 'stone' || targetElement.flammable) {
                return true;
            }
        }
        
        // Lava interactions - lava is very hot and dense
        if (movingCell.type === 'lava') {
            if (targetElement.flammable || targetCell.type === 'ice' || 
                targetCell.type === 'water' || targetElement.gas || 
                targetElement.liquid || densityDifference > -1) {
                return true;
            }
        }
        
        // Plasma interactions - plasma is extremely hot
        if (movingCell.type === 'plasma') {
            if (targetCell.type !== 'plasma') return true; // Plasma can displace almost everything
        }
        
        // Steam/gas interactions with temperature
        if (movingElement.gas && targetElement.liquid) {
            // Hot gases can displace cooler liquids
            const movingTemp = movingCell.temperature || 20;
            const targetTemp = targetCell.temperature || 20;
            if (movingTemp > targetTemp + 30) {
                return true;
            }
        }
        
        return false;
    }
    
    createAirCell() {
        return {
            type: 'empty',
            lifetime: 0,
            temperature: 20
        };
    }
    
    findSafeDisplacementLocation(x, y, displacedCell, newGrid, processed) {
        // Try to find a safe spot for the displaced element
        const gravityDirection = this.reverseGravity ? -1 : 1;
        const pushDirection = -gravityDirection; // Opposite to gravity
        
        // Try positions in order of preference
        const searchPositions = [
            [x, y + pushDirection],     // Straight up/down (opposite to gravity)
            [x - 1, y + pushDirection], // Diagonal up-left
            [x + 1, y + pushDirection], // Diagonal up-right
            [x - 1, y],                 // Left
            [x + 1, y],                 // Right
            [x, y + pushDirection * 2], // Further up/down
            [x - 1, y + pushDirection * 2], // Further diagonal
            [x + 1, y + pushDirection * 2]
        ];
        
        for (const [checkX, checkY] of searchPositions) {
            if (this.isValidPosition(checkX, checkY) && 
                (!processed[checkY] || !processed[checkY][checkX]) &&
                newGrid[checkY] && newGrid[checkY][checkX] &&
                (newGrid[checkY][checkX].type === 'empty' || newGrid[checkY][checkX].type === 'air')) {
                return { x: checkX, y: checkY };
            }
        }
        
        return null; // No safe location found
    }
    
    moveCellSafe(fromX, fromY, toX, toY, cell, newGrid, processed) {
        try {
            // Safety checks
            if (!this.isValidPosition(fromX, fromY) || !this.isValidPosition(toX, toY)) {
                return false;
            }
            
            if (!newGrid[fromY] || !newGrid[fromY][fromX] || !newGrid[toY]) {
                return false;
            }
            
            // Check if target position is already processed this frame
            if (processed[toY] && processed[toY][toX]) {
                return false;
            }
            
            // Check if we can actually move to the target
            if (!this.canMoveTo(toX, toY, cell, newGrid)) {
                return false;
            }
            
            // Mark the target position as processed
            if (!processed[toY]) {
                processed[toY] = {};
            }
            processed[toY][toX] = true;
            
            // Handle target cell displacement
            const targetCell = newGrid[toY][toX];
            if (targetCell && targetCell.type !== 'empty' && targetCell.type !== 'air') {
                const movingElement = this.elements[cell.type];
                const targetElement = this.elements[targetCell.type];
                
                // Special interactions take priority over displacement
                if (this.handleCellInteraction(cell, targetCell, newGrid, fromX, fromY, toX, toY)) {
                    return true; // Interaction handled the movement
                }
                
                // Only displace if source element has higher density or special rules apply
                if ((movingElement?.density || 0) > (targetElement?.density || 0) + 0.1) {
                    // Try to find a safe spot for the displaced element
                    const displaced = this.findSafeDisplacementLocation(toX, toY, targetCell, newGrid, processed);
                    if (displaced) {
                        // Mark displaced location as processed
                        if (!processed[displaced.y]) {
                            processed[displaced.y] = {};
                        }
                        processed[displaced.y][displaced.x] = true;
                        
                        // Move displaced element to safe location
                        newGrid[displaced.y][displaced.x] = { ...targetCell };
                        
                        // Move our element to target
                        newGrid[toY][toX] = { ...cell };
                        newGrid[fromY][fromX] = this.createAirCell();
                        return true;
                    } else {
                        // Can't displace safely, check if we can destroy the target
                        if (this.canDestroy(cell.type, targetCell.type)) {
                            // Destroy target and move in
                            newGrid[toY][toX] = { ...cell };
                            newGrid[fromY][fromX] = this.createAirCell();
                            return true;
                        }
                        return false; // Can't move
                    }
                } else {
                    // Can't displace due to density, but check for interactions
                    return false;
                }
            } else {
                // Target is empty, safe to move
                newGrid[toY][toX] = { ...cell };
                newGrid[fromY][fromX] = this.createAirCell();
                return true;
            }
        } catch (error) {
            console.warn('MoveCellSafe error:', error);
            return false;
        }
    }
    
    handleCellInteraction(movingCell, targetCell, newGrid, fromX, fromY, toX, toY) {
        // Handle special interactions between cells
        const movingType = movingCell.type;
        const targetType = targetCell.type;
        
        // Fire interactions
        if (movingType === 'fire') {
            if (targetType === 'water') {
                // Fire + water = steam + extinguish fire
                newGrid[toY][toX] = { type: 'steam', lifetime: 60, temperature: 120 };
                newGrid[fromY][fromX] = { type: 'steam', lifetime: 40, temperature: 100 };
                return true;
            } else if (this.elements[targetType]?.flammable) {
                // Fire spreads to flammable materials
                newGrid[toY][toX] = { type: 'fire', lifetime: 20, temperature: 200 };
                newGrid[fromY][fromX] = this.createAirCell();
                return true;
            }
        }
        
        // Water interactions
        if (movingType === 'water') {
            if (targetType === 'fire') {
                // Water extinguishes fire
                newGrid[toY][toX] = { type: 'steam', lifetime: 50, temperature: 110 };
                newGrid[fromY][fromX] = this.createAirCell();
                return true;
            } else if (targetType === 'lava') {
                // Water + lava = steam + stone
                newGrid[toY][toX] = { type: 'stone', lifetime: 0, temperature: 200 };
                newGrid[fromY][fromX] = { type: 'steam', lifetime: 80, temperature: 150 };
                return true;
            }
        }
        
        // Lava interactions
        if (movingType === 'lava') {
            if (targetType === 'water' || targetType === 'ice') {
                // Lava + water/ice = steam + stone
                newGrid[toY][toX] = { type: 'stone', lifetime: 0, temperature: 300 };
                newGrid[fromY][fromX] = { type: 'steam', lifetime: 60, temperature: 200 };
                return true;
            }
        }
        
        // Acid interactions
        if (movingType === 'acid') {
            if (targetType === 'metal') {
                // Acid dissolves metal
                newGrid[toY][toX] = { ...movingCell };
                newGrid[fromY][fromX] = { type: 'gas', lifetime: 0, temperature: 40 };
                return true;
            } else if (targetType === 'plant' || targetType === 'wood') {
                // Acid destroys organic materials
                newGrid[toY][toX] = { ...movingCell };
                newGrid[fromY][fromX] = this.createAirCell();
                return true;
            }
        }
        
        return false; // No special interaction
    }
    
    canDestroy(movingType, targetType) {
        // Define which elements can destroy others
        const destructiveInteractions = {
            'fire': ['plant', 'wood', 'oil', 'gas'],
            'lava': ['plant', 'wood', 'oil', 'ice', 'water'],
            'acid': ['metal', 'plant', 'wood'],
            'plasma': ['metal', 'stone', 'water', 'ice', 'plant', 'wood', 'oil']
        };
        
        return destructiveInteractions[movingType]?.includes(targetType) || false;
    }
    
    moveCell(fromX, fromY, toX, toY, movingCell, newGrid) {
        // Safety checks for valid coordinates
        if (!this.isValidPosition(fromX, fromY) || !this.isValidPosition(toX, toY)) {
            return;
        }
        
        // Safety checks for valid grid positions
        if (!this.grid[toY] || !this.grid[toY][toX] || !newGrid[toY] || !newGrid[fromY]) {
            return;
        }
        
        const targetCell = this.grid[toY][toX];
        
        // Handle displacement effects
        if (targetCell.type !== 'empty') {
            const targetElement = this.elements[targetCell.type];
            const movingElement = this.elements[movingCell.type];
            
            // Safety check for element existence
            if (!targetElement || !movingElement) {
                // Invalid target element, treat as empty
                newGrid[toY][toX] = { ...movingCell };
                newGrid[fromY][fromX] = { type: 'empty', lifetime: 0, temperature: 20 };
                return;
            }
            
            // If target is flammable and moving cell is fire/lava, ignite it
            if ((movingCell.type === 'fire' || movingCell.type === 'lava') && targetElement.flammable) {
                newGrid[toY][toX] = { 
                    type: 'fire', 
                    lifetime: 20 + Math.random() * 10, 
                    temperature: 200 
                };
                newGrid[fromY][fromX] = { type: 'empty', lifetime: 0, temperature: 20 };
                return;
            }
            
            // If acid dissolves target
            if (movingCell.type === 'acid' && (targetCell.type === 'metal' || targetCell.type === 'plant')) {
                newGrid[toY][toX] = { ...movingCell };
                newGrid[fromY][fromX] = { 
                    type: 'steam', 
                    lifetime: 40, 
                    temperature: 80 
                };
                return;
            }
            
            // If lava melts ice/water
            if (movingCell.type === 'lava' && (targetCell.type === 'ice' || targetCell.type === 'water')) {
                newGrid[toY][toX] = { ...movingCell };
                newGrid[fromY][fromX] = { 
                    type: 'steam', 
                    lifetime: 60, 
                    temperature: 120 
                };
                return;
            }
            
            // Normal displacement - try to push displaced element to a safe location
            const displaced = { ...targetCell };
            newGrid[toY][toX] = { ...movingCell };
            
            // Try to find a place for the displaced element
            let placedDisplaced = false;
            
            // First try to push it upward (opposite to gravity)
            const gravityDirection = this.reverseGravity ? -1 : 1;
            const pushDirection = -gravityDirection;
            
            if (this.isValidPosition(toX, toY + pushDirection) && 
                this.grid[toY + pushDirection] && 
                this.grid[toY + pushDirection][toX].type === 'empty') {
                newGrid[toY + pushDirection][toX] = displaced;
                placedDisplaced = true;
            }
            
            // If can't push upward, try diagonally upward
            if (!placedDisplaced) {
                const directions = [[-1, pushDirection], [1, pushDirection]];
                for (const [dx, dy] of directions) {
                    const newPosX = toX + dx;
                    const newPosY = toY + dy;
                    if (this.isValidPosition(newPosX, newPosY) && 
                        this.grid[newPosY] && 
                        this.grid[newPosY][newPosX] &&
                        this.grid[newPosY][newPosX].type === 'empty') {
                        newGrid[newPosY][newPosX] = displaced;
                        placedDisplaced = true;
                        break;
                    }
                }
            }
            
            // If still can't place, try horizontally
            if (!placedDisplaced) {
                const directions = [[-1, 0], [1, 0]];
                for (const [dx, dy] of directions) {
                    const newPosX = toX + dx;
                    const newPosY = toY + dy;
                    if (this.isValidPosition(newPosX, newPosY) && 
                        this.grid[newPosY] && 
                        this.grid[newPosY][newPosX] &&
                        this.grid[newPosY][newPosX].type === 'empty') {
                        newGrid[newPosY][newPosX] = displaced;
                        placedDisplaced = true;
                        break;
                    }
                }
            }
            
            // If we couldn't place the displaced element anywhere, it gets destroyed
            // This prevents elements from duplicating or disappearing incorrectly
            newGrid[fromY][fromX] = { type: 'empty', lifetime: 0, temperature: 20 };
            
        } else {
            // Simple move to empty space
            newGrid[toY][toX] = { ...movingCell };
            newGrid[fromY][fromX] = { type: 'empty', lifetime: 0, temperature: 20 };
        }
    }
    
    isValidPosition(x, y) {
        return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
    }
    
    updateTemperature(x, y, cell, newGrid) {
        // Safety checks
        if (!this.isValidPosition(x, y) || !cell || !newGrid[y] || !newGrid[y][x]) {
            return;
        }
        
        // Ensure temperature property exists
        const currentTemp = cell.temperature || 20;
        
        // More realistic temperature dissipation
        const roomTemp = 20;
        const dissipationRate = 0.02; // Slower dissipation for more realistic cooling
        
        if (Math.abs(currentTemp - roomTemp) > 1) {
            if (currentTemp > roomTemp) {
                // Hot elements cool down
                const coolingRate = Math.min(dissipationRate * (currentTemp - roomTemp), 2);
                newGrid[y][x].temperature = Math.max(roomTemp, currentTemp - coolingRate);
            } else {
                // Cold elements warm up
                const warmingRate = Math.min(dissipationRate * (roomTemp - currentTemp), 2);
                newGrid[y][x].temperature = Math.min(roomTemp, currentTemp + warmingRate);
            }
        } else {
            newGrid[y][x].temperature = currentTemp;
        }
        
        // Temperature-based state changes with improved thresholds
        const element = this.elements[cell.type];
        if (!element) return;
        
        const cellTemp = newGrid[y][x].temperature;
        
        // Ice melting - more realistic temperature range
        if (cell.type === 'ice' && cellTemp > 5) {
            newGrid[y][x] = { type: 'water', lifetime: 0, temperature: Math.min(cellTemp, 10) };
            return;
        }
        
        // Water freezing - more realistic
        if (cell.type === 'water' && cellTemp < -2) {
            newGrid[y][x] = { type: 'ice', lifetime: 0, temperature: cellTemp };
            return;
        }
        
        // Water evaporating - improved with pressure consideration
        if (cell.type === 'water' && cellTemp > 80) {
            // Higher chance at higher temperatures
            const evapChance = Math.min(0.3, (cellTemp - 80) * 0.01);
            if (Math.random() < evapChance) {
                newGrid[y][x] = { type: 'steam', lifetime: 60 + Math.random() * 40, temperature: cellTemp };
                return;
            }
        }
        
        // Steam condensing - improved
        if (cell.type === 'steam' && cellTemp < 90) {
            const condenseChance = (90 - cellTemp) * 0.005;
            if (Math.random() < condenseChance) {
                newGrid[y][x] = { type: 'water', lifetime: 0, temperature: cellTemp };
                return;
            }
        }
        
        // Lava cooling to stone - more gradual
        if (cell.type === 'lava' && cellTemp < 400) {
            const solidifyChance = (400 - cellTemp) * 0.001;
            if (Math.random() < solidifyChance) {
                newGrid[y][x] = { type: 'stone', lifetime: 0, temperature: cellTemp };
                return;
            }
        }
        
        // Stone melting back to lava at very high temperatures
        if (cell.type === 'stone' && cellTemp > 800) {
            const meltChance = (cellTemp - 800) * 0.0005;
            if (Math.random() < meltChance) {
                newGrid[y][x] = { type: 'lava', lifetime: 0, temperature: cellTemp };
                return;
            }
        }
        
        // Metal melting at extreme temperatures
        if (cell.type === 'metal' && cellTemp > 1000) {
            const meltChance = (cellTemp - 1000) * 0.0001;
            if (Math.random() < meltChance) {
                newGrid[y][x] = { type: 'lava', lifetime: 0, temperature: cellTemp };
                return;
            }
        }
        
        // Flammable materials igniting - improved with varying ignition temperatures
        if (element.flammable && cellTemp > this.getIgnitionTemperature(cell.type)) {
            const igniteChance = (cellTemp - this.getIgnitionTemperature(cell.type)) * 0.01;
            if (Math.random() < igniteChance) {
                newGrid[y][x] = { type: 'fire', lifetime: 6 + Math.random() * 4, temperature: 200 };
                return;
            }
        }
        
        // Enhanced heat conduction
        this.conductHeat(x, y, cell, newGrid);
    }
    
    getIgnitionTemperature(elementType) {
        switch (elementType) {
            case 'plant': return 60;     // Plants ignite easily
            case 'wood': return 80;      // Wood needs more heat
            case 'oil': return 40;       // Oil is very flammable
            case 'gas': return 30;       // Gas ignites easily
            case 'gunpowder': return 50; // Gunpowder is explosive
            default: return 100;         // Default ignition temperature
        }
    }
    
    conductHeat(x, y, cell, newGrid) {
        const conductionRate = 0.03; // Slightly faster heat conduction
        const currentTemp = cell.temperature || 20;
        
        // Get material-specific thermal conductivity
        const getThermalConductivity = (elementType) => {
            switch (elementType) {
                case 'metal': return 3.0;      // Metals conduct heat very well
                case 'water': return 1.5;      // Water conducts heat well
                case 'ice': return 1.2;        // Ice conducts heat moderately
                case 'stone': return 0.8;      // Stone conducts heat slowly
                case 'lava': return 2.0;       // Lava radiates heat well
                case 'sand': return 0.6;       // Sand is a poor conductor
                case 'dirt': return 0.5;       // Dirt is a poor conductor
                case 'wood': return 0.3;       // Wood is an insulator
                case 'plant': return 0.4;      // Plants conduct heat poorly
                case 'air':
                case 'empty': return 0.1;      // Air barely conducts heat
                default: return 1.0;           // Default conductivity
            }
        };
        
        const currentConductivity = getThermalConductivity(cell.type);
        
        // Conduct heat to adjacent cells (4-directional for performance)
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (this.isValidPosition(nx, ny) && this.grid[ny] && this.grid[ny][nx] && 
                newGrid[ny] && newGrid[ny][nx]) {
                
                const neighbor = this.grid[ny][nx];
                if (neighbor.type !== 'empty') {
                    const neighborTemp = neighbor.temperature || 20;
                    const neighborConductivity = getThermalConductivity(neighbor.type);
                    
                    const tempDiff = currentTemp - neighborTemp;
                    if (Math.abs(tempDiff) > 2) { // Only conduct significant temperature differences
                        
                        // Average conductivity between materials
                        const avgConductivity = (currentConductivity + neighborConductivity) / 2;
                        const rate = conductionRate * avgConductivity;
                        const transfer = tempDiff * rate;
                        
                        // Ensure temperature properties exist
                        if (!newGrid[y][x].hasOwnProperty('temperature')) {
                            newGrid[y][x].temperature = currentTemp;
                        }
                        if (!newGrid[ny][nx].hasOwnProperty('temperature')) {
                            newGrid[ny][nx].temperature = neighborTemp;
                        }
                        
                        // Apply heat transfer with limits
                        const maxTransfer = Math.abs(tempDiff) * 0.5; // Don't transfer more than half the difference
                        const actualTransfer = Math.sign(transfer) * Math.min(Math.abs(transfer), maxTransfer);
                        
                        newGrid[y][x].temperature -= actualTransfer;
                        newGrid[ny][nx].temperature += actualTransfer;
                        
                        // Clamp temperatures to reasonable ranges
                        newGrid[y][x].temperature = Math.max(-50, Math.min(2000, newGrid[y][x].temperature));
                        newGrid[ny][nx].temperature = Math.max(-50, Math.min(2000, newGrid[ny][nx].temperature));
                    }
                }
            }
        }
    }
    
    updateFire(x, y, cell, newGrid) {
        // Fire consumes oxygen and spreads to flammable materials
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (this.isValidPosition(nx, ny)) {
                    const neighbor = this.grid[ny][nx];
                    
                    if (neighbor.type === 'water') {
                        // Water extinguishes fire and creates steam
                        newGrid[y][x] = { type: 'steam', lifetime: 60, temperature: 100 };
                        if (Math.random() > 0.5) {
                            newGrid[ny][nx] = { type: 'steam', lifetime: 60, temperature: 100 };
                        }
                        return;
                    } else if (this.elements[neighbor.type]?.flammable && Math.random() > 0.85) {
                        // Spread fire to flammable materials - shorter lifetime
                        newGrid[ny][nx] = { type: 'fire', lifetime: 12, temperature: 200 };
                    } else if (neighbor.type === 'oil' && Math.random() > 0.7) {
                        // Oil burns more easily - but still shorter
                        newGrid[ny][nx] = { type: 'fire', lifetime: 15, temperature: 250 };
                    }
                }
            }
        }
    }
    
    spreadFire(x, y, newGrid) {
        // Fire spreading logic with more realistic behavior and safety checks
        try {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    if (this.isValidPosition(nx, ny) && this.grid[ny] && this.grid[ny][nx] && 
                        newGrid[ny] && newGrid[ny][nx]) {
                        
                        const neighbor = this.grid[ny][nx];
                        const element = this.elements[neighbor.type];
                        
                        if (element?.flammable && newGrid[ny][nx].type !== 'fire') {
                            // Higher chance to spread upward (fire rises)
                            let spreadChance = 0.15;
                            if (dy < 0) spreadChance *= 2; // Upward spread more likely
                            if (dy > 0) spreadChance *= 0.5; // Downward spread less likely
                            
                            // Different materials have different ignition chances
                            if (neighbor.type === 'plant') spreadChance *= 1.5;
                            if (neighbor.type === 'oil') spreadChance *= 2.5;
                            if (neighbor.type === 'wood') spreadChance *= 1.2;
                            if (neighbor.type === 'gas') spreadChance *= 3;
                            
                            if (Math.random() < spreadChance) {
                                const baseLifetime = neighbor.type === 'oil' ? 15 : 
                                                   neighbor.type === 'gas' ? 10 :
                                                   neighbor.type === 'plant' ? 8 : 6;
                                
                                newGrid[ny][nx] = { 
                                    type: 'fire', 
                                    lifetime: baseLifetime + Math.random() * 4,
                                    temperature: 200 + Math.random() * 50
                                };
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('SpreadFire error:', error);
        }
    }
    
    createSteam(x, y, newGrid) {
        // Create steam around fire location with safety checks
        try {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (this.isValidPosition(nx, ny) && newGrid[ny] && newGrid[ny][nx]) {
                        if (newGrid[ny][nx].type === 'empty' && Math.random() > 0.8) {
                            newGrid[ny][nx] = { type: 'steam', lifetime: 40, temperature: 100 };
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('CreateSteam error:', error);
        }
    }
    
    handleSpecialInteractions(x, y, cell, newGrid) {
        try {
            const neighbors = this.getNeighbors(x, y);
            
            // Lava interactions
            if (cell.type === 'lava') {
                for (const neighbor of neighbors) {
                    const {nx, ny, neighborCell} = neighbor;
                    if (!newGrid[ny] || !newGrid[ny][nx]) continue;
                    
                    if (neighborCell.type === 'water') {
                        // Lava + water = steam + stone
                        newGrid[ny][nx] = { type: 'steam', lifetime: 60, temperature: 150 };
                        if (Math.random() > 0.5) {
                            newGrid[y][x] = { type: 'stone', lifetime: 0, temperature: 100 };
                        }
                } else if (neighborCell.type === 'ice') {
                    // Lava melts ice instantly
                    newGrid[ny][nx] = { type: 'steam', lifetime: 80, temperature: 120 };
                } else if (this.elements[neighborCell.type]?.flammable && Math.random() > 0.8) {
                    newGrid[ny][nx] = { type: 'fire', lifetime: 25, temperature: 250 };
                }
            }
        }
        
        // Ice interactions
        if (cell.type === 'ice') {
            // Ice slowly freezes adjacent water
            for (const neighbor of neighbors) {
                const {nx, ny, neighborCell} = neighbor;
                if (neighborCell.type === 'water' && Math.random() > 0.98) {
                    newGrid[ny][nx] = { type: 'ice', lifetime: 0, temperature: -5 };
                }
            }
        }
        
        // Acid interactions
        if (cell.type === 'acid') {
            for (const neighbor of neighbors) {
                const {nx, ny, neighborCell} = neighbor;
                if (neighborCell.type === 'metal' && Math.random() > 0.95) {
                    // Acid dissolves metal, creates gas
                    newGrid[ny][nx] = { type: 'gas', lifetime: 0, temperature: 40 };
                } else if (neighborCell.type === 'plant' && Math.random() > 0.9) {
                    // Acid kills plants
                    newGrid[ny][nx] = { type: 'empty', lifetime: 0, temperature: 20 };
                } else if (neighborCell.type === 'stone' && Math.random() > 0.99) {
                    // Acid very slowly dissolves stone
                    newGrid[ny][nx] = { type: 'sand', lifetime: 0, temperature: 20 };
                }
            }
        }
        
        // Gunpowder explosion
        if (cell.type === 'gunpowder') {
            for (const neighbor of neighbors) {
                const {nx, ny, neighborCell} = neighbor;
                if (neighborCell.type === 'fire' || neighborCell.type === 'electricity' || 
                    neighborCell.type === 'lava' || 
                    (neighborCell.type === 'plasma' && Math.random() > 0.7)) {
                    
                    this.createGunpowderExplosion(x, y, newGrid);
                    return; // Exit after explosion
                }
            }
        }
        
        // Electricity conduction
        if (cell.type === 'electricity') {
            for (const neighbor of neighbors) {
                const {nx, ny, neighborCell} = neighbor;
                if (neighborCell.type === 'metal' && Math.random() > 0.6) {
                    // Electricity conducts through metal
                    newGrid[ny][nx] = { type: 'electricity', lifetime: 8, temperature: 150 };
                } else if (neighborCell.type === 'water' && Math.random() > 0.8) {
                    // Electricity electrocutes water
                    newGrid[ny][nx] = { type: 'steam', lifetime: 30, temperature: 200 };
                } else if (neighborCell.type === 'gunpowder' && Math.random() > 0.9) {
                    // Electricity can ignite gunpowder
                    this.createGunpowderExplosion(nx, ny, newGrid);
                }
            }
        }
        
        // Virus spread
        if (cell.type === 'virus') {
            for (const neighbor of neighbors) {
                const {nx, ny, neighborCell} = neighbor;
                if (neighborCell.type === 'plant' && Math.random() > 0.97) {
                    newGrid[ny][nx] = { type: 'virus', lifetime: 100, temperature: 20 };
                } else if (neighborCell.type === 'wood' && Math.random() > 0.99) {
                    newGrid[ny][nx] = { type: 'virus', lifetime: 80, temperature: 20 };
                }
            }
        }

        // Magnet interactions
        if (cell.type === 'magnet') {
            this.applyMagneticForce(x, y, newGrid);
        }

        // Gas combustion
        if (cell.type === 'gas') {
            for (const neighbor of neighbors) {
                const {nx, ny, neighborCell} = neighbor;
                if (neighborCell.type === 'fire' && Math.random() > 0.8) {
                    this.createGasExplosion(x, y, newGrid);
                    return;
                }
            }
        }

        // Plasma interactions
        if (cell.type === 'plasma') {
            for (const neighbor of neighbors) {
                const {nx, ny, neighborCell} = neighbor;
                if (!newGrid[ny] || !newGrid[ny][nx]) continue;
                
                if (neighborCell.type === 'metal' && Math.random() > 0.9) {
                    newGrid[ny][nx] = { type: 'lava', lifetime: 0, temperature: 400 };
                } else if (neighborCell.type === 'water' && Math.random() > 0.85) {
                    newGrid[ny][nx] = { type: 'steam', lifetime: 40, temperature: 300 };
                } else if (neighborCell.type === 'ice') {
                    newGrid[ny][nx] = { type: 'water', lifetime: 0, temperature: 80 };
                }
            }
        }
        } catch (error) {
            console.warn('Special interactions error:', error);
        }
    }
    
    getNeighbors(x, y) {
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (this.isValidPosition(nx, ny)) {
                    neighbors.push({
                        nx, ny,
                        neighborCell: this.grid[ny][nx]
                    });
                }
            }
        }
        return neighbors;
    }
    
    createGunpowderExplosion(x, y, newGrid) {
        const explosionRadius = 4;
        
        for (let dy = -explosionRadius; dy <= explosionRadius; dy++) {
            for (let dx = -explosionRadius; dx <= explosionRadius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (this.isValidPosition(nx, ny) && distance <= explosionRadius) {
                    const force = 1 - distance / explosionRadius;
                    
                    if (Math.random() < force * 0.8) {
                        if (Math.random() > 0.6) {
                            newGrid[ny][nx] = { type: 'fire', lifetime: 6, temperature: 300 };
                        } else {
                            newGrid[ny][nx] = { type: 'empty', lifetime: 0, temperature: 20 };
                        }
                    }
                }
            }
        }
    }
    
    createGasExplosion(x, y, newGrid) {
        const explosionRadius = 3;
        
        for (let dy = -explosionRadius; dy <= explosionRadius; dy++) {
            for (let dx = -explosionRadius; dx <= explosionRadius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (this.isValidPosition(nx, ny) && distance <= explosionRadius) {
                    if (Math.random() > 0.3) {
                        newGrid[ny][nx] = { type: 'fire', lifetime: 5, temperature: 250 };
                    }
                }
            }
        }
    }
    
    applyMagneticForce(x, y, newGrid) {
        // Optimize magnetic force calculation
        const magneticRange = 4; // Reduced range
        
        // Only process every few calls to reduce CPU load
        if (Math.random() > 0.3) return;
        
        for (let dy = -magneticRange; dy <= magneticRange; dy++) {
            for (let dx = -magneticRange; dx <= magneticRange; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                const distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance (faster)
                
                if (this.isValidPosition(nx, ny) && distance <= magneticRange && distance > 0) {
                    const targetCell = this.grid[ny][nx];
                    
                    if (targetCell.type === 'metal' && Math.random() > 0.9) { // Reduced frequency
                        // Calculate pull direction
                        const pullX = dx > 0 ? -1 : (dx < 0 ? 1 : 0);
                        const pullY = dy > 0 ? -1 : (dy < 0 ? 1 : 0);
                        const targetX = nx + pullX;
                        const targetY = ny + pullY;
                        
                        if (this.isValidPosition(targetX, targetY) && 
                            this.grid[targetY][targetX].type === 'empty') {
                            newGrid[targetY][targetX] = { ...targetCell };
                            newGrid[ny][nx] = { type: 'empty', lifetime: 0, temperature: 20 };
                        }
                    }
                }
            }
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life--;
            
            return particle.life > 0 && 
                   particle.x >= 0 && particle.x < this.gridWidth &&
                   particle.y >= 0 && particle.y < this.gridHeight;
        });
    }
    
    saveScene() {
        const sceneData = {
            grid: this.grid,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(sceneData);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `sandbox-scene-${Date.now()}.json`;
        link.click();
    }
    
    loadScene(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const sceneData = JSON.parse(e.target.result);
                if (sceneData.grid) {
                    this.grid = sceneData.grid;
                    this.particles = [];
                }
            } catch (error) {
                console.error('File loading error:', error);
                alert('Invalid file format!');
            }
        };
        reader.readAsText(file);
    }
    
    render() {
        try {
            // Clear canvas
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Create image data for efficient pixel manipulation
            const imageData = this.ctx.createImageData(this.width, this.height);
            const data = imageData.data;
            
            // Render each cell
            for (let y = 0; y < this.gridHeight; y++) {
                if (!this.grid[y]) continue; // Safety check
                
                for (let x = 0; x < this.gridWidth; x++) {
                    const cell = this.grid[y][x];
                    if (!cell || cell.type === 'empty') continue;
                    
                    const element = this.elements[cell.type];
                    if (!element || !element.color) continue; // Safety check
                    
                    let color = [...element.color];
                    
                    // Add some variation to fire color - daha dinamik
                    if (cell.type === 'fire') {
                        const time = Date.now() * 0.02;
                        const variation = Math.sin((x + y + time) * 0.8) * 60;
                        const flicker = Math.random() * 40 - 20;
                        
                        // Yaşam süresine göre renk solgunlaştır
                        const lifeFactor = Math.max(0.3, (cell.lifetime || 15) / 15);
                        
                        color[0] = Math.max(100, Math.min(255, (color[0] + variation + flicker) * lifeFactor));
                        color[1] = Math.max(0, Math.min(255, (color[1] + variation * 0.3 + flicker * 0.5) * lifeFactor));
                        color[2] = Math.max(0, Math.min(50, color[2] * lifeFactor));
                    }
                    
                    // Add variation to water color for waves effect
                    if (cell.type === 'water') {
                        const variation = Math.sin((x + y + Date.now() * 0.01) * 0.5) * 20;
                        color[0] = Math.max(0, Math.min(255, color[0] + variation * 0.3));
                        color[1] = Math.max(0, Math.min(255, color[1] + variation * 0.5));
                        color[2] = Math.max(0, Math.min(255, color[2] + variation));
                    }
                    
                    // Add variation to oil color
                    if (cell.type === 'oil') {
                        const variation = Math.sin((x + y + Date.now() * 0.005) * 0.3) * 15;
                        color[0] = Math.max(0, Math.min(255, color[0] + variation));
                        color[1] = Math.max(0, Math.min(255, color[1] + variation * 0.7));
                        color[2] = Math.max(0, Math.min(255, color[2] + variation * 0.3));
                    }
                    
                    // Ice shimmer effect
                    if (cell.type === 'ice') {
                        const shimmer = Math.sin((x + y + Date.now() * 0.01) * 0.7) * 30;
                        color[0] = Math.max(0, Math.min(255, color[0] + shimmer));
                        color[1] = Math.max(0, Math.min(255, color[1] + shimmer));
                        color[2] = Math.max(0, Math.min(255, color[2] + shimmer));
                    }
                    
                    // Lava glow effect
                    if (cell.type === 'lava') {
                        const glow = Math.sin((x + y + Date.now() * 0.015) * 0.5) * 40;
                        color[0] = Math.max(200, Math.min(255, color[0] + glow));
                        color[1] = Math.max(0, Math.min(255, color[1] + glow * 0.3));
                    }

                    // Electricity sparks
                    if (cell.type === 'electricity') {
                        const spark = Math.random() * 100;
                        color[0] = Math.min(255, color[0] + spark);
                        color[1] = Math.min(255, color[1] + spark);
                        color[2] = Math.max(0, color[2] - spark * 0.5);
                    }

                    // Virus pulsing effect
                    if (cell.type === 'virus') {
                        const pulse = Math.sin(Date.now() * 0.02 + (x + y) * 0.3) * 60;
                        color[0] = Math.max(150, Math.min(255, color[0] + pulse));
                        color[2] = Math.max(150, Math.min(255, color[2] + pulse));
                    }

                    // Magnet field visualization
                    if (cell.type === 'magnet') {
                        const field = Math.sin((x + y + Date.now() * 0.01) * 0.4) * 20;
                        color[0] = Math.max(100, Math.min(200, color[0] + field));
                    }

                    // Gas transparency variation
                    if (cell.type === 'gas') {
                        const transparency = Math.sin((x + y + Date.now() * 0.008) * 0.6) * 50;
                        color[3] = Math.max(100, Math.min(200, (color[3] || 255) + transparency));
                    }

                    // Plasma chaotic colors
                    if (cell.type === 'plasma') {
                        const chaos = Date.now() * 0.05 + (x + y) * 0.1;
                        color[0] = Math.max(200, Math.min(255, 255 * Math.sin(chaos)));
                        color[1] = Math.max(0, Math.min(150, 150 * Math.sin(chaos * 1.3)));
                        color[2] = Math.max(100, Math.min(255, 255 * Math.sin(chaos * 0.7)));
                    }
                    
                    // Acid bubble effect
                    if (cell.type === 'acid') {
                        const bubble = Math.sin((x * 0.5 + y * 0.3 + Date.now() * 0.008) * 2) * 25;
                        color[1] = Math.max(200, Math.min(255, color[1] + bubble));
                    }
                    
                    // Render 2x2 pixels for each grid cell
                    for (let py = 0; py < 2; py++) {
                        for (let px = 0; px < 2; px++) {
                            const pixelX = x * 2 + px;
                            const pixelY = y * 2 + py;
                            const index = (pixelY * this.width + pixelX) * 4;
                            
                            if (index >= 0 && index < data.length - 3) {
                                data[index] = color[0];     // R
                                data[index + 1] = color[1]; // G
                                data[index + 2] = color[2]; // B
                                data[index + 3] = color[3] || 255; // A
                            }
                        }
                    }
                }
            }
            
            this.ctx.putImageData(imageData, 0, 0);
            
            // Render particles
            if (this.particles && this.particles.length > 0) {
                this.particles.forEach(particle => {
                    if (particle && particle.color && particle.life > 0) {
                        const alpha = particle.life / 30;
                        this.ctx.fillStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${alpha})`;
                        this.ctx.fillRect(particle.x * 2, particle.y * 2, 2, 2);
                    }
                });
            }
            
            // Draw brush preview
            if (this.mouseX >= 0 && this.mouseY >= 0) {
                this.ctx.strokeStyle = this.selectedTool === 'eraser' ? '#ff0000' : '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([3, 3]);
                this.ctx.beginPath();
                
                if (this.selectedTool === 'explosion') {
                    this.ctx.arc(this.mouseX * 2, this.mouseY * 2, this.brushSize * 6, 0, Math.PI * 2);
                } else {
                    this.ctx.arc(this.mouseX * 2, this.mouseY * 2, this.brushSize * 2, 0, Math.PI * 2);
                }
                
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            
            // Draw line preview
            if (this.selectedTool === 'line' && this.lineStart && this.isMouseDown) {
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(this.lineStart.x * 2, this.lineStart.y * 2);
                this.ctx.lineTo(this.mouseX * 2, this.mouseY * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            
        } catch (error) {
            console.error('Render error:', error);
        }
    }
    
    updateStatusBar() {
        // Count elements
        let elementCount = 0;
        let totalTemp = 0;
        let tempCount = 0;
        
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x].type !== 'empty') {
                    elementCount++;
                    totalTemp += this.grid[y][x].temperature;
                    tempCount++;
                }
            }
        }
        
        const avgTemp = tempCount > 0 ? Math.round(totalTemp / tempCount) : 20;
        
        document.getElementById('elementCount').textContent = `Elements: ${elementCount}`;
        document.getElementById('fpsCounter').textContent = `FPS: ${this.fps}`;
        document.getElementById('temperatureInfo').textContent = `Temperature: ${avgTemp}°C`;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PhysicsSandbox();
});
