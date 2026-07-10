const clientIdInput = document.getElementById("client-id-input");
const allowlistInput = document.getElementById("allowlist-input");
const saveConfigButton = document.getElementById("save-config-btn");
const signOutButton = document.getElementById("sign-out-btn");
const configStatus = document.getElementById("config-status");
const configDetail = document.getElementById("config-detail");
const authStatus = document.getElementById("auth-status");
const googleSlot = document.getElementById("google-signin-slot");
const resultPanel = document.getElementById("result-panel");
const resultMessage = document.getElementById("result-message");
const profileList = document.getElementById("profile-list");

const STORAGE_KEY = "github-pages-test-google-gate";

const state = {
  clientId: "",
  allowlist: [],
  profile: null
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.clientId = String(parsed.clientId || "").trim();
    state.allowlist = Array.isArray(parsed.allowlist)
      ? parsed.allowlist.map(value => String(value).trim().toLowerCase()).filter(Boolean)
      : [];
  } catch (error) {
    console.error("Failed to load config", error);
  }
}

function saveConfig() {
  state.clientId = clientIdInput.value.trim();
  state.allowlist = allowlistInput.value
    .split(/\r?\n/)
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      clientId: state.clientId,
      allowlist: state.allowlist
    }));
  } catch (error) {
    console.error("Failed to save config", error);
    renderConfigStatus("Save failed", "danger");
    configDetail.textContent = "This browser blocked local storage, so the gate config was not saved.";
    return;
  }

  renderConfigStatus("Config saved", "success");
  configDetail.textContent = [
    `Client ID saved: ${state.clientId ? "Yes" : "No"}.`,
    `Approved emails saved: ${state.allowlist.length}.`,
    `Saved at ${new Date().toLocaleTimeString()}.`
  ].join(" ");
  renderGoogleButton();
}

function renderConfigStatus(message, tone = "") {
  configStatus.textContent = message;
  configStatus.className = "status";
  if (tone === "success") configStatus.classList.add("is-success");
  if (tone === "warning") configStatus.classList.add("is-warning");
  if (tone === "danger") configStatus.classList.add("is-danger");
}

function renderAuthStatus(message, tone = "") {
  authStatus.textContent = message;
  authStatus.className = "status";
  if (tone === "success") authStatus.classList.add("is-success");
  if (tone === "warning") authStatus.classList.add("is-warning");
  if (tone === "danger") authStatus.classList.add("is-danger");
}

function decodeJwtPayload(token) {
  const [, payload] = token.split(".");
  if (!payload) return null;
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(normalized);
  return JSON.parse(json);
}

function isApprovedEmail(profile) {
  const email = String(profile?.email || "").toLowerCase();
  return Boolean(email) && state.allowlist.includes(email);
}

function renderProfile(profile) {
  const rows = [
    ["Name", profile.name || "Unknown"],
    ["Email", profile.email || "Unknown"],
    ["Email Verified", profile.email_verified ? "Yes" : "No"],
    ["Google Subject", profile.sub || "Unknown"]
  ];
  profileList.innerHTML = rows.map(([label, value]) => (
    `<dt>${label}</dt><dd>${value}</dd>`
  )).join("");
}

function handleCredentialResponse(response) {
  try {
    const profile = decodeJwtPayload(response.credential);
    state.profile = profile;

    if (!profile?.email_verified) {
      resultPanel.hidden = false;
      resultMessage.textContent = "Google sign-in worked, but the email is not verified.";
      renderProfile(profile || {});
      renderAuthStatus("Signed in, but not allowed", "danger");
      return;
    }

    if (isApprovedEmail(profile)) {
      resultPanel.hidden = false;
      resultMessage.textContent = "Access allowed. This email is on the local allowlist.";
      renderProfile(profile);
      renderAuthStatus("Signed in and allowed", "success");
      return;
    }

    resultPanel.hidden = false;
    resultMessage.textContent = "Access denied. This email is not on the local allowlist.";
    renderProfile(profile || {});
    renderAuthStatus("Signed in, but denied", "warning");
  } catch (error) {
    console.error("Failed to process Google credential", error);
    renderAuthStatus("Sign-in failed", "danger");
  }
}

function renderGoogleButton() {
  googleSlot.innerHTML = "";

  if (!state.clientId) {
    renderConfigStatus("Enter a Google client ID first", "warning");
    renderAuthStatus("Waiting for Google client ID", "warning");
    return;
  }

  if (!window.google?.accounts?.id) {
    renderAuthStatus("Google script not loaded yet", "warning");
    return;
  }

  window.google.accounts.id.initialize({
    client_id: state.clientId,
    callback: handleCredentialResponse,
    auto_select: false,
    use_fedcm_for_prompt: true,
    cancel_on_tap_outside: true
  });

  window.google.accounts.id.renderButton(googleSlot, {
    theme: "outline",
    size: "large",
    shape: "pill",
    text: "signin_with",
    logo_alignment: "left",
    width: 280
  });

  renderAuthStatus("Ready for Google sign-in", "");
}

function resetSession() {
  state.profile = null;
  resultPanel.hidden = true;
  profileList.innerHTML = "";
  resultMessage.textContent = "";
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
  renderAuthStatus("Session cleared", "");
}

function hydrateForm() {
  clientIdInput.value = state.clientId;
  allowlistInput.value = state.allowlist.join("\n");
  renderConfigStatus(state.clientId ? "Loaded saved config" : "Config not saved", state.clientId ? "success" : "");
  configDetail.textContent = state.clientId
    ? `Loaded saved settings from this browser. Approved emails: ${state.allowlist.length}.`
    : "Saved settings stay in this browser.";
}

loadConfig();
hydrateForm();

saveConfigButton?.addEventListener("click", saveConfig);
signOutButton?.addEventListener("click", resetSession);

window.addEventListener("load", () => {
  renderGoogleButton();
});
