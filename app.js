// State variables
let state = {
    F1: 10,
    d1: 0.5,
    F2: 10,
    d2: 0.5,
    F1_dir: 'up', // 'up' or 'down'
    pivotAlign: 'left', // 'left' or 'right'
    structureStyle: 'truss', // 'plank', 'truss', 'neon'
    testMode: false,
    hiddenVar: null, // 'F1', 'd1', 'F2', 'd2'
    revealAnswer: false,
    showWorking: false,
    rotationAngle: 0 // Current visual tilt angle in radians
};

// Canvas Setup
const canvas = document.getElementById('physics-canvas');
const ctx = canvas.getContext('2d');
let dpi = window.devicePixelRatio || 1;

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpi;
    canvas.height = rect.height * dpi;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpi, dpi);
}

// Elements
const sliderF1 = document.getElementById('slider-F1');
const sliderd1 = document.getElementById('slider-d1');
const sliderF2 = document.getElementById('slider-F2');
const sliderd2 = document.getElementById('slider-d2');

const valF1 = document.getElementById('val-F1');
const vald1 = document.getElementById('val-d1');
const valF2 = document.getElementById('val-F2');
const vald2 = document.getElementById('val-d2');

const quizF1Wrapper = document.getElementById('quiz-F1-wrapper');
const quizd1Wrapper = document.getElementById('quiz-d1-wrapper');
const quizF2Wrapper = document.getElementById('quiz-F2-wrapper');
const quizd2Wrapper = document.getElementById('quiz-d2-wrapper');

const btnRandomise = document.getElementById('btn-randomise');
const btnTestMode = document.getElementById('btn-test-mode');
const btnReveal = document.getElementById('btn-reveal');
const btnShowWorking = document.getElementById('btn-show-working');

const testHud = document.getElementById('test-hud');
const solutionWorking = document.getElementById('solution-working');
const equilibriumBadge = document.getElementById('equilibrium-badge');
const pivotIndicator = document.getElementById('pivot-indicator');

const momentAcwDisplay = document.getElementById('moment-acw');
const momentCwDisplay = document.getElementById('moment-cw');

const eyeIconShow = document.getElementById('eye-icon-show');
const eyeIconHide = document.getElementById('eye-icon-hide');
const revealText = document.getElementById('reveal-text');

// Init
window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
});
setTimeout(() => {
    resizeCanvas();
    updatePhysics();
}, 100);

// Sliders event listeners
sliderF1.addEventListener('input', (e) => { state.F1 = parseInt(e.target.value); updatePhysics(); });
sliderd1.addEventListener('input', (e) => { state.d1 = parseFloat(e.target.value); updatePhysics(); });
sliderF2.addEventListener('input', (e) => { state.F2 = parseInt(e.target.value); updatePhysics(); });
sliderd2.addEventListener('input', (e) => { state.d2 = parseFloat(e.target.value); updatePhysics(); });

// Controls Event Listeners
btnRandomise.addEventListener('click', randomiseState);
btnTestMode.addEventListener('click', toggleTestMode);
btnReveal.addEventListener('click', toggleReveal);
btnShowWorking.addEventListener('click', toggleWorking);

