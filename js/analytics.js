/* ============================================================
   ANALYTICS.JS — TURBO VERSION (No PapaParse, Uses RAW from main.js)
   ============================================================ */

console.log("⏳ Analytics waiting for RAW...");

function waitForAnalyticsRAW() {
  if (typeof RAW !== "undefined" && RAW.length > 0) {
    console.log("✅ RAW Loaded for Analytics:", RAW.length);
    buildAnalytics(RAW);
  } else {
    setTimeout(waitForAnalyticsRAW, 120);
  }
}
waitForAnalyticsRAW();

/* ===================== BUILD ANALYTICS ===================== */
function buildAnalytics(rows) {
  // ---------- KPI ----------
  const kSales = sum(rows.map((r) => r.Sales));
  const kProfit = sum(rows.map((r) => r.Profit));
  const kOrders = rows.length;
  const kAvgDisc = kOrders ? sum(rows.map((r) => r.Discount)) / kOrders : 0;
  const kCities = new Set(rows.map((r) => r.City)).size;

  document.getElementById("anKpiSales").textContent = "$" + fmt(kSales);
  document.getElementById("anKpiProfit").textContent = "$" + fmt(kProfit);
  document.getElementById("anKpiOrders").textContent = fmt(kOrders);
  document.getElementById("anKpiDiscount").textContent =
    (kAvgDisc * 100).toFixed(1) + "%";
  document.getElementById("anKpiCities").textContent = fmt(kCities);

  const topCat = Object.entries(groupBy(rows, "Category"))
    .map(([k, v]) => [k, sum(v.map((r) => r.Sales))])
    .sort((a, b) => b[1] - a[1])[0];
  const worstReg = Object.entries(groupBy(rows, "Region"))
    .map(([k, v]) => [k, sum(v.map((r) => r.Profit))])
    .sort((a, b) => a[1] - b[1])[0];

  document.getElementById("anKpiInsight").innerHTML =
    `• Kinerja total <b>$${fmt(kSales)}</b> sales, profit <b>$${fmt(
      kProfit
    )}</b>, dari <b>${fmt(kOrders)}</b> orders.` +
    `<br>• Category paling kuat: <b>${topCat?.[0] || "-"}</b> (sales $${fmt(
      topCat?.[1] || 0
    )}).` +
    `<br>• Region paling lemah (profit): <b>${worstReg?.[0] || "-"}</b> ($${fmt(
      worstReg?.[1] || 0
    )}).`;

  // ---------- Correlation Matrix ----------
  const features = ["Sales", "Profit", "Discount", "Quantity"];
  const arr = features.map((f) => rows.map((r) => +r[f] || 0));
  const corr = features.map((_, i) =>
    features.map((__, j) => pearson(arr[i], arr[j]))
  );

  Plotly.newPlot(
    "anCorr",
    [
      {
        z: corr,
        x: features,
        y: features,
        type: "heatmap",
        colorscale: "Teal",
        zmin: -1,
        zmax: 1,
      },
    ],
    {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { l: 70, r: 20, t: 20, b: 50 },
      font: { color: "#dfe9ff" },
    }
  );

  const corrSalesDisc =
    corr[features.indexOf("Sales")][features.indexOf("Discount")];
  document.getElementById(
    "anCorrInsight"
  ).innerHTML = `• Korelasi Sales–Profit: <b>${corr[0][1].toFixed(
    2
  )}</b> • Sales–Discount: <b>${corrSalesDisc.toFixed(
    2
  )}</b> (negatif → diskon tinggi rentan menekan sales efektif).`;

  // ---------- Forecasting (simple regression on monthly sales) ----------
  const monthMap = {};
  rows
    .filter((r) => r.YM)
    .forEach((r) => {
      monthMap[r.YM] = (monthMap[r.YM] || 0) + r.Sales;
    });
  const months = Object.keys(monthMap).sort();
  const values = months.map((m) => monthMap[m]);

  // linear regression (t vs sales)
  const xs = months.map((_, i) => i + 1);
  const lr = linearRegression(xs, values);

  const horizon = 6;
  const futureX = Array.from({ length: horizon }, (_, k) => xs.length + k + 1);
  const futureVals = futureX.map((x) => lr.a * x + lr.b);

  // labels future
  const lastDate = months.length
    ? new Date(months[months.length - 1] + "-01")
    : new Date();
  const futureLabels = Array.from({ length: horizon }, (_, i) => {
    const d = new Date(lastDate);
    d.setMonth(d.getMonth() + i + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  new Chart(document.getElementById("anForecast"), {
    type: "line",
    data: {
      labels: [...months, ...futureLabels],
      datasets: [
        {
          label: "Actual",
          data: [...values, ...Array(horizon).fill(null)],
          borderColor: "#00eaff",
          tension: 0.25,
        },
        {
          label: "Forecast",
          data: [...Array(values.length).fill(null), ...futureVals],
          borderColor: "#b026ff",
          borderDash: [6, 4],
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: "rgba(255,255,255,.08)" } },
        y: { grid: { color: "rgba(255,255,255,.08)" } },
      },
    },
  });

  document.getElementById(
    "anForecastInsight"
  ).innerHTML = `• Proyeksi 6 bulan ke depan total sekitar <b>$${fmt(
    sum(futureVals)
  )}</b> (metode regresi linear sederhana).`;

  // ---------- RFM (City proxy) ----------
  // Recency (bulan dari terakhir transaksi terhadap max YM), Frequency (jumlah record), Monetary (total sales)
  const maxYM = months[months.length - 1];
  const cityGroups = groupBy(
    rows.filter((r) => r.YM),
    "City"
  );
  const rfm = Object.entries(cityGroups).map(([city, arr]) => {
    const recency = diffMonth(
      maxYM,
      arr
        .map((a) => a.YM)
        .sort()
        .pop()
    );
    const frequency = arr.length;
    const monetary = sum(arr.map((a) => a.Sales));
    return { city, recency, frequency, monetary };
  });

  // score 1-5 via quantiles (low recency better → invert)
  const q = (list, p) => {
    if (!list.length) return 0;
    const s = [...list].sort((a, b) => a - b),
      idx = Math.floor((s.length - 1) * p);
    return s[idx];
  };
  const rec = rfm.map((r) => r.recency),
    fre = rfm.map((r) => r.frequency),
    mon = rfm.map((r) => r.monetary);
  const score = (val, arr, invert = false) => {
    const cuts = [q(arr, 0.2), q(arr, 0.4), q(arr, 0.6), q(arr, 0.8)];
    let s = 1;
    if (val > cuts[0]) s = 2;
    if (val > cuts[1]) s = 3;
    if (val > cuts[2]) s = 4;
    if (val > cuts[3]) s = 5;
    return invert ? 6 - s : s;
  };
  rfm.forEach((r) => {
    r.R = score(r.recency, rec, true);
    r.F = score(r.frequency, fre, false);
    r.M = score(r.monetary, mon, false);
    r.RFM = r.R + r.F + r.M;
  });

  // bar distribution of RFM scores (sum counts by RFM total)
  const rfmDist = groupBy(rfm, "RFM");
  const rfmKeys = Object.keys(rfmDist).sort((a, b) => +a - +b);
  const rfmCounts = rfmKeys.map((k) => rfmDist[k].length);

  new Chart(document.getElementById("anRfmBar"), {
    type: "bar",
    data: {
      labels: rfmKeys,
      datasets: [
        { label: "Cities count", data: rfmCounts, backgroundColor: "#00ffc3" },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: "rgba(255,255,255,.08)" } },
        y: { grid: { color: "rgba(255,255,255,.08)" } },
      },
    },
  });

  // top 10 cities by RFM + monetary
  const topRfm = [...rfm]
    .sort((a, b) => b.RFM - a.RFM || b.monetary - a.monetary)
    .slice(0, 10);
  const tbl = [
    `<div class="head">City</div><div class="head">RFM (R/F/M)</div>`,
    ...topRfm.map(
      (r) =>
        `<div>${r.city}</div><div>${r.RFM} <span class="muted">(${r.R}/${r.F}/${r.M})</span></div>`
    ),
  ].join("");
  document.getElementById("anRfmTop").innerHTML = tbl;

  document.getElementById("anRfmInsight").innerHTML = `• ${
    topRfm[0]?.city || "-"
  } memiliki skor RFM tertinggi (${
    topRfm[0]?.RFM || "-"
  }) — kandidat utama untuk prioritas campaign.`;

  // ---------- Outliers (Sales vs Profit) ----------
  const sales = rows.map((r) => r.Sales),
    profit = rows.map((r) => r.Profit);
  const zs = zScore(sales),
    zp = zScore(profit);
  const outIdx = sales
    .map((_, i) => (Math.abs(zs[i]) > 3 || Math.abs(zp[i]) > 3 ? i : -1))
    .filter((i) => i >= 0);

  const scatterData = rows
    .slice(0, 3000)
    .map((r, i) => ({ x: r.Sales, y: r.Profit }));
  const outData = outIdx
    .slice(0, 600)
    .map((i) => ({ x: rows[i].Sales, y: rows[i].Profit }));

  new Chart(document.getElementById("anOutlier"), {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Points",
          data: scatterData,
          pointRadius: 2,
          backgroundColor: "rgba(0,234,255,.7)",
        },
        {
          label: "Outliers",
          data: outData,
          pointRadius: 3.5,
          backgroundColor: "#ff007c",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: "rgba(255,255,255,.08)" } },
        y: { grid: { color: "rgba(255,255,255,.08)" } },
      },
    },
  });

  document.getElementById(
    "anOutlierInsight"
  ).innerHTML = `• Ditemukan sekitar <b>${fmt(
    outIdx.length
  )}</b> titik outlier (|z| > 3). Cek terutama outlier dengan profit negatif besar.`;

  // ---------- Affinity (Sub-Category co-occurrence by City) ----------
  // Untuk setiap City, ambil set unik SubCategory → hitung pasangan
  const affin = {};
  const perCity = groupBy(
    rows.filter((r) => r.SubCategory && r.City),
    "City"
  );
  Object.values(perCity).forEach((list) => {
    const set = [...new Set(list.map((r) => r.SubCategory))];
    for (let i = 0; i < set.length; i++) {
      for (let j = i + 1; j < set.length; j++) {
        const a = set[i],
          b = set[j],
          key = a < b ? `${a} ⇄ ${b}` : `${b} ⇄ ${a}`;
        affin[key] = (affin[key] || 0) + 1;
      }
    }
  });
  const topPairs = Object.entries(affin)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  const affTbl = [
    `<div class="head">Sub-Category Pair</div><div class="head">Co-occurrence (Cities)</div>`,
    ...topPairs.map(([k, v]) => `<div>${k}</div><div>${fmt(v)}</div>`),
  ].join("");
  document.getElementById("anAffinity").innerHTML = affTbl;
}

