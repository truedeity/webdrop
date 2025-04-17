const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
const audio = document.getElementById("audio");
const visualizerSelect = document.getElementById("visualizerSelect");

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const source = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

source.connect(analyser);
analyser.connect(audioCtx.destination);

let currentVisualizer = "bars";

// Resize canvas to match display size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

visualizerSelect.addEventListener("change", (e) => {
    currentVisualizer = e.target.value;
});

function barsVisualizer() {
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const height = dataArray[i];
        const r = 85 + i * 2;
        const g = 137 - i;
        const b = 107 + height;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, canvas.height - height, barWidth, height);
        x += barWidth + 1;
    }
}

function waveformVisualizer() {
    analyser.getByteTimeDomainData(dataArray);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(125, 76, 147)";
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}

function spiralVisualizer() {
    analyser.getByteFrequencyData(dataArray);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "hsl(" + (Date.now() % 360) + ", 100%, 70%)";
    ctx.beginPath();

    let a = 2;
    let b = 4;
    let maxTheta = Math.PI * 6;
    let points = 100;

    for (let i = 0; i < points; i++) {
        let theta = (i / points) * maxTheta;
        let r = a + b * theta;

        // Use frequency data to scale radius
        let binIndex = Math.floor((i / points) * dataArray.length);
        r *= 1 + dataArray[binIndex] / 255;

        let x = centerX + r * Math.cos(theta);
        let y = centerY + r * Math.sin(theta);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();
}

function pixelGridVisualizer() {
    analyser.getByteFrequencyData(dataArray);

    const cols = 32;
    const rows = 16;
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;
    const totalCells = cols * rows;
    const binStep = Math.floor(dataArray.length / totalCells);

    let i = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const binIndex = i * binStep;
            const val = dataArray[binIndex] || 0;
            const brightness = val / 255;

            const x = col * cellWidth;
            const y = row * cellHeight;

            const hue = 120 + val / 2; // Green-ish with some variation
            ctx.fillStyle = `hsl(${hue}, 100%, ${brightness * 70}%)`;
            ctx.fillRect(x, y, cellWidth, cellHeight);

            i++;
        }
    }
}

