const masterStorageKey = "lis-master-data-v1";
const defaults = {
  tests: [
    { name: "Hemoglobin", department: "Hematology", units: "g/dL", maleRange: "13-17", femaleRange: "12-15", pediatricRange: "11-14", criticalLow: "7", criticalHigh: "20", price: "8" },
    { name: "Fasting Glucose", department: "Biochemistry", units: "mg/dL", maleRange: "70-99", femaleRange: "70-99", pediatricRange: "70-100", criticalLow: "50", criticalHigh: "400", price: "10" }
  ],
  formulas: [
    { name: "MCV", expression: "(HCT * 10) / RBC", linkedTest: "CBC" },
    { name: "MCH", expression: "(Hb * 10) / RBC", linkedTest: "CBC" }
  ],
  panels: [
    { name: "Fever Panel", tests: "CBC, Widal, Dengue" },
    { name: "Diabetes Panel", tests: "Fasting Glucose, HbA1c" }
  ],
  doctors: [
    { name: "Dr. Sophia Carter", qualification: "MD Pathology", clinic: "City Care", contact: "+1-555-1020" }
  ],
  departments: [{ name: "Hematology" }, { name: "Biochemistry" }, { name: "Serology" }],
  inventory: [
    { name: "EDTA Tubes", stock: "150", lowAlert: "40" },
    { name: "Test Kits", stock: "50", lowAlert: "15" }
  ],
  features: {
    analyzerIntegration: true,
    abnormalHighlighting: true,
    trendGraphs: true,
    inventoryModule: true,
    cloudBackup: false,
    keyboardShortcuts: false,
    commentsSection: true
  },
  template: {
    headerEnabled: true,
    footerEnabled: true,
    startLine: "4",
    labName: "Central Diagnostic Laboratory",
    address: "123 Health Avenue, Metro City",
    phone: "+1-555-900-1000",
    email: "info@centrallab.example",
    registration: "REG-2026-LIS-009",
    doctorName: "Dr. Sophia Carter",
    doctorQualification: "MD Pathology",
    technicianName: "Alex Morgan",
    logos: [],
    doctorSignature: "",
    techSignature: ""
  }
};
let data = loadMasterData();
let editState = {};
function loadMasterData() {
  const raw = localStorage.getItem(masterStorageKey);
  return raw ? JSON.parse(raw) : structuredClone(defaults);
}
function saveMasterData() {
  localStorage.setItem(masterStorageKey, JSON.stringify(data));
}
function toDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}
function bindCrud(formId, key, fields, tableId) {
  const form = document.getElementById(formId);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const record = Object.fromEntries(fields.map((f) => [f, formData.get(f) || ""]));
    if (editState[key] !== undefined) {
      data[key][editState[key]] = record;
      editState[key] = undefined;
    } else {
      data[key].push(record);
    }
    saveMasterData();
    form.reset();
    renderTable(key, tableId, fields);
    renderReport();
  });
  renderTable(key, tableId, fields);
}
function renderTable(key, tableId, fields) {
  const container = document.getElementById(tableId);
  container.innerHTML = "";
  if (!data[key].length) return;
  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  const table = document.createElement("table");
  const head = document.createElement("tr");
  fields.forEach((f) => {
    const th = document.createElement("th");
    th.textContent = f;
    head.appendChild(th);
  });
  const act = document.createElement("th");
  act.textContent = "Actions";
  head.appendChild(act);
  table.appendChild(head);
  data[key].forEach((row, idx) => {
    const tr = document.createElement("tr");
    fields.forEach((f) => {
      const td = document.createElement("td");
      td.textContent = row[f] || "";
      tr.appendChild(td);
    });
    const tdA = document.createElement("td");
    tdA.innerHTML = `<span class="action" data-edit="${idx}">Edit</span><span class="action" data-del="${idx}">Delete</span>`;
    tdA.addEventListener("click", (e) => {
      const { edit, del } = e.target.dataset;
      if (edit !== undefined) {
        editState[key] = Number(edit);
        const form = document.getElementById(`${key.slice(0, -1)}Form`) || document.getElementById(`${key}Form`);
        if (form) {
          fields.forEach((f) => form.elements[f] && (form.elements[f].value = data[key][edit][f] || ""));
        }
      }
      if (del !== undefined) {
        data[key].splice(Number(del), 1);
        saveMasterData();
        renderTable(key, tableId, fields);
        renderReport();
      }
    });
    tr.appendChild(tdA);
    table.appendChild(tr);
  });
  tableWrap.appendChild(table);
  container.appendChild(tableWrap);
}
function parseRange(rangeText) {
  if (!rangeText || !rangeText.includes("-")) return null;
  const [min, max] = rangeText.split("-").map(Number);
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return { min, max };
}
function isAbnormal(result, range, criticalLow, criticalHigh) {
  const r = Number(result);
  if (Number.isNaN(r)) return false;
  const rg = parseRange(range);
  if (rg && (r < rg.min || r > rg.max)) return true;
  if (criticalLow && r < Number(criticalLow)) return true;
  if (criticalHigh && r > Number(criticalHigh)) return true;
  return false;
}
async function initTemplateForm() {
  const form = document.getElementById("templateForm");
  Object.entries(data.template).forEach(([k, v]) => {
    if (!form.elements[k]) return;
    if (form.elements[k].type === "checkbox") form.elements[k].checked = !!v;
    else if (form.elements[k].type !== "file") form.elements[k].value = v;
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    data.template.headerEnabled = !!fd.get("headerEnabled");
    data.template.footerEnabled = !!fd.get("footerEnabled");
    data.template.startLine = fd.get("startLine");
    ["labName", "address", "phone", "email", "registration", "doctorName", "doctorQualification", "technicianName"].forEach((k) => {
      data.template[k] = fd.get(k) || "";
    });
    const logos = form.elements.logos.files;
    if (logos.length) {
      data.template.logos = await Promise.all([...logos].map(toDataUrl));
    }
    const docSig = form.elements.doctorSignature.files[0];
    if (docSig) data.template.doctorSignature = await toDataUrl(docSig);
    const techSig = form.elements.techSignature.files[0];
    if (techSig) data.template.techSignature = await toDataUrl(techSig);
    saveMasterData();
    renderReport();
  });
}
function initFeatureForm() {
  const form = document.getElementById("featureForm");
  Object.entries(data.features).forEach(([k, v]) => {
    if (form.elements[k]) form.elements[k].checked = !!v;
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    Object.keys(data.features).forEach((k) => {
      data.features[k] = !!form.elements[k].checked;
    });
    saveMasterData();
    renderReport();
  });
}
function renderReport() {
  const t = data.template;
  const headerEl = document.getElementById("reportHeader");
  const contentEl = document.getElementById("reportContent");
  const footerEl = document.getElementById("reportFooter");
  headerEl.style.display = t.headerEnabled ? "block" : "none";
  footerEl.style.display = t.footerEnabled ? "block" : "none";
  headerEl.innerHTML = `
    <div class="header-row">
      <div class="logo-strip">
        ${(t.logos || []).map((logo) => `<img src="${logo}" alt="Lab logo" />`).join("") || "<strong>Logos</strong>"}
      </div>
      <div class="lab-info">
        <h2>${t.labName}</h2>
        <p>${t.address}</p>
        <p>Phone: ${t.phone} | Email: ${t.email}</p>
        <p>Registration: ${t.registration}</p>
      </div>
      <div class="meta-box">
        <div><strong>Consultant:</strong> ${t.doctorName}</div>
        <div>${t.doctorQualification}</div>
        <div><strong>Technician:</strong> ${t.technicianName}</div>
      </div>
    </div>
  `;
  const results = data.tests.slice(0, 8).map((test, idx) => {
    const baseRange = test.maleRange || test.femaleRange || test.pediatricRange || "-";
    const parsed = parseRange(baseRange);
    const simulated = parsed ? (idx % 2 ? parsed.max + 1 : (parsed.min + parsed.max) / 2) : 0;
    const abnormal = data.features.abnormalHighlighting && isAbnormal(simulated, baseRange, test.criticalLow, test.criticalHigh);
    return `
      <tr>
        <td>${test.name}</td>
        <td class="${abnormal ? "abnormal" : ""}">${Number(simulated).toFixed(1)}</td>
        <td>${test.units || "-"}</td>
        <td>${baseRange}</td>
      </tr>
    `;
  }).join("");
  contentEl.className = `report-content start-line-${t.startLine}`;
  contentEl.innerHTML = `
    <div class="patient-grid">
      <div><strong>Patient:</strong> John Doe</div>
      <div><strong>Age/Gender:</strong> 42 / Male</div>
      <div><strong>Report ID:</strong> LIS-240010</div>
      <div><strong>Ref. Doctor:</strong> ${t.doctorName}</div>
      <div><strong>Collection Date:</strong> 2026-03-10</div>
      <div><strong>Department:</strong> Multi-Department</div>
    </div>
    <h4 class="section-title">Laboratory Test Results</h4>
    <table class="result-table">
      <thead>
        <tr>
          <th>Test Name</th>
          <th>Result</th>
          <th>Units</th>
          <th>Reference Range</th>
        </tr>
      </thead>
      <tbody>${results}</tbody>
    </table>
  `;
  const qrData = encodeURIComponent(`verify: LIS-240010 | ${t.labName}`);
  footerEl.innerHTML = `
    <div class="footer-grid">
      <div class="sig">
        ${t.techSignature ? `<img src="${t.techSignature}" alt="Technician Signature" />` : ""}
        <div><strong>Technician:</strong> ${t.technicianName}</div>
        <div>Checked by</div>
      </div>
      <div class="sig">
        ${t.doctorSignature ? `<img src="${t.doctorSignature}" alt="Doctor Signature" />` : ""}
        <div><strong>${t.doctorName}</strong></div>
        <div>${t.doctorQualification}</div>
      </div>
      <div class="qr">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${qrData}" alt="Verification QR" />
        <div>Scan to verify report</div>
      </div>
    </div>
    <div class="disclaimer">Disclaimer: Results should be interpreted by a qualified clinician in correlation with clinical findings.</div>
    <div>${t.address} | ${t.phone} | ${t.email}</div>
  `;
}
function initialize() {
  bindCrud("testForm", "tests", ["name", "department", "units", "maleRange", "femaleRange", "pediatricRange", "criticalLow", "criticalHigh", "price"], "testMasterTable");
  bindCrud("formulaForm", "formulas", ["name", "expression", "linkedTest"], "formulaTable");
  bindCrud("panelForm", "panels", ["name", "tests"], "panelTable");
  bindCrud("doctorForm", "doctors", ["name", "qualification", "clinic", "contact"], "doctorTable");
  bindCrud("departmentForm", "departments", ["name"], "departmentTable");
  bindCrud("inventoryForm", "inventory", ["name", "stock", "lowAlert"], "inventoryTable");
  initTemplateForm();
  initFeatureForm();
  renderReport();
}
initialize();
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
  orders: [],
  bills: [],
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
  document.getElementById("loadOrderPanelBtn").onclick = loadOrderPanel;
  document.getElementById("createOrderBtn").onclick = createOrder;
  document.getElementById("loadOrderBtn").onclick = loadOrderForEntry;
  document.getElementById("saveReportBtn").onclick = saveReport;
  document.getElementById("printReportBtn").onclick = () => window.print();
  document.getElementById("generateReportBtn").onclick = generateReportPreview;
  document.getElementById("patientSearchBtn").onclick = searchPatients;
  document.getElementById("createBillBtn").onclick = createBill;
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
    ["dashboard", "Dashboard"], ["registration", "Registration"], ["ordering", "Ordering"], ["resultEntry", "Results"],
    ["reporting", "Reporting"], ["search", "Search"], ["billing", "Billing"], ["history", "History"],
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
  renderOrderList();
  renderOrderSelect();
  renderReportSelect();
  renderBillingReportSelect();
  renderDashboard();
  renderTimeline();
  renderReprintList(db.reports);
  renderBillingList();
  renderToggles();
  applyFeatureToggles();
}
function renderDoctorList() {
  const sel = document.getElementById("patientDoctor");
  sel.innerHTML = db.doctors.map(d => `<option>${d.name} - ${d.hospital}</option>`).join("");
}
function renderPatientSelects() {
  const options = db.patients.map(p => `<option value="${p.id}">${p.id} - ${p.name}</option>`).join("");
  ["orderPatient", "historyPatient", "trendPatient"].forEach(id => document.getElementById(id).innerHTML = options);
}
function renderPanelSelect() {
  const options = Object.keys(db.panels).map(p => `<option>${p}</option>`).join("");
  document.getElementById("orderPanel").innerHTML = options;
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
function normalizedPanelTests(panel) {
  const tests = [...(db.panels[panel] || [])];
  if (tests.includes("CBC")) tests.push("Hemoglobin", "RBC", "HCT", "Potassium", "Blood glucose");
  return [...new Set(tests)];
}
function loadOrderPanel() {
  const panel = document.getElementById("orderPanel").value;
  document.getElementById("orderTests").value = normalizedPanelTests(panel).join(", ");
}
function createOrder() {
  const patientId = document.getElementById("orderPatient").value;
  const panel = document.getElementById("orderPanel").value;
  const tests = document.getElementById("orderTests").value.split(",").map(x => x.trim()).filter(Boolean);
  if (!patientId || !tests.length) return alert("Select patient and tests");
  db.orders.unshift({
    id: `O${Date.now().toString().slice(-8)}`,
    patientId,
    panel,
    tests,
    status: "Ordered",
    date: nowDate(),
  });
  saveData();
}
function renderOrderList() {
  const ul = document.getElementById("orderList");
  ul.innerHTML = db.orders.map(o => `<li>${o.id} | ${o.patientId} | ${o.panel} | ${o.status}</li>`).join("") || "<li>No orders</li>";
}
function renderOrderSelect() {
  document.getElementById("resultOrder").innerHTML = db.orders
    .filter(o => o.status === "Ordered")
    .map(o => `<option value="${o.id}">${o.id} | ${o.patientId} | ${o.panel}</option>`)
    .join("");
}
function loadOrderForEntry() {
  const orderId = document.getElementById("resultOrder").value;
  const order = db.orders.find(o => o.id === orderId);
  if (!order) return alert("Select pending order");
  currentTests = [...order.tests];
  renderResultRows(order.patientId);
}
function previousResultFor(patientId, test) {
  const rep = db.reports.find(r => r.patientId === patientId && r.results[test] !== undefined);
  return rep ? rep.results[test] : "-";
}
function renderResultRows(selectedPatientId) {
  const order = db.orders.find(o => o.id === document.getElementById("resultOrder").value);
  const pid = selectedPatientId || order?.patientId || "";
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
  const orderId = document.getElementById("resultOrder").value;
  const order = db.orders.find(o => o.id === orderId);
  const patientId = order?.patientId;
  if (!patientId) return alert("Select pending order");
  const report = {
    id: `R${Date.now().toString().slice(-8)}`,
    patientId,
    date: nowDate(),
    results: collectResults(),
    comments: document.getElementById("resultComments").value,
    paymentMethod: "Pending",
    revenue: order?.tests?.length ? order.tests.length * 120 : 500,
    orderId,
  };
  db.reports.unshift(report);
  if (order) order.status = "Result Entered";
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
function renderReportSelect() {
  document.getElementById("reportSelect").innerHTML = db.reports.map(r => `<option value="${r.id}">${r.id} | ${r.patientId}</option>`).join("");
}
function generateReportPreview() {
  const rid = document.getElementById("reportSelect").value;
  const report = db.reports.find(r => r.id === rid);
  if (!report) return;
  const patient = db.patients.find(p => p.id === report.patientId);
  const lines = [
    `Report ID: ${report.id}`,
    `Patient: ${patient?.name || report.patientId}`,
    `Date: ${report.date}`,
    `Technician workflow status: Finalized`,
    ...Object.entries(report.results).map(([k,v]) => `${k}: ${v}`),
    `Comments: ${report.comments || "-"}`,
  ];
  document.getElementById("generatedReport").textContent = lines.join("\n");
}
function searchPatients() {
  const q = document.getElementById("patientSearchInput").value.toLowerCase();
  const rows = db.patients.filter(p => `${p.id} ${p.name} ${p.phone}`.toLowerCase().includes(q));
  document.getElementById("patientSearchResults").innerHTML = rows.map(p => `<li>${p.id} | ${p.name} | ${p.phone || "-"}</li>`).join("") || "<li>No patient found</li>";
}
function renderBillingReportSelect() {
  document.getElementById("billingReport").innerHTML = db.reports.map(r => `<option value="${r.id}">${r.id} | ${r.patientId} | ${r.revenue}</option>`).join("");
}
function createBill() {
  const reportId = document.getElementById("billingReport").value;
  const method = document.getElementById("billingMethod").value;
  const report = db.reports.find(r => r.id === reportId);
  if (!report) return alert("Select report");
  const bill = {
    id: `B${Date.now().toString().slice(-8)}`,
    reportId,
    patientId: report.patientId,
    amount: report.revenue || 0,
    paymentMethod: method,
    date: nowDate(),
  };
  db.bills.unshift(bill);
  report.paymentMethod = method;
  saveData();
}
function renderBillingList() {
  const ul = document.getElementById("billingList");
  ul.innerHTML = db.bills.map(b => `<li>${b.id} | ${b.reportId} | ${b.patientId} | ${b.amount} | ${b.paymentMethod}</li>`).join("") || "<li>No bills</li>";
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
