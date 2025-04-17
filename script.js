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

const orbits = [];

for (let i = 0; i < 100; i++) {
    orbits.push({
        angle: Math.random() * Math.PI * 2,
        radius: 50 + Math.random() * 150,
        speed: 0.002 + Math.random() * 0.01,
        size: 2 + Math.random() * 3,
        colorHue: Math.floor(Math.random() * 360),
        band: Math.floor(Math.random() * analyser.frequencyBinCount)
    });
}


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
    }



}

audio.onplay = () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    draw();
};