// Physics Updates
function updatePhysics() {
    // Round to 1 decimal place to avoid floating point issues
    state.d1 = Math.round(state.d1 * 10) / 10;
    state.d2 = Math.round(state.d2 * 10) / 10;

    // F1 Direction determines F2 Direction
    const F1_up = (state.F1_dir === 'up');
    const F2_up = !F1_up;

    // Moments about pivot
    let m1_acw = 0;
    let m1_cw = 0;
    let m2_acw = 0;
    let m2_cw = 0;

    if (state.pivotAlign === 'left') {
        // Pivot on Left. 
        // Upward force creates anti-clockwise (ACW) moment.
        // Downward force creates clockwise (CW) moment.
        if (F1_up) m1_acw = state.F1 * state.d1;
        else m1_cw = state.F1 * state.d1;

        if (F2_up) m2_acw = state.F2 * state.d2;
        else m2_cw = state.F2 * state.d2;
    } else {
        // Pivot on Right.
        // Upward force creates clockwise (CW) moment.
        // Downward force creates anti-clockwise (ACW) moment.
        if (F1_up) m1_cw = state.F1 * state.d1;
        else m1_acw = state.F1 * state.d1;

        if (F2_up) m2_cw = state.F2 * state.d2;
        else m2_acw = state.F2 * state.d2;
    }

    const totalACW = m1_acw + m2_acw;
    const totalCW = m1_cw + m2_cw;
    const netMoment = totalCW - totalACW;

    // Update UI Displays
    if (!state.testMode || state.hiddenVar !== 'F1' || state.revealAnswer) {
        valF1.textContent = state.F1 + ' N';
    } else {
        valF1.textContent = '?';
    }

    if (!state.testMode || state.hiddenVar !== 'd1' || state.revealAnswer) {
        vald1.textContent = state.d1.toFixed(1) + ' m';
    } else {
        vald1.textContent = '?';
    }

    if (!state.testMode || state.hiddenVar !== 'F2' || state.revealAnswer) {
        valF2.textContent = state.F2 + ' N';
    } else {
        valF2.textContent = '?';
    }

    if (!state.testMode || state.hiddenVar !== 'd2' || state.revealAnswer) {
        vald2.textContent = state.d2.toFixed(1) + ' m';
    } else {
        vald2.textContent = '?';
    }

    momentAcwDisplay.textContent = totalACW.toFixed(1) + ' N·m';
    momentCwDisplay.textContent = totalCW.toFixed(1) + ' N·m';

    // Show details formula
    document.getElementById('moment-acw-detail').innerHTML = 
        F1_up ? `F₁ × d₁ (${state.F1} × ${state.d1})` : `F₂ × d₂ (${state.F2} × ${state.d2})`;
    document.getElementById('moment-cw-detail').innerHTML = 
        !F1_up ? `F₁ × d₁ (${state.F1} × ${state.d1})` : `F₂ × d₂ (${state.F2} × ${state.d2})`;

    // Check Balance status
    const isBalanced = Math.abs(netMoment) < 0.05;
    if (isBalanced) {
        equilibriumBadge.textContent = 'BALANCED';
        equilibriumBadge.className = 'status-badge balanced';
        state.rotationAngle = 0;
    } else {
        equilibriumBadge.textContent = netMoment > 0 ? 'ROTATING CW' : 'ROTATING ACW';
        equilibriumBadge.className = 'status-badge unbalanced';
        // visual tilt proportional to difference, capped at 8 degrees
        state.rotationAngle = Math.max(-0.14, Math.min(0.14, netMoment * 0.005));
    }

    pivotIndicator.textContent = `Pivot: ${state.pivotAlign.toUpperCase()}`;

    // Render step solver if working is open
    if (state.showWorking) {
        generateWorkingHTML();
    }

    draw();
}

// Randomisation Logic
function randomiseState() {
    // Reset test mode reveals
    state.revealAnswer = false;
    state.showWorking = false;
    solutionWorking.classList.add('hidden');
    eyeIconShow.classList.remove('hidden');
    eyeIconHide.classList.add('hidden');
    revealText.textContent = "Reveal Answer";

    // Randomize configurations
    state.pivotAlign = Math.random() > 0.5 ? 'left' : 'right';
    state.F1_dir = Math.random() > 0.5 ? 'up' : 'down';
    
    const styleOptions = ['plank', 'truss', 'neon'];
    state.structureStyle = styleOptions[Math.floor(Math.random() * styleOptions.length)];

    // Generate balanced F1*d1 = F2*d2
    // We scale distance to integer [1, 10] (representing 0.1 to 1.0 m)
    let F1, D1, F2, D2;
    let found = false;
    
    while(!found) {
        F1 = Math.floor(Math.random() * 20) + 1; // 1 to 20
        D1 = Math.floor(Math.random() * 10) + 1; // 1 to 10
        
        // Find possible matching pairs
        const possiblePairs = [];
        const target = F1 * D1;
        
        for (let f = 1; f <= 20; f++) {
            for (let d = 1; d <= 10; d++) {
                if (f * d === target && (f !== F1 || d !== D1)) {
                    possiblePairs.push({f, d});
                }
            }
        }
        
        if (possiblePairs.length > 0) {
            const pair = possiblePairs[Math.floor(Math.random() * possiblePairs.length)];
            F2 = pair.f;
            D2 = pair.d;
            found = true;
        }
    }

    state.F1 = F1;
    state.d1 = D1 / 10;
    state.F2 = F2;
    state.d2 = D2 / 10;

    // Apply values to sliders
    sliderF1.value = state.F1;
    sliderd1.value = state.d1;
    sliderF2.value = state.F2;
    sliderd2.value = state.d2;

    if (state.testMode) {
        setupTestChallenge();
    } else {
        updatePhysics();
    }
}

