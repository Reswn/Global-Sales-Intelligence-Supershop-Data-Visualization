/* Superstore Neon Dashboard (8 insight charts) */
const FILE_PATH = "../data/superstore_clean.csv";

// global state
let RAW = [];
let FILTER = { category: "ALL", region: "ALL", year: "ALL" };

// helpers
const fmt = (n) => (n ?? 0).toLocaleString("en-US");
const sum = (a) => a.reduce((x, y) => x + (+y || 0), 0);
const groupBy = (rows, key) =>
  rows.reduce((acc, r) => ((acc[r[key]] ??= []).push(r), acc), {});
const parseYear = (dt) => {
  if (!dt) return null;
  const d = new Date(dt);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
};
const ymKey = (dt) => {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// ============== MOBILE MENU ==============
const nav = document.getElementById("navLinks");
const burger = document.getElementById("hamburger");

if (burger && nav) {
  burger.addEventListener("click", () => {
    nav.classList.toggle("show");
  });
}

// ============== ACTIVE PAGE DETECTOR ==============
const current = window.location.pathname.split("/").pop();

document.querySelectorAll(".nav-link").forEach((link) => {
  const href = link.getAttribute("href");
  if (href === current) {
    link.classList.add("active");
  }
});

// Chart.js global neon styling
Chart.defaults.color = "#dfe9ff";
Chart.defaults.borderColor = "rgba(255,255,255,.15)";
const neonGrid = "rgba(255,255,255,.08)";
const cjBase = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800, easing: "easeOutQuart" },
  plugins: {
    legend: { labels: { color: "#cfe4ff", font: { size: 12 } } },
    tooltip: { titleFont: { size: 13 }, bodyFont: { size: 12 } },
  },
  scales: {
    x: { grid: { color: neonGrid } },
    y: { grid: { color: neonGrid } },
  },
};
const C = {
  cyan: "#00eaff",
  purple: "#b026ff",
  magenta: "#ff007c",
  teal: "#00ffc3",
  blue: "#0ea5e9",
  lime: "#84cc16",
  amber: "#f59e0b",
};
const palette = (n) => {
  const base = [C.cyan, C.purple, C.magenta, C.teal, C.blue, C.lime, C.amber];
  if (n <= base.length) return base.slice(0, n);
  const out = [];
  while (out.length < n) out.push(...base);
  return out.slice(0, n);
};

// read CSV
Papa.parse(FILE_PATH, {
  download: true,
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  complete: ({ data }) => {
    RAW = data
      .map((r) => ({
        Category: r.Category ?? r["Category "],
        SubCategory: r["Sub.Category"] ?? r["Sub-Category"] ?? r.SubCategory,
        Region: r.Region,
        City: r.City,
        Segment: r.Segment,
        ShipMode: r["Ship.Mode"] ?? r["Ship Mode"] ?? r.ShipMode,
        Sales: +r.Sales,
        Profit: +r.Profit,
        Discount: +r.Discount,
        Quantity: +r.Quantity,
        OrderDate:
          r.Order_Date ?? r["Order Date"] ?? r["Order.Date"] ?? r.OrderDate,
      }))
      .filter((r) => r.Category && r.Region && r.Sales != null);

    RAW.forEach((r) => {
      r.Year = parseYear(r.OrderDate);
      r.YM = ymKey(r.OrderDate);
    });

    initFilters();
    refreshAll();
  },
  error: (err) => alert("CSV load error: " + err),
});