function orbitsVisualizer() {
    analyser.getByteFrequencyData(dataArray);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    for (let p of orbits) {
        p.angle += p.speed;

        const intensity = dataArray[p.band] / 255;
        const dynamicRadius = p.radius + intensity * 100;

        const x = cx + dynamicRadius * Math.cos(p.angle);
        const y = cy + dynamicRadius * Math.sin(p.angle);

        ctx.beginPath();
        ctx.fillStyle = `hsl(${p.colorHue}, 100%, ${40 + intensity * 60}%)`;
        ctx.arc(x, y, p.size + intensity * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function nebulaVisualizer() {
    analyser.getByteFrequencyData(dataArray);

    // Slight translucent overlay to create long trails
    ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate average bass energy
    const bassEnergy = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 20;

    for (let p of nebulaParticles) {
        const energy = dataArray[p.band] / 255;

        // Add some swirl via sine
        const swirl = Math.sin(Date.now() * 0.001 + p.band) * 0.5;

        // Boost speed based on intensity
        const speedFactor = 1 + energy * 4;
        p.angle += swirl * 0.01;

        p.x += Math.cos(p.angle) * p.speed * speedFactor * 0.5;
        p.y += Math.sin(p.angle) * p.speed * speedFactor * 0.5;

        // Wraparound edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Cycle hue wildly with energy and time
        const hue = (p.hue + Date.now() * 0.05 + energy * 100) % 360;
        const radius = p.radius * (0.5 + energy * 1.8);

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 75%, ${0.3 + energy * 0.7})`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Optional: screen pulse for heavy bass
    if (bassEnergy > 180) {
        ctx.fillStyle = `rgba(255, 255, 255, 0.02)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}
function kaleidoscopeVisualizer() {
    analyser.getByteFrequencyData(dataArray);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const symmetry = 8;
    const angleStep = (Math.PI * 2) / symmetry;
    const time = Date.now() * 0.001;

    const bass = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
    const treb = dataArray.slice(150).reduce((a, b) => a + b, 0) / (dataArray.length - 150);
    const energy = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

    // fade background slightly to leave trails
    ctx.fillStyle = `rgba(0, 0, 0, 0.08)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(cx, cy);

    // faster rotation based on energy and bass
    ctx.rotate(Math.sin(time * 0.6) * 2 + energy * 0.05);


    const spikeCount = 5 + Math.floor(treb / 32);

    for (let s = 0; s < symmetry; s++) {
        ctx.save();
        ctx.rotate(s * angleStep);

        for (let i = 0; i < 100; i++) {
            if (Math.random() < treb / 255) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
                ctx.fillRect(x, y, 1.5, 1.5);
            }
        }

        for (let i = 0; i < spikeCount; i++) {
            const angle = i * 0.3 + time * 0.2;
            const radius = 80 + Math.sin(time + i) * 50 + bass * 1.5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            const hue = (angle * 180 / Math.PI + time * 60) % 360;

            // Draw line (spike)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(x, y);
            ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
            ctx.lineWidth = 2 + treb * 0.01;
            ctx.stroke();

            // Draw endpoint circle
            ctx.beginPath();
            ctx.arc(x, y, 5 + energy * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${(hue + 180) % 360}, 100%, 50%)`;
            ctx.fill();
            if (bass > 180) {
                ctx.fillStyle = `hsla(${Date.now() % 360}, 100%, 50%, 0.07)`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Orbiting particles around each endpoint
            const orbitParticles = orbitingSystems[(s * spikeCount + i) % orbitingSystems.length];
            for (let op of orbitParticles) {
                op.angle += op.speed;
                const px = x + Math.cos(op.angle) * op.radius;
                const py = y + Math.sin(op.angle) * op.radius;

                ctx.beginPath();
                ctx.fillStyle = `hsl(${(hue + 60 + op.offset) % 360}, 100%, 60%, 0.8)`;
                ctx.arc(px, py, 2 + energy * 0.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    // Center pulse
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 50 + bass);
    coreGradient.addColorStop(0, `rgba(255,255,255,${0.2 + bass / 255})`);
    coreGradient.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 50 + bass, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
let mandelbrotZoom = 1.5;
let mandelbrotOffsetX = -0.5;
let mandelbrotOffsetY = 0;
let mandelbrotTimeStart = Date.now();
// Seahorse Valley
let mandelbrotTarget = { x: -0.7453, y: 0.1127 };

function mandelbrotVisualizer() {
    analyser.getByteFrequencyData(dataArray);
    const bass = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 20;

    mandelbrotZoom *= 1 + bass * 0.00005;

    const w = canvas.width;
    const h = canvas.height;
    const maxIter = 100 + Math.floor(bass / 2);
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    for (let px = 0; px < w; px++) {
        for (let py = 0; py < h; py++) {
            const x0 = (px - w / 2) / (0.5 * mandelbrotZoom * w) + mandelbrotTarget.x;
            const y0 = (py - h / 2) / (0.5 * mandelbrotZoom * h) + mandelbrotTarget.y;

            let iteration = 0;

            // Early-out for known Mandelbrot interior points
            const x = x0;
            const y = y0;
            const q = (x - 0.25) * (x - 0.25) + y * y;

            let isInSet = false;
            if (q * (q + (x - 0.25)) < 0.25 * y * y || (x + 1) * (x + 1) + y * y < 1 / 16) {
                iteration = maxIter;
                isInSet = true;
            }

            if (!isInSet) {
                let zx = 0, zy = 0;
                while (zx * zx + zy * zy <= 4 && iteration < maxIter) {
                    const xtemp = zx * zx - zy * zy + x0;
                    zy = 2 * zx * zy + y0;
                    zx = xtemp;
                    iteration++;
                }
            }

            const color = iteration === maxIter ? 0 : 255 - Math.floor(iteration * 255 / maxIter);
            const idx = 4 * (py * w + px);
            data[idx] = (color + bass * 0.5) % 255;
            data[idx + 1] = (color * 1.2) % 255;
            data[idx + 2] = (color * 2.5) % 255;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);
}




function hybridVisualizer() {
    nebulaVisualizer();
    kaleidoscopeVisualizer();
}


function draw() {
    requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentVisualizer === "bars") {
        barsVisualizer();
    } else if (currentVisualizer === "waveform") {
        waveformVisualizer();
    } else if (currentVisualizer === "spiral") {
        spiralVisualizer();
    } else if (currentVisualizer === "pixelGrid") {
        pixelGridVisualizer();
    } else if (currentVisualizer === "orbits") {
        orbitsVisualizer();
    } else if (currentVisualizer === "nebula") {
        nebulaVisualizer();
    } else if (currentVisualizer === "kaleidoscope") {
        kaleidoscopeVisualizer();
    } else if (currentVisualizer === "hybrid") {
        hybridVisualizer();
    } else if (currentVisualizer === "mandelbrot") {
        mandelbrotVisualizer();
    }






}

audio.onplay = () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    draw();
};
