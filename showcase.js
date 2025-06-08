// Sword Generation Showcase - Main JavaScript
  
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the sword viewer
    const viewer = new SwordViewer('sword-container');
    
    // Set up event listeners for controls
    document.getElementById('activate-sword').addEventListener('click', () => {
        viewer.activateSword();
    });
    
    document.getElementById('toggle-rotation').addEventListener('click', () => {
        viewer.toggleAutoRotation();
    });
    
    document.getElementById('reset-view').addEventListener('click', () => {
        viewer.resetView();
    });
    
    document.getElementById('screenshot').addEventListener('click', () => {
        viewer.takeScreenshot();
    });
    
    // Set up the enchantment level slider output
    const enchantmentSlider = document.getElementById('enchantment-level');
    const enchantmentOutput = document.getElementById('enchantment-value');
    enchantmentSlider.addEventListener('input', () => {
        enchantmentOutput.textContent = enchantmentSlider.value;
    });
    
    // Set up the generator form
    const generatorForm = document.getElementById('sword-generator-form');
    generatorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        generateSwordFromForm();
    });
    
    // Randomize button
    document.getElementById('randomize-btn').addEventListener('click', () => {
        randomizeSwordAttributes();
    });
    
    // Set up navigation highlighting
    setupNavigation();
    
    // Load the default sword
    loadDefaultSword();
});

