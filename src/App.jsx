import {
  Building2,
  CheckCircle2,
  Edit3,
  LogIn,
  LogOut,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api.js";

const emptyEmployer = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  status: "active",
  permissions: ["view_dashboard"],
  image: ""
};

const emptyEmployee = {
  name: "",
  email: "",
  phone: "",
  department: "",
  position: "",
  salary: "",
  status: "active",
  image: ""
};

const permissionOptions = [
  { value: "view_dashboard", label: "Dashboard" },
  { value: "manage_employers", label: "Employers" },
  { value: "manage_employees", label: "Employees" }
];

const emailPattern = /^\S+@\S+\.\S+$/;
const phonePattern = /^[+\d\s().-]*$/;

const isPresent = (value) => String(value ?? "").trim().length > 0;

const getImageUrl = (value) => {
  if (!value) return "";
  return /^(https?:)?\/\//i.test(value)
    ? value
    : `http://13.60.157.78:5000/uploads/${value}`;
};

const validateTextField = (errors, field, value, label, rules = {}) => {
  const text = String(value ?? "").trim();

  if (rules.required && !text) {
    errors[field] = `${label} is required`;
    return;
  }

  if (!text) return;

  if (rules.min && text.length < rules.min) {
    errors[field] = `${label} must be at least ${rules.min} characters`;
    return;
  }

  if (rules.max && text.length > rules.max) {
    errors[field] = `${label} must be ${rules.max} characters or less`;
  }
};

const validateEmailField = (errors, field, value, label) => {
  const text = String(value ?? "").trim();

  if (!text) {
    errors[field] = `${label} is required`;
    return;
  }

  if (!emailPattern.test(text)) {
    errors[field] = `Enter a valid ${label.toLowerCase()}`;
  }
};

const validatePhoneField = (errors, field, value) => {
  const text = String(value ?? "").trim();

  if (!text) return;

  if (text.length > 30) {
    errors[field] = "Phone must be 30 characters or less";
    return;
  }

  if (!phonePattern.test(text)) {
    errors[field] = "Phone can contain only numbers";
  }
};

const validateAuthForm = (mode, form) => {
  const errors = {};

  if (mode === "signup") {
    validateTextField(errors, "companyName", form.companyName, "Company name", {
      required: true,
      min: 2,
      max: 120
    });
    validateTextField(errors, "industry", form.industry, "Industry", { max: 80 });
    validatePhoneField(errors, "phone", form.phone);
    validateTextField(errors, "address", form.address, "Address", { max: 200 });
  }

  validateEmailField(errors, "email", form.email, "Company email");
  validateTextField(errors, "password", form.password, "Password", {
    required: true,
    min: 6,
    max: 128
  });

  return errors;
};

const validateCompanyForm = (form) => {
  const errors = {};

  validateTextField(errors, "companyName", form.companyName, "Company name", {
    required: true,
    min: 2,
    max: 120
  });
  validateEmailField(errors, "email", form.email, "Company email");
  validateTextField(errors, "industry", form.industry, "Industry", { max: 80 });
  validatePhoneField(errors, "phone", form.phone);
  validateTextField(errors, "address", form.address, "Address", { max: 200 });

  return errors;
};

const validateRecordForm = (type, form) => {
  const errors = {};
  const isEmployers = type === "employers";

  validateTextField(errors, "name", form.name, "Full name", { required: true, min: 2, max: 100 });
  validateEmailField(errors, "email", form.email, "Email");
  validatePhoneField(errors, "phone", form.phone);
  validateTextField(errors, "department", form.department, "Department", {
    required: true,
    min: 2,
    max: 80
  });
  validateTextField(errors, isEmployers ? "designation" : "position", isEmployers ? form.designation : form.position, isEmployers ? "Designation" : "Position", {
    required: true,
    min: 2,
    max: 80
  });

  if (!isEmployers && isPresent(form.salary) && Number(form.salary) < 0) {
    errors.salary = "Salary cannot be negative";
  }

  if (isEmployers && (!Array.isArray(form.permissions) || form.permissions.length === 0)) {
    errors.permissions = "Select at least one permission";
  }

  return errors;
};

