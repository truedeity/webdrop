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

function draw() {
  requestAnimationFrame(draw);

  analyser.getByteFrequencyData(dataArray);
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (currentVisualizer === "bars") {
    barsVisualizer();
  } else if (currentVisualizer === "waveform") {
    waveformVisualizer();
  }
}

audio.onplay = () => {
  if (audioCtx.state === "suspended") audioCtx.resume();
  draw();
};
