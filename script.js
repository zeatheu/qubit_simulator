// Qubit state
let qubitState = [
    { re: 1, im: 0 },
    { re: 0, im: 0 }
];

let isAnimating = false;
let scene, camera, renderer, stateArrow;

// Complex number operations
function complexMultiply(a, b) {
    return {
        re: a.re * b.re - a.im * b.im,
        im: a.re * b.im + a.im * b.re
    };
}

function complexAdd(a, b) {
    return {
        re: a.re + b.re,
        im: a.im + b.im
    };
}

// Quantum gates
const gates = {
    X: [
        [{ re: 0, im: 0 }, { re: 1, im: 0 }],
        [{ re: 1, im: 0 }, { re: 0, im: 0 }]
    ],
    Y: [
        [{ re: 0, im: 0 }, { re: 0, im: -1 }],
        [{ re: 0, im: 1 }, { re: 0, im: 0 }]
    ],
    Z: [
        [{ re: 1, im: 0 }, { re: 0, im: 0 }],
        [{ re: 0, im: 0 }, { re: -1, im: 0 }]
    ],
    H: [
        [{ re: 1/Math.sqrt(2), im: 0 }, { re: 1/Math.sqrt(2), im: 0 }],
        [{ re: 1/Math.sqrt(2), im: 0 }, { re: -1/Math.sqrt(2), im: 0 }]
    ],
    S: [
        [{ re: 1, im: 0 }, { re: 0, im: 0 }],
        [{ re: 0, im: 0 }, { re: 0, im: 1 }]
    ],
    T: [
        [{ re: 1, im: 0 }, { re: 0, im: 0 }],
        [{ re: 0, im: 0 }, { re: Math.cos(Math.PI/4), im: Math.sin(Math.PI/4) }]
    ]
};

// Apply gate to state
function applyGateToState(gate, state) {
    const newAlpha = complexAdd(
        complexMultiply(gate[0][0], state[0]),
        complexMultiply(gate[0][1], state[1])
    );
    const newBeta = complexAdd(
        complexMultiply(gate[1][0], state[0]),
        complexMultiply(gate[1][1], state[1])
    );
    return [newAlpha, newBeta];
}

// Convert state to Bloch coordinates
function stateToBloch(state) {
    const [alpha, beta] = state;
    const alphaAbs = Math.sqrt(alpha.re ** 2 + alpha.im ** 2);
    const betaAbs = Math.sqrt(beta.re ** 2 + beta.im ** 2);
    
    const theta = 2 * Math.acos(alphaAbs);
    let phi = Math.atan2(beta.im, beta.re) - Math.atan2(alpha.im, alpha.re);
    
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    
    return { x, y, z };
}

// Calculate probabilities
function calculateProbabilities(state) {
    const [alpha, beta] = state;
    const p0 = alpha.re ** 2 + alpha.im ** 2;
    const p1 = beta.re ** 2 + beta.im ** 2;
    return { p0, p1 };
}

// Format complex number
function formatComplex(c) {
    const re = Math.abs(c.re) < 0.0001 ? 0 : c.re;
    const im = Math.abs(c.im) < 0.0001 ? 0 : c.im;
    
    if (re === 0 && im === 0) return '0';
    if (im === 0) return re.toFixed(3);
    if (re === 0) return `${im.toFixed(3)}i`;
    
    const sign = im >= 0 ? '+' : '-';
    return `${re.toFixed(3)} ${sign} ${Math.abs(im).toFixed(3)}i`;
}

// Update UI
function updateUI() {
    const probs = calculateProbabilities(qubitState);
    
    // Update equation
    const alpha = formatComplex(qubitState[0]);
    const beta = formatComplex(qubitState[1]);
    document.getElementById('state-equation').textContent = 
        `|ψ⟩ = (${alpha})|0⟩ + (${beta})|1⟩`;
    
    // Update probabilities
    document.getElementById('prob-0').textContent = `${(probs.p0 * 100).toFixed(1)}%`;
    document.getElementById('prob-1').textContent = `${(probs.p1 * 100).toFixed(1)}%`;
    
    const bar0 = document.getElementById('bar-0');
    const bar1 = document.getElementById('bar-1');
    
    bar0.style.width = `${probs.p0 * 100}%`;
    bar1.style.width = `${probs.p1 * 100}%`;
    
    bar0.textContent = probs.p0 > 0.1 ? '↑' : '';
    bar1.textContent = probs.p1 > 0.1 ? '↓' : '';
    
    // Update arrow
    if (stateArrow) {
        const bloch = stateToBloch(qubitState);
        const direction = new THREE.Vector3(bloch.x, bloch.y, bloch.z);
        direction.normalize();
        stateArrow.setDirection(direction);
    }
}