// Sword Viewer Class
class SwordViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sword = null;
        this.autoRotationEnabled = false;
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

        // Add ground plane with grid
        this.addGroundPlane();

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

    addGroundPlane() {
        // Create a ground plane with grid
        const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
        gridHelper.position.y = -1;
        this.scene.add(gridHelper);

        // Add a subtle reflective plane
        const planeGeometry = new THREE.PlaneGeometry(10, 10);
        const planeMaterial = new THREE.MeshStandardMaterial({
            color: 0x111a2b,
            metalness: 0.5,
            roughness: 0.7,
            envMapIntensity: 0.5
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -1;
        plane.receiveShadow = true;
        this.scene.add(plane);
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
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 10;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 2.0;
    }

    loadSword(swordData) {
        // Show loading overlay
        document.getElementById('viewer-loading').classList.add('active');
        
        // Remove any existing sword
        if (this.sword) {
            this.scene.remove(this.sword);
        }

        // Create a group for the sword
        this.sword = new THREE.Group();
        
        // Set sword data
        this.swordData = swordData;
        
        // Update UI with sword data
        this.updateSwordInfoUI();
        
        // For this demo, we'll use a placeholder model URL
        const modelUrl = swordData.assets.model || 'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/sword/model.gltf';
        
        // Load the sword model
        const loader = new THREE.GLTFLoader();
        loader.load(modelUrl, (gltf) => {
            // Add the loaded model to our sword group
            this.sword.add(gltf.scene);
            
            // Set initial scale based on sword type
            let scale = 1.0;
            switch(swordData.type) {
                case 'shortsword': scale = 0.7; break;
                case 'greatsword': scale = 1.3; break;
                case 'rapier': scale = 0.9; break;
                case 'katana': scale = 1.1; break;
                case 'falchion': scale = 0.9; break;
                default: scale = 1.0;
            }
            this.sword.scale.set(scale, scale, scale);
            
            // Center the sword
            const box = new THREE.Box3().setFromObject(this.sword);
            const center = box.getCenter(new THREE.Vector3());
            this.sword.position.x = -center.x;
            this.sword.position.y = -center.y;
            this.sword.position.z = -center.z;
            
            // Adjust sword position for better display
            this.sword.position.y += 0.5;
            
            // Add the sword to the scene
            this.scene.add(this.sword);
            
            // Set up the magic light color based on element
            this.setupMagicLightColor();
            
            // Hide loading overlay
            document.getElementById('viewer-loading').classList.remove('active');
        }, undefined, (error) => {
            console.error('Error loading sword model:', error);
            document.getElementById('viewer-loading').classList.remove('active');
        });
    }
    
    setupMagicLightColor() {
        if (!this.swordData || !this.swordData.magical) return;
        
        // Set magic light color based on element
        const element = this.swordData.magical.element;
        switch(element) {
            case 'fire': this.magicLight.color.set(0xff6b6b); break;
            case 'ice': this.magicLight.color.set(0x5bc0be); break;
            case 'lightning': this.magicLight.color.set(0xffde59); break;
            case 'shadow': this.magicLight.color.set(0x8a76c9); break;
            case 'holy': this.magicLight.color.set(0xfcf7bb); break;
            case 'nature': this.magicLight.color.set(0x6aaa64); break;
            default: this.magicLight.color.set(0xffffff);
        }
    }
    
    updateSwordInfoUI() {
        // Update the sword info panel with data
        if (!this.swordData) return;
        
        document.getElementById('sword-name').textContent = this.swordData.name;
        document.getElementById('sword-description').textContent = this.swordData.description || 'A masterfully crafted sword with unique properties.';
        
        // Update physical properties
        const properties = document.querySelectorAll('.property-value');
        properties[0].textContent = capitalize(this.swordData.type);
        properties[1].textContent = formatMaterial(this.swordData.physical.material);
        properties[2].textContent = `${this.swordData.physical.length} cm`;
        properties[3].textContent = `${this.swordData.physical.weight} kg`;
        properties[4].textContent = `${this.swordData.physical.damage.base} (${capitalize(this.swordData.physical.damage.type)})`;
        
        // Update magical properties
        properties[5].textContent = capitalize(this.swordData.magical.element);
        properties[6].textContent = this.swordData.magical.enchantmentLevel;
        
        // Update effects
        const effectsContainer = document.querySelector('.sword-property-group:nth-child(2)');
        const existingEffects = effectsContainer.querySelectorAll('.effect');
        
        // Remove existing effects
        existingEffects.forEach(effect => effect.remove());
        
        // Add new effects
        if (this.swordData.magical && this.swordData.magical.effects) {
            this.swordData.magical.effects.forEach(effect => {
                const effectDiv = document.createElement('div');
                effectDiv.className = 'effect';
                
                const effectName = document.createElement('div');
                effectName.className = 'effect-name';
                effectName.textContent = formatEffectName(effect.type);
                
                const effectDesc = document.createElement('div');
                effectDesc.className = 'effect-description';
                effectDesc.textContent = formatEffectDescription(effect);
                
                effectDiv.appendChild(effectName);
                effectDiv.appendChild(effectDesc);
                effectsContainer.appendChild(effectDiv);
            });
        }
        
        // Update historical properties
        const historyProperties = document.querySelectorAll('.sword-property-group:nth-child(3) .property-value');
        if (this.swordData.history) {
            historyProperties[0].textContent = `${this.swordData.history.age} years`;
            historyProperties[1].textContent = formatCulture(this.swordData.history.culture);
            historyProperties[2].textContent = this.swordData.history.previousOwners ? this.swordData.history.previousOwners.join(', ') : 'Unknown';
        }
    }
    
    activateSword() {
        if (!this.sword || !this.swordData) return;
        
        const hasEnchantment = this.swordData.magical && this.swordData.magical.enchantmentLevel > 0;
        if (!hasEnchantment) {
            console.log('This sword has no magical properties to activate.');
            return;
        }
        
        // Play the activation sound
        if (this.sound && this.sound.buffer) {
            if (this.sound.isPlaying) {
                this.sound.stop();
            }
            this.sound.play();
        }
        
        // Animate the magical glow
        this.magicLight.intensity = 0;
        const targetIntensity = this.swordData.magical.enchantmentLevel / 2; // Scale intensity by enchantment level
        
        // Animate the intensity
        const glowTween = new TWEEN.Tween({ intensity: 0 })
            .to({ intensity: targetIntensity }, 2000)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate((obj) => {
                this.magicLight.intensity = obj.intensity;
            })
            .start();
        
        // Animate sword
        if (this.sword) {
            const originalRotation = this.sword.rotation.y;
            
            // Sword rotation animation
            const rotateTween = new TWEEN.Tween({ rotation: originalRotation })
                .to({ rotation: originalRotation + Math.PI * 2 }, 2000)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate((obj) => {
                    this.sword.rotation.y = obj.rotation;
                })
                .start();
                
            // Slight hover effect
            const originalY = this.sword.position.y;
            const hoverTween = new TWEEN.Tween({ y: originalY })
                .to({ y: originalY + 0.3 }, 1000)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate((obj) => {
                    this.sword.position.y = obj.y;
                })
                .yoyo(true)
                .repeat(1)
                .start();
        }
    }
    
    toggleAutoRotation() {
        this.autoRotationEnabled = !this.autoRotationEnabled;
        this.controls.autoRotate = this.autoRotationEnabled;
        
        // Update button text
        const button = document.getElementById('toggle-rotation');
        button.textContent = this.autoRotationEnabled ? 'Stop Rotation' : 'Toggle Auto-Rotation';
    }
    
    resetView() {
        // Reset camera position
        this.camera.position.set(0, 0.5, 3);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }
    
    takeScreenshot() {
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // Get the canvas data as an image
        const dataURL = this.renderer.domElement.toDataURL('image/png');
        
        // Create a link and download the image
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `${this.swordData.name || 'sword'}_screenshot.png`;
        link.click();
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

// Helper Functions
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function formatMaterial(material) {
    if (!material) return '';
    return material.split('_').map(word => capitalize(word)).join(' ');
}

function formatEffectName(effectType) {
    if (!effectType) return '';
    return effectType.split('_').map(word => capitalize(word)).join(' ');
}

function formatEffectDescription(effect) {
    if (!effect) return '';
    
    switch(effect.type) {
        case 'frost_damage':
            return `Deals ${effect.value} frost damage over ${effect.duration} seconds`;
        case 'fire_damage':
            return `Deals ${effect.value} fire damage over ${effect.duration} seconds`;
        case 'lightning_damage':
            return `Deals ${effect.value} lightning damage over ${effect.duration} seconds`;
        case 'movement_slow':
            return `Reduces target movement speed by ${effect.value}% for ${effect.duration} seconds`;
        case 'stun':
            return `Stuns the target for ${effect.duration} seconds`;
        case 'life_steal':
            return `Steals ${effect.value}% of damage as health`;
        default:
            return `${capitalize(effect.type)}: ${effect.value} (${effect.duration}s)`;
    }
}

function formatCulture(culture) {
    if (!culture) return 'Unknown';
    return culture.split('_').map(word => capitalize(word)).join(' ');
}

// Navigation functions
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Add click event listeners to nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the target section
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Scroll to the section
                targetElement.scrollIntoView({ behavior: 'smooth' });
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
    
    // Update active link on scroll
    window.addEventListener('scroll', () => {
        let currentSection = '';
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= (sectionTop - 100)) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === currentSection) {
                link.classList.add('active');
            }
        });
    });
}