// Test Mode Toggle & Challenge Creation
function toggleTestMode() {
    state.testMode = !state.testMode;
    state.revealAnswer = false;
    state.showWorking = false;
    
    if (state.testMode) {
        btnTestMode.classList.add('active');
        testHud.classList.remove('hidden');
        setupTestChallenge();
    } else {
        btnTestMode.classList.remove('active');
        testHud.classList.add('hidden');
        solutionWorking.classList.add('hidden');
        
        // Restore standard view
        restoreSliders();
        updatePhysics();
    }
}

function setupTestChallenge() {
    // Select a variable to hide: F1, d1, F2, or d2
    const variables = ['F1', 'd1', 'F2', 'd2'];
    state.hiddenVar = variables[Math.floor(Math.random() * variables.length)];
    state.revealAnswer = false;
    state.showWorking = false;

    solutionWorking.classList.add('hidden');
    eyeIconShow.classList.remove('hidden');
    eyeIconHide.classList.add('hidden');
    revealText.textContent = "Reveal Answer";

    // Hide/Show inputs
    restoreSliders();

    const sliderCard = document.getElementById(`card-${state.hiddenVar}`);
    const sliderInput = sliderCard.querySelector('input[type="range"]');
    const quizWrapper = document.getElementById(`quiz-${state.hiddenVar}-wrapper`);
    const quizInput = document.getElementById(`quiz-${state.hiddenVar}`);

    sliderInput.classList.add('hidden');
    quizWrapper.classList.remove('hidden');
    quizInput.value = '';

    updatePhysics();
}

function restoreSliders() {
    ['F1', 'd1', 'F2', 'd2'].forEach(v => {
        const card = document.getElementById(`card-${v}`);
        card.querySelector('input[type="range"]').classList.remove('hidden');
        document.getElementById(`quiz-${v}-wrapper`).classList.add('hidden');
    });
}

function toggleReveal() {
    state.revealAnswer = !state.revealAnswer;
    
    if (state.revealAnswer) {
        eyeIconShow.classList.add('hidden');
        eyeIconHide.classList.remove('hidden');
        revealText.textContent = "Hide Answer";
        
        const ansVal = state[state.hiddenVar];
        // Autofill input
        document.getElementById(`quiz-${state.hiddenVar}`).value = ansVal;
    } else {
        eyeIconShow.classList.remove('hidden');
        eyeIconHide.classList.add('hidden');
        revealText.textContent = "Reveal Answer";
    }
    updatePhysics();
}

function toggleWorking() {
    state.showWorking = !state.showWorking;
    if (state.showWorking) {
        solutionWorking.classList.remove('hidden');
        generateWorkingHTML();
    } else {
        solutionWorking.classList.add('hidden');
    }
}

