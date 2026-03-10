const storageKey = "lis_mobile_data_v1";
const settingsKey = "lis_feature_toggles_v1";
let sessionTimer;

const defaultSettings = {
  abnormalHighlight: true,
  keyboardShortcuts: true,
  previousComparison: true,
  historyTimeline: true,
  commentsSection: true,
  trendGraphs: true,
  dataExport: true,
  smartDashboard: true,
  analyzerIntegration: false,
  inventorySystem: false,
  cloudBackup: false,
};

const defaultData = {
  doctors: [
    { name: "Dr. Sharma", hospital: "City Clinic", contact: "9000000011", address: "Central Road" },
    { name: "Dr. Khan", hospital: "Metro Hospital", contact: "9000000042", address: "Lake Street" },
  ],
  panels: {
    "Fever Profile": ["CBC", "Widal", "Dengue"],
    "Diabetes Profile": ["Blood glucose", "HbA1c"],
    "Liver Profile": ["LFT"],
  },
  tests: {
    "CBC": { unit: "", range: "panel", low: 0, high: 0 },
    "Hemoglobin": { unit: "g/dL", range: "13-17", low: 13, high: 17 },
    "RBC": { unit: "M/µL", range: "4.5-5.9", low: 4.5, high: 5.9 },
    "HCT": { unit: "%", range: "40-52", low: 40, high: 52 },
    "MCV": { unit: "fL", range: "80-100", low: 80, high: 100 },
    "MCH": { unit: "pg", range: "27-33", low: 27, high: 33 },
    "MCHC": { unit: "g/dL", range: "32-36", low: 32, high: 36 },
    "Blood glucose": { unit: "mg/dL", range: "70-110", low: 70, high: 110 },
    "HbA1c": { unit: "%", range: "4-5.6", low: 4, high: 5.6 },
    "Cholesterol": { unit: "mg/dL", range: "125-200", low: 125, high: 200 },
    "Creatinine": { unit: "mg/dL", range: "0.6-1.2", low: 0.6, high: 1.2 },
    "Potassium": { unit: "mmol/L", range: "3.5-5.2", low: 3.5, high: 5.2 },
    "LFT": { unit: "", range: "panel", low: 0, high: 0 },
    "Widal": { unit: "", range: "Negative", low: 0, high: 0 },
    "Dengue": { unit: "", range: "Negative", low: 0, high: 0 },
  },
  patients: [],
  reports: [],
  inventory: [
    { item: "EDTA Tubes", stock: 20 },
    { item: "Syringes", stock: 150 },
    { item: "Glucose Reagent", stock: 8 },
  ],
};

let db = loadData();
let feature = loadSettings();
let role = "";
let currentTests = [];

function loadData() {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : structuredClone(defaultData);
}
function saveData() { localStorage.setItem(storageKey, JSON.stringify(db)); renderAll(); }
function loadSettings() { return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(settingsKey) || "{}")) }; }
function saveSettings() { localStorage.setItem(settingsKey, JSON.stringify(feature)); applyFeatureToggles(); }
function makeId() { return `P${Date.now().toString().slice(-8)}`; }
function nowDate() { return new Date().toISOString().slice(0, 10); }

function setup() {
  document.getElementById("loginBtn").onclick = login;
  document.getElementById("savePatientBtn").onclick = savePatient;
  document.getElementById("loadPanelBtn").onclick = loadPanel;
  document.getElementById("saveReportBtn").onclick = saveReport;
  document.getElementById("printReportBtn").onclick = () => window.print();
  document.getElementById("drawTrendBtn").onclick = drawTrend;
  document.getElementById("searchReprintBtn").onclick = searchReprints;
  document.querySelectorAll(".exportBtn").forEach(b => b.onclick = exportData);
  document.getElementById("patientDate").value = nowDate();
  document.getElementById("patientId").value = makeId();
  bindKeyboardShortcuts();
  renderTabs();
  renderAll();
  monitorOffline();
}

function monitorOffline() {
  const sync = document.getElementById("syncStatus");
  const paint = () => sync.textContent = navigator.onLine ? "Online" : "Offline mode";
  window.addEventListener("online", paint);
  window.addEventListener("offline", paint);
  paint();
}

function login() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPassword").value;
  role = document.getElementById("loginRole").value;
  if (!user || !pass) return alert("Enter credentials");
  document.getElementById("loginCard").classList.add("hidden");
  document.getElementById("workspace").classList.remove("hidden");
  document.getElementById("sessionInfo").classList.remove("hidden");
  document.getElementById("sessionInfo").textContent = `${role}: ${user}`;
  startSessionTimeout();
  applyRoleAccess();
}