// Load the default sword
function loadDefaultSword() {
    // Sample sword data - in a real application this would come from the generation pipeline
    const sampleSwordData = {
        "id": "e7c8a12b-3d9f-4e7a-8f1d-25a9e02e6c15",
        "name": "Frostbite",
        "type": "longsword",
        "rarity": "legendary",
        "level": 42,
        "description": "An ancient blade forged in the eternal ice of the Northern Peaks. Once wielded by Jormund the Frost King, this legendary sword carries powerful ice enchantments.",
        "physical": {
            "length": 120,
            "weight": 2.5,
            "material": "enchanted_steel",
            "durability": 950,
            "damage": {
                "base": 75,
                "type": "slashing"
            }
        },
        "visual": {
            "colorScheme": "ice_blue",
            "decorationStyle": "nordic",
            "weathering": "pristine",
            "inscriptions": true
        },
        "magical": {
            "element": "ice",
            "enchantmentLevel": 5,
            "effects": [
                {
                    "type": "frost_damage",
                    "value": 25,
                    "duration": 5
                },
                {
                    "type": "movement_slow",
                    "value": 30,
                    "duration": 3
                }
            ]
        },
        "history": {
            "age": 347,
            "culture": "northern_realm",
            "previousOwners": [
                "Jormund the Frost King",
                "Valeria Iceheart"
            ],
            "lore": "Forged in the eternal ice of the Northern Peaks..."
        },
        "assets": {
            "thumbnail": "swords/e7c8a12b/thumbnail.png",
            "fullImage": "swords/e7c8a12b/full.png",
            "model": "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/sword/model.gltf", // Example URL to a sword model
            "textures": {
                "diffuse": "swords/e7c8a12b/textures/diffuse.jpg",
                "normal": "swords/e7c8a12b/textures/normal.jpg",
                "metallic": "swords/e7c8a12b/textures/metallic.jpg",
                "emissive": "swords/e7c8a12b/textures/emissive.jpg"
            }
        },
        "gameplay": {
            "requiredLevel": 38,
            "requiredStrength": 45,
            "specialMoves": [
                "frost_nova",
                "ice_slash"
            ],
            "cooldowns": {
                "frost_nova": 30,
                "ice_slash": 15
            }
        },
        "metadata": {
            "createdAt": "2023-11-15T08:24:31Z",
            "generationSeed": "78a92c4fd13e",
            "version": "2.4.1"
        }
    };
    
    // Load the sample sword into the viewer
    const viewer = document.querySelector('main').swordViewer;
    if (viewer) {
        viewer.loadSword(sampleSwordData);
    } else {
        // If the viewer isn't available yet, wait a moment and try again
        setTimeout(() => {
            const viewer = new SwordViewer('sword-container');
            viewer.loadSword(sampleSwordData);
            // Store the viewer instance for later access
            document.querySelector('main').swordViewer = viewer;
        }, 100);
    }
}

