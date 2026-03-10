const storageKey = "lis-master-data-v1";

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

let data = loadData();
let editState = {};

function loadData() {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : structuredClone(defaults);
}

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(data));
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
    saveData();
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
        saveData();
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

    saveData();
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
    saveData();
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