/* ---------- small helpers ---------- */
function pearson(a, b) {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  const ma = mean(a),
    mb = mean(b);
  let num = 0,
    da = 0,
    db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma,
      xb = b[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}
function linearRegression(x, y) {
  const n = Math.min(x.length, y.length);
  const mx = mean(x),
    my = mean(y);
  let num = 0,
    den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) * (x[i] - mx);
  }
  const a = den ? num / den : 0; // slope
  const b = my - a * mx; // intercept
  return { a, b };
}
function zScore(arr) {
  const m = mean(arr),
    s = std(arr) || 1e-9;
  return arr.map((v) => (v - m) / s);
}
function diffMonth(ymA, ymB) {
  // ym format: YYYY-MM
  if (!ymA || !ymB) return 0;
  const [ya, ma] = ymA.split("-").map(Number);
  const [yb, mb] = ymB.split("-").map(Number);
  return (ya - yb) * 12 + (ma - mb);
}
/* ============================================================
   PATCHES (append-only) — safety, sizing, and data hygiene
   ============================================================ */

// 1) Pastikan kanvas punya tinggi minimal (kalau CSS belum menetapkan)
(function ensureChartHeights() {
  const targets = [
    ["anForecast", 380],
    ["anOutlier", 360],
    ["anRfmBar", 320],
  ];
  targets.forEach(([id, h]) => {
    const el = document.getElementById(id);
    if (el && (!el.style.height || el.clientHeight < 40)) {
      el.style.height = h + "px";
    }
    // jika parent .chart-box ada tapi collapse, beri min-height juga
    if (
      el &&
      el.parentElement &&
      el.parentElement.classList.contains("chart-box")
    ) {
      const p = el.parentElement;
      if (!p.style.minHeight || p.clientHeight < 40)
        p.style.minHeight = h + "px";
    }
  });
})();