// filters
function initFilters() {
  const cats = [...new Set(RAW.map((r) => r.Category))].sort();
  const regs = [...new Set(RAW.map((r) => r.Region))].sort();
  const yrs = [...new Set(RAW.map((r) => r.Year).filter(Boolean))].sort(
    (a, b) => a - b
  );

  const cf = document.getElementById("categoryFilter");
  const rf = document.getElementById("regionFilter");
  const yf = document.getElementById("yearFilter");
  cats.forEach((v) =>
    cf.insertAdjacentHTML("beforeend", `<option>${v}</option>`)
  );
  regs.forEach((v) =>
    rf.insertAdjacentHTML("beforeend", `<option>${v}</option>`)
  );
  yrs.forEach((v) =>
    yf.insertAdjacentHTML("beforeend", `<option>${v}</option>`)
  );

  cf.addEventListener("change", (e) => {
    FILTER.category = e.target.value;
    refreshAll();
  });
  rf.addEventListener("change", (e) => {
    FILTER.region = e.target.value;
    refreshAll();
  });
  yf.addEventListener("change", (e) => {
    FILTER.year = e.target.value;
    refreshAll();
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    FILTER = { category: "ALL", region: "ALL", year: "ALL" };
    cf.value = "ALL";
    rf.value = "ALL";
    yf.value = "ALL";
    refreshAll();
  });
}

const applyFilter = (rows) =>
  rows.filter(
    (r) =>
      (FILTER.category === "ALL" || r.Category === FILTER.category) &&
      (FILTER.region === "ALL" || r.Region === FILTER.region) &&
      (FILTER.year === "ALL" || String(r.Year) === String(FILTER.year))
  );

// KPIs
function updateKPI(rows) {
  const totSales = sum(rows.map((r) => r.Sales));
  const totProfit = sum(rows.map((r) => r.Profit));
  const orders = rows.length;
  const avgDisc = orders ? sum(rows.map((r) => r.Discount)) / orders : 0;
  document.getElementById("kpiSales").textContent = "$" + fmt(totSales);
  document.getElementById("kpiProfit").textContent = "$" + fmt(totProfit);
  document.getElementById("kpiOrders").textContent = fmt(orders);
  document.getElementById("kpiDiscount").textContent =
    (avgDisc * 100).toFixed(1) + "%";
}

// chart instances
let chTrend,
  chCatSales,
  chCatProfit,
  chSubcat,
  chScatter,
  chSegment,
  chTopCities;

