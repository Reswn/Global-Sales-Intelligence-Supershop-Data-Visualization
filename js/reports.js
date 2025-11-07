/* ============================================================
   REPORTS.JS — FINAL (No PapaParse, Uses RAW from main.js)
   ============================================================ */

/* 
   RAW berasal dari main.js  
   Kita hanya perlu menunggu sampai main.js selesai load CSV-nya.
*/

function waitForRAW() {
  if (typeof RAW !== "undefined" && RAW.length > 0) {
    console.log("✅ RAW Loaded for Reports:", RAW.length);
    buildReports(RAW);
  } else {
    setTimeout(waitForRAW, 120);
  }
}
waitForRAW();

/* ============================================================
     BUILD REPORTS
     ============================================================ */
function buildReports(rows) {
  // Tambahkan Year & Month (YYYY-MM)
  rows.forEach((r) => {
    const d = new Date(r.OrderDate);
    if (!isNaN(d.getTime())) {
      r.Year = d.getFullYear();
      r.Month = d.toISOString().slice(0, 7);
    }
  });

  /* ========== MONTHLY REPORT ========== */
  const monthMap = {};
  rows.forEach((r) => {
    monthMap[r.Month] = (monthMap[r.Month] || 0) + r.Sales;
  });

  new Chart(document.getElementById("repMonthlyChart"), {
    type: "line",
    data: {
      labels: Object.keys(monthMap),
      datasets: [
        {
          label: "Sales",
          data: Object.values(monthMap),
          borderColor: "#00eaff",
          backgroundColor: "rgba(0,234,255,.25)",
          tension: 0.25,
        },
      ],
    },
  });
  document.getElementById("repMonthlyInsight").innerHTML = generateInsight(
    Object.keys(monthMap),
    Object.values(monthMap)
  );
  document.getElementById("repSummary").innerHTML = `
  <b>Ringkasan Utama:</b><br><br>
  • Monthly Trend: ${
    document.getElementById("repMonthlyInsight").innerText
  }<br><br>
  • Annual Report: ${
    document.getElementById("repAnnualInsight").innerText
  }<br><br>
  • Category: ${document.getElementById("repCategoryInsight").innerText}<br><br>
  • Regional: ${document.getElementById("repRegionalInsight").innerText}<br><br>
  • Discount Impact: ${
    document.getElementById("repDiscountInsight").innerText
  }<br><br>
  • Segment: ${document.getElementById("repSegmentInsight").innerText}<br><br>
`;

  /* ========== ANNUAL REPORT ========== */
  const yearSales = {};
  const yearProfit = {};

  rows.forEach((r) => {
    yearSales[r.Year] = (yearSales[r.Year] || 0) + r.Sales;
    yearProfit[r.Year] = (yearProfit[r.Year] || 0) + r.Profit;
  });

  new Chart(document.getElementById("repAnnualChart"), {
    type: "bar",
    data: {
      labels: Object.keys(yearSales),
      datasets: [
        {
          label: "Sales",
          data: Object.values(yearSales),
          backgroundColor: "#00eaff",
        },
        {
          label: "Profit",
          data: Object.values(yearProfit),
          backgroundColor: "#b026ff",
        },
      ],
    },
  });
  document.getElementById("repAnnualInsight").innerHTML = generateInsight(
    Object.keys(yearSales),
    Object.values(yearSales)
  );
  document.getElementById("repSummary").innerHTML = `
  <b>Ringkasan Utama:</b><br><br>
  • Monthly Trend: ${
    document.getElementById("repMonthlyInsight").innerText
  }<br><br>
  • Annual Report: ${
    document.getElementById("repAnnualInsight").innerText
  }<br><br>
  • Category: ${document.getElementById("repCategoryInsight").innerText}<br><br>
  • Regional: ${document.getElementById("repRegionalInsight").innerText}<br><br>
  • Discount Impact: ${
    document.getElementById("repDiscountInsight").innerText
  }<br><br>
  • Segment: ${document.getElementById("repSegmentInsight").innerText}<br><br>
`;

  /* ========== CATEGORY REPORT ========== */
  const catMap = {};

  rows.forEach((r) => {
    catMap[r.Category] = (catMap[r.Category] || 0) + r.Sales;
  });

  new Chart(document.getElementById("repCategoryChart"), {
    type: "bar",
    data: {
      labels: Object.keys(catMap),
      datasets: [
        {
          label: "Sales",
          data: Object.values(catMap),
          backgroundColor: ["#00eaff", "#b026ff", "#ff007c"],
        },
      ],
    },
  });
  document.getElementById("repCategoryInsight").innerHTML = generateInsight(
    Object.keys(catMap),
    Object.values(catMap)
  );
  document.getElementById("repSummary").innerHTML = `
  <b>Ringkasan Utama:</b><br><br>
  • Monthly Trend: ${
    document.getElementById("repMonthlyInsight").innerText
  }<br><br>
  • Annual Report: ${
    document.getElementById("repAnnualInsight").innerText
  }<br><br>
  • Category: ${document.getElementById("repCategoryInsight").innerText}<br><br>
  • Regional: ${document.getElementById("repRegionalInsight").innerText}<br><br>
  • Discount Impact: ${
    document.getElementById("repDiscountInsight").innerText
  }<br><br>
  • Segment: ${document.getElementById("repSegmentInsight").innerText}<br><br>
`;

  /* ========== REGIONAL HEATMAP (PROFIT) ========== */
  const regions = [...new Set(rows.map((r) => r.Region))];
  const cats = [...new Set(rows.map((r) => r.Category))];

  const heatZ = cats.map((cat) =>
    regions.map((reg) =>
      rows
        .filter((r) => r.Category === cat && r.Region === reg)
        .reduce((a, b) => a + b.Profit, 0)
    )
  );

  Plotly.newPlot(
    "repHeatmap",
    [
      {
        z: heatZ,
        x: regions,
        y: cats,
        type: "heatmap",
        colorscale: [
          [0, "#111827"],
          [0.2, "#2dd4bf"],
          [0.5, "#00eaff"],
          [0.8, "#b026ff"],
          [1, "#ff007c"],
        ],
      },
    ],
    {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#dfe9ff" },
      margin: { l: 80, r: 20, t: 20, b: 60 },
    }
  );
  const regionTotalProfit = regions.map((reg) =>
    rows.filter((r) => r.Region === reg).reduce((a, b) => a + b.Profit, 0)
  );

  document.getElementById("repRegionalInsight").innerHTML = generateInsight(
    regions,
    regionTotalProfit
  );
  document.getElementById("repSummary").innerHTML = `
  <b>Ringkasan Utama:</b><br><br>
  • Monthly Trend: ${
    document.getElementById("repMonthlyInsight").innerText
  }<br><br>
  • Annual Report: ${
    document.getElementById("repAnnualInsight").innerText
  }<br><br>
  • Category: ${document.getElementById("repCategoryInsight").innerText}<br><br>
  • Regional: ${document.getElementById("repRegionalInsight").innerText}<br><br>
  • Discount Impact: ${
    document.getElementById("repDiscountInsight").innerText
  }<br><br>
  • Segment: ${document.getElementById("repSegmentInsight").innerText}<br><br>
`;

  /* ========== DISCOUNT SCATTER ========== */
  const scatterData = rows
    .slice(0, 2000)
    .map((r) => ({ x: r.Discount, y: r.Profit }));

  new Chart(document.getElementById("repDiscountChart"), {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Points",
          data: scatterData,
          pointRadius: 3,
          backgroundColor: "#ff007c",
        },
      ],
    },
  });
  const discProf = scatterData.map((p) => p.y);

  document.getElementById("repDiscountInsight").innerHTML = generateInsight(
    ["Min Profit", "Max Profit", "Last Point"],
    [
      Math.min(...discProf),
      Math.max(...discProf),
      discProf[discProf.length - 1],
    ]
  );
  document.getElementById("repSummary").innerHTML = `
  <b>Ringkasan Utama:</b><br><br>
  • Monthly Trend: ${
    document.getElementById("repMonthlyInsight").innerText
  }<br><br>
  • Annual Report: ${
    document.getElementById("repAnnualInsight").innerText
  }<br><br>
  • Category: ${document.getElementById("repCategoryInsight").innerText}<br><br>
  • Regional: ${document.getElementById("repRegionalInsight").innerText}<br><br>
  • Discount Impact: ${
    document.getElementById("repDiscountInsight").innerText
  }<br><br>
  • Segment: ${document.getElementById("repSegmentInsight").innerText}<br><br>
`;

  /* ========== SEGMENT PIE ========== */
  const segMap = {};

  rows.forEach((r) => {
    segMap[r.Segment] = (segMap[r.Segment] || 0) + r.Sales;
  });

  new Chart(document.getElementById("repSegmentChart"), {
    type: "pie",
    data: {
      labels: Object.keys(segMap),
      datasets: [
        {
          data: Object.values(segMap),
          backgroundColor: ["#00eaff", "#b026ff", "#ff007c"],
        },
      ],
    },
  });
  document.getElementById("repSegmentInsight").innerHTML = generateInsight(
    Object.keys(segMap),
    Object.values(segMap)
  );
  document.getElementById("repSummary").innerHTML = `
  <b>Ringkasan Utama:</b><br><br>
  • Monthly Trend: ${
    document.getElementById("repMonthlyInsight").innerText
  }<br><br>
  • Annual Report: ${
    document.getElementById("repAnnualInsight").innerText
  }<br><br>
  • Category: ${document.getElementById("repCategoryInsight").innerText}<br><br>
  • Regional: ${document.getElementById("repRegionalInsight").innerText}<br><br>
  • Discount Impact: ${
    document.getElementById("repDiscountInsight").innerText
  }<br><br>
  • Segment: ${document.getElementById("repSegmentInsight").innerText}<br><br>
`;

  console.log("✅ Reports Generated");
}

