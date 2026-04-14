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
} from "lucide-react";
import "./App.css";

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

const stateMultipliers = {
  "Kuala Lumpur": 1.35,
  Selangor: 1.2,
  Penang: 1.12,
  Johor: 1.08,
  Perak: 0.9,
  "Negeri Sembilan": 0.92,
  Melaka: 0.95,
  Kedah: 0.88,
  Pahang: 0.9,
  Sabah: 0.97,
  Sarawak: 0.98,
};

const typeMultipliers = {
  Condominium: 1.1,
  Apartment: 0.9,
  "Terrace House": 1.0,
  "Semi-Detached": 1.3,
  Bungalow: 1.6,
  Townhouse: 1.05,
};

const tenureMultipliers = {
  Freehold: 1.08,
  Leasehold: 0.95,
};

const stateChart = [
  { label: "Kuala Lumpur", avg: 820000 },
  { label: "Selangor", avg: 690000 },
  { label: "Penang", avg: 640000 },
  { label: "Johor", avg: 590000 },
  { label: "Perak", avg: 430000 },
];

function currency(n) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(n || 0);
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
    state: "Selangor",
    type: "Condominium",
    tenure: "Freehold",
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
    if (!form.sqft || form.sqft < 200) errors.push("Built-up size should be at least 200 sqft.");
    if (!form.medianPsf || form.medianPsf < 50) errors.push("Median PSF should be at least RM50.");
    if (form.transactions < 1) errors.push("Transactions should be at least 1.");
    return errors;
  }, [form]);

  const estimatePrice = () => {
    if (validation.length) return;

    const base = form.sqft * form.medianPsf;
    const stateAdj = (stateMultipliers[form.state] - 1) * base;
    const typeAdj = (typeMultipliers[form.type] - 1) * base;
    const tenureAdj = (tenureMultipliers[form.tenure] - 1) * base;
    const marketAdj = Math.min(form.transactions, 50) * 3500;
    const total = Math.max(80000, base + stateAdj + typeAdj + tenureAdj + marketAdj);

    const contributions = [
      { label: "Built-up size and PSF", value: base },
      { label: "Location impact", value: stateAdj },
      { label: "Property type impact", value: typeAdj },
      { label: "Tenure impact", value: tenureAdj },
      { label: "Market demand activity", value: marketAdj },
    ];

    const sorted = [...contributions].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    const maxAbs = Math.max(...sorted.map((x) => Math.abs(x.value)));

    const stateAverage =
      stateChart.find((x) => x.label === form.state)?.avg ?? Math.round(total * 0.95);

    const comparisonPct = ((total - stateAverage) / stateAverage) * 100;

    let pricingLabel = "Fairly Priced";
    if (comparisonPct > 10) pricingLabel = "Premium Area Estimate";
    if (comparisonPct < -10) pricingLabel = "Value-Friendly Estimate";

    const baseGrowth =
      form.state === "Kuala Lumpur" ? 0.055 :
      form.state === "Selangor" ? 0.048 :
      form.state === "Penang" ? 0.045 :
      0.038;

    const futureTrend = [1, 2, 3, 4, 5].map((year) => ({
      year: `${year}Y`,
      value: Math.round(total * Math.pow(1 + baseGrowth, year)),
    }));

    setResult({
      predictedPrice: Math.round(total),
      estimatedRangeLow: Math.round(total * 0.93),
      estimatedRangeHigh: Math.round(total * 1.07),
      pricePerSqft: Math.round(total / form.sqft),
      confidence: form.transactions >= 15 ? "Higher confidence" : form.transactions >= 8 ? "Moderate confidence" : "Lower confidence",
      pricingLabel,
      stateAverage,
      comparisonPct,
      futureTrend,
      contributions: sorted.map((x) => ({
        ...x,
        width: Math.max(8, Math.round((Math.abs(x.value) / maxAbs) * 100)),
      })),
    });

    setActiveTab("predict");
  };

  const resetForm = () => {
    setForm({
      state: "Selangor",
      type: "Condominium",
      tenure: "Freehold",
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
              <motion.div key="dashboard" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <div className="section-head">
                  <div>
                    <h2>Overview Dashboard</h2>
                    <p>A polished landing dashboard for your Final Year Project web application.</p>
                  </div>
                  <button className="primary-btn" onClick={() => setActiveTab("predict")}>
                    Start Predicting <ChevronRight size={16} />
                  </button>
                </div>

                <div className="stats-grid">
                  <StatCard icon={Building2} label="System Type" value="ML Web App" sub="Interactive valuation platform" />
                  <StatCard icon={ShieldCheck} label="Deployment Scope" value="Local Prototype" sub="Ready for FYP demo" />
                  <StatCard icon={Brain} label="Core Capability" value="Price Prediction" sub="Malaysia-specific inputs" />
                  <StatCard icon={Layers3} label="Explainability" value="Feature View" sub="Simple SHAP-style UI" />
                </div>

                <div className="two-grid">
                  <div className="card">
                    <h3>Average Estimated Prices by State</h3>
                    <p className="muted">Professional dashboard card section for regional comparison.</p>
                    <MiniBarChart data={stateChart} />
                  </div>

                  <div className="card hero-card">
                    <div className="hero-icon">
                      <Sparkles size={24} />
                    </div>
                    <h3>RumahAI Intelligent Prediction System</h3>
                    <p className="hero-desc">
                      A machine learning-powered platform for estimating Malaysian house prices
                      with real-time inputs and explainable predictions.
                    </p>
                    <div className="hero-features">
                      <div>✔ Real-time price prediction</div>
                      <div>✔ Malaysia-focused dataset</div>
                      <div>✔ Explainable AI output</div>
                      <div>✔ Interactive web interface</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "predict" && (
              <motion.div key="predict" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
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
                    <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                      {states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <div className="form-grid">
                      <div>
                        <label>Property Type</label>
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                          {propertyTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label>Tenure</label>
                        <select value={form.tenure} onChange={(e) => setForm({ ...form, tenure: e.target.value })}>
                          {tenures.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-3">
                      <div>
                        <label>Built-up Size (sqft)</label>
                        <input type="number" value={form.sqft} onChange={(e) => setForm({ ...form, sqft: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label>Median PSF (RM)</label>
                        <input type="number" value={form.medianPsf} onChange={(e) => setForm({ ...form, medianPsf: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label>Transactions</label>
                        <input type="number" value={form.transactions} onChange={(e) => setForm({ ...form, transactions: Number(e.target.value) })} />
                      </div>
                    </div>

                    {validation.length > 0 && (
                      <div className="error-box">
                        {validation.map((err) => <div key={err}>• {err}</div>)}
                      </div>
                    )}

                    <div className="btn-row">
                      <button className="primary-btn" onClick={estimatePrice}>Get Estimate</button>
                      <button className="secondary-btn" onClick={resetForm}>Clear Form</button>
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
                              Likely range: {currency(result.estimatedRangeLow)} — {currency(result.estimatedRangeHigh)}
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
                              Compared with the average in {form.state}, this estimate is{" "}
                              <strong>
                                {result.comparisonPct >= 0 ? `${result.comparisonPct.toFixed(1)}% higher` : `${Math.abs(result.comparisonPct).toFixed(1)}% lower`}
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
                      <h3>Why this estimate?</h3>
                      {result ? (
                        <div className="chart-list">
                          {result.contributions.map((item) => (
                            <div key={item.label} className="chart-item">
                              <div className="chart-row">
                                <span>{item.label}</span>
                                <strong>
                                  {item.value >= 0 ? "+" : "-"}
                                  {currency(Math.abs(item.value))}
                                </strong>
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
              <motion.div key="trends" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <div className="section-head">
                  <div>
                    <h2>Market Trends & Future Outlook</h2>
                    <p>Simple graphs and trend visuals that are easier for normal users to understand.</p>
                  </div>
                </div>

                <div className="stats-grid">
                  <StatCard icon={TrendingUp} label="Expected 5-Year Outlook" value="Positive Growth" sub="Based on current estimate scenario" />
                  <StatCard icon={CircleDollarSign} label="Current State Average" value={currency(result?.stateAverage || 690000)} sub="Comparison baseline" />
                  <StatCard icon={MapPin} label="Selected State" value={form.state} sub="Used in estimate and outlook" />
                  <StatCard icon={Brain} label="Forecast Mode" value="Scenario Based" sub="Conservative long-term projection" />
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
              <motion.div key="about" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
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

                  <div className="card hero-card">
                    <div className="hero-icon">
                      <Sparkles size={24} />
                    </div>
                    <h3>Professional FYP Presentation UI</h3>
                    <p>
                      Use this section for your elevator pitch, methodology summary, or project importance.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
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