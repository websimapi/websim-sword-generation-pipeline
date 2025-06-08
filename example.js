// Sword Viewer Example - Three.js Implementation

// Import dependencies (in a real implementation, these would be properly imported)
// const THREE = window.THREE; // Three.js is assumed to be loaded

// Main class for sword viewing
class SwordViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sword = null;
        this.setupThreeJS();
        this.setupAudio();
        this.setupControls();
        this.animate();
    }

    setupThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1c2541);

        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.container.clientWidth / this.container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.z = 3;
        this.camera.position.y = 0.5;

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Add lighting
        this.addLighting();

        // Add event listener for window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    addLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        // Additional rim light
        const rimLight = new THREE.DirectionalLight(0x5bc0be, 0.7);
        rimLight.position.set(-5, 3, -5);
        this.scene.add(rimLight);

        // Optional: Add point light for magical glow effect
        this.magicLight = new THREE.PointLight(0x5bc0be, 0, 3);
        this.magicLight.position.set(0, 0.5, 0);
        this.scene.add(this.magicLight);
    }

    setupAudio() {
        // Create an audio listener and add it to the camera
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        // Create a global audio source
        this.sound = new THREE.Audio(this.listener);

        // Load the sound
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('sounds/sword_activation.wav', (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setVolume(0.5);
        });
    }

    setupControls() {
        // Add orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;

        // Add button for activating magical effects
        const activateButton = document.createElement('button');
        activateButton.textContent = 'Activate Sword';
        activateButton.className = 'activate-button';
        activateButton.addEventListener('click', () => this.activateSword());
        this.container.appendChild(activateButton);
    }

    loadSword(swordData) {
        // Remove any existing sword
        if (this.sword) {
            this.scene.remove(this.sword);
        }

        // Create a group for the sword
        this.sword = new THREE.Group();

        // Load the sword model
        const loader = new THREE.GLTFLoader();
        loader.load(swordData.assets.model, (gltf) => {
            // Add the loaded model to our sword group
            this.sword.add(gltf.scene);

            // Set initial scale
            this.sword.scale.set(1, 1, 1);

            // Center the sword
            const box = new THREE.Box3().setFromObject(this.sword);
            const center = box.getCenter(new THREE.Vector3());
            this.sword.position.x = -center.x;
            this.sword.position.y = -center.y;
            this.sword.position.z = -center.z;

            // Add the sword to the scene
            this.scene.add(this.sword);

            // Store information about emissive elements
            this.hasEmissiveElements = swordData.magical && swordData.magical.enchantmentLevel > 0;
        });

        // Store the sword data
        this.swordData = swordData;
    }

    activateSword() {
        if (!this.sword || !this.hasEmissiveElements) return;

        // Play the activation sound
        if (this.sound && this.sound.buffer) {
            if (this.sound.isPlaying) {
                this.sound.stop();
            }
            this.sound.play();
        }

        // Animate the magical glow
        this.magicLight.intensity = 0;
        const targetIntensity = 2;
        
        // Animate the intensity
        const glowTween = new TWEEN.Tween({ intensity: 0 })
            .to({ intensity: targetIntensity }, 2000)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate((obj) => {
                this.magicLight.intensity = obj.intensity;
            })
            .start();
        
        // Optional: Animate sword slightly
        if (this.sword) {
            const originalRotation = this.sword.rotation.y;
            
            // Sword vibration animation
            const rotateTween = new TWEEN.Tween({ rotation: originalRotation })
                .to({ rotation: originalRotation + Math.PI * 2 }, 2000)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate((obj) => {
                    this.sword.rotation.y = obj.rotation;
                })
                .start();
        }
    }

    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        this.controls.update();
        
        // Update any tweens
        if (window.TWEEN) {
            TWEEN.update();
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Example usage:
document.addEventListener('DOMContentLoaded', () => {
    // Create the sword viewer
    const viewer = new SwordViewer('sword-container');
    
    // Load a sword (this would come from your generation pipeline)
    fetch('/api/swords/generate')
        .then(response => response.json())
        .then(swordData => {
            viewer.loadSword(swordData);
        });
});