// 2) Helper lokal (tidak menimpa helper di main.js)
function _ymKeyLocal(dt) {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function _toNum(v) {
  const n = +v;
  return isFinite(n) ? n : 0;
}
function _fmt(n) {
  try {
    return (n ?? 0).toLocaleString("en-US");
  } catch (e) {
    return String(n);
  }
}

// 3) Hook ringan agar buildAnalytics selalu dapat data yang bersih
const _buildAnalyticsOrig =
  typeof buildAnalytics === "function" ? buildAnalytics : null;

if (_buildAnalyticsOrig) {
  window.buildAnalytics = function patchedBuildAnalytics(rows) {
    // a) Koersi tipe & lengkapi YM/Year bila belum ada
    const clean = rows.map((r) => {
      const YM = r.YM || _ymKeyLocal(r.OrderDate);
      const d = new Date(r.OrderDate);
      const Year = r.Year || (isNaN(d.getTime()) ? null : d.getFullYear());
      return {
        ...r,
        Sales: _toNum(r.Sales),
        Profit: _toNum(r.Profit),
        Discount: _toNum(r.Discount),
        Quantity: _toNum(r.Quantity),
        YM,
        Year,
      };
    });

    // b) Pastikan elemen target tersedia; kalau belum, tunda dikit
    const needIds = [
      "anKpiSales",
      "anKpiProfit",
      "anKpiOrders",
      "anKpiDiscount",
      "anKpiCities",
      "anCorr",
      "anForecast",
      "anRfmBar",
      "anRfmTop",
      "anOutlier",
      "anAffinity",
    ];
    const missing = needIds.filter((id) => !document.getElementById(id));
    if (missing.length) {
      // coba lagi sebentar (DOM mungkin belum siap)
      return setTimeout(() => window.buildAnalytics(clean), 120);
    }

    // c) Neon style default ringan untuk Chart.js (tidak menimpa yang sudah ada)
    if (!window.__chartNeonDefaults) {
      if (window.Chart && Chart.defaults) {
        Chart.defaults.color = Chart.defaults.color || "#dfe9ff";
        Chart.defaults.borderColor =
          Chart.defaults.borderColor || "rgba(255,255,255,.15)";
      }
      window.__chartNeonDefaults = true;
    }

    // d) Panggil aslinya
    const out = _buildAnalyticsOrig(clean);

    // e) Auto-resize agar chart tidak blank saat container berubah ukuran
    try {
      window.__anaChartsResizeHandler ||= () => {
        // Force relayout for plotly and update chart.js instances
        if (window.Plotly && document.getElementById("anCorr")) {
          Plotly.Plots.resize("anCorr");
        }
        // Update all canvas charts
        document
          .querySelectorAll("#anForecast,#anOutlier,#anRfmBar")
          .forEach((cv) => {
            if (cv && cv._chart) {
              try {
                cv._chart.resize();
              } catch (_) {}
            }
          });
      };
      window.addEventListener("resize", window.__anaChartsResizeHandler);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) window.__anaChartsResizeHandler();
      });

      // Simpan instance chart.js supaya bisa di-resize (apabila Chart.js v3+)
      const tryTag = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const inst = Chart.getChart ? Chart.getChart(el) : el && el._chart;
        if (inst) el._chart = inst;
      };
      tryTag("anForecast");
      tryTag("anOutlier");
      tryTag("anRfmBar");
    } catch (e) {
      /* no-op */
    }

    // f) Insight fallback bila ada elemen tapi tidak terisi (supaya tidak kosong)
    const ensureText = (id, text) => {
      const el = document.getElementById(id);
      if (el && !el.innerHTML.trim()) el.innerHTML = text;
    };
    ensureText(
      "anCorrInsight",
      "• Korelasi tampil setelah data siap. Jika kosong, periksa kolom numerik (Sales/Profit/Discount/Quantity)."
    );
    ensureText(
      "anForecastInsight",
      "• Forecast diestimasi dengan regresi linear sederhana 6 bulan ke depan."
    );
    ensureText(
      "anRfmInsight",
      "• RFM dihitung berbasis kota (proxy). Nilai tinggi = pelanggan/area bernilai tinggi."
    );
    ensureText(
      "anOutlierInsight",
      "• Outlier ditandai dengan |z|>3 pada Sales/Profit."
    );

    return out;
  };
}

// 4) Jika RAW update belakangan, rebuild otomatis
window.__rebuildAnalytics = function () {
  if (
    typeof RAW !== "undefined" &&
    RAW.length &&
    typeof buildAnalytics === "function"
  ) {
    buildAnalytics(RAW);
  }
};

// 5) Jalankan resize sekali setelah semua load (supaya kanvas tidak 0px)
window.addEventListener("load", () => {
  setTimeout(() => {
    if (window.__anaChartsResizeHandler) window.__anaChartsResizeHandler();
  }, 150);
});
