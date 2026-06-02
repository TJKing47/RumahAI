import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Info,
  Sparkles,
  User,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  Building2,
  ShieldCheck,
  Brain,
  Layers3,
  ChevronRight,
  BadgeDollarSign,
  LineChart,
  SlidersHorizontal,
  Filter,
  ExternalLink,
  Images,
  RefreshCcw,
  Moon,
  Sun,
  TrendingUp,
  MapPin,
  CircleDollarSign,
  ArrowRight,
  Search,
  BarChart3,
  House,
  Landmark,
} from "lucide-react";
import "./App.css";

import heroHouse from "./assets/hero-house.jpg";
import kualaLumpurImg from "./assets/kuala-lumpur.jpg";
import modernCondoImg from "./assets/modern-condo.jpg";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "predict", label: "Predict", icon: BadgeDollarSign },
  { id: "trends", label: "Market Trends", icon: LineChart },
  { id: "about", label: "House Finder", icon: Search },
  { id: "account", label: "Login / Account", icon: User },
];

const states = [
  "Kuala Lumpur",
  "Selangor",
  "Penang",
  "Johor",
  "Perak",
  "Negeri Sembilan",
  "Melaka",
  "Kedah",
  "Pahang",
  "Sabah",
  "Sarawak",
];

const propertyTypes = [
  "Condominium",
  "Apartment",
  "Terrace House",
  "Semi-Detached",
  "Bungalow",
  "Townhouse",
];

const tenures = ["Freehold", "Leasehold"];

const finderFacilities = [
   "Parking",
  "Security",
  "Lift",
  "Swimming Pool",
  "Playground",
  "Gymnasium",
  "Barbeque Area",
  "Multipurpose Hall",
  "Balcony",
  "Air Conditioning",
  "Fully Furnished",
  "Partially Furnished",
  "Unfurnished",
  "Gated & Guarded",
  "24 Hour Security",
  "Mini Market",
  "Surau",
  "Near MRT",
  "Corner Lot",
  "Renovated",
];

const stateChart = [
  { label: "Kuala Lumpur", avg: 820000 },
  { label: "Selangor", avg: 690000 },
  { label: "Penang", avg: 640000 },
  { label: "Johor", avg: 590000 },
  { label: "Perak", avg: 430000 },
];

const showcaseCards = [
  {
    title: "Instant AI Estimation",
    text: "Get an estimated property value in seconds using structured housing inputs.",
    icon: Brain,
  },
  {
    title: "Malaysia-Focused Insights",
    text: "Designed around Malaysian property data, market conditions, and state-level comparison.",
    icon: Landmark,
  },
  {
    title: "Future Value Outlook",
    text: "Understand how value may grow over time through a simple projection experience.",
    icon: TrendingUp,
  },
];

