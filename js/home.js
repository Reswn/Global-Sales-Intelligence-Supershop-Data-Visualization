// Mobile menu
const menuBtn = document.getElementById("menu");
const mobile = document.getElementById("mobile-menu");
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    mobile.classList.toggle("hidden");
  });
}
// ============== MOBILE MENU ==============
const nav = document.getElementById("navLinks");
const burger = document.getElementById("hamburger");

burger.addEventListener("click", () => {
  nav.classList.toggle("show");
});

// ============== ACTIVE PAGE DETECTOR ==============
const current = window.location.pathname.split("/").pop();

document.querySelectorAll(".nav-link").forEach((link) => {
  const href = link.getAttribute("href");
  if (href === current) {
    link.classList.add("active");
  }
});

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length > 1) {
      e.preventDefault();
      document
        .querySelector(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      mobile.classList.add("hidden");
    }
  });
});

// Neon particles background (lightweight)
const canvas = document.getElementById("bg-particles");
const ctx = canvas.getContext("2d");
let W,
  H,
  particles = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

function initParticles(n = 70) {
  particles = Array.from({ length: n }).map(() => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    r: Math.random() * 2.2 + 0.6,
    c:
      Math.random() < 0.33
        ? "#00eaff"
        : Math.random() < 0.66
        ? "#b026ff"
        : "#ff007c",
  }));
}
initParticles();

function step() {
  ctx.clearRect(0, 0, W, H);

  // connect lines
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j];
      const dx = p.x - q.x,
        dy = p.y - q.y;
      const d = Math.hypot(dx, dy);
      if (d < 120) {
        const a = (1 - d / 120) * 0.35;
        ctx.strokeStyle = `rgba(0,234,255,${a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
  }

  // draw dots
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.c;
    ctx.shadowBlur = 12;
    ctx.shadowColor = p.c;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  requestAnimationFrame(step);
}
step();