// Generate a sword from the form values
function generateSwordFromForm() {
    // Show loading overlay
    document.getElementById('viewer-loading').classList.add('active');
    
    // Get form values
    const type = document.getElementById('sword-type').value;
    const material = document.getElementById('material').value;
    const rarity = document.getElementById('rarity').value;
    const element = document.getElementById('element').value;
    const enchantmentLevel = parseInt(document.getElementById('enchantment-level').value);
    const decorationStyle = document.getElementById('decoration-style').value;
    const weathering = document.getElementById('weathering').value;
    
    // Generate a unique ID
    const id = 'sword-' + Math.random().toString(36).substring(2, 15);
    
    // Generate a name based on attributes
    const name = generateSwordName(type, element, rarity);
    
    // Create the sword data object
    const swordData = {
        "id": id,
        "name": name,
        "type": type,
        "rarity": rarity,
        "level": calculateLevelFromRarity(rarity),
        "description": generateSwordDescription(name, type, material, element, rarity),
        "physical": {
            "length": calculateLength(type),
            "weight": calculateWeight(type, material),
            "material": material,
            "durability": calculateDurability(material, rarity),
            "damage": {
                "base": calculateDamage(type, rarity),
                "type": getDamageType(type)
            }
        },
        "visual": {
            "colorScheme": getColorScheme(element),
            "decorationStyle": decorationStyle,
            "weathering": weathering,
            "inscriptions": element !== 'none'
        },
        "magical": {
            "element": element,
            "enchantmentLevel": enchantmentLevel,
            "effects": generateEffects(element, enchantmentLevel)
        },
        "history": {
            "age": calculateAge(weathering, rarity),
            "culture": generateCulture(decorationStyle),
            "previousOwners": generatePreviousOwners(rarity, element)
        },
        "assets": {
            "model": "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/sword/model.gltf" // Placeholder model URL
        }
    };
    
    // Load the generated sword
    const viewer = document.querySelector('main').swordViewer;
    if (viewer) {
        viewer.loadSword(swordData);
    }
}

// Random sword attribute generator
function randomizeSwordAttributes() {
    // Set random values for each form element
    const swordTypeSelect = document.getElementById('sword-type');
    swordTypeSelect.value = getRandomArrayElement(['shortsword', 'longsword', 'greatsword', 'rapier', 'katana', 'falchion']);
    
    const materialSelect = document.getElementById('material');
    materialSelect.value = getRandomArrayElement(['iron', 'steel', 'enchanted_steel', 'damascus_steel', 'dragonbone', 'mythril']);
    
    const raritySelect = document.getElementById('rarity');
    raritySelect.value = getRandomArrayElement(['common', 'uncommon', 'rare', 'legendary', 'artifact']);
    
    const elementSelect = document.getElementById('element');
    elementSelect.value = getRandomArrayElement(['none', 'fire', 'ice', 'lightning', 'shadow', 'holy', 'nature']);
    
    const enchantmentLevelSlider = document.getElementById('enchantment-level');
    const randomEnchantmentLevel = Math.floor(Math.random() * 11); // 0-10
    enchantmentLevelSlider.value = randomEnchantmentLevel;
    document.getElementById('enchantment-value').textContent = randomEnchantmentLevel;
    
    const decorationStyleSelect = document.getElementById('decoration-style');
    decorationStyleSelect.value = getRandomArrayElement(['plain', 'ornate', 'runic', 'nordic', 'elven', 'dwarven', 'demonic']);
    
    const weatheringSelect = document.getElementById('weathering');
    weatheringSelect.value = getRandomArrayElement(['pristine', 'slightly_used', 'battle_worn', 'ancient', 'restored']);
}