// Animate gate application
function animateGateApplication(targetState) {
    isAnimating = true;
    const startState = [
        { re: qubitState[0].re, im: qubitState[0].im },
        { re: qubitState[1].re, im: qubitState[1].im }
    ];
    
    const steps = 30;
    let currentStep = 0;
    
    function interpolate() {
        if (currentStep <= steps) {
            const t = currentStep / steps;
            
            qubitState = [
                {
                    re: startState[0].re + (targetState[0].re - startState[0].re) * t,
                    im: startState[0].im + (targetState[0].im - startState[0].im) * t
                },
                {
                    re: startState[1].re + (targetState[1].re - startState[1].re) * t,
                    im: startState[1].im + (targetState[1].im - startState[1].im) * t
                }
            ];
            
            // Normalize
            const norm = Math.sqrt(
                qubitState[0].re ** 2 + qubitState[0].im ** 2 +
                qubitState[1].re ** 2 + qubitState[1].im ** 2
            );
            qubitState[0].re /= norm;
            qubitState[0].im /= norm;
            qubitState[1].re /= norm;
            qubitState[1].im /= norm;
            
            updateUI();
            currentStep++;
            requestAnimationFrame(interpolate);
        } else {
            isAnimating = false;
        }
    }
    
    interpolate();
}

// Apply gate
function applyGate(gateName) {
    if (isAnimating) return;
    
    const newState = applyGateToState(gates[gateName], qubitState);
    
    document.getElementById('last-gate').style.display = 'block';
    document.getElementById('last-gate-name').textContent = gateName;
    
    animateGateApplication(newState);
}

// Reset state
function resetState() {
    if (isAnimating) return;
    
    document.getElementById('last-gate').style.display = 'block';
    document.getElementById('last-gate-name').textContent = 'Reset';
    
    animateGateApplication([{ re: 1, im: 0 }, { re: 0, im: 0 }]);
}

// Initialize Three.js
function init() {
    const container = document.getElementById('canvas-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
    
    // Bloch sphere
    const sphereGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x4444ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
    
    // Axes
    function createAxis(color, start, end) {
        const points = [start, end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color });
        return new THREE.Line(geometry, material);
    }
    
    scene.add(createAxis(0xff0000, new THREE.Vector3(-1.0, 0, 0), new THREE.Vector3(1.0, 0, 0)));
    scene.add(createAxis(0x00ff00, new THREE.Vector3(0, -1.0, 0), new THREE.Vector3(0, 1.0, 0)));
    scene.add(createAxis(0x0088ff, new THREE.Vector3(0, 0, -1.0), new THREE.Vector3(0, 0, 1.0)));
    
    // Labels
    function createLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        ctx.fillStyle = color;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(0.3, 0.3, 0.3);
        return sprite;
    }
    
    scene.add(createLabel('X', new THREE.Vector3(1.2, 0, 0), '#ff0000'));
    scene.add(createLabel('Y', new THREE.Vector3(0, 1.2, 0), '#00ff00'));
    scene.add(createLabel('Z', new THREE.Vector3(0, 0, 1.2), '#0088ff'));
    scene.add(createLabel('|0⟩', new THREE.Vector3(0, 0, 0.9), '#00ddff'));
    scene.add(createLabel('|1⟩', new THREE.Vector3(0, 0, -0.9), '#ff00ff'));
    
    // State arrow
    stateArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        0.7,
        0xffff00,
        0.15,
        0.1
    );
    scene.add(stateArrow);
    
    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 };
    
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            
            rotation.y += deltaX * 0.005;
            rotation.x += deltaY * 0.005;
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        camera.position.x = 3 * Math.cos(rotation.y) * Math.cos(rotation.x);
        camera.position.y = 3 * Math.sin(rotation.x);
        camera.position.z = 3 * Math.sin(rotation.y) * Math.cos(rotation.x);
        camera.lookAt(0, 0, 0);
        
        renderer.render(scene, camera);
    }
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// Start when page loads
window.addEventListener('load', () => {
    init();
    updateUI();
});

