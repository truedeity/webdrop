
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

const nebulaParticles = [];

for (let i = 0; i < 250; i++) {
  nebulaParticles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: 20 + Math.random() * 40,
    speed: 0.5 + Math.random() * 1.5,
    angle: Math.random() * Math.PI * 2,
    hue: 200 + Math.random() * 80,
    band: Math.floor(Math.random() * analyser.frequencyBinCount)
  });
}

const orbitingSystems = [];

for (let i = 0; i < 60; i++) {
  let particles = [];
  for (let j = 0; j < 6; j++) {
    particles.push({
      angle: Math.random() * Math.PI * 2,
      radius: 5 + Math.random() * 15,
      speed: 0.01 + Math.random() * 0.03,
      offset: j * 10
    });
  }
  orbitingSystems.push(particles);
}