// Helper function to get a random array element
function getRandomArrayElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Helper functions for sword generation
function generateSwordName(type, element, rarity) {
    // Simple name generation based on attributes
    const rarityPrefixes = {
        'common': ['Simple', 'Basic', 'Plain', 'Sturdy'],
        'uncommon': ['Quality', 'Fine', 'Reliable', 'Crafted'],
        'rare': ['Exceptional', 'Superior', 'Masterful', 'Impressive'],
        'legendary': ['Legendary', 'Mythical', 'Ancient', 'Fabled'],
        'artifact': ['Divine', 'Godly', 'Transcendent', 'Supreme']
    };
    
    const elementSuffixes = {
        'none': ['Edge', 'Blade', 'Steel', 'Cutter', 'Slicer'],
        'fire': ['Flame', 'Blaze', 'Inferno', 'Ember', 'Scorch'],
        'ice': ['Frost', 'Chill', 'Glacier', 'Winter', 'Freeze'],
        'lightning': ['Storm', 'Thunder', 'Shock', 'Tempest', 'Volt'],
        'shadow': ['Dusk', 'Shade', 'Night', 'Umbra', 'Eclipse'],
        'holy': ['Light', 'Radiance', 'Divine', 'Halo', 'Saint'],
        'nature': ['Bloom', 'Thorn', 'Grove', 'Vine', 'Forest']
    };
    
    const typeSuffixes = {
        'shortsword': ['Dagger', 'Shiv', 'Piercer'],
        'longsword': ['Sword', 'Blade', 'Steel'],
        'greatsword': ['Cleaver', 'Destroyer', 'Crusher'],
        'rapier': ['Needle', 'Poker', 'Piercer'],
        'katana': ['Kiri', 'Slasher', 'Whisper'],
        'falchion': ['Crescent', 'Curve', 'Hook']
    };
    
    const legendaryNames = [
        'Frostbite', 'Inferno', 'Doomcaller', 'Lightbringer', 'Shadowfang', 
        'Soulreaver', 'Windcutter', 'Kingslayer', 'Dragonspine', 'Oathkeeper',
        'Dawnbreaker', 'Nightfall', 'Stormbringer', 'Heartseeker', 'Bloodthirst'
    ];
    
    // For legendary and artifact items, sometimes use a special name
    if ((rarity === 'legendary' || rarity === 'artifact') && Math.random() < 0.7) {
        return getRandomArrayElement(legendaryNames);
    }
    
    // Otherwise generate a name from components
    const prefix = getRandomArrayElement(rarityPrefixes[rarity] || rarityPrefixes.common);
    const elementSuffix = getRandomArrayElement(elementSuffixes[element] || elementSuffixes.none);
    const typeSuffix = getRandomArrayElement(typeSuffixes[type] || typeSuffixes.longsword);
    
    // Decide on name format
    const nameFormat = Math.floor(Math.random() * 3);
    switch (nameFormat) {
        case 0: return `${prefix} ${typeSuffix}`;
        case 1: return `${elementSuffix}${typeSuffix}`;
        case 2: return `${prefix} ${elementSuffix}`;
        default: return `${prefix} ${elementSuffix} ${typeSuffix}`;
    }
}

function generateSwordDescription(name, type, material, element, rarity) {
    // Simple description generation based on attributes
    const materialDesc = {
        'iron': 'sturdy iron',
        'steel': 'quality steel',
        'enchanted_steel': 'magically-infused steel',
        'damascus_steel': 'intricately patterned damascus steel',
        'dragonbone': 'rare and resilient dragonbone',
        'mythril': 'legendary mythril'
    };
    
    const elementDesc = {
        'none': '',
        'fire': 'It radiates an intense heat, with flames dancing along the blade when wielded with purpose.',
        'ice': 'The blade is perpetually cold to the touch, occasionally emitting a light frost mist in warm environments.',
        'lightning': 'Tiny sparks occasionally dance across its surface, and the air around it seems charged with energy.',
        'shadow': 'Shadows seem to cling to the blade, and it appears to absorb light rather than reflect it.',
        'holy': 'It emits a subtle, warm glow that intensifies in the presence of evil or corruption.',
        'nature': 'Small vines and leaves occasionally sprout along the hilt, withering and regrowing in an endless cycle.'
    };
    
    const rarityDesc = {
        'common': 'A serviceable weapon without particular distinction.',
        'uncommon': 'A well-crafted weapon of above-average quality.',
        'rare': 'An excellent weapon crafted by a master smith.',
        'legendary': 'A renowned weapon whose name echoes through history.',
        'artifact': 'A weapon of immense power, its origins lost to time.'
    };
    
    const typeDesc = {
        'shortsword': 'short but deadly blade',
        'longsword': 'perfectly balanced blade',
        'greatsword': 'massive, imposing blade',
        'rapier': 'thin, elegant blade',
        'katana': 'curved, razor-sharp blade',
        'falchion': 'single-edged curved blade'
    };
    
    let description = `A ${typeDesc[type] || 'blade'} forged of ${materialDesc[material] || 'metal'}. `;
    
    if (element !== 'none') {
        description += elementDesc[element] + ' ';
    }
    
    description += rarityDesc[rarity] || '';
    
    return description;
}