function ErrorText({ message }) {
  return message ? <span className="field-error">{message}</span> : null;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("companyToken") || "");
  const [company, setCompany] = useState(() => {
    const stored = localStorage.getItem("companyProfile");
    return stored ? JSON.parse(stored) : null;
  });
  const [authMode, setAuthMode] = useState("signup");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(Boolean(token));
  const [message, setMessage] = useState("");

  const persistCompany = (nextCompany) => {
    setCompany(nextCompany);
    localStorage.setItem("companyProfile", JSON.stringify(nextCompany));
  };

  const persistSession = (payload) => {
    setToken(payload.token);
    persistCompany(payload.company);
    localStorage.setItem("companyToken", payload.token);
  };

  const logout = () => {
    setToken("");
    setCompany(null);
    localStorage.removeItem("companyToken");
    localStorage.removeItem("companyProfile");
  };

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }

    apiRequest("/auth/me", {}, token)
      .then((data) => {
        setCompany(data.company);
        localStorage.setItem("companyProfile", JSON.stringify(data.company));
      })
      .catch(() => logout())
      .finally(() => setBooting(false));
  }, [token]);

  const handleAuth = async (payload) => {
    setLoading(true);
    setMessage("");

    try {
      const endpoint = authMode === "signup" ? "/auth/signup" : "/auth/login";
      
      let options = {
        method: "POST"
      };

      if (authMode === "signup" && payload.logoFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("logo", payload.logoFile);
        formData.append("companyName", payload.companyName);
        formData.append("email", payload.email);
        formData.append("password", payload.password);
        formData.append("industry", payload.industry);
        formData.append("phone", payload.phone);
        formData.append("address", payload.address);
        options.body = formData;
      } else {
        options.body = JSON.stringify(payload);
      }

      const data = await apiRequest(endpoint, options);
      persistSession(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (booting) {
    return (
      <main className="shell center-shell">
        <div className="loader" />
      </main>
    );
  }

  if (!token || !company) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onSubmit={handleAuth}
        loading={loading}
        message={message}
      />
    );
  }

  return <Dashboard company={company} token={token} onCompanyUpdate={persistCompany} onLogout={logout} />;
}

