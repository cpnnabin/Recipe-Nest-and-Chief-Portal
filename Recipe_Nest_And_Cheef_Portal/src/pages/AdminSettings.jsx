import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/SideBar";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const defaultPreferences = {
  darkMode: false,
  compactLayout: false,
  weeklyDigest: true,
  commentModerationAlerts: true,
  emailNotifications: true,
  pushNotifications: false,
  language: "en",
  timezone: "Asia/Kathmandu",
};

const SETTINGS_STORAGE_KEY = "chifPortalSettings";

const parseStoredUser = () => {
  const rawUser = localStorage.getItem("loggedInUser");
  if (!rawUser) return {};

  try {
    return JSON.parse(rawUser);
  } catch {
    return { name: rawUser };
  }
};

export default function AdminSettings() {
  const token = localStorage.getItem("jwtToken");
  const storedUser = parseStoredUser();

  const [profile, setProfile] = useState({
    name: storedUser.name || storedUser.username || "",
    email: storedUser.email || "",
    phone: "",
    address: "",
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preferences, setPreferences] = useState(() => {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultPreferences;

    try {
      return { ...defaultPreferences, ...JSON.parse(raw) };
    } catch {
      return defaultPreferences;
    }
  });

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const securityScore = useMemo(() => {
    let score = 0;
    if (security.newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(security.newPassword)) score += 1;
    if (/[0-9]/.test(security.newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(security.newPassword)) score += 1;
    return score;
  }, [security.newPassword]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await response.json();
        const user = payload?.data?.user || payload?.user || payload?.data;

        if (payload?.success && user) {
          setProfile({
            name: user.name || storedUser.name || "",
            email: user.email || storedUser.email || "",
            phone: user.phone || "",
            address: user.address || "",
          });

          localStorage.setItem(
            "loggedInUser",
            JSON.stringify({
              name: user.name || "",
              username: user.username || user.name || "",
              email: user.email || "",
              role: user.role || localStorage.getItem("userRole") || "chief",
            })
          );
        }
      } catch (error) {
        console.error("Settings profile load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [storedUser.email, storedUser.name, token]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setMsg("Preferences saved");
    setErr("");
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setMsg("");
    setErr("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const payload = await res.json();

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || "Profile update failed");
      }

      const user = payload?.data?.user || payload?.user || payload?.data;
      if (user) {
        localStorage.setItem(
          "loggedInUser",
          JSON.stringify({
            name: user.name || profile.name,
            username: user.username || user.name || profile.name,
            email: user.email || profile.email,
            role: user.role || localStorage.getItem("userRole") || "chief",
          })
        );
      }

      setMsg("Profile updated successfully");
    } catch (error) {
      setErr(error.message || "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
      setErr("Please fill all password fields");
      setMsg("");
      return;
    }

    if (security.newPassword !== security.confirmPassword) {
      setErr("New password and confirm password do not match");
      setMsg("");
      return;
    }

    setPasswordSaving(true);
    setMsg("");
    setErr("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || "Password update failed");
      }

      setSecurity({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMsg("Password updated successfully");
    } catch (error) {
      setErr(error.message || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSignOutAll = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/users/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout notify error:", error);
    }

    localStorage.removeItem("jwtToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  return (
    <div className="admin-settings-page">
      <Sidebar />

      <main className="admin-settings-main">
        <header className="admin-settings-header">
          <div>
            <h1>Chif Portal Settings</h1>
            <p>Separate control center for profile, security, and platform preferences.</p>
          </div>
          <span className="admin-settings-chip">All Settings</span>
        </header>

        {loading ? (
          <div className="admin-settings-card">Loading settings...</div>
        ) : (
          <>
            {(msg || err) && (
              <div className={`admin-settings-alert ${err ? "is-error" : "is-success"}`}>
                {err || msg}
              </div>
            )}

            <section className="admin-settings-grid">
              <article className="admin-settings-card">
                <h2>Account Profile</h2>
                <p>Update your Chif identity details used across dashboard and analytics.</p>

                <label>Name</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                />

                <label>Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                />

                <label>Phone</label>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+977..."
                />

                <label>Address</label>
                <input
                  value={profile.address}
                  onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Your address"
                />

                <button type="button" onClick={handleSaveProfile} disabled={profileSaving}>
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
              </article>

              <article className="admin-settings-card">
                <h2>Security</h2>
                <p>Protect your account with strong credentials.</p>

                <label>Current Password</label>
                <div className="admin-settings-password-wrapper">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={security.currentPassword}
                    onChange={(e) => setSecurity((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Current password"
                  />
                  <button
                    type="button"
                    className="admin-settings-password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                <label>New Password</label>
                <div className="admin-settings-password-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={security.newPassword}
                    onChange={(e) => setSecurity((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="New password"
                  />
                  <button
                    type="button"
                    className="admin-settings-password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                <label>Confirm New Password</label>
                <div className="admin-settings-password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={security.confirmPassword}
                    onChange={(e) => setSecurity((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="admin-settings-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                <div className="admin-security-meter">
                  <span>Password strength</span>
                  <div className="admin-security-meter-bars">
                    {[1, 2, 3, 4].map((level) => (
                      <i
                        key={level}
                        className={securityScore >= level ? "active" : ""}
                      />
                    ))}
                  </div>
                </div>

                <button type="button" onClick={handleChangePassword} disabled={passwordSaving}>
                  {passwordSaving ? "Updating..." : "Change Password"}
                </button>
              </article>

              <article className="admin-settings-card">
                <h2>Notifications</h2>
                <p>Choose which updates you want from Chif Portal.</p>

                <div className="admin-settings-switch-list">
                  <label>
                    <span>Email Notifications</span>
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) => updatePreference("emailNotifications", e.target.checked)}
                    />
                  </label>
                  <label>
                    <span>Push Notifications</span>
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications}
                      onChange={(e) => updatePreference("pushNotifications", e.target.checked)}
                    />
                  </label>
                  <label>
                    <span>Weekly Digest</span>
                    <input
                      type="checkbox"
                      checked={preferences.weeklyDigest}
                      onChange={(e) => updatePreference("weeklyDigest", e.target.checked)}
                    />
                  </label>
                  <label>
                    <span>Comment Moderation Alerts</span>
                    <input
                      type="checkbox"
                      checked={preferences.commentModerationAlerts}
                      onChange={(e) => updatePreference("commentModerationAlerts", e.target.checked)}
                    />
                  </label>
                </div>
              </article>

              <article className="admin-settings-card">
                <h2>Portal Preferences</h2>
                <p>Customize your Chif Portal workspace experience.</p>

                <div className="admin-settings-switch-list">
                  <label>
                    <span>Dark Mode</span>
                    <input
                      type="checkbox"
                      checked={preferences.darkMode}
                      onChange={(e) => updatePreference("darkMode", e.target.checked)}
                    />
                  </label>
                  <label>
                    <span>Compact Layout</span>
                    <input
                      type="checkbox"
                      checked={preferences.compactLayout}
                      onChange={(e) => updatePreference("compactLayout", e.target.checked)}
                    />
                  </label>
                </div>

                <label>Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => updatePreference("language", e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="ne">Nepali</option>
                </select>

                <label>Timezone</label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => updatePreference("timezone", e.target.value)}
                >
                  <option value="Asia/Kathmandu">Asia/Kathmandu</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                </select>

                <button type="button" className="ghost" onClick={() => setPreferences(defaultPreferences)}>
                  Reset Preferences
                </button>
              </article>
            </section>

            <section className="admin-settings-danger-zone">
              <h2>Session Controls</h2>
              <p>Sign out from this account securely when you finish management tasks.</p>
              <button type="button" onClick={handleSignOutAll}>Logout from Chif Portal</button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