// Generate Dynamic step-by-step solution
function generateWorkingHTML() {
    const isPivotLeft = state.pivotAlign === 'left';
    const isF1Up = state.F1_dir === 'up';

    let knowns = '';
    let unknownSymbol = '';
    let stepFormula = '';
    let stepSubstitution = '';
    let stepResult = '';

    // Classify which direction causes which rotation
    let acwForce = isF1Up ? "F₁" : "F₂";
    let acwDist = isF1Up ? "d₁" : "d₂";
    let cwForce = !isF1Up ? "F₁" : "F₂";
    let cwDist = !isF1Up ? "d₁" : "d₂";

    if (state.pivotAlign === 'right') {
        // Reverse if pivot is on right side
        acwForce = !isF1Up ? "F₁" : "F₂";
        acwDist = !isF1Up ? "d₁" : "d₂";
        cwForce = isF1Up ? "F₁" : "F₂";
        cwDist = isF1Up ? "d₁" : "d₂";
    }

    if (state.hiddenVar === 'F1') {
        unknownSymbol = 'F₁';
        knowns = `F₂ = ${state.F2} N, d₁ = ${state.d1} m, d₂ = ${state.d2} m`;
        stepFormula = `F₁ × d₁ = F₂ × d₂`;
        stepSubstitution = `F₁ × ${state.d1} = ${state.F2} × ${state.d2}`;
        stepResult = `F₁ = (${state.F2} × ${state.d2}) / ${state.d1} = ${state.F1} N`;
    } else if (state.hiddenVar === 'd1') {
        unknownSymbol = 'd₁';
        knowns = `F₁ = ${state.F1} N, F₂ = ${state.F2} N, d₂ = ${state.d2} m`;
        stepFormula = `F₁ × d₁ = F₂ × d₂`;
        stepSubstitution = `${state.F1} × d₁ = ${state.F2} × ${state.d2}`;
        stepResult = `d₁ = (${state.F2} × ${state.d2}) / ${state.F1} = ${state.d1} m`;
    } else if (state.hiddenVar === 'F2') {
        unknownSymbol = 'F₂';
        knowns = `F₁ = ${state.F1} N, d₁ = ${state.d1} m, d₂ = ${state.d2} m`;
        stepFormula = `F₂ × d₂ = F₁ × d₁`;
        stepSubstitution = `F₂ × ${state.d2} = ${state.F1} × ${state.d1}`;
        stepResult = `F₂ = (${state.F1} × ${state.d1}) / ${state.d2} = ${state.F2} N`;
    } else if (state.hiddenVar === 'd2') {
        unknownSymbol = 'd₂';
        knowns = `F₁ = ${state.F1} N, d₁ = ${state.d1} m, F₂ = ${state.F2} N`;
        stepFormula = `F₂ × d₂ = F₁ × d₁`;
        stepSubstitution = `${state.F2} × d₂ = ${state.F1} × ${state.d1}`;
        stepResult = `d₂ = (${state.F1} × ${state.d1}) / ${state.F2} = ${state.d2} m`;
    }

    solutionWorking.innerHTML = `
        <h4>Step-by-Step Working Using Principle of Moments</h4>
        <ol>
            <li><strong>Identify the Pivot and Moments:</strong>
                <ul>
                    <li>The Pivot is on the <strong>${state.pivotAlign.toUpperCase()}</strong>.</li>
                    <li>${acwForce} (${state.F1_dir === 'up' ? 'pointing UP' : 'pointing DOWN'}) produces the <strong>Anti-Clockwise Moment</strong>: ${acwForce} × ${acwDist}.</li>
                    <li>${cwForce} (${state.F1_dir === 'down' ? 'pointing UP' : 'pointing DOWN'}) produces the <strong>Clockwise Moment</strong>: ${cwForce} × ${cwDist}.</li>
                </ul>
            </li>
            <li><strong>Apply the Principle of Moments:</strong>
                <p>Since the structure is balanced, the sum of Clockwise Moments equals the sum of Anti-Clockwise Moments.</p>
                <div class="math-block">Total CW Moment = Total ACW Moment</div>
                <div class="math-block">${stepFormula}</div>
            </li>
            <li><strong>Substitute Known values:</strong>
                <p>Given: ${knowns}</p>
                <div class="math-block">${stepSubstitution}</div>
            </li>
            <li><strong>Solve for the Unknown (${unknownSymbol}):</strong>
                <div class="math-block">${stepResult}</div>
            </li>
        </ol>
    `;
}

