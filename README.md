# 🌐 Global Sales Intelligence (GSI) Dashboard  
### Superstore Retail Analytics — Futuristic & Interactive  

![GSI Dashboard Preview](https://github.com/Reswn/Global-Sales-Intelligence-Supershop-Data-Visualization/blob/main/GSI%20insight.png?raw=true)

A **neon-futuristic, fully interactive dashboard** for deep retail analytics — built with pure frontend tech. Explore sales, profit, customer behavior, and product performance across categories, regions, and time — all in real time, no backend required.

➡️ **Live Demo**: [https://gsidatavisualizationrenikartikasuwa.vercel.app/](https://gsidatavisualizationrenikartikasuwa.vercel.app/)  
📦 **Source Code**: [GitHub Repository](https://github.com/Reswn/Global-Sales-Intelligence-Supershop-Data-Visualization.git)

---

## 📌 Overview

This project visualizes the **Global Superstore Dataset** (Kaggle) to deliver actionable business insights through an intuitive, visually striking interface. Designed with a cyberpunk-inspired neon aesthetic and glassmorphism UI, it empowers users to:

- Identify top-performing products & underperforming regions  
- Detect seasonal patterns and growth trends  
- Analyze discount elasticity and segment behavior  
- Make data-driven decisions — instantly.

All computation runs client-side using JavaScript. Zero server dependencies.

---

## 📊 Dataset

- **Source**: [Global Superstore Dataset — Kaggle (by ronysoliman)](https://www.kaggle.com/datasets/ronysoliman/global-superstore-dataset)  
- **File Used**: `superstore_clean.csv` *(cleaned & optimized for visualization)*  
- **Records**: ~11,000 transaction rows  
- **Time Range**: 2014 – 2017  
- **Geography**: 4 Regions (East, West, Central, South), 530+ Cities  
- **Categories**: Furniture, Office Supplies, Technology  
- **Segments**: Consumer, Corporate, Home Office  

### ✅ Data Preprocessing:
- Removed duplicates & missing values  
- Standardized date formats (`Order Date`, `Ship Date`)  
- Derived metrics: `Profit Margin (%)`, `Order Value`, `Days to Ship`  
- Optimized CSV structure for fast `fetch()` + `PapaParse`/`d3.csv`

---

## 🎯 Key Features

| Feature | Description |
|--------|-------------|
| 🔍 **Interactive Filters** | Combine **Category**, **Region**, and **Year** for real-time drill-down. |
| 📈 **Hero Trend Chart** | Monthly sales line chart — spot growth, dips, and seasonality (e.g., Q4 spikes). |
| 📊 **Category Pair Analysis** | Compare **Sales vs. Profit** per category — uncover high-revenue, low-margin traps. |
| 🌡️ **Profit Heatmap** | `Category × Region` matrix to reveal strategic hotspots (e.g., West + Technology). |
| 🏙️ **Top Cities** | Rank cities by total sales — identify high-demand markets. |
| 👥 **Segment & Discount Insights** | Scatter plots showing **Discount % vs. Profit** — visualize elasticity per segment. |

> 💡 All charts are responsive, animated, and interactive (hover, zoom, filter-linked).

---

## 🛠️ Tech Stack

| Layer | Technologies |
|------|--------------|
| **Core** | HTML5, CSS3 (Custom Neon Glassmorphism), Vanilla JavaScript |
| **Charts** | [Chart.js](https://www.chartjs.org/), [Plotly.js](https://plotly.com/javascript/) |
| **Data Parsing** | `fetch()` + native CSV parsing (no external libs required) |
| **Styling** | CSS Variables, Flexbox, Grid — dark-mode native, mobile-responsive |
| **Deployment** | [Vercel](https://vercel.com/) (static site) |
| **Tooling** | VS Code, Git, GitHub, Kaggle |

> 🚀 **Why no framework?**  
> Built for hackathons, learning, and lightweight deployment — easy to understand, modify, and extend.

---

## 🚀 How to Run Locally

1. **Clone the repo**
   ```bash
   git clone https://github.com/Reswn/Global-Sales-Intelligence-Supershop-Data-Visualization.git
   cd Global-Sales-Intelligence-Supershop-Data-Visualization