// render all
function refreshAll() {
  const rows = applyFilter(RAW);
  updateKPI(rows);

  // 1) Monthly Sales Trend (hero)
  {
    const g = groupBy(
      rows.filter((r) => r.YM),
      "YM"
    );
    const labels = Object.keys(g).sort();
    const data = labels.map((k) => sum(g[k].map((r) => r.Sales)));
    const ds = {
      labels,
      datasets: [
        {
          label: "Sales",
          data,
          borderColor: C.cyan,
          backgroundColor: "rgba(0,234,255,.15)",
          tension: 0.25,
        },
      ],
    };
    const opt = {
      ...cjBase,
      scales: {
        x: {
          grid: { color: neonGrid },
          ticks: { autoSkip: true, maxRotation: 0, minRotation: 0 },
        },
        y: { grid: { color: neonGrid } },
      },
    };
    if (!chTrend)
      chTrend = new Chart(document.getElementById("monthlySalesChart"), {
        type: "line",
        data: ds,
        options: opt,
      });
    else {
      chTrend.data = ds;
      chTrend.update();
    }
  }

  // 2) Sales per Category
  {
    const g = groupBy(rows, "Category");
    const labels = Object.keys(g);
    const data = labels.map((k) => sum(g[k].map((r) => r.Sales)));
    const ds = {
      labels,
      datasets: [
        { label: "Sales", data, backgroundColor: palette(labels.length) },
      ],
    };
    if (!chCatSales)
      chCatSales = new Chart(document.getElementById("catSalesChart"), {
        type: "bar",
        data: ds,
        options: cjBase,
      });
    else {
      chCatSales.data = ds;
      chCatSales.update();
    }
  }

  // 3) Profit per Category
  {
    const g = groupBy(rows, "Category");
    const labels = Object.keys(g);
    const data = labels.map((k) => sum(g[k].map((r) => r.Profit)));
    const ds = {
      labels,
      datasets: [
        { label: "Profit", data, backgroundColor: palette(labels.length) },
      ],
    };
    if (!chCatProfit)
      chCatProfit = new Chart(document.getElementById("catProfitChart"), {
        type: "bar",
        data: ds,
        options: cjBase,
      });
    else {
      chCatProfit.data = ds;
      chCatProfit.update();
    }
  }

  // 4) Heatmap Profit (Category × Region) — Plotly
  {
    const cats = [...new Set(rows.map((r) => r.Category))].sort();
    const regs = [...new Set(rows.map((r) => r.Region))].sort();
    const z = cats.map((cat) =>
      regs.map((reg) =>
        sum(
          rows
            .filter((r) => r.Category === cat && r.Region === reg)
            .map((r) => r.Profit)
        )
      )
    );
    Plotly.react(
      "heatmapProfit",
      [
        {
          z,
          x: regs,
          y: cats,
          type: "heatmap",
          colorscale: [
            [0, "#111827"],
            [0.2, "#2dd4bf"],
            [0.5, "#00eaff"],
            [0.8, "#b026ff"],
            [1, "#ff007c"],
          ],
          showscale: true,
        },
      ],
      {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { l: 80, r: 10, t: 10, b: 60 },
        font: { color: "#dfe9ff" },
      },
      { responsive: true }
    );
  }

  // 5) Sales per Sub-Category (Top 15, horizontal)
  {
    const g = groupBy(rows, "SubCategory");
    let items = Object.entries(g)
      .map(([k, v]) => [k, sum(v.map((r) => r.Sales))])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    const labels = items.map((d) => d[0]);
    const data = items.map((d) => d[1]);
    const ds = {
      labels,
      datasets: [
        { label: "Sales", data, backgroundColor: palette(labels.length) },
      ],
    };
    const opt = { ...cjBase, indexAxis: "y" };
    if (!chSubcat)
      chSubcat = new Chart(document.getElementById("subcatSalesChart"), {
        type: "bar",
        data: ds,
        options: opt,
      });
    else {
      chSubcat.data = ds;
      chSubcat.update();
    }
  }

  // 6) Profit vs Discount (scatter)
  {
    const pts = rows
      .slice(0, 3000)
      .map((r) => ({ x: r.Discount, y: r.Profit }));
    const ds = {
      datasets: [
        {
          label: "Points",
          data: pts,
          pointRadius: 3,
          backgroundColor: C.magenta,
        },
      ],
    };
    if (!chScatter)
      chScatter = new Chart(document.getElementById("profitDiscountChart"), {
        type: "scatter",
        data: ds,
        options: cjBase,
      });
    else {
      chScatter.data = ds;
      chScatter.update();
    }
  }

  // 7) Segment Distribution (pie by Sales)
  {
    const g = groupBy(rows, "Segment");
    const labels = Object.keys(g);
    const data = labels.map((k) => sum(g[k].map((r) => r.Sales)));
    const ds = {
      labels,
      datasets: [{ data, backgroundColor: palette(labels.length) }],
    };
    if (!chSegment)
      chSegment = new Chart(document.getElementById("segmentPieChart"), {
        type: "pie",
        data: ds,
        options: cjBase,
      });
    else {
      chSegment.data = ds;
      chSegment.update();
    }
  }

  // 8) Top 10 Cities by Sales
  {
    const g = groupBy(rows, "City");
    let items = Object.entries(g)
      .map(([k, v]) => [k, sum(v.map((r) => r.Sales))])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const labels = items.map((d) => d[0]);
    const data = items.map((d) => d[1]);
    const ds = {
      labels,
      datasets: [
        { label: "Sales", data, backgroundColor: palette(labels.length) },
      ],
    };
    if (!chTopCities)
      chTopCities = new Chart(document.getElementById("topCitiesChart"), {
        type: "bar",
        data: ds,
        options: cjBase,
      });
    else {
      chTopCities.data = ds;
      chTopCities.update();
    }
  }
}
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