function calculateLevelFromRarity(rarity) {
    // Calculate an appropriate level requirement based on rarity
    switch(rarity) {
        case 'common': return Math.floor(Math.random() * 10) + 1; // 1-10
        case 'uncommon': return Math.floor(Math.random() * 10) + 11; // 11-20
        case 'rare': return Math.floor(Math.random() * 10) + 21; // 21-30
        case 'legendary': return Math.floor(Math.random() * 10) + 31; // 31-40
        case 'artifact': return Math.floor(Math.random() * 10) + 41; // 41-50
        default: return 1;
    }
}

function calculateLength(type) {
    // Average lengths in cm
    switch(type) {
        case 'shortsword': return Math.floor(Math.random() * 20) + 50; // 50-70 cm
        case 'longsword': return Math.floor(Math.random() * 30) + 90; // 90-120 cm
        case 'greatsword': return Math.floor(Math.random() * 40) + 140; // 140-180 cm
        case 'rapier': return Math.floor(Math.random() * 20) + 100; // 100-120 cm
        case 'katana': return Math.floor(Math.random() * 20) + 90; // 90-110 cm
        case 'falchion': return Math.floor(Math.random() * 20) + 80; // 80-100 cm
        default: return 100; // Default
    }
}

function calculateWeight(type, material) {
    // Base weight by type in kg
    let baseWeight = 1.0;
    switch(type) {
        case 'shortsword': baseWeight = 0.8; break;
        case 'longsword': baseWeight = 1.5; break;
        case 'greatsword': baseWeight = 3.0; break;
        case 'rapier': baseWeight = 1.0; break;
        case 'katana': baseWeight = 1.2; break;
        case 'falchion': baseWeight = 1.3; break;
    }
    
    // Material modifiers
    let materialMod = 1.0;
    switch(material) {
        case 'iron': materialMod = 1.2; break;
        case 'steel': materialMod = 1.0; break;
        case 'enchanted_steel': materialMod = 0.8; break;
        case 'damascus_steel': materialMod = 0.9; break;
        case 'dragonbone': materialMod = 0.7; break;
        case 'mythril': materialMod = 0.6; break;
    }
    
    // Calculate final weight with some randomness
    const randomFactor = 0.9 + Math.random() * 0.2; // 0.9-1.1
    return parseFloat((baseWeight * materialMod * randomFactor).toFixed(1));
}

function calculateDurability(material, rarity) {
    // Base durability by material
    let baseDurability = 100;
    switch(material) {
        case 'iron': baseDurability = 100; break;
        case 'steel': baseDurability = 200; break;
        case 'enchanted_steel': baseDurability = 400; break;
        case 'damascus_steel': baseDurability = 300; break;
        case 'dragonbone': baseDurability = 500; break;
        case 'mythril': baseDurability = 700; break;
    }
    
    // Rarity modifiers
    let rarityMod = 1.0;
    switch(rarity) {
        case 'common': rarityMod = 1.0; break;
        case 'uncommon': rarityMod = 1.2; break;
        case 'rare': rarityMod = 1.5; break;
        case 'legendary': rarityMod = 2.0; break;
        case 'artifact': rarityMod = 3.0; break;
    }
    
    // Calculate final durability with some randomness
    const randomFactor = 0.9 + Math.random() * 0.2; // 0.9-1.1
    return Math.floor(baseDurability * rarityMod * randomFactor);
}

