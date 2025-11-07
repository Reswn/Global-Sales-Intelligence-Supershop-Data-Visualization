# 🌐 Global Sales Intelligence Dashboard

![Dashboard Preview](https://raw.githubusercontent.com/Reswn/Visualisasi-Data-1/main/public/screenshot.png)  
*(Tambahkan screenshot saat sudah di-commit!)*

A **futuristic, neon-powered interactive dashboard** for deep-dive retail analytics — built with pure frontend tech (no backend required). Explore sales, profit, customer behavior, and product performance across categories, regions, and time — all in real-time.

➡️ **Live Demo**: [https://gsidatavisualizationrenikartikasuwa.vercel.app/](https://gsidatavisualizationrenikartikasuwa.vercel.app/)

---

## 📌 Overview

This dashboard visualizes the **Global Superstore Dataset** (Kaggle) to empower data-driven decision making. Designed with a cyberpunk/neon aesthetic, it combines interactivity, analytical depth, and visual clarity — ideal for business analysts, managers, students, and data enthusiasts.

All processing happens client-side using JavaScript. No server, no database — just HTML, CSS, and modern charting libraries.

---

## 🎯 Key Features

| Feature | Description |
|--------|-------------|
| 🔍 **Interactive Filters** | Filter by **Category**, **Region**, and **Year** — combine filters for instant drill-down. |
| 📈 **Hero Trend Chart** | Monthly sales line chart to detect growth momentum and seasonality. |
| 📊 **Category Pair View** | Side-by-side comparison of **Sales vs. Profit** per category — spot high-revenue but low-margin traps. |
| 🌡️ **Profit Heatmap** | Matrix of **Category × Region** to reveal strategic profit hotspots and underperformers. |
| 🏙️ **Top Cities** | Identify high-demand locations by total sales. |
| 👥 **Segments & Discount Analysis** | Understand how customer segments respond to discounts — with scatter plots showing **discount vs. profit** elasticity. |

---

## 📊 Dataset

- **Source**: [Global Superstore Dataset on Kaggle](https://www.kaggle.com/datasets/juandimarq/global-superstore-dataset)  
- **File Used**: `superstore_clean.csv` *(pre-processed & cleaned for analysis)*  
- **Rows**: ~11,000 transaction records  
- **Time Range**: 2014–2017  
- **Geography**: 4 Regions (East, West, Central, South), 530+ Cities  
- **Categories**: Furniture, Office Supplies, Technology  
- **Segments**: Consumer, Corporate, Home Office  

### ✅ Data Cleaning Highlights:
- Removed duplicates & missing values  
- Standardized date formats  
- Derived key metrics: `Profit Margin (%)`, `Order Value`, etc.  
- Optimized for fast client-side parsing

---

## 🛠️ Tech Stack

| Layer | Technologies |
|------|--------------|
| **Core** | HTML5, CSS3 (Neon Glassmorphism), Vanilla JavaScript |
| **Charts** | [Chart.js](https://www.chartjs.org/), [Plotly.js](https://plotly.com/javascript/) |
| **Styling** | Custom CSS with variables (no framework) — responsive & dark-mode ready |
| **Deployment** | Vercel (static site) |
| **Tooling** | VS Code, Git, GitHub |

> 💡 **Why no framework?**  
> To keep the project lightweight, hackathon-friendly, and easy to understand — while still delivering rich interactivity.

---

## 🚀 How to Run Locally

1. **Clone this repo**
   ```bash
   git clone https://github.com/Reswn/Visualisasi-Data-1.git
   cd Visualisasi-Data-1