function currency(n) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatFeatureLabel(label) {
  if (!label) return "Other factor";
  if (label.startsWith("num__Median_PSF")) return "Median PSF";
  if (label.startsWith("num__Transactions")) return "Transactions";
  if (label.startsWith("cat__Type_")) {
    return `Property Type: ${label.replace("cat__Type_", "").replaceAll("_", " ")}`;
  }
  if (label.startsWith("cat__State_")) {
    return `State: ${label.replace("cat__State_", "").replaceAll("_", " ")}`;
  }
  if (label.startsWith("cat__Tenure_")) {
    return `Tenure: ${label.replace("cat__Tenure_", "").replaceAll("_", " ")}`;
  }
  if (label.startsWith("cat__Township_")) {
    return `Township: ${label.replace("cat__Township_", "").replaceAll("_", " ")}`;
  }
  if (label.startsWith("cat__Area_")) {
    return `Area: ${label.replace("cat__Area_", "").replaceAll("_", " ")}`;
  }
  return label.replace(/^cat__|^num__/, "").replaceAll("_", " ");
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.avg));
  return (
    <div className="chart-list">
      {data.map((item) => (
        <div key={item.label} className="chart-item">
          <div className="chart-row">
            <span>{item.label}</span>
            <strong>{currency(item.avg)}</strong>
          </div>
          <div className="chart-track">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.avg / max) * 100}%` }}
              transition={{ duration: 0.7 }}
              className="chart-fill"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ data }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="trend-chart">
      {data.map((item) => (
        <div key={item.year} className="trend-item">
          <div className="trend-bar-wrap">
            <motion.div
              className="trend-bar"
              initial={{ height: 0 }}
              animate={{ height: `${(item.value / max) * 220}px` }}
              transition={{ duration: 0.7 }}
            />
          </div>
          <div className="trend-year">{item.year}</div>
          <div className="trend-value">{currency(item.value)}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <motion.div whileHover={{ y: -4 }}>
      <div className="card stat-card">
        <div className="stat-top">
          <div className="icon-box">
            <Icon size={20} />
          </div>
          <span className="badge">Live UI</span>
        </div>
        <div className="muted">{label}</div>
        <div className="big-value">{value}</div>
        <div className="small-muted">{sub}</div>
      </div>
    </motion.div>
  );
}

function MarketLineChart({ data }) {
  const [hovered, setHovered] = useState(null);

  if (!data?.length) {
    return <div className="placeholder-box">No state market data available.</div>;
  }

  const cleanData = data.filter(
    (item) => String(item.State).toLowerCase() !== "putrajaya"
  );

  const width = Math.max(1200, cleanData.length * 96);
  const height = 520;
  const paddingLeft = 76;
  const paddingRight = 76;
  const paddingTop = 56;
  const paddingBottom = 126;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartTop = paddingTop;
  const chartBottom = height - paddingBottom;
  const chartHeight = chartBottom - chartTop;

  const values = cleanData.flatMap((item) => [
    Number(item.average_price || 0),
    Number(item.median_price || 0),
  ]);

  const maxValue = Math.max(...values) * 1.08;
  const minValue = Math.min(...values) * 0.82;

  const xFor = (index) =>
    paddingLeft + index * (chartWidth / Math.max(cleanData.length - 1, 1));

  const yFor = (value) =>
    chartBottom -
    ((Number(value || 0) - minValue) / (maxValue - minValue || 1)) * chartHeight;

  const avgPoints = cleanData
    .map((item, index) => `${xFor(index)},${yFor(Number(item.average_price || 0))}`)
    .join(" ");

  const medianPoints = cleanData
    .map((item, index) => `${xFor(index)},${yFor(Number(item.median_price || 0))}`)
    .join(" ");

  return (
    <div className="custom-chart-shell line-chart-shell">
      <div className="chart-scroll-wrap">
        <svg className="custom-chart-svg line-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img">
          {[0, 1, 2, 3, 4].map((line) => {
            const y = chartTop + line * (chartHeight / 4);
            return (
              <line
                key={line}
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                className="chart-grid-line"
              />
            );
          })}

          <polyline points={avgPoints} className="market-line average" />
          <polyline points={medianPoints} className="market-line median" />

          {cleanData.map((item, index) => {
            const x = xFor(index);
            const yAverage = yFor(Number(item.average_price || 0));
            const yMedian = yFor(Number(item.median_price || 0));
            const isHovered = hovered?.State === item.State;
            const shortState =
              item.State.length > 13 ? `${item.State.slice(0, 13)}...` : item.State;

            return (
              <g
                key={item.State}
                className="chart-point-group"
                onMouseEnter={() => setHovered(item)}
                onMouseLeave={() => setHovered(null)}
              >
                <line
                  x1={x}
                  x2={x}
                  y1={chartTop}
                  y2={chartBottom}
                  className={isHovered ? "chart-hover-line active" : "chart-hover-line"}
                />

                <circle cx={x} cy={yAverage} r={isHovered ? 7 : 5.5} className="chart-dot average" />
                <circle cx={x} cy={yMedian} r={isHovered ? 7 : 5.5} className="chart-dot median" />

                <text
                  x={x}
                  y={chartBottom + 42}
                  textAnchor="end"
                  transform={`rotate(-35 ${x} ${chartBottom + 42})`}
                  className="chart-axis-label state-axis-label"
                >
                  {shortState}
                </text>

                <title>
                  {item.State}: Average {currency(item.average_price)}, Median {currency(item.median_price)}
                </title>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="chart-legend-row">
        <span><i className="legend-dot average"></i> Average Price</span>
        <span><i className="legend-dot median"></i> Median Price</span>
      </div>

      {hovered && (
        <div className="chart-hover-card">
          <strong>{hovered.State}</strong>
          <span>Average: {currency(hovered.average_price)}</span>
          <span>Median: {currency(hovered.median_price)}</span>
          <span>PSF: RM {Math.round(hovered.average_psf || 0)}</span>
          <span>Samples: {hovered.sample_count}</span>
        </div>
      )}
    </div>
  );
}

function MarketAreaBarChart({ stateAverage, areaData }) {
  const [hovered, setHovered] = useState(null);

  if (!areaData?.length) {
    return <div className="placeholder-box">No area data available for this state.</div>;
  }

  const width = 1100;
  const height = 520;

  // More dedicated space for title/average line, bars, and x-axis labels.
  const paddingLeft = 70;
  const paddingRight = 70;
  const paddingTop = 58;
  const paddingBottom = 118;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartTop = paddingTop;
  const chartBottom = height - paddingBottom;
  const chartHeight = chartBottom - chartTop;

  const maxValue =
    Math.max(stateAverage || 0, ...areaData.map((item) => Number(item.average_price || 0))) * 1.18;

  const barGap = 18;
  const barWidth = Math.max(
    34,
    (chartWidth - barGap * (areaData.length - 1)) / areaData.length
  );

  const yFor = (value) => chartBottom - (Number(value || 0) / maxValue) * chartHeight;
  const avgY = yFor(stateAverage);

  return (
    <div className="custom-chart-shell area-chart-shell">
      <div className="area-average-summary-card">
        <span>State Average Benchmark</span>
        <strong>{currency(stateAverage)}</strong>
      </div>
      <svg className="custom-chart-svg area-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img">
        {[0, 1, 2, 3, 4].map((line) => {
          const y = chartTop + line * (chartHeight / 4);
          return (
            <line
              key={line}
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              className="chart-grid-line"
            />
          );
        })}

        {areaData.map((item, index) => {
          const value = Number(item.average_price || 0);
          const x = paddingLeft + index * (barWidth + barGap);
          const barHeight = (value / maxValue) * chartHeight;
          const y = chartBottom - barHeight;
          const isHovered = hovered?.Area === item.Area;
          const label =
            item.Area.length > 11 ? `${item.Area.slice(0, 11)}...` : item.Area;

          return (
            <g
              key={item.Area}
              className="chart-point-group"
              onMouseEnter={() => setHovered(item)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="12"
                className={isHovered ? "area-bar active" : "area-bar"}
              />

              <title>
                {item.Area}: {currency(value)}
              </title>

              <text
                x={x + barWidth / 2}
                y={chartBottom + 42}
                textAnchor="end"
                transform={`rotate(-32 ${x + barWidth / 2} ${chartBottom + 42})`}
                className="chart-axis-label area-label"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="chart-legend-row area-chart-legend">
        <span><i className="legend-dot average"></i> Area Average Price</span>
        <span><i className="legend-line"></i> State Average</span>
      </div>

      {hovered && (
        <div className="chart-hover-card">
          <strong>{hovered.Area}</strong>
          <span>Average: {currency(hovered.average_price)}</span>
          <span>Median: {currency(hovered.median_price)}</span>
          <span>PSF: RM {Math.round(hovered.average_psf || 0)}</span>
          <span>Samples: {hovered.sample_count}</span>
        </div>
      )}
    </div>
  );
}

function YearlyPredictionChart({ data }) {
  if (!data?.length) {
    return <div className="placeholder-box">No yearly prediction data available.</div>;
  }

  const max = Math.max(...data.map((d) => d.predicted_price));

  return (
    <div className="yearly-forecast-chart">
      {data.map((item) => (
        <div key={item.year} className="yearly-forecast-item">
          <div className="yearly-bar-wrap">
            <motion.div
              className="yearly-bar"
              initial={{ height: 0 }}
              animate={{
                height: `${(item.predicted_price / max) * 150}px`,
              }}
              transition={{ duration: 0.7 }}
            />
          </div>

          <strong>{item.year}</strong>
          <span>{currency(item.predicted_price)}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("rumahai-dark-mode") === "true";
  });
  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem("rumahai-token") || ""
  );

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("rumahai-user");
    return saved ? JSON.parse(saved) : null;
  });

  const [authError, setAuthError] = useState("");

  const [savedSearches, setSavedSearches] = useState([]);

  const [adminUsers, setAdminUsers] = useState([]);

  const [adminLogs, setAdminLogs] = useState([]);

  const [form, setForm] = useState({
    State: "Selangor",
    Type: "Condominium",
    Tenure: "Freehold",
    sqft: 1000,
    medianPsf: 450,
    transactions: 20,
  });

  const [yearlyTrendData, setYearlyTrendData] = useState([]);
  const [yearlyTrendLoading, setYearlyTrendLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [marketStatesData, setMarketStatesData] = useState([]);
  const [marketAreasData, setMarketAreasData] = useState([]);
  const [marketTrendLoading, setMarketTrendLoading] = useState(false);
  const [selectedTrendState, setSelectedTrendState] = useState("Selangor");
  const [snapshot, setSnapshot] = useState([]);
  const [finderForm, setFinderForm] = useState({
  keyword: "",
  state: "Selangor",
  property_type: "Condominium",
  tenure: "",
  min_price: "",
  max_price: "",
  min_sqft: "",
  max_sqft: "",
  bedrooms: "",
  bathrooms: "",
  carparks: "",
  floor_range: "",
  furnishing: "",
  sort_by: "newest",
  facilities: [],
});


const [finderResults, setFinderResults] = useState(null);
const [finderLoading, setFinderLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("rumahai-dark-mode", String(darkMode));
  }, [darkMode]);
  

  useEffect(() => {
    fetchMarketSnapshot();
  }, []);

  const validation = useMemo(() => {
    const errors = [];
    if (!form.sqft || form.sqft < 200) {
      errors.push("Built-up size should be at least 200 sqft.");
    }
    if (!form.medianPsf || form.medianPsf < 50) {
      errors.push("Median PSF should be at least RM50.");
    }
    if (form.transactions < 1) {
      errors.push("Transactions should be at least 1.");
    }
    return errors;
  }, [form]);

  const priceDiffPct = useMemo(() => {
    if (!benchmark?.median_price || !(result?.adjustedPrice || result?.predictedPrice)) return null;
    const anchorPrice = result?.adjustedPrice || result?.predictedPrice;
    return ((anchorPrice - benchmark.median_price) / benchmark.median_price) * 100;
  }, [benchmark, result]);

  const benchmarkVerdict = useMemo(() => {
    if (priceDiffPct === null) return null;
    if (priceDiffPct > 10) return "Above market benchmark";
    if (priceDiffPct < -10) return "Below market benchmark";
    return "Near market benchmark";
  }, [priceDiffPct]);

  const benchmarkDifference = useMemo(() => {
    if (!benchmark?.median_price || !(result?.adjustedPrice || result?.predictedPrice)) return null;
    const anchorPrice = result?.adjustedPrice || result?.predictedPrice;
    return anchorPrice - benchmark.median_price;
  }, [benchmark, result]);

  const fetchMarketBenchmark = async () => {
    setBenchmarkLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/market-benchmark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          State: form.State,
          Type: form.Type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.error || "Benchmark fetch failed");
        setBenchmark(null);
        return;
      }

      setBenchmark(data);
    } catch (error) {
      console.error("Could not fetch market benchmark", error);
      setBenchmark(null);
    } finally {
      setBenchmarkLoading(false);
    }
  };


  const fetchMarketTrendStates = async () => {
    setMarketTrendLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/market-trends/states");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "State market trend fetch failed");
      }

      const rows = Array.isArray(payload)
        ? payload
        : payload.data || payload.states || payload.state_summary || [];

      const cleanedRows = rows
        .map((item) => ({
          State: item.State ?? item.state ?? item.label ?? item.name,
          average_price: Number(
            item.average_price ??
              item.averagePrice ??
              item.avg ??
              item.mean_price ??
              item.median_price ??
              0
          ),
          median_price: Number(
            item.median_price ??
              item.medianPrice ??
              item.median ??
              item.average_price ??
              item.avg ??
              0
          ),
          average_psf: Number(item.average_psf ?? item.averagePsf ?? item.median_psf ?? 0),
          transactions: Number(item.transactions ?? item.Transactions ?? 0),
          sample_count: Number(item.sample_count ?? item.sampleCount ?? item.count ?? 0),
        }))
        .filter((item) => item.State && item.average_price > 0)
        .filter((item) => String(item.State).toLowerCase() !== "putrajaya");

      setMarketStatesData(cleanedRows);

      if (cleanedRows.length && !cleanedRows.some((item) => item.State === selectedTrendState)) {
        setSelectedTrendState(cleanedRows[0].State);
      }
    } catch (error) {
      console.error("Could not fetch state market trends", error);
      setMarketStatesData([]);
    } finally {
      setMarketTrendLoading(false);
    }
  };



  const fetchMarketTrendAreas = async (stateName) => {
    if (!stateName) return;

    setMarketTrendLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/market-trends/areas/${encodeURIComponent(stateName)}`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Area market trend fetch failed");
      }

      const rows = Array.isArray(payload)
        ? payload
        : payload.data || payload.areas || payload.area_summary || [];

      const cleanedRows = rows
        .map((item) => ({
          Area: item.Area ?? item.area ?? item.label ?? item.name,
          average_price: Number(
            item.average_price ??
              item.averagePrice ??
              item.avg ??
              item.mean_price ??
              item.median_price ??
              0
          ),
          median_price: Number(
            item.median_price ??
              item.medianPrice ??
              item.median ??
              item.average_price ??
              item.avg ??
              0
          ),
          average_psf: Number(item.average_psf ?? item.averagePsf ?? item.median_psf ?? 0),
          transactions: Number(item.transactions ?? item.Transactions ?? 0),
          sample_count: Number(item.sample_count ?? item.sampleCount ?? item.count ?? 0),
        }))
        .filter((item) => item.Area && item.average_price > 0);

      setMarketAreasData(cleanedRows);
    } catch (error) {
      console.error("Could not fetch area market trends", error);
      setMarketAreasData([]);
    } finally {
      setMarketTrendLoading(false);
    }
  };

  const selectedStateSummary =
    marketStatesData.find((item) => item.State === selectedTrendState) || null;
 
  const fetchYearlyTrend = async (stateName) => {
  setYearlyTrendLoading(true);

  try {
    const response = await fetch(
      `http://127.0.0.1:5000/market-trends/yearly/${encodeURIComponent(stateName)}`
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Yearly trend fetch failed");
    }

    setYearlyTrendData(payload.data || []);
  } catch (error) {
    console.error("Could not fetch yearly trend", error);
    setYearlyTrendData([]);
  } finally {
    setYearlyTrendLoading(false);
  }
};

  const fetchMarketSnapshot = async () => {
    try {
      // Uses the existing Market Trends API from your backend.
      // This keeps the dashboard snapshot connected to the same real dataset pipeline.
      const response = await fetch("http://127.0.0.1:5000/market-trends/states");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Market snapshot fetch failed");
      }

      const rows = Array.isArray(payload)
        ? payload
        : payload.data || payload.states || payload.state_summary || [];

      const cleanedRows = rows
        .map((item) => ({
          state: item.State ?? item.state ?? item.label ?? item.name,
          avg_price: Number(
            item.average_price ??
              item.averagePrice ??
              item.avg ??
              item.mean_price ??
              item.median_price ??
              0
          ),
          min_price: Number(item.min_price ?? item.minPrice ?? item.minimum_price ?? 0),
          max_price: Number(item.max_price ?? item.maxPrice ?? item.maximum_price ?? 0),
          samples: Number(item.sample_count ?? item.sampleCount ?? item.count ?? item.samples ?? 0),
        }))
        .filter((item) => item.state && item.avg_price > 0)
        .filter((item) => String(item.state).toLowerCase() !== "putrajaya")
        .sort((a, b) => b.avg_price - a.avg_price)
        .slice(0, 5)
        .map((item) => ({
          ...item,
          min_price: item.min_price > 0 ? item.min_price : Math.round(item.avg_price * 0.82),
          max_price: item.max_price > 0 ? item.max_price : Math.round(item.avg_price * 1.18),
        }));

      setSnapshot(cleanedRows);
    } catch (error) {
      console.error("Could not fetch market snapshot", error);
      setSnapshot([]);
    }
  };

  const estimatePrice = async () => {
    if (validation.length) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Township: "Unknown",
          Area: "Unknown",
          State: form.State,
          Tenure: form.Tenure,
          Type: form.Type,
          Median_PSF: Number(form.medianPsf),
          Transactions: Number(form.transactions),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Prediction failed");
        return;
      }

      const predicted = Number(data.predicted_price);
      const adjusted = Number(data.adjusted_price || data.predicted_price);
      const growthRate =
        form.State === "Kuala Lumpur"
          ? 0.055
          : form.State === "Selangor"
          ? 0.048
          : form.State === "Penang"
          ? 0.045
          : 0.038;

      setResult({
        predictedPrice: Math.round(predicted),
        adjustedPrice: Math.round(adjusted),
        estimatedRangeLow: Math.round(adjusted * 0.93),
        estimatedRangeHigh: Math.round(adjusted * 1.07),
        pricePerSqft: Math.round(adjusted / Number(form.sqft)),
        confidence:
          form.transactions >= 15
            ? "Higher confidence"
            : form.transactions >= 8
            ? "Moderate confidence"
            : "Lower confidence",
        pricingLabel: data.market_median ? "Market-adjusted AI value" : "AI Estimated Value",
        stateAverage: data.market_median ? Number(data.market_median) : adjusted * 0.95,
        comparisonPct:
          data.market_median && Number(data.market_median) > 0
            ? ((adjusted - Number(data.market_median)) / Number(data.market_median)) * 100
            : 5.0,
        futureTrend: [1, 2, 3, 4, 5].map((year) => ({
          year: `${year}Y`,
          value: Math.round(adjusted * Math.pow(1 + growthRate, year)),
        })),
      });

      fetchMarketBenchmark();
      setActiveTab("predict");
    } catch (error) {
      alert("Could not connect to Flask backend.");
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeTab === "trends" && !benchmark && !benchmarkLoading) {
      fetchMarketBenchmark();
    }
  }, [activeTab, benchmark, benchmarkLoading]);

  useEffect(() => {
  if (activeTab === "trends") {
    fetchYearlyTrend(selectedTrendState);
  }
}, [activeTab, selectedTrendState]);

  useEffect(() => {
    if (activeTab === "trends" && marketStatesData.length === 0) {
      fetchMarketTrendStates();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "trends") {
      fetchMarketTrendAreas(selectedTrendState);
    }
  }, [activeTab, selectedTrendState]);

  const searchHouses = async () => {
  setFinderLoading(true);
  setFinderResults(null);

  try {
    const response = await fetch("http://127.0.0.1:5000/search-houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finderForm),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "House search failed");
      setFinderResults({ count: 0, listings: [] });
      return;
    }

    setFinderResults(data);
  } catch (error) {
    console.error("Could not search houses", error);
    alert("Could not connect to Flask backend.");
    setFinderResults({ count: 0, listings: [] });
  } finally {
    setFinderLoading(false);
  }
};