// Switch between input modes
function switchInputMode(mode) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (mode === 'complex') {
        tabs[0].classList.add('active');
        document.getElementById('complex-input').style.display = 'block';
        document.getElementById('vector-input').style.display = 'none';
    } else {
        tabs[1].classList.add('active');
        document.getElementById('complex-input').style.display = 'none';
        document.getElementById('vector-input').style.display = 'block';
    }
}

// Set custom state
function setCustomState() {
    if (isAnimating) return;
    
    let alpha, beta;
    
    // Check which input mode is active
    if (document.getElementById('complex-input').style.display !== 'none') {
        // Complex mode
        alpha = {
            re: parseFloat(document.getElementById('alpha-re').value) || 0,
            im: parseFloat(document.getElementById('alpha-im').value) || 0
        };
        beta = {
            re: parseFloat(document.getElementById('beta-re').value) || 0,
            im: parseFloat(document.getElementById('beta-im').value) || 0
        };
    } else {
        // Vector mode
        alpha = {
            re: parseFloat(document.getElementById('v0-re').value) || 0,
            im: parseFloat(document.getElementById('v0-im').value) || 0
        };
        beta = {
            re: parseFloat(document.getElementById('v1-re').value) || 0,
            im: parseFloat(document.getElementById('v1-im').value) || 0
        };
    }
    
    // Normalize the state
    const norm = Math.sqrt(
        alpha.re ** 2 + alpha.im ** 2 +
        beta.re ** 2 + beta.im ** 2
    );
    
    if (norm === 0) {
        alert('Invalid state: cannot be zero vector');
        return;
    }
    
    alpha.re /= norm;
    alpha.im /= norm;
    beta.re /= norm;
    beta.im /= norm;
    
    const newState = [alpha, beta];
    
    document.getElementById('last-gate').style.display = 'block';
    document.getElementById('last-gate-name').textContent = 'Custom State';
    
    animateGateApplication(newState);
}

// Generate random qubit
function generateRandomQubit() {
    if (isAnimating) return;
    
    // Generate random angles for Bloch sphere
    const theta = Math.random() * Math.PI;
    const phi = Math.random() * 2 * Math.PI;
    const globalPhase = Math.random() * 2 * Math.PI;
    
    // Convert to alpha and beta
    const alpha = {
        re: Math.cos(theta / 2) * Math.cos(globalPhase),
        im: Math.cos(theta / 2) * Math.sin(globalPhase)
    };
    
    const beta = {
        re: Math.sin(theta / 2) * Math.cos(phi + globalPhase),
        im: Math.sin(theta / 2) * Math.sin(phi + globalPhase)
    };
    
    const newState = [alpha, beta];
    
    document.getElementById('last-gate').style.display = 'block';
    document.getElementById('last-gate-name').textContent = 'Random State';
    
    animateGateApplication(newState);
    
    // Update input fields
    document.getElementById('alpha-re').value = alpha.re.toFixed(3);
    document.getElementById('alpha-im').value = alpha.im.toFixed(3);
    document.getElementById('beta-re').value = beta.re.toFixed(3);
    document.getElementById('beta-im').value = beta.im.toFixed(3);
    
    document.getElementById('v0-re').value = alpha.re.toFixed(3);
    document.getElementById('v0-im').value = alpha.im.toFixed(3);
    document.getElementById('v1-re').value = beta.re.toFixed(3);
    document.getElementById('v1-im').value = beta.im.toFixed(3);
}

// Measure qubit
function measureQubit() {
    if (isAnimating) return;
    
    const probs = calculateProbabilities(qubitState);
    
    // Perform measurement based on probabilities
    const randomValue = Math.random();
    const measuredState = randomValue < probs.p0 ? 0 : 1;
    
    // Collapse to measured state
    let collapsedState;
    if (measuredState === 0) {
        collapsedState = [{ re: 1, im: 0 }, { re: 0, im: 0 }];
    } else {
        collapsedState = [{ re: 0, im: 0 }, { re: 1, im: 0 }];
    }
    
    // Show measurement result
    const resultDiv = document.getElementById('measurement-result');
    resultDiv.style.display = 'block';
    resultDiv.className = 'measurement-result result-' + measuredState;
    resultDiv.innerHTML = `
        <strong>Measurement Result: |${measuredState}⟩</strong><br>
        Probability: ${(measuredState === 0 ? probs.p0 : probs.p1) * 100}%<br>
        State collapsed to |${measuredState}⟩
    `;
    
    // Animate collapse
    animateGateApplication(collapsedState);
    
    // Hide result after 5 seconds
    setTimeout(() => {
        resultDiv.style.display = 'none';
    }, 5000);
}