function startSessionTimeout() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    alert("Session timed out");
    location.reload();
  }, 15 * 60 * 1000);
  ["click", "keydown"].forEach(evt => window.addEventListener(evt, () => {
    clearTimeout(sessionTimer);
    startSessionTimeout();
  }, { once: true }));
}

function applyRoleAccess() {
  if (role !== "Admin") document.getElementById("settings").classList.add("hidden");
  if (role === "Doctor") {
    ["resultEntry", "registration", "export"].forEach(v => document.querySelector(`[data-view='${v}']`)?.classList.add("hidden"));
  }
}

function renderTabs() {
  const views = [
    ["dashboard", "Dashboard"], ["registration", "Patients"], ["resultEntry", "Results"], ["history", "History"],
    ["trend", "Trends"], ["reprint", "Reprint"], ["export", "Export"], ["settings", "Settings"]
  ];
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = "";
  views.forEach(([id, label], i) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.dataset.view = id;
    if (i === 0) b.classList.add("active");
    b.onclick = () => {
      document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
      document.getElementById(id).classList.remove("hidden");
      document.querySelectorAll(".tabs button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
    };
    tabs.appendChild(b);
  });
}

function renderAll() {
  renderDoctorList();
  renderPatientSelects();
  renderPanelSelect();
  renderDashboard();
  renderTimeline();
  renderReprintList(db.reports);
  renderToggles();
  applyFeatureToggles();
}

function renderDoctorList() {
  const sel = document.getElementById("patientDoctor");
  sel.innerHTML = db.doctors.map(d => `<option>${d.name} - ${d.hospital}</option>`).join("");
}
function renderPatientSelects() {
  const options = db.patients.map(p => `<option value="${p.id}">${p.id} - ${p.name}</option>`).join("");
  ["resultPatient", "historyPatient", "trendPatient"].forEach(id => document.getElementById(id).innerHTML = options);
}
function renderPanelSelect() {
  document.getElementById("panelSelect").innerHTML = Object.keys(db.panels).map(p => `<option>${p}</option>`).join("");
}

function savePatient() {
  const p = {
    id: document.getElementById("patientId").value,
    name: document.getElementById("patientName").value,
    age: +document.getElementById("patientAge").value,
    sex: document.getElementById("patientSex").value,
    phone: document.getElementById("patientPhone").value,
    address: document.getElementById("patientAddress").value,
    doctor: document.getElementById("patientDoctor").value,
    date: document.getElementById("patientDate").value,
  };
  if (!p.name || !p.age) return alert("Fill required fields");
  db.patients.unshift(p);
  document.getElementById("patientForm").reset();
  document.getElementById("patientDate").value = nowDate();
  document.getElementById("patientId").value = makeId();
  saveData();
}

function loadPanel() {
  const panel = document.getElementById("panelSelect").value;
  currentTests = [...db.panels[panel]];
  if (currentTests.includes("CBC")) currentTests.push("Hemoglobin", "RBC", "HCT", "Potassium", "Blood glucose");
  renderResultRows();
}

function previousResultFor(patientId, test) {
  const rep = db.reports.find(r => r.patientId === patientId && r.results[test] !== undefined);
  return rep ? rep.results[test] : "-";
}

function renderResultRows() {
  const pid = document.getElementById("resultPatient").value;
  const body = document.getElementById("resultTableBody");
  body.innerHTML = "";
  currentTests.forEach((t, idx) => {
    const meta = db.tests[t] || { unit: "", range: "", low: 0, high: 0 };
    const tr = document.createElement("tr");
    const prev = feature.previousComparison ? previousResultFor(pid, t) : "Feature OFF";
    tr.innerHTML = `<td>${t}</td><td><input data-test="${t}" class="resultInput" /></td><td>${prev}</td><td>${meta.unit}</td><td>${meta.range}</td><td class="flagCell"></td>`;
    body.appendChild(tr);
    const input = tr.querySelector("input");
    input.oninput = () => {
      checkAbnormal(input, meta, tr.querySelector(".flagCell"));
      autoMoveToNext(idx);
      cbcAutocalc();
      criticalAlerts();
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        focusNextResult(idx);
      }
    };
  });
}

