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
  { id: "about", label: "About Project", icon: Info },
  { id: "profile", label: "My Info", icon: User },
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

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("rumahai-dark-mode") === "true";
  });

  const [form, setForm] = useState({
    State: "Selangor",
    Type: "Condominium",
    Tenure: "Freehold",
    sqft: 1000,
    medianPsf: 450,
    transactions: 20,
  });

  const [result, setResult] = useState(null);

  useEffect(() => {
    localStorage.setItem("rumahai-dark-mode", String(darkMode));
  }, [darkMode]);

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

      setResult({
        predictedPrice: Math.round(predicted),
        estimatedRangeLow: Math.round(predicted * 0.93),
        estimatedRangeHigh: Math.round(predicted * 1.07),
        pricePerSqft: Math.round(predicted / Number(form.sqft)),
        confidence:
          form.transactions >= 15
            ? "Higher confidence"
            : form.transactions >= 8
            ? "Moderate confidence"
            : "Lower confidence",
        pricingLabel: "AI Estimated Value",
        stateAverage: predicted * 0.95,
        comparisonPct: 5.0,
        futureTrend: [1, 2, 3, 4, 5].map((year) => ({
          year: `${year}Y`,
          value: Math.round(predicted * Math.pow(1.045, year)),
        })),
        contributions: (data.explanation || [])
          .filter((item) => Number(item.importance) > 0)
          .map((item, index) => ({
            label: formatFeatureLabel(item.feature),
            value: Number(item.importance),
            width: Math.max(8, 100 - index * 10),
          })),
      });

      setActiveTab("predict");
    } catch (error) {
      alert("Could not connect to Flask backend.");
      console.error(error);
    }
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
  };

  return (
    <div className={`app-shell ${darkMode ? "dark" : ""}`}>
      <div className="main-wrap">
        <div className="topbar card">
          <div className="brand">
            <div className="brand-icon">
              <Home size={28} />
            </div>
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
                  <div className="showcase-large card">
                    <div className="showcase-title-row">
                      <div>
                        <span className="showcase-kicker">Market Snapshot</span>
                        <h3>Average Estimated Prices by State</h3>
                      </div>
                    </div>
                    <MiniBarChart data={stateChart} />
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
                    <p>Enter your property details to get an estimated market value and price outlook.</p>
                  </div>
                  <button className="secondary-btn" onClick={resetForm}>
                    <RefreshCcw size={16} /> Reset
                  </button>
                </div>

                <div className="two-grid">
                  <div className="card">
                    <h3>Property Details</h3>

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

                    <div className="form-grid">
                      <div>
                        <label>Property Type</label>
                        <select
                          value={form.Type}
                          onChange={(e) => setForm({ ...form, Type: e.target.value })}
                        >
                          {propertyTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label>Tenure</label>
                        <select
                          value={form.Tenure}
                          onChange={(e) => setForm({ ...form, Tenure: e.target.value })}
                        >
                          {tenures.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-3">
                      <div>
                        <label>Built-up Size (sqft)</label>
                        <input
                          type="number"
                          value={form.sqft}
                          onChange={(e) => setForm({ ...form, sqft: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label>Median PSF (RM)</label>
                        <input
                          type="number"
                          value={form.medianPsf}
                          onChange={(e) => setForm({ ...form, medianPsf: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label>Transactions</label>
                        <input
                          type="number"
                          value={form.transactions}
                          onChange={(e) =>
                            setForm({ ...form, transactions: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>

                    {validation.length > 0 && (
                      <div className="error-box">
                        {validation.map((err) => (
                          <div key={err}>• {err}</div>
                        ))}
                      </div>
                    )}

                    <div className="btn-row">
                      <button className="primary-btn" onClick={estimatePrice}>
                        Get Estimate
                      </button>
                      <button className="secondary-btn" onClick={resetForm}>
                        Clear Form
                      </button>
                    </div>
                  </div>

                  <div className="stack">
                    <div className="card">
                      <h3>Estimated Market Value</h3>
                      {result ? (
                        <>
                          <div className="result-box">
                            <div className="muted-light">Estimated property value</div>
                            <div className="result-price">{currency(result.predictedPrice)}</div>
                            <div className="muted-light">
                              Likely range: {currency(result.estimatedRangeLow)} —{" "}
                              {currency(result.estimatedRangeHigh)}
                            </div>
                          </div>

                          <div className="result-grid">
                            <div className="mini-box">
                              <div className="small-muted">Price per sqft</div>
                              <strong>RM {result.pricePerSqft}</strong>
                            </div>
                            <div className="mini-box">
                              <div className="small-muted">Estimate confidence</div>
                              <strong>{result.confidence}</strong>
                            </div>
                            <div className="mini-box">
                              <div className="small-muted">Market position</div>
                              <strong>{result.pricingLabel}</strong>
                            </div>
                          </div>

                          <div className="insight-strip">
                            <MapPin size={16} />
                            <span>
                              Compared with the average in {form.State}, this estimate is{" "}
                              <strong>
                                {result.comparisonPct >= 0
                                  ? `${result.comparisonPct.toFixed(1)}% higher`
                                  : `${Math.abs(result.comparisonPct).toFixed(1)}% lower`}
                              </strong>.
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="placeholder-box">
                          Fill in your property details to get an estimated market value.
                        </div>
                      )}
                    </div>

                    <div className="card">
                      <h3>Top factors affecting this estimate</h3>
                      {result ? (
                        <div className="chart-list">
                          {result.contributions
                            .filter((item) => item.value > 0)
                            .slice(0, 5)
                            .map((item) => (
                              <div key={item.label} className="chart-item">
                                <div className="chart-row">
                                  <span>{item.label}</span>
                                  <strong>+{currency(Math.abs(item.value))}</strong>
                                </div>
                                <div className="chart-track">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.width}%` }}
                                    transition={{ duration: 0.7 }}
                                    className="chart-fill"
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="placeholder-box">
                          A simple explanation of the price will appear here after prediction.
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
                    <p>Simple graphs and trend visuals that are easier for normal users to understand.</p>
                  </div>
                </div>

                <div className="stats-grid">
                  <StatCard
                    icon={TrendingUp}
                    label="Expected 5-Year Outlook"
                    value="Positive Growth"
                    sub="Based on current estimate scenario"
                  />
                  <StatCard
                    icon={CircleDollarSign}
                    label="Current State Average"
                    value={currency(result?.stateAverage || 690000)}
                    sub="Comparison baseline"
                  />
                  <StatCard
                    icon={MapPin}
                    label="Selected State"
                    value={form.State}
                    sub="Used in estimate and outlook"
                  />
                  <StatCard
                    icon={Brain}
                    label="Forecast Mode"
                    value="Scenario Based"
                    sub="Conservative long-term projection"
                  />
                </div>

                <div className="two-grid">
                  <div className="card">
                    <h3>5-Year Future Value Projection</h3>
                    <p className="muted">A simple showcase of how this property value may grow over time.</p>
                    <TrendChart
                      data={
                        result?.futureTrend || [
                          { year: "1Y", value: 520000 },
                          { year: "2Y", value: 545000 },
                          { year: "3Y", value: 570000 },
                          { year: "4Y", value: 598000 },
                          { year: "5Y", value: 628000 },
                        ]
                      }
                    />
                  </div>

                  <div className="card">
                    <h3>State Price Comparison</h3>
                    <p className="muted">Average estimated house values across selected states.</p>
                    <MiniBarChart data={stateChart} />
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
                    <h2>About RumahAI</h2>
                    <p>A professional project overview section for your lecturer or evaluator.</p>
                  </div>
                </div>

                <div className="two-grid">
                  <div className="card">
                    <h3>Project Summary</h3>
                    <p>
                      RumahAI is a Malaysia-focused house price estimation web application designed
                      to support transparent, data-driven valuation. Users enter key housing
                      attributes and receive an estimated market price through a clean and
                      interactive interface.
                    </p>
                    <p>
                      This frontend can later be connected to your trained machine learning model,
                      Flask API, or other backend architecture.
                    </p>
                  </div>

                  <div className="card info-card">
                    <h3>Why RumahAI?</h3>
                    <p className="muted info-copy">
                      RumahAI helps users understand estimated property value using a cleaner, more
                      transparent interface focused on price guidance, market comparison, and future outlook.
                    </p>

                    <div className="info-pills">
                      <span>Real-time estimate</span>
                      <span>Malaysia-focused</span>
                      <span>Explainable output</span>
                      <span>Interactive interface</span>
                    </div>
                  </div>
                </div>
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

                <div className="two-grid">
                  <div className="card">
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