function AuthScreen({ mode, setMode, onSubmit, loading, message }) {
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
    industry: "",
    phone: "",
    address: ""
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    const errors = validateAuthForm(mode, form);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const payload =
      mode === "signup"
        ? { ...form, logoFile }
        : {
            email: form.email,
            password: form.password
          };
    onSubmit(payload);
  };

  return (
    <main className="auth-layout">
      <section className="auth-copy">
        <div className="brand-mark">
          <ShieldCheck size={28} />
        </div>
        <h1>Company Directory</h1>
        <p>
          Sign up a company, log in securely, and manage employer and employee records with JWT
          protected APIs.
        </p>
        <div className="auth-points">
          <span>
            <CheckCircle2 size={17} /> MongoDB schemas
          </span>
          <span>
            <CheckCircle2 size={17} /> RBAC middleware
          </span>
          <span>
            <CheckCircle2 size={17} /> CRUD dashboard
          </span>
        </div>
      </section>

      <section className="auth-panel" aria-label="Authentication form">
        <div className="mode-switch">
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
        </div>

        <form onSubmit={submit} className="form-grid" noValidate autoComplete="off">
          <input type="text" name="fakeusername" autoComplete="off" style={{ display: "none" }} />
          <input type="password" name="fakepassword" autoComplete="new-password" style={{ display: "none" }} />
          <div className="form-heading">
            <h2>{mode === "signup" ? "Create company account" : "Welcome back"}</h2>
            <p>{mode === "signup" ? "Your company becomes the admin account." : "Log in as your company."}</p>
          </div>

          {mode === "signup" && (
            <>
              <label>
                Company name
                <input
                  className={fieldErrors.companyName ? "invalid" : ""}
                  value={form.companyName}
                  onChange={(event) => update("companyName", event.target.value)}
                  placeholder="Acme Operations"
                  required
                />
                <ErrorText message={fieldErrors.companyName} />
              </label>
              <label>
                Company logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                {logoPreview && (
                  <div style={{ marginTop: "8px" }}>
                    <img src={logoPreview} alt="Logo preview" style={{ maxWidth: "100px", maxHeight: "100px", borderRadius: "4px" }} />
                  </div>
                )}
              </label>
              <label>
                Industry
                <input
                  className={fieldErrors.industry ? "invalid" : ""}
                  value={form.industry}
                  onChange={(event) => update("industry", event.target.value)}
                  placeholder="Technology"
                />
                <ErrorText message={fieldErrors.industry} />
              </label>
              <label>
                Phone
                <input
                  className={fieldErrors.phone ? "invalid" : ""}
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="+91 98765 43210"
                />
                <ErrorText message={fieldErrors.phone} />
              </label>
              <label className="span-2">
                Address
                <input
                  className={fieldErrors.address ? "invalid" : ""}
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  placeholder="Company office address"
                />
                <ErrorText message={fieldErrors.address} />
              </label>
            </>
          )}

          <label>
            Company email
            <input
              className={fieldErrors.email ? "invalid" : ""}
              type="email"
              autoComplete="off"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="admin@company.com"
              required
            />
            <ErrorText message={fieldErrors.email} />
          </label>

          <label>
            Password
            <input
              className={fieldErrors.password ? "invalid" : ""}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
            <ErrorText message={fieldErrors.password} />
          </label>

          {message && <div className="alert">{message}</div>}

          <button className="primary-action span-2" type="submit" disabled={loading}>
            {mode === "signup" ? <Building2 size={18} /> : <LogIn size={18} />}
            {loading ? "Please wait..." : mode === "signup" ? "Create company" : "Log in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ company, token, onCompanyUpdate, onLogout }) {
  const [activeTab, setActiveTab] = useState("employers");
  const [employers, setEmployers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [companyPanelOpen, setCompanyPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState("");
  const [zoom, setZoom] = useState(1);

  const isEmployers = activeTab === "employers";
  const rows = isEmployers ? employers : employees;

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return rows;

    return rows.filter((row) => {
      const fields = isEmployers
        ? [row.name, row.email, row.department, row.designation, row.status]
        : [row.name, row.email, row.department, row.position, row.status];
      return fields.some((field) => String(field || "").toLowerCase().includes(normalized));
    });
  }, [query, rows, isEmployers]);

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    try {
      const [employerData, employeeData, summaryData] = await Promise.all([
        apiRequest("/employers", {}, token),
        apiRequest("/employees", {}, token),
        apiRequest("/dashboard/summary", {}, token)
      ]);
      setEmployers(employerData.employers);
      setEmployees(employeeData.employees);
      setSummary(summaryData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditing(null);
    setFormOpen(false);
  };

  const saveCompany = async (payload) => {
    setCompanySaving(true);
    setMessage("");

    try {
      let options = {
        method: "PUT"
      };

      if (payload.logoFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("logo", payload.logoFile);
        formData.append("companyName", payload.companyName);
        formData.append("email", payload.email);
        formData.append("industry", payload.industry);
        formData.append("phone", payload.phone);
        formData.append("address", payload.address);
        options.body = formData;
      } else {
        options.body = JSON.stringify(payload);
      }

      const data = await apiRequest("/company", options, token);
      onCompanyUpdate(data.company);
      setCompanyPanelOpen(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setCompanySaving(false);
    }
  };

  const deleteCompany = async () => {
    setCompanySaving(true);
    setMessage("");

    try {
      await apiRequest("/company", { method: "DELETE" }, token);
      onLogout();
    } catch (error) {
      setMessage(error.message);
      setCompanySaving(false);
    }
  };

  const saveRecord = async (payload) => {
    setSaving(true);
    setMessage("");

    try {
      const collectionPath = isEmployers ? "/employers" : "/employees";
      const path = editing ? `${collectionPath}/${editing._id}` : collectionPath;
      
      let options = {
        method: editing ? "PUT" : "POST"
      };

      if (payload.imageFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("image", payload.imageFile);
        formData.append("name", payload.name);
        formData.append("email", payload.email);
        formData.append("phone", payload.phone);
        formData.append("department", payload.department);
        
        if (isEmployers) {
          formData.append("designation", payload.designation);
          // Ensure permissions are sent as repeated fields so multer/express parses them as an array
          if (Array.isArray(payload.permissions)) {
            payload.permissions.forEach((perm) => formData.append("permissions[]", perm));
          } else if (typeof payload.permissions === "string") {
            try {
              const parsed = JSON.parse(payload.permissions);
              if (Array.isArray(parsed)) parsed.forEach((perm) => formData.append("permissions[]", perm));
              else formData.append("permissions[]", payload.permissions);
            } catch (e) {
              formData.append("permissions[]", payload.permissions);
            }
          }
        } else {
          formData.append("position", payload.position);
          formData.append("salary", payload.salary);
        }
        
        formData.append("status", payload.status);
        options.body = formData;
      } else {
        options.body = JSON.stringify(payload);
      }

      await apiRequest(path, options, token);
      closeForm();
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (record) => {
    const label = isEmployers ? "employer" : "employee";
    const confirmed = window.confirm(`Delete ${record.name} from the ${label} list?`);

    if (!confirmed) return;

    setMessage("");

    try {
      await apiRequest(`${isEmployers ? "/employers" : "/employees"}/${record._id}`, { method: "DELETE" }, token);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const openImageModal = (src) => {
    if (!src) return;
    setModalSrc(src);
    setZoom(1);
    setModalOpen(true);
  };

  const closeImageModal = () => setModalOpen(false);

  const zoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)));

  return (
    <main className="app-shell">
          <header className="topbar">
        <div className="company-lockup">
          <div className="brand-mark small">
            {company.logo ? (
              <img
                src={getImageUrl(company.logo)}
                alt="Company logo"
                style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", cursor: "pointer" }}
                onClick={() => openImageModal(getImageUrl(company.logo))}
              />
            ) : (
              <Building2 size={21} />
            )}
          </div>
          <div>
            <p>{company.role.toUpperCase()} ACCOUNT</p>
            <h1>{company.companyName}</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" type="button" onClick={() => setCompanyPanelOpen(true)}>
            <UserCog size={18} />
            About company
          </button>
          <button className="ghost-button" type="button" onClick={onLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <section className="summary-band">
        <Metric label="Employers" value={summary?.employerCount || 0} icon={<UsersRound size={20} />} />
        <Metric label="Employees" value={summary?.employeeCount || 0} icon={<UserRound size={20} />} />
        <Metric label="Active employers" value={summary?.activeEmployers || 0} icon={<CheckCircle2 size={20} />} />
        <Metric label="Active employees" value={summary?.activeEmployees || 0} icon={<ShieldCheck size={20} />} />
      </section>

      <section className="directory">
        <div className="directory-toolbar">
          <div className="tabs" role="tablist" aria-label="Directory tabs">
            <button
              type="button"
              className={activeTab === "employers" ? "active" : ""}
              onClick={() => {
                setActiveTab("employers");
                setQuery("");
                closeForm();
              }}
            >
              <UsersRound size={18} />
              Employers
            </button>
            <button
              type="button"
              className={activeTab === "employees" ? "active" : ""}
              onClick={() => {
                setActiveTab("employees");
                setQuery("");
                closeForm();
              }}
            >
              <UserRound size={18} />
              Employees
            </button>
          </div>

          <div className="toolbar-actions">
            <label className="search-box">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${isEmployers ? "employers" : "employees"}`}
              />
            </label>
            <button className="primary-action compact" type="button" onClick={openCreate}>
              <Plus size={18} />
              Add {isEmployers ? "employer" : "employee"}
            </button>
          </div>
        </div>

        {message && <div className="alert inline">{message}</div>}

        <div className="content-grid">
          <DirectoryTable
            type={activeTab}
            rows={filteredRows}
            loading={loading}
            onEdit={openEdit}
            onDelete={deleteRecord}
            onOpenImage={openImageModal}
          />
        </div>

        {formOpen && (
          <div className="editor-overlay" role="presentation" onClick={closeForm}>
            <RecordForm
              type={activeTab}
              record={editing}
              saving={saving}
              onSave={saveRecord}
              onClose={closeForm}
            />
          </div>
        )}

        {companyPanelOpen && (
          <div className="editor-overlay" role="presentation" onClick={() => setCompanyPanelOpen(false)}>
            <CompanyPanel
              company={company}
              saving={companySaving}
              onSave={saveCompany}
              onDelete={deleteCompany}
              onClose={() => setCompanyPanelOpen(false)}
            />
          </div>
        )}
        {modalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.6)",
              zIndex: 9999
            }}
            onClick={closeImageModal}
          >
            <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }} onClick={(e) => e.stopPropagation()}>
              <button
                aria-label="Close"
                onClick={closeImageModal}
                style={{
                  position: "absolute",
                  right: -10,
                  top: -10,
                  background: "#fff",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                X
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                  <button onClick={zoomIn} style={{ padding: "6px 8px", cursor: "pointer" }}>+</button>
                  <button onClick={zoomOut} style={{ padding: "6px 8px", cursor: "pointer" }}>-</button>
                </div>
                <div style={{ overflow: "auto", maxWidth: "calc(100vw - 120px)", maxHeight: "calc(100vh - 120px)" }}>
                  <img src={modalSrc} alt="Preview" style={{ transform: `scale(${zoom})`, transformOrigin: "center center", display: "block", maxWidth: "100%", height: "auto" }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="metric">
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function DirectoryTable({ type, rows, loading, onEdit, onDelete, onOpenImage }) {
  const isEmployers = type === "employers";

  if (loading) {
    return (
      <div className="table-shell empty-state">
        <div className="loader" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="table-shell empty-state">
        <ShieldCheck size={34} />
        <h2>No {isEmployers ? "employers" : "employees"} yet</h2>
        <p>Create the first record from the Add button.</p>
      </div>
    );
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Department</th>
            <th>{isEmployers ? "Designation" : "Position"}</th>
            <th>Email</th>
            {!isEmployers && <th>Salary</th>}
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>
                {row.image ? (
                  <img
                    src={getImageUrl(row.image)}
                    alt={row.name}
                    style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", cursor: "pointer" }}
                    onClick={() => onOpenImage && onOpenImage(getImageUrl(row.image))}
                  />
                ) : (
                  <div style={{ width: "40px", height: "40px", borderRadius: "4px", backgroundColor: "#f0f0f0" }} />
                )}
              </td>
              <td>
                <strong>{row.name}</strong>
                <span>{row.phone || "No phone"}</span>
              </td>
              <td>{row.department}</td>
              <td>{isEmployers ? row.designation : row.position}</td>
              <td>{row.email}</td>
              {!isEmployers && <td>{Number(row.salary || 0).toLocaleString("en-IN")}</td>}
              <td>
                <span className={`status-pill ${row.status}`}>{row.status}</span>
              </td>
              <td className="row-actions">
                <button type="button" title="Edit" onClick={() => onEdit(row)}>
                  <Edit3 size={17} />
                </button>
                <button type="button" title="Delete" onClick={() => onDelete(row)}>
                  <Trash2 size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompanyPanel({ company, saving, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    companyName: company.companyName || "",
    email: company.email || "",
    industry: company.industry || "",
    phone: company.phone || "",
    address: company.address || ""
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(company.logo ? getImageUrl(company.logo) : "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteText, setDeleteText] = useState("");

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    const errors = validateCompanyForm(form);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const payload = {
      ...form,
      ...(logoFile && { logoFile })
    };
    onSave(payload);
  };

  const canDelete = deleteText.trim() === company.companyName;

  return (
    <aside className="editor-panel company-panel" aria-label="Company profile" onClick={(event) => event.stopPropagation()}>
      <div className="editor-title">
        <div>
          <p>Company profile</p>
          <h2>About company</h2>
        </div>
        <button type="button" title="Close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={submit} className="editor-form" noValidate>
        <label>
          Company name
          <input
            className={fieldErrors.companyName ? "invalid" : ""}
            value={form.companyName}
            onChange={(event) => update("companyName", event.target.value)}
            required
          />
          <ErrorText message={fieldErrors.companyName} />
        </label>
        <label>
          Company logo
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
          />
          {logoPreview && (
            <div style={{ marginTop: "8px" }}>
              <img src={logoPreview} alt="Logo preview" style={{ maxWidth: "100px", maxHeight: "100px", borderRadius: "4px", objectFit: "cover" }} />
            </div>
          )}
        </label>
        <label>
          Company email
          <input
            className={fieldErrors.email ? "invalid" : ""}
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
          <ErrorText message={fieldErrors.email} />
        </label>
        <label>
          Industry
          <input
            className={fieldErrors.industry ? "invalid" : ""}
            value={form.industry}
            onChange={(event) => update("industry", event.target.value)}
          />
          <ErrorText message={fieldErrors.industry} />
        </label>
        <label>
          Phone
          <input
            className={fieldErrors.phone ? "invalid" : ""}
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
          <ErrorText message={fieldErrors.phone} />
        </label>
        <label>
          Address
          <input
            className={fieldErrors.address ? "invalid" : ""}
            value={form.address}
            onChange={(event) => update("address", event.target.value)}
          />
          <ErrorText message={fieldErrors.address} />
        </label>

        <button className="primary-action" type="submit" disabled={saving}>
          <Save size={18} />
          {saving ? "Saving..." : "Update company"}
        </button>
      </form>

      <section className="danger-zone" aria-label="Delete company">
        <div>
          <p>Danger zone</p>
          <h3>Delete company account</h3>
          <span>This permanently deletes the company, all employers, and all employees from MongoDB.</span>
        </div>
        <label>
          Type company name to confirm
          <input
            value={deleteText}
            onChange={(event) => setDeleteText(event.target.value)}
            placeholder={company.companyName}
          />
        </label>
        <button className="danger-button" type="button" disabled={saving || !canDelete} onClick={onDelete}>
          <Trash2 size={18} />
          Delete company
        </button>
      </section>
    </aside>
  );
}

function RecordForm({ type, record, saving, onSave, onClose }) {
  const isEmployers = type === "employers";
  const [form, setForm] = useState(() => ({
    ...(isEmployers ? emptyEmployer : emptyEmployee),
    ...(record || {})
  }));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(record?.image ? `http://13.60.157.78:5000/uploads/${record.image}` : "");

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setForm({
      ...(isEmployers ? emptyEmployer : emptyEmployee),
      ...(record || {})
    });
    setImagePreview(record?.image ? getImageUrl(record.image) : "");
    setImageFile(null);
    setFieldErrors({});
  }, [record, isEmployers]);

  const clearFieldError = (field) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePermission = (permission) => {
    setForm((current) => {
      const exists = current.permissions.includes(permission);
      return {
        ...current,
        permissions: exists
          ? current.permissions.filter((item) => item !== permission)
          : [...current.permissions, permission]
      };
    });
    clearFieldError("permissions");
  };

  const submit = (event) => {
    event.preventDefault();
    const errors = validateRecordForm(type, form);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const payload = isEmployers
      ? {
          name: form.name,
          email: form.email,
          phone: form.phone,
          department: form.department,
          designation: form.designation,
          permissions: form.permissions,
          status: form.status,
          ...(imageFile && { imageFile })
        }
      : {
          name: form.name,
          email: form.email,
          phone: form.phone,
          department: form.department,
          position: form.position,
          salary: Number(form.salary || 0),
          status: form.status,
          ...(imageFile && { imageFile })
        };
    onSave(payload);
  };

  return (
    <aside
      className="editor-panel"
      aria-label={`${record ? "Edit" : "Create"} ${isEmployers ? "employer" : "employee"}`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="editor-title">
        <div>
          <p>{record ? "Edit record" : "New record"}</p>
          <h2>{isEmployers ? "Employer" : "Employee"}</h2>
        </div>
        <button type="button" title="Close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={submit} className="editor-form" noValidate>
        <label>
          Full name
          <input
            className={fieldErrors.name ? "invalid" : ""}
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            required
          />
          <ErrorText message={fieldErrors.name} />
        </label>
        <label>
          {isEmployers ? "Employer" : "Employee"} image
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <div style={{ marginTop: "8px" }}>
              <img src={imagePreview} alt="Profile preview" style={{ maxWidth: "100px", maxHeight: "100px", borderRadius: "4px", objectFit: "cover" }} />
            </div>
          )}
        </label>
        <label>
          Email
          <input
            className={fieldErrors.email ? "invalid" : ""}
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
          <ErrorText message={fieldErrors.email} />
        </label>
        <label>
          Phone
          <input
            className={fieldErrors.phone ? "invalid" : ""}
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
          <ErrorText message={fieldErrors.phone} />
        </label>
        <label>
          Department
          <input
            className={fieldErrors.department ? "invalid" : ""}
            value={form.department}
            onChange={(event) => update("department", event.target.value)}
            required
          />
          <ErrorText message={fieldErrors.department} />
        </label>
        <label>
          {isEmployers ? "Designation" : "Position"}
          <input
            className={fieldErrors[isEmployers ? "designation" : "position"] ? "invalid" : ""}
            value={isEmployers ? form.designation : form.position}
            onChange={(event) => update(isEmployers ? "designation" : "position", event.target.value)}
            required
          />
          <ErrorText message={fieldErrors[isEmployers ? "designation" : "position"]} />
        </label>

        {!isEmployers && (
          <label>
            Salary
            <input
              className={fieldErrors.salary ? "invalid" : ""}
              type="number"
              min="0"
              value={form.salary}
              onChange={(event) => update("salary", event.target.value)}
            />
            <ErrorText message={fieldErrors.salary} />
          </label>
        )}

        <label>
          Status
          <select
            className={fieldErrors.status ? "invalid" : ""}
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ErrorText message={fieldErrors.status} />
        </label>

        {isEmployers && (
          <div className="permission-group">
            <span>Permissions</span>
            <div>
              {permissionOptions.map((option) => (
                <label key={option.value} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(option.value)}
                    onChange={() => togglePermission(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <ErrorText message={fieldErrors.permissions} />
          </div>
        )}

        <button className="primary-action" type="submit" disabled={saving}>
          <Save size={18} />
          {saving ? "Saving..." : "Save record"}
        </button>
      </form>
    </aside>
  );
}

export default App;
