function checkAbnormal(input, meta, flagCell) {
  const val = +input.value;
  if (!feature.abnormalHighlight || Number.isNaN(val) || !meta.low) {
    input.classList.remove("abnormal");
    flagCell.textContent = "";
    return;
  }
  if (val < meta.low) { input.classList.add("abnormal"); flagCell.textContent = "L"; flagCell.className = "flagCell flag"; }
  else if (val > meta.high) { input.classList.add("abnormal"); flagCell.textContent = "H"; flagCell.className = "flagCell flag"; }
  else { input.classList.remove("abnormal"); flagCell.textContent = ""; }
}

function focusNextResult(idx) {
  const all = [...document.querySelectorAll(".resultInput")];
  all[idx + 1]?.focus();
}
function autoMoveToNext(idx) {
  const all = [...document.querySelectorAll(".resultInput")];
  if (all[idx].value.length >= 1) all[idx + 1]?.focus();
}

function bindKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (!feature.keyboardShortcuts) return;
    if (e.ctrlKey && e.key.toLowerCase() === "s") { e.preventDefault(); saveReport(); }
    if (e.ctrlKey && e.key.toLowerCase() === "p") { e.preventDefault(); window.print(); }
  });
}

function collectResults() {
  const results = {};
  document.querySelectorAll(".resultInput").forEach(i => results[i.dataset.test] = i.value);
  return results;
}

function cbcAutocalc() {
  const v = collectResults();
  const hb = +v["Hemoglobin"], hct = +v["HCT"], rbc = +v["RBC"];
  if ([hb, hct, rbc].some(Number.isNaN) || rbc === 0) return;
  v["MCV"] = ((hct * 10) / rbc).toFixed(1);
  v["MCH"] = ((hb * 10) / rbc).toFixed(1);
  v["MCHC"] = ((hb * 100) / hct).toFixed(1);
  const morph = morphology(v["MCV"], v["MCHC"]);
  document.getElementById("cbcInterpretation").textContent = `CBC Auto-calculated: MCV ${v["MCV"]}, MCH ${v["MCH"]}, MCHC ${v["MCHC"]} | ${morph}`;
}

function morphology(mcv, mchc) {
  if (mcv < 80 && mchc < 32) return "Microcytic hypochromic";
  if (mcv > 100) return "Macrocytic anemia";
  return "Normocytic normochromic";
}

function criticalAlerts() {
  const v = collectResults();
  const messages = [];
  if (+v["Hemoglobin"] < 5) messages.push("Hb < 5");
  if (+v["Potassium"] > 6.5) messages.push("Potassium > 6.5");
  if (+v["Blood glucose"] > 400) messages.push("Glucose > 400");
  const box = document.getElementById("criticalAlert");
  if (messages.length) {
    box.classList.remove("hidden");
    box.textContent = `Critical value alert: ${messages.join(", ")}`;
  } else box.classList.add("hidden");
}

function saveReport() {
  const patientId = document.getElementById("resultPatient").value;
  if (!patientId) return alert("Select patient");
  const report = {
    id: `R${Date.now().toString().slice(-8)}`,
    patientId,
    date: nowDate(),
    results: collectResults(),
    comments: document.getElementById("resultComments").value,
    paymentMethod: "Cash",
    revenue: 500,
  };
  db.reports.unshift(report);
  saveData();
  alert("Report saved");
}

function renderTimeline() {
  const pid = document.getElementById("historyPatient").value;
  const list = document.getElementById("timeline");
  const rows = db.reports.filter(r => r.patientId === pid).sort((a, b) => b.date.localeCompare(a.date));
  list.innerHTML = rows.map(r => `<li><strong>${r.date}</strong> - Report ${r.id}<br/><button onclick="reprintById('${r.id}')">Open report</button></li>`).join("") || "<li>No history</li>";
}

function reprintById(id) {
  const r = db.reports.find(x => x.id === id);
  if (!r) return;
  const content = `Report ${r.id}\nPatient ${r.patientId}\n${Object.entries(r.results).map(([k,v]) => `${k}: ${v}`).join("\n")}\nComments: ${r.comments}`;
  const w = window.open("", "_blank");
  w.document.write(`<pre>${content}</pre><p>Reprint mode (read-only)</p>`);
  w.print();
}
window.reprintById = reprintById;