function calculateDamage(type, rarity) {
    // Base damage by type
    let baseDamage = 10;
    switch(type) {
        case 'shortsword': baseDamage = 15; break;
        case 'longsword': baseDamage = 25; break;
        case 'greatsword': baseDamage = 40; break;
        case 'rapier': baseDamage = 20; break;
        case 'katana': baseDamage = 30; break;
        case 'falchion': baseDamage = 28; break;
    }
    
    // Rarity modifiers
    let rarityMod = 1.0;
    switch(rarity) {
        case 'common': rarityMod = 1.0; break;
        case 'uncommon': rarityMod = 1.3; break;
        case 'rare': rarityMod = 1.6; break;
        case 'legendary': rarityMod = 2.0; break;
        case 'artifact': rarityMod = 2.5; break;
    }
    
    // Calculate final damage with some randomness
    const randomFactor = 0.9 + Math.random() * 0.2; // 0.9-1.1
    return Math.floor(baseDamage * rarityMod * randomFactor);
}

function getDamageType(type) {
    // Determine damage type based on sword type
    switch(type) {
        case 'shortsword': return 'piercing';
        case 'longsword': return 'slashing';
        case 'greatsword': return 'crushing';
        case 'rapier': return 'piercing';
        case 'katana': return 'slashing';
        case 'falchion': return 'slashing';
        default: return 'slashing';
    }
}

function getColorScheme(element) {
    // Determine color scheme based on element
    switch(element) {
        case 'fire': return 'red_gold';
        case 'ice': return 'ice_blue';
        case 'lightning': return 'electric_blue';
        case 'shadow': return 'dark_purple';
        case 'holy': return 'gold_white';
        case 'nature': return 'emerald_brown';
        default: return 'steel_gray';
    }
}

function generateEffects(element, enchantmentLevel) {
    if (enchantmentLevel <= 0 || element === 'none') {
        return [];
    }
    
    const effects = [];
    
    // Add element-specific primary effect
    switch(element) {
        case 'fire':
            effects.push({
                "type": "fire_damage",
                "value": 5 * enchantmentLevel,
                "duration": Math.min(5, 1 + Math.floor(enchantmentLevel / 2))
            });
            break;
        case 'ice':
            effects.push({
                "type": "frost_damage",
                "value": 4 * enchantmentLevel,
                "duration": Math.min(5, 1 + Math.floor(enchantmentLevel / 2))
            });
            break;
        case 'lightning':
            effects.push({
                "type": "lightning_damage",
                "value": 6 * enchantmentLevel,
                "duration": Math.min(3, 1 + Math.floor(enchantmentLevel / 3))
            });
            break;
        case 'shadow':
            effects.push({
                "type": "shadow_damage",
                "value": 5 * enchantmentLevel,
                "duration": Math.min(4, 1 + Math.floor(enchantmentLevel / 2))
            });
            break;
        case 'holy':
            effects.push({
                "type": "holy_damage",
                "value": 5 * enchantmentLevel,
                "duration": Math.min(4, 1 + Math.floor(enchantmentLevel / 2))
            });
            break;
        case 'nature':
            effects.push({
                "type": "nature_damage",
                "value": 4 * enchantmentLevel,
                "duration": Math.min(6, 1 + Math.floor(enchantmentLevel / 2))
            });
            break;
    }
    
    // Add secondary effect based on enchantment level
    if (enchantmentLevel >= 5) {
        switch(element) {
            case 'fire':
                effects.push({
                    "type": "burning",
                    "value": 10 + (enchantmentLevel - 5) * 5,
                    "duration": Math.min(3, 1 + Math.floor((enchantmentLevel - 5) / 2))
                });
                break;
            case 'ice':
                effects.push({
                    "type": "movement_slow",
                    "value": 20 + (enchantmentLevel - 5) * 5,
                    "duration": Math.min(4, 1 + Math.floor((enchantmentLevel - 5) / 2))
                });
                break;
            case 'lightning':
                effects.push({
                    "type": "stun",
                    "value": 1,
                    "duration": Math.min(2, 1 + Math.floor((enchantmentLevel - 5) / 3))
                });
                break;
            case 'shadow':
                effects.push({
                    "type": "life_steal",
                    "value": 5 + (enchantmentLevel - 5) * 3,
                    "duration": 0
                });
                break;
            case 'holy':
                effects.push({
                    "type": "healing_bonus",
                    "value": 10 + (enchantmentLevel - 5) * 5,
                    "duration": 0
                });
                break;
            case 'nature':
                effects.push({
                    "type": "poison",
                    "value": 3 * (enchantmentLevel - 5),
                    "duration": Math.min(5, 2 + Math.floor((enchantmentLevel - 5) / 2))
                });
                break;
        }
    }
    
    return effects;
}