const toggleFacility = (tag) => {
  setFinderForm((prev) => ({
    ...prev,
    facilities: prev.facilities.includes(tag)
      ? prev.facilities.filter((item) => item !== tag)
      : [...prev.facilities, tag],
  }));
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${authToken}`,
});

const handleAuth = async () => {
  setAuthError("");
  try {
    const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
    const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authForm),
    });
    const data = await response.json();
    if (!response.ok) {
      setAuthError(data.error || "Authentication failed");
      return;
    }
    setAuthToken(data.token);
    setCurrentUser(data.user);
    localStorage.setItem("rumahai-token", data.token);
    localStorage.setItem("rumahai-user", JSON.stringify(data.user));
  } catch {
    setAuthError("Could not connect to backend");
  }
};

const logout = () => {
  setAuthToken("");
  setCurrentUser(null);
  localStorage.removeItem("rumahai-token");
  localStorage.removeItem("rumahai-user");
};

const saveCurrentSearch = async () => {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }
  const name = prompt("Name this search:", "My House Search");
  if (!name) return;
  const response = await fetch("http://127.0.0.1:5000/user/saved-searches", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ search_name: name, filters: finderForm }),
  });
  const data = await response.json();
  alert(data.message || "Saved.");
};

const loadSavedSearches = async () => {
  if (!authToken) return;
  const response = await fetch("http://127.0.0.1:5000/user/saved-searches", {
    headers: authHeaders(),
  });
  const data = await response.json();
  setSavedSearches(data.saved_searches || []);
};

const loadAdminData = async () => {
  if (!authToken || currentUser?.role !== "admin") return;
  const usersRes = await fetch("http://127.0.0.1:5000/admin/users", { headers: authHeaders() });
  const usersData = await usersRes.json();
  setAdminUsers(usersData.users || []);

  const logsRes = await fetch("http://127.0.0.1:5000/admin/logs", { headers: authHeaders() });
  const logsData = await logsRes.json();
  setAdminLogs(logsData.logs || []);
};

  const resetForm = () => {
    setForm({
      State: "Selangor",
      Type: "Condominium",
      Tenure: "Freehold",
      sqft: 1000,
      medianPsf: 450,
      transactions: 20,
    });
    setResult(null);
    setBenchmark(null);
  };

  return (
    <div className={`app-shell ${darkMode ? "dark" : ""}`}>
      <div className="main-wrap">
        <div className="topbar card">
          <div className="brand">
           <button
  className="brand-icon"
  type="button"
  onClick={() => setActiveTab("account")}
  title={currentUser ? `Logged in as ${currentUser.name}` : "Login / Account"}
>
  <User size={28} />
</button>
            <div>
              <div className="brand-row">
                <h1>RumahAI</h1>
                <span className="badge">Professional UI</span>
              </div>
              <p>Predictive House Price Estimation in Malaysia</p>
            </div>
          </div>

          <div className="tab-row">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}

            <button
              className="theme-toggle"
              onClick={() => setDarkMode((prev) => !prev)}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>

        <div className="content-area">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="dashboard-frontpage"
              >
                <section className="front-hero card">
                  <div className="front-hero-copy">
                    <span className="hero-kicker">Property Intelligence Platform</span>
                    <h2>Find smarter property value insights with RumahAI.</h2>
                    <p>
                      Explore estimated prices, compare state-level housing trends, and
                      understand market movement through a clean front-page experience built
                      for Malaysian users.
                    </p>

                    <div className="front-hero-actions">
                      <button className="primary-btn" onClick={() => setActiveTab("predict")}>
                        Start Predicting <ArrowRight size={16} />
                      </button>
                      <button className="secondary-btn" onClick={() => setActiveTab("trends")}>
                        Explore Market Trends
                      </button>
                    </div>

                    <div className="front-hero-badges">
                      <span>AI valuation</span>
                      <span>Malaysia-focused</span>
                      <span>Explainable results</span>
                    </div>
                  </div>

                  <div className="front-hero-image-wrap">
                    <img src={heroHouse} alt="Featured property" className="front-hero-image" />
                    <div className="front-hero-floating">
                      <div className="floating-label">Top benchmark</div>
                      <div className="floating-value">RM 820,000</div>
                      <div className="floating-sub">Kuala Lumpur average</div>
                    </div>
                  </div>
                </section>

                <section className="front-quick-grid">
                  <div className="quick-card card">
                    <div className="quick-card-top">
                      <div className="quick-icon"><Search size={18} /></div>
                      <span className="quick-tag">01</span>
                    </div>
                    <h3>Estimate Value</h3>
                    <p>Get a fast estimated market price from a simple set of property details.</p>
                  </div>

                  <div className="quick-card card">
                    <div className="quick-card-top">
                      <div className="quick-icon"><BarChart3 size={18} /></div>
                      <span className="quick-tag">02</span>
                    </div>
                    <h3>Compare States</h3>
                    <p>See how house values differ across major Malaysian property markets.</p>
                  </div>

                  <div className="quick-card card">
                    <div className="quick-card-top">
                      <div className="quick-icon"><TrendingUp size={18} /></div>
                      <span className="quick-tag">03</span>
                    </div>
                    <h3>Future Outlook</h3>
                    <p>Understand projected price movement with simple long-term value charts.</p>
                  </div>
                </section>

                <section className="front-showcase-grid">
                  <div className="showcase-large card live-snapshot-card">
                    <div className="showcase-title-row">
                      <div>
                        <span className="showcase-kicker">Real-Time Data</span>
                        <h3>Live Market Intelligence</h3>
                        <p className="muted">
                          Dataset-driven snapshot from your Malaysia housing dataset, connected
                          through the Flask market-trends API.
                        </p>
                      </div>

                      <button className="secondary-btn snapshot-refresh-btn" onClick={fetchMarketSnapshot}>
                        <RefreshCcw size={14} /> Refresh
                      </button>
                    </div>

                    {snapshot.length === 0 ? (
                      <div className="placeholder-box">
                        No snapshot data loaded yet. Start the Flask backend and refresh this panel.
                      </div>
                    ) : (
                      <div className="snapshot-list">
                        {snapshot.map((item) => (
                          <div key={item.state} className="snapshot-row">
                            <div className="snapshot-header">
                              <strong>{item.state}</strong>
                              <span>RM {Math.round(item.avg_price).toLocaleString()}</span>
                            </div>

                            <div className="snapshot-bar">
                              <div
                                className="fill"
                                style={{
                                  width: `${Math.min((item.avg_price / Math.max(snapshot[0]?.avg_price || 1, 1)) * 100, 100)}%`,
                                }}
                              />
                            </div>

                            <div className="snapshot-meta">
                              <span>Low: RM {Math.round(item.min_price).toLocaleString()}</span>
                              <span>High: RM {Math.round(item.max_price).toLocaleString()}</span>
                              <span>{item.samples || 0} samples</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="showcase-side">
                    <div className="showcase-image-card card">
                      <img src={kualaLumpurImg} alt="Kuala Lumpur skyline" className="showcase-image" />
                      <div className="showcase-overlay">
                        <span className="showcase-kicker">Urban Market</span>
                        <h3>Kuala Lumpur & Selangor</h3>
                        <p>Popular high-demand regions with stronger average pricing signals.</p>
                      </div>
                    </div>

                    <div className="showcase-info-grid">
                      {showcaseCards.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.title} className="showcase-info-card card">
                            <div className="showcase-info-icon">
                              <Icon size={18} />
                            </div>
                            <h4>{item.title}</h4>
                            <p>{item.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section className="front-bottom-grid">
                  <div className="bottom-feature card">
                    <div className="bottom-feature-copy">
                      <span className="showcase-kicker">User Journey</span>
                      <h3>Built for a smoother front-page experience</h3>
                      <p>
                        RumahAI is structured to feel less like a student dashboard and more
                        like a modern property platform, with clearer entry points and stronger
                        visual hierarchy.
                      </p>
                      <button className="primary-btn" onClick={() => setActiveTab("predict")}>
                        Try Prediction
                      </button>
                    </div>
                    <div className="bottom-feature-image-wrap">
                      <img src={modernCondoImg} alt="Modern condominium" className="bottom-feature-image" />
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "predict" && (
              <motion.div
                key="predict"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="section-head">
                  <div>
                    <h2>Estimate Property Value</h2>
                    <p>
                      Use the guided inputs below to get an AI estimate, then compare it
                      against the live market benchmark and current comparable listings.
                    </p>
                  </div>
                  <button className="secondary-btn" onClick={resetForm}>
                    <RefreshCcw size={16} /> Reset
                  </button>
                </div>

                <div className="predict-page-stack">
                  <div className="predict-page-center">
                    <div className="predict-centered-card card">
                      <div className="predict-headline">
                        <span className="hero-kicker">Smart Property Check</span>
                        <h3>Tell RumahAI about the property</h3>
                        <p className="muted">
                          We turned the technical inputs into friendlier controls so normal
                          users can explore property value more easily.
                        </p>
                      </div>

                      <div className="predict-pill-row">
                        {propertyTypes.map((type) => (
                          <motion.button
                            key={type}
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`choice-pill ${form.Type === type ? "active" : ""}`}
                            onClick={() => setForm({ ...form, Type: type })}
                          >
                            {type}
                          </motion.button>
                        ))}
                      </div>

                      <div className="predict-grid-friendly">
                        <div className="friendly-field">
                          <label>State</label>
                          <select
                            value={form.State}
                            onChange={(e) => setForm({ ...form, State: e.target.value })}
                          >
                            {states.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                     <div className="friendly-field">
  <label>Bedrooms</label>
  <select
    value={finderForm.bedrooms}
    onChange={(e) =>
      setFinderForm({ ...finderForm, bedrooms: e.target.value })
    }
  >
    <option value="">Any</option>
    <option value="1">1+</option>
    <option value="2">2+</option>
    <option value="3">3+</option>
    <option value="4">4+</option>
    <option value="5">5+</option>
  </select>
</div>

<div className="friendly-field">
  <label>Bathrooms</label>
  <select
    value={finderForm.bathrooms}
    onChange={(e) =>
      setFinderForm({ ...finderForm, bathrooms: e.target.value })
    }
  >
    <option value="">Any</option>
    <option value="1">1+</option>
    <option value="2">2+</option>
    <option value="3">3+</option>
    <option value="4">4+</option>
  </select>
</div>

<div className="friendly-field">
  <label>Car Parks</label>
  <select
    value={finderForm.carparks}
    onChange={(e) =>
      setFinderForm({ ...finderForm, carparks: e.target.value })
    }
  >
    <option value="">Any</option>
    <option value="1">1+</option>
    <option value="2">2+</option>
    <option value="3">3+</option>
    <option value="4">4+</option>
  </select>
</div>

<div className="friendly-field">
  <label>Floor Range</label>
  <select
    value={finderForm.floor_range}
    onChange={(e) =>
      setFinderForm({ ...finderForm, floor_range: e.target.value })
    }
  >
    <option value="">Any</option>
    <option value="Low">Low Floor</option>
    <option value="Medium">Medium Floor</option>
    <option value="High">High Floor</option>
  </select>
</div>

<div className="friendly-field">
  <label>Furnishing</label>
  <select
    value={finderForm.furnishing}
    onChange={(e) =>
      setFinderForm({ ...finderForm, furnishing: e.target.value })
    }
  >
    <option value="">Any</option>
    <option value="Fully Furnished">Fully Furnished</option>
    <option value="Partially Furnished">Partially Furnished</option>
    <option value="Unfurnished">Unfurnished</option>
  </select>
</div>

<div className="friendly-field">
  <label>Sort By</label>
  <select
    value={finderForm.sort_by}
    onChange={(e) =>
      setFinderForm({ ...finderForm, sort_by: e.target.value })
    }
  >
    <option value="newest">Newest Listings</option>
    <option value="price_low">Lowest Price</option>
    <option value="price_high">Highest Price</option>
    <option value="size_large">Largest Size</option>
    <option value="size_small">Smallest Size</option>
    <option value="best_value">Best Value RM/sqft</option>
  </select>
</div>
                      </div>

                      <div className="predict-slider-grid">
                        <div className="slider-card">
                          <div className="slider-top">
                            <label>Property Size</label>
                            <div className="slider-value-input">
                              <input
                                type="number"
                                min="500"
                                max="5000"
                                step="50"
                                value={form.sqft}
                                onChange={(e) =>
                                  setForm({ ...form, sqft: Number(e.target.value) })
                                }
                              />
                              <strong>sq ft</strong>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="500"
                            max="5000"
                            step="50"
                            value={form.sqft}
                            onChange={(e) =>
                              setForm({ ...form, sqft: Number(e.target.value) })
                            }
                          />
                          <div className="slider-scale">
                            <span>Compact</span>
                            <span>Spacious</span>
                          </div>
                          <p className="small-muted">
                            The overall built-up size of the home.
                          </p>
                        </div>

                        <div className="slider-card">
  <div className="slider-top">
    <label>Area Price Level</label>
    <div className="slider-input-inline">
      <span className="inline-unit">RM</span>
      <input
        type="number"
        min="50"
        max="1200"
        step="10"
        value={form.medianPsf}
        onChange={(e) =>
          setForm({ ...form, medianPsf: Number(e.target.value) || 0 })
        }
        className="inline-number-input"
      />
      <span className="inline-unit">/ sq ft</span>
    </div>
  </div>
  <input
    type="range"
    min="50"
    max="1200"
    step="10"
    value={form.medianPsf}
    onChange={(e) =>
      setForm({ ...form, medianPsf: Number(e.target.value) })
    }
  />
  <div className="slider-scale">
    <span>Budget area</span>
    <span>Premium area</span>
  </div>
  <p className="small-muted">
    A friendlier version of median PSF — the typical price level in that area.
  </p>
</div>

<div className="slider-card">
  <div className="slider-top">
    <label>Recent Sales Activity</label>
    <div className="slider-input-inline">
      <input
        type="number"
        min="1"
        max="50"
        step="1"
        value={form.transactions}
        onChange={(e) =>
          setForm({ ...form, transactions: Number(e.target.value) || 0 })
        }
        className="inline-number-input"
      />
      <span className="inline-unit">sales</span>
    </div>
  </div>
  <input
    type="range"
    min="1"
    max="50"
    step="1"
    value={form.transactions}
    onChange={(e) =>
      setForm({ ...form, transactions: Number(e.target.value) })
    }
  />
  <div className="slider-scale">
    <span>Quiet market</span>
    <span>Active market</span>
  </div>
  <p className="small-muted">
    A simplified way to show how active recent sales have been nearby.
  </p>
</div>
</div>

{validation.length > 0 && (
  <div className="error-box">
    {validation.map((err) => (
      <div key={err}>• {err}</div>
    ))}
  </div>
)}

<div className="predict-action-row">
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="primary-btn big-action-btn"
    onClick={estimatePrice}
  >
    Get My Estimate
  </motion.button>

  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="secondary-btn"
    onClick={resetForm}
  >
    Clear Form
  </motion.button>
</div>
</div>
</div>

                  <div className="predict-results-grid">
                    <div className="stack">
                      <div className="card">
                        <h3>Estimated Market Value</h3>
                        {result ? (
                          <>
                            <div className="result-box">
                              <div className="muted-light">Recommended property value</div>
                              <div className="result-price">
                                {currency(result.adjustedPrice || result.predictedPrice)}
                              </div>
                              <div className="muted-light">
                                AI base estimate: {currency(result.predictedPrice)}
                              </div>
                              <div className="muted-light">
                                Likely range: {currency(result.estimatedRangeLow)} —{" "}
                                {currency(result.estimatedRangeHigh)}
                              </div>
                            </div>

                            <div className="result-grid">
                              <div className="mini-box">
                                <div className="small-muted">Price per sq ft</div>
                                <strong>RM {result.pricePerSqft}</strong>
                              </div>
                              <div className="mini-box">
                                <div className="small-muted">Estimate confidence</div>
                                <strong>{result.confidence}</strong>
                              </div>
                              <div className="mini-box">
                                <div className="small-muted">Market position</div>
                                <strong>{benchmarkVerdict || result.pricingLabel}</strong>
                              </div>
                            </div>

                            {benchmarkDifference !== null && (
                              <div className="insight-strip">
                                <MapPin size={16} />
                                <span>
                                  Compared with the live benchmark, this estimate is{" "}
                                  <strong>
                                    {priceDiffPct >= 0
                                      ? `${priceDiffPct.toFixed(1)}% above`
                                      : `${Math.abs(priceDiffPct).toFixed(1)}% below`}
                                  </strong>.
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="placeholder-box">
                            Your property estimate will appear here after you submit the form.
                          </div>
                        )}
                      </div>

                      <div className="card">
                        <h3>Live Market Benchmark</h3>
                        {benchmarkLoading ? (
                          <div className="placeholder-box">Fetching live market benchmark...</div>
                        ) : benchmark ? (
                          <>
                            <div className="result-grid">
                              <div className="mini-box">
                                <div className="small-muted">Source</div>
                                <strong>{benchmark.source}</strong>
                              </div>
                              <div className="mini-box">
                                <div className="small-muted">Median asking price</div>
                                <strong>{currency(benchmark.median_price)}</strong>
                              </div>
                              <div className="mini-box">
                                <div className="small-muted">Median area price</div>
                                <strong>
                                  {benchmark.median_psf
                                    ? `RM ${Math.round(benchmark.median_psf)} / sq ft`
                                    : "N/A"}
                                </strong>
                              </div>
                            </div>

                            <div className="result-grid" style={{ marginTop: "16px" }}>
                              <div className="mini-box">
                                <div className="small-muted">Listings found</div>
                                <strong>{benchmark.listing_count}</strong>
                              </div>
                              <div className="mini-box">
                                <div className="small-muted">Lowest asking price</div>
                                <strong>{currency(benchmark.min_price)}</strong>
                              </div>
                              <div className="mini-box">
                                <div className="small-muted">Highest asking price</div>
                                <strong>{currency(benchmark.max_price)}</strong>
                              </div>
                            </div>

                            {result && benchmarkDifference !== null && (
                              <div className="insight-strip">
                                <TrendingUp size={16} />
                                <span>
                                  RumahAI estimate is{" "}
                                  <strong>
                                    {priceDiffPct >= 0
                                      ? `${priceDiffPct.toFixed(1)}% above`
                                      : `${Math.abs(priceDiffPct).toFixed(1)}% below`}
                                  </strong>{" "}
                                  the live Mudah median. <strong>{benchmarkVerdict}</strong>
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="placeholder-box">
                            Live benchmark will appear after prediction.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card">
                      <h3>Market Trend & Comparable Listings</h3>
                      {benchmarkLoading ? (
                        <div className="placeholder-box">Loading market trend and comparable listings...</div>
                      ) : benchmark?.listings?.length ? (
                        <div className="chart-list">
                          {benchmark.listings.slice(0, 5).map((item, index) => (
                            <div key={`${item.url || item.title}-${index}`} className="mini-box">
                              <strong>{item.title || item.location || "Comparable Listing"}</strong>
                              <span className="small-muted">
                                {item.location || "Location unavailable"}
                              </span>
                              <span className="small-muted">
                                {currency(item.price)}
                                {item.sqft ? ` • ${Math.round(item.sqft)} sq ft` : ""}
                                {item.tenure ? ` • ${item.tenure}` : ""}
                              </span>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ marginTop: "8px", fontWeight: 700 }}
                                >
                                  Open listing
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="placeholder-box">
                          Market trend and comparable listings will appear below the estimate after prediction.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "trends" && (
              <motion.div
                key="trends"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="section-head">
                  <div>
                    <h2>Market Trends & Future Outlook</h2>
                    <p>
                      Dataset-driven graphs from your local Malaysia housing price data.
                    </p>
                  </div>
                  <button className="secondary-btn" onClick={fetchMarketTrendStates}>
                    <RefreshCcw size={16} /> Refresh Graphs
                  </button>
                </div>

  <div className="card trends-chart-card yearly-forecast-card">
  <div className="trends-card-head">
    <div>
      <h3>Yearly Price Forecast 2025–2030</h3>
     <p className="muted">
  Live yearly projection calculated from the current dataset baseline for{" "}
  {selectedTrendState}.
</p>

<select
  value={selectedTrendState}
  onChange={(e) => setSelectedTrendState(e.target.value)}
  style={{
    width: "260px",
    marginTop: "18px",
    padding: "12px",
    borderRadius: "12px",
    background: "#111827",
    color: "white",
    border: "1px solid #334155",
  }}
>
  {(marketStatesData.length
    ? marketStatesData.map((item) => item.State)
    : states
  ).map((state) => (
    <option key={state} value={state}>
      {state}
    </option>
  ))}
</select>
    </div>
  </div>

  {yearlyTrendLoading ? (
    <div className="placeholder-box">
      Calculating yearly forecast...
    </div>
  ) : (
    <YearlyPredictionChart data={yearlyTrendData} />
  )}
</div>

                <div className="stack">
                  <div className="card trends-chart-card">
                    <div className="trends-card-head">
                      <div>
                        <h3>Overall Housing Price Estimation by State </h3>
                        <p className="muted">
                          This line graph uses the dataset average and median prices for all in the year 2025
                          available Malaysian states. Hover on each point to view exact values.
                        </p>
                      </div>
                    </div>

                    <div className="friendly-field yearly-state-picker">
  <label>Forecast State</label>
  <select
    value={selectedTrendState}
    onChange={(e) => setSelectedTrendState(e.target.value)}
  >
    {(marketStatesData.length
      ? marketStatesData.map((item) => item.State)
      : states
    ).map((state) => (
      <option key={state} value={state}>
        {state}
      </option>
    ))}
  </select>
</div>

                    {marketTrendLoading && marketStatesData.length === 0 ? (
                      <div className="placeholder-box">Loading state graph data...</div>
                    ) : (
                      <MarketLineChart data={marketStatesData} />
                    )}
                  </div>

                  <div className="card trends-chart-card">
                    <div className="trends-card-head trends-filter-head">
                      <div>
                        <h3>State & Area Housing Price Comparison</h3>
                        <p className="muted">
                          Select a state to view area-level estimated prices and compare them
                          against the state average.
                        </p>
                      </div>

                      <div className="trends-filter-row">
                        <div className="friendly-field trends-filter-box">
                          <label>Choose State</label>
                          <select
                            value={selectedTrendState}
                            onChange={(e) => setSelectedTrendState(e.target.value)}
                          >
                            {(marketStatesData.length
                              ? marketStatesData.map((item) => item.State)
                              : states
                            ).map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="result-grid" style={{ marginBottom: "18px" }}>
                      <div className="mini-box">
                        <div className="small-muted">Selected State</div>
                        <strong>{selectedTrendState}</strong>
                      </div>
                      <div className="mini-box">
                        <div className="small-muted">State Average</div>
                        <strong>
                          {selectedStateSummary
                            ? currency(selectedStateSummary.average_price)
                            : "Loading..."}
                        </strong>
                      </div>
                      <div className="mini-box">
                        <div className="small-muted">Dataset Samples</div>
                        <strong>{selectedStateSummary?.sample_count || 0}</strong>
                      </div>
                    </div>

                    {marketTrendLoading && marketAreasData.length === 0 ? (
                      <div className="placeholder-box">Loading area graph data...</div>
                    ) : (
                      <MarketAreaBarChart
                        stateAverage={selectedStateSummary?.average_price || 0}
                        areaData={marketAreasData}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "about" && (
  <motion.div
    key="about"
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="section-head">
      <div>
        <h2>House Finder</h2>
        <p>Search Mudah.my listings using filters and tags.</p>
      </div>

      <button className="secondary-btn" onClick={searchHouses}>
        <Search size={16} /> Search Houses
      </button>
    </div>

    <div className="two-grid">
      <div className="card">
        <h3>Search Filters</h3>

        <div className="predict-grid-friendly">
          <div className="friendly-field">
            <label>Keyword / Area</label>
            <input
              type="text"
              value={finderForm.keyword}
              placeholder="Kajang, Casa Villa, Ampang"
              onChange={(e) =>
                setFinderForm({ ...finderForm, keyword: e.target.value })
              }
            />
          </div>

          <div className="friendly-field">
            <label>State</label>
            <select
              value={finderForm.state}
              onChange={(e) =>
                setFinderForm({ ...finderForm, state: e.target.value })
              }
            >
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="friendly-field">
            <label>Property Type</label>
            <select
              value={finderForm.property_type}
              onChange={(e) =>
                setFinderForm({
                  ...finderForm,
                  property_type: e.target.value,
                })
              }
            >
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="friendly-field">
            <label>Tenure</label>
            <select
              value={finderForm.tenure}
              onChange={(e) =>
                setFinderForm({ ...finderForm, tenure: e.target.value })
              }
            >
              <option value="">Any tenure</option>
              {tenures.map((tenure) => (
                <option key={tenure} value={tenure}>
                  {tenure}
                </option>
              ))}
            </select>
          </div>

          <div className="friendly-field">
            <label>Min Price</label>
            <input
              type="number"
              value={finderForm.min_price}
              placeholder="300000"
              onChange={(e) =>
                setFinderForm({ ...finderForm, min_price: e.target.value })
              }
            />
          </div>

          <div className="friendly-field">
            <label>Max Price</label>
            <input
              type="number"
              value={finderForm.max_price}
              placeholder="600000"
              onChange={(e) =>
                setFinderForm({ ...finderForm, max_price: e.target.value })
              }
            />
          </div>

          <div className="friendly-field">
            <label>Min Size</label>
            <input
              type="number"
              value={finderForm.min_sqft}
              placeholder="800"
              onChange={(e) =>
                setFinderForm({ ...finderForm, min_sqft: e.target.value })
              }
            />
          </div>

          <div className="friendly-field">
            <label>Max Size</label>
            <input
              type="number"
              value={finderForm.max_sqft}
              placeholder="1800"
              onChange={(e) =>
                setFinderForm({ ...finderForm, max_sqft: e.target.value })
              }
            />
          </div>
        </div>

        <div className="finder-tags" style={{ marginTop: "18px" }}>
          {finderFacilities.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`choice-pill ${
                finderForm.facilities.includes(tag) ? "active" : ""
              }`}
              onClick={() => toggleFacility(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="predict-action-row">
          <button
            className="primary-btn big-action-btn"
            onClick={searchHouses}
            disabled={finderLoading}
          >
            {finderLoading ? "Searching..." : "Search Live Listings"}
          </button>

          <button
            className="secondary-btn"
            onClick={() => {
              setFinderForm({
                keyword: "",
                state: "Selangor",
                property_type: "Condominium",
                tenure: "",
                min_price: "",
                max_price: "",
                min_sqft: "",
                max_sqft: "",
                facilities: [],
              });
              setFinderResults(null);
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Matching Properties</h3>

        {finderLoading ? (
          <div className="placeholder-box">Searching Mudah.my listings...</div>
        ) : finderResults?.listings?.length ? (
          <div className="chart-list">
            {finderResults.listings.map((item, index) => (
              <div
                key={`${item.url || item.title}-${index}`}
                className="mini-box"
              >
                <strong>{item.title || item.location || "Property Listing"}</strong>

                <span className="small-muted">
                  {item.location || "Location unavailable"}
                </span>

                <span className="small-muted">
                  {currency(item.price)}
                  {item.sqft ? ` • ${Math.round(item.sqft)} sq ft` : ""}
                  {item.tenure ? ` • ${item.tenure}` : ""}
                  {item.property_type ? ` • ${item.property_type}` : ""}
                </span>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginTop: "8px", fontWeight: 700 }}
                  >
                    Open listing
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : finderResults ? (
          <div className="placeholder-box">
            No matching listings found. Try widening your budget or removing some tags.
          </div>
        ) : (
          <div className="placeholder-box">
            Choose filters and click Search Live Listings.
          </div>
        )}
      </div>
    </div>
  </motion.div>
)}

{activeTab === "account" && (
  <motion.div
    key="account"
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="section-head">
      <div>
        <h2>{currentUser ? "My Account" : "Login / Register"}</h2>
        <p>Login to save house searches, preferences, and access admin tools.</p>
      </div>
    </div>

   {!currentUser ? (
  <div className="account-login-wrap">
    <div className="card account-login-card">
      <h3>{authMode === "login" ? "Login" : "Create Account"}</h3>

      {authMode === "register" && (
        <div className="friendly-field">
          <label>Name</label>
          <input
            value={authForm.name}
            onChange={(e) =>
              setAuthForm({ ...authForm, name: e.target.value })
            }
            placeholder="Your name"
          />
        </div>
      )}

      <div className="friendly-field">
        <label>Email</label>
        <input
          value={authForm.email}
          onChange={(e) =>
            setAuthForm({ ...authForm, email: e.target.value })
          }
          placeholder="email@example.com"
        />
      </div>

      <div className="friendly-field">
        <label>Password</label>
        <input
          type="password"
          value={authForm.password}
          onChange={(e) =>
            setAuthForm({ ...authForm, password: e.target.value })
          }
          placeholder="Minimum 6 characters"
        />
      </div>

      {authError && <div className="error-box">{authError}</div>}

      <div className="predict-action-row">
        <button className="primary-btn big-action-btn" onClick={handleAuth}>
          {authMode === "login" ? "Login" : "Register"}
        </button>

        <button
          className="secondary-btn"
          onClick={() =>
            setAuthMode(authMode === "login" ? "register" : "login")
          }
        >
          {authMode === "login" ? "Create Account" : "Back to Login"}
        </button>
      </div>
    </div>
  </div>
) : (
      <div className="two-grid">
        <div className="card">
          <h3>Welcome, {currentUser.name}</h3>
          <p className="muted">{currentUser.email}</p>
          <p className="muted">Role: {currentUser.role}</p>

          <div className="predict-action-row">
            <button className="primary-btn" onClick={saveCurrentSearch}>
              Save Current House Search
            </button>

            <button className="secondary-btn" onClick={loadSavedSearches}>
              Load Saved Searches
            </button>

            <button className="secondary-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div className="card">
          <h3>{currentUser.role === "admin" ? "Admin Tools" : "Saved Searches"}</h3>
          {savedSearches.length ? (
            <div className="chart-list">
              {savedSearches.map((item) => (
                <div key={item.id} className="mini-box">
                  <strong>{item.search_name}</strong>
                  <span className="small-muted">{item.created_at}</span>
                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setFinderForm(item.filters);
                      setActiveTab("about");
                    }}
                  >
                    Use Search
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="placeholder-box">No saved searches loaded yet.</div>
          )}
        </div>

        {currentUser.role === "admin" && (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <h3>Admin Panel</h3>
            <button className="secondary-btn" onClick={loadAdminData}>
              Load Users & Logs
            </button>

            <h4>Users</h4>
            <div className="chart-list">
              {adminUsers.map((u) => (
                <div key={u.id} className="mini-box">
                  <strong>{u.name} ({u.role})</strong>
                  <span className="small-muted">{u.email}</span>
                  <span className="small-muted">Status: {u.is_active ? "Active" : "Disabled"}</span>
                </div>
              ))}
            </div>

            <h4>System Logs</h4>
            <div className="chart-list">
              {adminLogs.map((log) => (
                <div key={log.id} className="mini-box">
                  <strong>{log.action}</strong>
                  <span className="small-muted">{log.details}</span>
                  <span className="small-muted">{log.created_at}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
  </motion.div>
)}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="section-head">
                  <div>
                    <h2>Developer / Student Profile</h2>
                    <p>Replace this with your own personal information and real project images.</p>
                  </div>
                </div>

                <div className="account-login-wrap">
  <div className="card account-login-card">
                    <div className="profile-banner"></div>
                    <div className="profile-avatar">
                      <Images size={36} />
                    </div>
                    <h3>Jeevanraaj a/l Thayanithi</h3>
                    <p className="muted">Bachelor of Computer Science (Software Engineering) (Hons.)</p>
                    <div className="profile-list">
                      <div><GraduationCap size={16} /> Universiti Tenaga Nasional (UNITEN)</div>
                      <div><Briefcase size={16} /> Final Year Project Developer</div>
                      <div><Mail size={16} /> your-email@example.com</div>
                      <div><Phone size={16} /> +60 xx-xxxx xxxx</div>
                    </div>
                  </div>

                  <div className="stack">
                    <div className="card">
                      <h3>About Me</h3>
                      <p>
                        I am the developer of RumahAI, a predictive house price estimation system
                        for the Malaysian housing market. This project combines software engineering,
                        machine learning, and interactive web design into a practical application.
                      </p>
                    </div>

                    <div className="card">
                      <h3>Image Gallery Placeholders</h3>
                      <div className="gallery-grid">
                        <div className="gallery-item"><Images size={28} /><span>Image 1</span></div>
                        <div className="gallery-item"><Images size={28} /><span>Image 2</span></div>
                        <div className="gallery-item"><Images size={28} /><span>Image 3</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}