/* ============================================================
     TAB SWITCHING
     ============================================================ */
document.querySelectorAll(".r-tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelector(".r-tab.active").classList.remove("active");
    tab.classList.add("active");

    document.querySelector(".report-section.show").classList.remove("show");
    document.getElementById(tab.dataset.target).classList.add("show");
  };
});

/* ============================================================
     INSIGHT GENERATOR
   ============================================================ */
function generateInsight(label, values) {
  if (!values.length) return "No data available.";

  const min = Math.min(...values);
  const max = Math.max(...values);

  return `
      • Nilai tertinggi pada <b>${
        label[values.indexOf(max)]
      }</b> (${max.toLocaleString()})<br>
      • Nilai terendah pada <b>${
        label[values.indexOf(min)]
      }</b> (${min.toLocaleString()})<br>
    `;
}

/* ============================================================
       SUMMARY BOX SYSTEM
     ============================================================ */
function createSummaryBox(title, content) {
  return `
      <div class="summary-box">
        <div class="summary-title">${title}</div>
        <div class="summary-text">${content}</div>
      </div>
    `;
}

function generateSummary() {
  repSummary.innerHTML = `
      ${createSummaryBox("📅 Monthly Report", repMonthlyInsight.innerHTML)}
      ${createSummaryBox("📊 Annual Performance", repAnnualInsight.innerHTML)}
      ${createSummaryBox("📦 Category Overview", repCategoryInsight.innerHTML)}
      ${createSummaryBox("🌍 Regional Insight", repRegionalInsight.innerHTML)}
      ${createSummaryBox("💸 Discount Impact", repDiscountInsight.innerHTML)}
      ${createSummaryBox("🧩 Segment Analysis", repSegmentInsight.innerHTML)}
    `;
}