// 2D Canvas Renderer
function draw() {
    const w = canvas.width / dpi;
    const h = canvas.height / dpi;

    ctx.clearRect(0, 0, w, h);

    // Save Context for rotations
    ctx.save();

    // Center pivot vertically
    const pivotY = h * 0.6;
    let pivotX = state.pivotAlign === 'left' ? w * 0.15 : w * 0.85;
    const beamLength = w * 0.65; // Total scale of 1.0 m

    // Grid ticks (0.1m interval)
    const pxPerMeter = beamLength;
    const stepPx = pxPerMeter / 10;

    // Apply rotation for unbalanced system (around pivot point)
    ctx.translate(pivotX, pivotY);
    ctx.rotate(state.rotationAngle);
    // Draw relative to pivot
    const directionSign = state.pivotAlign === 'left' ? 1 : -1;

    // 1. Draw Structure Beam
    ctx.lineWidth = 12;
    if (state.structureStyle === 'plank') {
        ctx.strokeStyle = '#c2410c'; // Warm Orange-Brown wood color
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(directionSign * beamLength, 0);
        ctx.stroke();
    } else if (state.structureStyle === 'neon') {
        ctx.strokeStyle = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(directionSign * beamLength, 0);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
    } else {
        // Truss bridge look (default)
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Top and bottom rail of truss
        ctx.moveTo(0, -10);
        ctx.lineTo(directionSign * beamLength, -10);
        ctx.moveTo(0, 10);
        ctx.lineTo(directionSign * beamLength, 10);
        
        // Verticals and diagonals
        for (let i = 0; i <= 10; i++) {
            let cx = directionSign * i * stepPx;
            ctx.moveTo(cx, -10);
            ctx.lineTo(cx, 10);
            if (i < 10) {
                let nextX = directionSign * (i + 1) * stepPx;
                ctx.moveTo(cx, -10);
                ctx.lineTo(nextX, 10);
            }
        }
        ctx.stroke();
    }

    // 2. Draw Measurement Ticks & Labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#374151';

    for (let i = 1; i <= 10; i++) {
        const tickX = directionSign * i * stepPx;
        ctx.beginPath();
        ctx.moveTo(tickX, -15);
        ctx.lineTo(tickX, 15);
        ctx.stroke();
        if (!state.testMode || state.revealAnswer) {
            ctx.fillText((i / 10).toFixed(1) + 'm', tickX, -22);
        }
    }

    // 3. Draw Force 1 & Force 2
    drawForceArrow(state.d1 * pxPerMeter * directionSign, state.F1, state.F1_dir, '#06b6d4', 'F₁', state.hiddenVar === 'F1');
    drawForceArrow(state.d2 * pxPerMeter * directionSign, state.F2, state.F1_dir === 'up' ? 'down' : 'up', '#a855f7', 'F₂', state.hiddenVar === 'F2');

    ctx.restore();

    // 4. Draw Pivot (Must remain stable/static, not rotated)
    drawPivot(pivotX, pivotY);
}

function drawPivot(x, y) {
    ctx.fillStyle = '#10b981';
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 16, y + 25);
    ctx.lineTo(x + 16, y + 25);
    ctx.closePath();
    ctx.fill();

    // Pivot center dot
    ctx.fillStyle = '#060a12';
    ctx.beginPath();
    ctx.arc(x, y + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawForceArrow(x, magnitude, dir, color, label, isHidden) {
    if (isHidden && !state.revealAnswer) {
        // Render a cool interactive mystery box instead of direct numbers
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        
        const boxSize = 35;
        const boxY = dir === 'up' ? -70 : 35;
        ctx.beginPath();
        ctx.rect(x - boxSize/2, boxY, boxSize, boxSize);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]); // reset

        ctx.fillStyle = color;
        ctx.font = 'bold 16px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText('?', x, boxY + 23);
        
        // draw a dashed line indicator where force is
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, dir === 'up' ? -35 : 35);
        ctx.stroke();
        return;
    }

    const arrowLength = 30 + (magnitude * 3); // Scaled visually
    const directionSign = dir === 'up' ? -1 : 1;
    const endY = directionSign * arrowLength;
    const startY = 0;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Arrow line
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();

    // Arrow head at the tip (end point if pointing down, or end point if pointing up)
    const headSize = 8;
    ctx.beginPath();
    ctx.moveTo(x, endY);
    ctx.lineTo(x - headSize, endY - directionSign * headSize);
    ctx.lineTo(x + headSize, endY - directionSign * headSize);
    ctx.closePath();
    ctx.fill();

    // Text Label
    ctx.font = 'bold 12px Space Grotesk';
    if (state.testMode && !state.revealAnswer) {
        ctx.fillText(`${label}`, x, endY + (directionSign * 15));
    } else {
        ctx.fillText(`${label}: ${magnitude}N`, x, endY + (directionSign * 15));
    }
}