function searchReprints() {
  const q = document.getElementById("reprintSearch").value.toLowerCase();
  const patientIds = db.patients.filter(p => `${p.id} ${p.name}`.toLowerCase().includes(q)).map(p => p.id);
  const hits = db.reports.filter(r => patientIds.includes(r.patientId));
  renderReprintList(hits);
}
function renderReprintList(rows) {
  const ul = document.getElementById("reprintList");
  ul.innerHTML = rows.map(r => `<li>${r.id} | ${r.patientId} | ${r.date} <button onclick="reprintById('${r.id}')">Reprint</button></li>`).join("") || "<li>No reports</li>";
}

function exportData(e) {
  if (role !== "Admin") return alert("Admin only");
  const format = e.target.dataset.format;
  const kind = document.getElementById("exportType").value;
  const lines = ["reportId,patientId,date,revenue", ...db.reports.map(r => `${r.id},${r.patientId},${r.date},${r.revenue}`)];
  if (format === "pdf") {
    const w = window.open("", "_blank");
    w.document.write(`<h2>${kind} export</h2><pre>${lines.join("\n")}</pre>`);
    w.print();
    return;
  }
  const ext = format === "excel" ? "xls" : "csv";
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${kind}.${ext}`;
  a.click();
}

function renderDashboard() {
  const today = nowDate();
  const todayReports = db.reports.filter(r => r.date === today);
  const kpis = {
    "Total patients today": db.patients.filter(p => p.date === today).length,
    "Pending reports": Math.max(db.patients.length - db.reports.length, 0),
    "Completed reports": db.reports.length,
    "Critical value alerts": db.reports.filter(r => (+r.results["Hemoglobin"] < 5) || (+r.results["Potassium"] > 6.5) || (+r.results["Blood glucose"] > 400)).length,
    "Daily revenue": todayReports.reduce((t, r) => t + (r.revenue || 0), 0),
  };
  document.getElementById("dashboardCards").innerHTML = Object.entries(kpis).map(([k,v]) => `<div class='kpi'><div>${k}</div><div class='v'>${v}</div></div>`).join("");
  document.getElementById("recentPatients").innerHTML = db.patients.slice(0, 5).map(p => `<li>${p.id} | ${p.name} | ${p.date}</li>`).join("") || "<li>No patients</li>";
}

function drawTrend() {
  const pid = document.getElementById("trendPatient").value;
  const test = document.getElementById("trendTest").value;
  const rows = db.reports.filter(r => r.patientId === pid && r.results[test]).reverse();
  const c = document.getElementById("trendCanvas");
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#1f4b99";
  ctx.beginPath();
  rows.forEach((r, i) => {
    const x = 20 + i * ((c.width - 40) / Math.max(rows.length - 1, 1));
    const y = c.height - 20 - (+r.results[test] || 0) * 2;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    ctx.fillStyle = "#b00020";
    ctx.fillText(r.results[test], x - 5, y - 4);
  });
  ctx.stroke();
  ctx.fillStyle = "#222";
  ctx.fillText(`${test} trend`, 10, 12);
}

function renderToggles() {
  const panel = document.getElementById("togglePanel");
  panel.innerHTML = "";
  Object.keys(defaultSettings).forEach(k => {
    const lbl = document.createElement("label");
    lbl.innerHTML = `<input type='checkbox' data-key='${k}' ${feature[k] ? "checked" : ""}/> ${k}`;
    panel.appendChild(lbl);
  });
  panel.querySelectorAll("input").forEach(i => i.onchange = () => {
    feature[i.dataset.key] = i.checked;
    saveSettings();
  });
  document.getElementById("cloudSyncToggle").checked = feature.cloudBackup;
  document.getElementById("cloudSyncToggle").onchange = (e) => {
    feature.cloudBackup = e.target.checked;
    saveSettings();
    if (feature.cloudBackup) alert("Supabase sync can be connected with project URL + anon key.");
  };
}

function applyFeatureToggles() {
  document.getElementById("commentsWrap").classList.toggle("hidden", !feature.commentsSection);
  document.getElementById("history").classList.toggle("hidden", !feature.historyTimeline && document.querySelector(".tabs button.active")?.dataset.view === "history");
  document.getElementById("trend").classList.toggle("hidden", !feature.trendGraphs && document.querySelector(".tabs button.active")?.dataset.view === "trend");
  document.getElementById("export").classList.toggle("hidden", !feature.dataExport && document.querySelector(".tabs button.active")?.dataset.view === "export");
  if (currentTests.length) renderResultRows();
}

["historyPatient"].forEach(id => document.addEventListener("change", (e) => {
  if (e.target.id === id) renderTimeline();
}));

document.addEventListener("DOMContentLoaded", setup);
