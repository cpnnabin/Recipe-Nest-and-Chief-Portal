import { useEffect, useMemo, useState } from "react";
import {Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import Sidebar from "../components/SideBar";
import { getAdminAnalytics } from "../services/api";
import "../styles/AdminAnalytics.css";

const defaultAnalytics = {
  title: "ChifPortal",
  subtitle: "Analytics",
  description: "Detailed analytics and insights",
  adminName: "Admin User",
  adminEmail: "admin@recipenest.com",
  month: "Feb",
  monthlyGrowth: [
    { label: "Jan", recipes: 900, users: 550, reviews: 300 },
    { label: "Feb", recipes: 1400, users: 1050, reviews: 700 },
    { label: "Mar", recipes: 1200, users: 900, reviews: 500 },
    { label: "Apr", recipes: 1500, users: 1150, reviews: 850 },
    { label: "May", recipes: 1700, users: 1280, reviews: 920 },
    { label: "Jun", recipes: 1800, users: 1400, reviews: 960 },
  ],
  metrics: [
    { id: "recipes", value: "1400", label: "Recipes" },
    { id: "categories", value: "1050", label: "Categories" },
    { id: "users", value: "700", label: "Users" },
  ],
  insights: [
    { id: "rating", value: "4.7", label: "Avg. Recipe Rating", note: "↑ 0.3 from last month" },
    { id: "retention", value: "78%", label: "User Retention", note: "↑ 5% from last month" },
    { id: "time", value: "12m", label: "Avg. Time on Site", note: "↑ 2m from last month" },
    { id: "bounce", value: "23%", label: "Bounce Rate", note: "↑ 1% from last month" },
  ],
  engagement: {
    max: 60000,
    ticks: [0, 15000, 30000, 45000, 60000],
    series: [
      { label: "Recipe Saves", value: 60000 },
      { label: "Shares", value: 45000 },
      { label: "Reviews Posted", value: 30000 },
    ],
  },
  distribution: [
    { label: "Mobile", value: "62%" },
    { label: "Tablet", value: "10%" },
    { label: "Desktop", value: "28%" },
  ],
};

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(defaultAnalytics);
  const [loading, setLoading] = useState(true);

  const rawUser = localStorage.getItem("loggedInUser");
  let parsedUser = null;
  let legacyUserName = "";

  try {
    parsedUser = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    legacyUserName = rawUser || "";
  }

  const dynamicAdminName = parsedUser?.name || parsedUser?.fullName || parsedUser?.username || legacyUserName || defaultAnalytics.adminName;
  const dynamicAdminEmail = parsedUser?.email || defaultAnalytics.adminEmail;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAdminAnalytics();
        const payload = res?.data || defaultAnalytics;
        setAnalytics({
          ...payload,
          adminName: payload?.adminName || dynamicAdminName,
          adminEmail: payload?.adminEmail || dynamicAdminEmail,
        });
      } catch (error) {
        console.error("Failed to fetch analytics, using defaults:", error);
        setAnalytics({
          ...defaultAnalytics,
          adminName: dynamicAdminName,
          adminEmail: dynamicAdminEmail,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dynamicAdminEmail, dynamicAdminName]);

  const growthData = useMemo(() => analytics.monthlyGrowth || [], [analytics.monthlyGrowth]);
  const engagementData = useMemo(() => analytics.engagement?.series || [], [analytics.engagement]);

  return (
    <div className="admin-analytics-page">
      <Sidebar />

      <main className="admin-analytics-main">
        <div className="admin-analytics-top-row">
          <div>
            <h1 className="admin-analytics-title">{analytics.title}</h1>
            <p className="admin-analytics-subtitle">{analytics.description}</p>
          </div>
          <div className="admin-analytics-admin-block">
            <div className="admin-analytics-admin-name">{analytics.adminName}</div>
            <div>{analytics.adminEmail}</div>
            <span className="admin-analytics-month-chip">{analytics.month}</span>
          </div>
        </div>

        <div className="admin-analytics-card">
          <h2 className="admin-analytics-card-title">Monthly Growth Trends</h2>
          <div className="admin-analytics-chart-wrap">
            <ResponsiveContainer>
              <LineChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="recipes" stroke="#2563EB" strokeWidth={2.2} dot={{ r: 3 }} name="Recipes" />
                <Line type="monotone" dataKey="users" stroke="#14B8A6" strokeWidth={2.2} dot={{ r: 3 }} name="Users" />
                <Line type="monotone" dataKey="reviews" stroke="#8B5CF6" strokeWidth={2.2} dot={{ r: 3 }} name="Reviews" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-analytics-metrics-row">
          {(analytics.metrics || []).map((metric) => (
            <article key={metric.id} className="admin-analytics-metric-item">
              <p className="admin-analytics-metric-value">{metric.value}</p>
              <p className="admin-analytics-metric-label">{metric.label}</p>
            </article>
          ))}
        </div>

        <div className="admin-analytics-insight-grid">
          {(analytics.insights || []).map((insight) => (
            <article key={insight.id} className="admin-analytics-insight-card">
              <p className="admin-analytics-insight-label">{insight.label}</p>
              <p className="admin-analytics-insight-value">{insight.value}</p>
              <p className="admin-analytics-insight-note">{insight.note}</p>
            </article>
          ))}
        </div>

        <div className="admin-analytics-bottom-grid">
          <section className="admin-analytics-card">
            <h2 className="admin-analytics-card-title">User Engagement</h2>
            <div className="admin-analytics-bar-wrap">
              <ResponsiveContainer>
                <BarChart data={engagementData} margin={{ top: 10, right: 8, left: 0, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    domain={[0, analytics.engagement?.max || 60000]}
                    ticks={analytics.engagement?.ticks || [0, 15000, 30000, 45000, 60000]}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="admin-analytics-card">
            <h2 className="admin-analytics-card-title">User Role Distribution</h2>
            <ul className="admin-analytics-distribution-list">
              {(analytics.distribution || []).map((item) => (
                <li key={item.label} className="admin-analytics-distribution-item">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </li>
              ))}
            </ul>
            <p className="admin-analytics-note">
              Settings and Logout are available in the left menu.
            </p>
          </section>
        </div>

        {loading && (
          <p className="admin-analytics-loading">
            Loading latest analytics...
          </p>
        )}
      </main>
    </div>
  );
}