function calculateAge(weathering, rarity) {
    // Calculate age based on weathering and rarity
    let baseAge = 0;
    switch(weathering) {
        case 'pristine': baseAge = 1; break;
        case 'slightly_used': baseAge = 10; break;
        case 'battle_worn': baseAge = 50; break;
        case 'ancient': baseAge = 200; break;
        case 'restored': baseAge = 100; break;
    }
    
    // Rarity modifiers
    let rarityMod = 1.0;
    switch(rarity) {
        case 'common': rarityMod = 0.5; break;
        case 'uncommon': rarityMod = 1.0; break;
        case 'rare': rarityMod = 1.5; break;
        case 'legendary': rarityMod = 3.0; break;
        case 'artifact': rarityMod = 5.0; break;
    }
    
    // Add randomness
    const randomFactor = 0.7 + Math.random() * 0.6; // 0.7-1.3
    return Math.floor(baseAge * rarityMod * randomFactor);
}

function generateCulture(decorationStyle) {
    // Determine culture based on decoration style
    switch(decorationStyle) {
        case 'plain': return 'common_folk';
        case 'ornate': return 'imperial';
        case 'runic': return 'dwarven';
        case 'nordic': return 'northern_realm';
        case 'elven': return 'high_elven';
        case 'dwarven': return 'mountain_kingdom';
        case 'demonic': return 'nether_realm';
        default: return 'unknown';
    }
}

function generatePreviousOwners(rarity, element) {
    // Generate previous owners based on rarity
    const owners = [];
    
    // Name pools by element
    const namesByElement = {
        'fire': ['Pyrus the Red', 'Ember Flameheart', 'Ignatius the Scorcher', 'Vulcan Ashbringer'],
        'ice': ['Jormund the Frost King', 'Valeria Iceheart', 'Glacius Winterborn', 'Frida Coldsteel'],
        'lightning': ['Threx Stormcaller', 'Volta Thunderfist', 'Zephyr the Quick', 'Elektra Skysplitter'],
        'shadow': ['Morvus Nightwalker', 'Selene Shadowstep', 'Karnax the Void', 'Tenebris Duskblade'],
        'holy': ['Lumos the Radiant', 'Seraphina Lightbringer', 'Halo Dawnkeeper', 'Sanctus the Pure'],
        'nature': ['Gaia Thornheart', 'Sylvan Oakshield', 'Thorne Wildborn', 'Flora Greenmantle'],
        'none': ['Captain Ironhand', 'Marshal Steelblade', 'Lady Sharpeye', 'Commander Truestrike']
    };
    
    // Noble titles
    const titles = ['King', 'Queen', 'Prince', 'Princess', 'Duke', 'Duchess', 'Count', 'Countess', 'Baron', 'Baroness', 'Lord', 'Lady', 'Sir', 'Dame', 'General', 'Commander', 'Captain', 'Master', 'Champion'];
    
    // Number of previous owners based on rarity and age
    let ownerCount = 0;
    switch(rarity) {
        case 'common': ownerCount = 0; break;
        case 'uncommon': ownerCount = Math.floor(Math.random() * 2); break; // 0-1
        case 'rare': ownerCount = Math.floor(Math.random() * 2) + 1; break; // 1-2
        case 'legendary': ownerCount = Math.floor(Math.random() * 2) + 2; break; // 2-3
        case 'artifact': ownerCount = Math.floor(Math.random() * 3) + 2; break; // 2-4
    }
    
    // Get appropriate name pool
    const namePool = namesByElement[element] || namesByElement.none;
    
    // Generate the owners
    for (let i = 0; i < ownerCount; i++) {
        if (i < namePool.length) {
            owners.push(namePool[i]);
        } else {
            // Generate a random name if we run out of predefined names
            const title = getRandomArrayElement(titles);
            const names = ['Alric', 'Branir', 'Cedric', 'Darian', 'Eldrin', 'Fionn', 'Gareth', 'Hector', 'Ivellios', 'Jareth'];
            const surnames = ['Blackwood', 'Steelblade', 'Ironfist', 'Goldheart', 'Silverthorn', 'Stormborn', 'Frostbeard', 'Sunshield'];
            
            const name = getRandomArrayElement(names);
            const surname = getRandomArrayElement(surnames);
            
            if (Math.random() < 0.5) {
                owners.push(`${title} ${name} ${surname}`);
            } else {
                owners.push(`${name} ${surname}`);
            }
        }
    }
    
    return owners;
}