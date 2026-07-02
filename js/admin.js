/**
 * Club Capelli Cursos - Administrative BI Dashboard Controller
 * 
 * Manages:
 * - Authentication (cesc / cescadmin) with LocalStorage session persistence.
 * - Dynamic SPA view routing.
 * - Dynamic metrics compilation (KPIs) from data.js.
 * - Added-Value Business Intelligence insights (Churn, LTV, geographic distribution).
 * - Chart.js integrations for lines, bars, and donut visual graphics.
 * - Dynamic list rendering with reactive search filters.
 * - Premium report generation and downloads for PDF (jsPDF + AutoTable), Excel (SheetJS), and CSV.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Check elements
    const loginContainer = document.getElementById("login-container");
    const dashboardContainer = document.getElementById("dashboard-container");
    const loginForm = document.getElementById("login-form");
    const loginAlert = document.getElementById("login-alert");
    const btnLogout = document.getElementById("btn-logout");

    let activeSection = "dashboard";
    let googleSheetsSynced = false;
    let chartIngresosInstance = null;
    let chartSubsInstance = null;
    let chartCursosInstance = null;

    // ==========================================
    // SPLASH PARTICLES
    // ==========================================
    const splashParticles = document.getElementById('splash-particles');
    if (splashParticles) {
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'splash-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.width = (2 + Math.random() * 6) + 'px';
            p.style.height = p.style.width;
            p.style.animationDuration = (8 + Math.random() * 12) + 's';
            p.style.animationDelay = (Math.random() * 10) + 's';
            splashParticles.appendChild(p);
        }
    }

    // ==========================================
    // SPLASH SCREEN CONTROL
    // ==========================================
    function hideSplash() {
        const splash = document.getElementById("splash-screen");
        if (splash) {
            splash.classList.add("hidden");
            setTimeout(() => {
                splash.style.display = "none";
            }, 600);
        }
    }

    // ==========================================
    // ANIMATED COUNTER
    // ==========================================
    function animateCounter(elementId, targetValue, duration = 800) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const startValue = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startValue + (targetValue - startValue) * eased);
            el.textContent = current;
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = targetValue;
            }
        }
        requestAnimationFrame(update);
    }

    // ==========================================
    // GSAP KPI CARD ENTRANCE
    // ==========================================
    function animateKpiCards() {
        if (typeof gsap === 'undefined') return;
        gsap.fromTo('.kpi-card',
            { opacity: 0, y: 30, scale: 0.95 },
            {
                opacity: 1, y: 0, scale: 1,
                duration: 0.5,
                stagger: 0.08,
                ease: 'power3.out'
            }
        );
    }

    // ==========================================
    // TOAST NOTIFICATION SYSTEM
    // ==========================================
    function showToast(title, message, type = "info", duration = 4000) {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const icons = {
            success: "fa-check-circle",
            error: "fa-times-circle",
            warning: "fa-exclamation-triangle",
            info: "fa-info-circle"
        };

        const toast = document.createElement("div");
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
            <div class="toast-content">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);

        // Trigger entrance animation
        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    // ==========================================
    // CONFIRM MODAL
    // ==========================================
    function showConfirm(title, message, callback, iconType = "warning", confirmText = "Confirmar") {
        const modalEl = document.getElementById("confirmModal");
        if (!modalEl) return;

        document.getElementById("confirm-title").textContent = title;
        document.getElementById("confirm-message").textContent = message;

        const icon = document.getElementById("confirm-icon");
        icon.className = `modal-confirm-icon ${iconType}`;
        const iconsMap = {
            warning: "fa-exclamation-triangle",
            success: "fa-check-circle",
            danger: "fa-times-circle"
        };
        icon.innerHTML = `<i class="fas ${iconsMap[iconType] || iconsMap.warning}"></i>`;

        const btn = document.getElementById("confirm-action-btn");
        btn.textContent = confirmText;
        btn.style.background = iconType === "danger" ? "#ef4444" : "var(--color-naranja)";

        // Remove old listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener("click", () => {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            if (callback) callback();
        });

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    // ==========================================
    // 1. AUTHENTICATION CONTROLS
    // ==========================================
    const checkSession = () => {
        const session = localStorage.getItem("capelli_admin_session");
        
        if (session) {
            loginContainer.style.display = "none";
            dashboardContainer.style.display = "flex";
            // GSAP entrance for dashboard
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(dashboardContainer,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.2 }
                );
            }
            // Hide splash after a brief moment for smooth transition
            setTimeout(hideSplash, 800);
            initializeDashboard();
        } else {
            loginContainer.style.display = "flex";
            dashboardContainer.style.display = "none";
            // Hide splash immediately for login screen
            hideSplash();
        }
    };

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const user = document.getElementById("username").value.trim();
        const pass = document.getElementById("password").value.trim();

        if (user === "cesc" && pass === "cescadmin") {
            loginAlert.classList.add("d-none");
            localStorage.setItem("capelli_admin_session", "active_session_token");
            
            // Animated login transition
            if (typeof gsap !== 'undefined') {
                gsap.to(loginContainer, {
                    opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in',
                    onComplete: () => {
                        loginContainer.style.display = "none";
                        dashboardContainer.style.display = "flex";
                        gsap.fromTo(dashboardContainer,
                            { opacity: 0, y: 20 },
                            { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
                        );
                        initializeDashboard();
                    }
                });
            } else {
                loginContainer.style.display = "none";
                dashboardContainer.style.display = "flex";
                initializeDashboard();
            }
        } else {
            loginAlert.classList.remove("d-none");
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(loginAlert, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.3 });
            }
        }
    });

    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("capelli_admin_session");
        window.location.reload();
    });

    // ==========================================
    // 2. SPA VIEW ROUTING & SIDEBAR
    // ==========================================
    const menuItems = document.querySelectorAll(".menu-item");
    const viewPanels = document.querySelectorAll(".dashboard-view-panel");
    const sectionTitle = document.getElementById("section-title");
    const sectionSubtitle = document.getElementById("section-subtitle");

    // Expose routing globally to allow navigation from dashboard buttons
    window.switchSection = (sectionId) => {
        menuItems.forEach(item => {
            if (item.getAttribute("data-section") === sectionId) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        const targetPanel = document.getElementById(`section-${sectionId}`);

        viewPanels.forEach(panel => {
            if (panel === targetPanel) {
                panel.style.display = "block";
                // GSAP entrance animation
                if (typeof gsap !== 'undefined') {
                    gsap.fromTo(panel,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
                    );
                }
            } else {
                panel.style.display = "none";
            }
        });

        // Update titles
        activeSection = sectionId;
        updateHeader(sectionId);
        
        // Re-trigger specific renders if required
        if (sectionId === "alumnos") renderAlumnosTable();
        if (sectionId === "cursos") renderCursosTable();
        if (sectionId === "suscripciones") renderSuscripcionesTable();
        if (sectionId === "ingresos") renderIngresosTable();
        if (sectionId === "reportes") renderReportPreview();
    };

    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const section = item.getAttribute("data-section");
            window.switchSection(section);
        });
    });

    function updateHeader(sectionId) {
        const headers = {
            dashboard: { title: "Dashboard Ejecutivo", subtitle: "Visualización estratégica del estado comercial" },
            alumnos: { title: "Gestión de Alumnos", subtitle: "Control de altas, bajas y distribución escolar" },
            cursos: { title: "Rendimiento de Cursos", subtitle: "Análisis de ventas, vistas y popularidad comercial" },
            suscripciones: { title: "Membresías Activas", subtitle: "Control de cuotas mensuales y tasas de renovación" },
            ingresos: { title: "Contabilidad & Facturación", subtitle: "Libro diario e historial detallado de caja" },
            reportes: { title: "Centro de Reportes", subtitle: "Descarga de informes listos en PDF, Excel y CSV" },
            configuracion: { title: "Configuración del Sistema", subtitle: "Administración de parámetros globales de BI" }
        };

        const head = headers[sectionId] || headers.dashboard;
        sectionTitle.textContent = head.title;
        sectionSubtitle.textContent = head.subtitle;
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(sectionTitle, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' });
            gsap.fromTo(sectionSubtitle, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, delay: 0.1, ease: 'power2.out' });
        }
    }

    // ==========================================
    // 3. CORE ANALYTICAL LOGIC & CALCULATIONS
    // ==========================================
    function initializeDashboard() {
        const db = CAPELLI_DATABASE;

        // === PASO 1: Cargar datos reales inmediatamente (sin esperar red) ===
        // Si la base está vacía, inyectar los datos del formulario de Google ahora mismo
        if (db.alumnos.length === 0) {
            loadFallbackData();
        }

        // Update navbar date badge dynamically
        const dateBadge = document.getElementById("navbar-date-badge");
        if (dateBadge && db.today) {
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            dateBadge.innerHTML = `<i class="fas fa-calendar-alt me-1"></i> ${db.today.toLocaleDateString("es-AR", options)}`;
        }

        // Calculate metrics
        const totalAlumnos = db.alumnos.length;
        const totalSubsActivas = db.suscripciones.filter(s => s.estado === "Activa").length;
        const totalSubsVencidas = db.suscripciones.filter(s => s.estado === "Vencida").length;

        // ── Cálculos por SEDE ──
        const ybCount = db.alumnos.filter(a => a.sede === "Yerba Buena").length;
        const sjCount = db.alumnos.filter(a => a.sede === "San Juan 790").length;
        const topSede = ybCount >= sjCount ? "Yerba Buena" : "San Juan 790";
        const topSedeCount = Math.max(ybCount, sjCount);
        const topSedePct = totalAlumnos > 0 ? Math.round((topSedeCount / totalAlumnos) * 100) : 0;

        // ── Cálculos por CURSO ──
        const cursosConAlumnos = [...db.cursos].sort((a, b) => b.sales - a.sales);
        const topCurso = cursosConAlumnos[0];
        const lowCurso = cursosConAlumnos[cursosConAlumnos.length - 1];

        // ── Registros por MES ──
        const mayoCount = db.alumnos.filter(a => {
            const d = new Date(a.fechaRegistro);
            return d.getMonth() === 4 && d.getFullYear() === 2025; // Mayo = 4
        }).length;
        const junioCount = db.alumnos.filter(a => {
            const d = new Date(a.fechaRegistro);
            return d.getMonth() === 5 && d.getFullYear() === 2025; // Junio = 5
        }).length;

        // ── KPI Row 1 (with animated counters) ──
        animateCounter("kpi-total-alumnos", totalAlumnos);
        document.getElementById("kpi-alumnos-trend").innerHTML = `<i class="fas fa-users"></i> ${totalAlumnos} registros totales`;
        
        if (document.getElementById("kpi-top-sede")) {
            document.getElementById("kpi-top-sede").textContent = topSede;
            document.getElementById("kpi-top-sede-pct").innerHTML = `<i class="fas fa-map-marker-alt"></i> ${topSedePct}% del total`;
        }
        if (topCurso && document.getElementById("kpi-top-curso")) {
            document.getElementById("kpi-top-curso").textContent = topCurso.nombre.replace("Curso de ", "");
            document.getElementById("kpi-top-curso-cnt").innerHTML = `<i class="fas fa-crown"></i> ${topCurso.sales} alumno${topCurso.sales !== 1 ? 's' : ''}`;
        }
        if (lowCurso && document.getElementById("kpi-low-curso")) {
            document.getElementById("kpi-low-curso").textContent = lowCurso.nombre.replace("Curso de ", "");
            document.getElementById("kpi-low-curso-cnt").innerHTML = `<i class="fas fa-triangle-exclamation"></i> ${lowCurso.sales} alumno${lowCurso.sales !== 1 ? 's' : ''}`;
        }

        // ── KPI Row 2 (with animated counters) ──
        animateCounter("kpi-mayo-count", mayoCount);
        animateCounter("kpi-junio-count", junioCount);
        if (document.getElementById("kpi-yb-count")) {
            animateCounter("kpi-yb-count", ybCount);
            document.getElementById("kpi-yb-pct").innerHTML = `<i class="fas fa-building"></i> ${totalAlumnos > 0 ? Math.round((ybCount/totalAlumnos)*100) : 0}% del total`;
        }
        if (document.getElementById("kpi-sj-count")) {
            animateCounter("kpi-sj-count", sjCount);
            document.getElementById("kpi-sj-pct").innerHTML = `<i class="fas fa-building"></i> ${totalAlumnos > 0 ? Math.round((sjCount/totalAlumnos)*100) : 0}% del total`;
        }

        // ── Animate KPI cards entrance ──
        animateKpiCards();

        // ── Render Analytics Panels ──
        renderSedeDistribution(ybCount, sjCount, totalAlumnos);
        renderCursoDistributionBars();
        renderKeyFacts(db, topCurso, lowCurso, ybCount, sjCount, mayoCount, junioCount);

        // Load dynamic visual components
        renderRecentStudentsTable();
        renderCharts();

        // === PASO 2: Intentar sincronizar con Google Sheets en segundo plano ===
        syncGoogleSheets(false);

        // Attach dynamic search and filter events in secondary panels
        setupSecondaryFilters();
    }

    // ── Distribución visual por sede ──
    function renderSedeDistribution(ybCount, sjCount, total) {
        const container = document.getElementById("sede-distribution-bars");
        if (!container) return;
        const sedes = [
            { nombre: "Yerba Buena", count: ybCount, color: "#f26522" },
            { nombre: "San Juan 790", count: sjCount, color: "#3b82f6" }
        ];
        container.innerHTML = sedes.map(s => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            return `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-semibold" style="font-size:0.85rem;">${s.nombre}</span>
                    <span class="badge" style="background:${s.color}; font-size:0.78rem;">${s.count} alumnos</span>
                </div>
                <div class="progress" style="height: 10px; border-radius: 6px;">
                    <div class="progress-bar" style="width:${pct}%; background:${s.color}; border-radius:6px; transition: width 0.8s ease;"></div>
                </div>
                <small class="text-muted">${pct}% del total de inscriptos</small>
            </div>`;
        }).join("") + `
        <div class="mt-3 p-3 rounded text-center" style="background:#f8fafc; border:1px solid #e2e8f0;">
            <div class="text-muted small fw-semibold">Total entre ambas sedes</div>
            <div class="fw-bold fs-4 text-dark mt-1">${total} alumnos</div>
        </div>`;
    }

    // ── Barras horizontales por curso ──
    function renderCursoDistributionBars() {
        const container = document.getElementById("curso-distribution-bars");
        if (!container) return;
        const db = CAPELLI_DATABASE;
        const maxSales = Math.max(...db.cursos.map(c => c.sales), 1);
        const colors = ["#f26522", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];
        
        container.innerHTML = db.cursos.map((c, i) => {
            const pct = Math.round((c.sales / maxSales) * 100);
            const shortName = c.nombre.replace("Curso de ", "").replace("Especialización de ", "");
            return `
            <div class="mb-2">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span style="font-size:0.78rem; font-weight:600; color:#374151;" title="${c.nombre}">${shortName.length > 22 ? shortName.substring(0,22)+'…' : shortName}</span>
                    <span class="fw-bold" style="font-size:0.82rem; color:${colors[i % colors.length]};">${c.sales}</span>
                </div>
                <div class="progress" style="height:8px; border-radius:4px;">
                    <div class="progress-bar" style="width:${pct}%; background:${colors[i % colors.length]}; border-radius:4px; transition: width 0.8s ease;"></div>
                </div>
            </div>`;
        }).join("");
    }

    // ── Panel de Datos Clave ──
    function renderKeyFacts(db, topCurso, lowCurso, ybCount, sjCount, mayoCount, junioCount) {
        const container = document.getElementById("key-facts-list");
        if (!container) return;

        const total = db.alumnos.length;
        const cursosConAlumnos = db.cursos.filter(c => c.sales > 0).length;
        const cursosSinAlumnos = db.cursos.filter(c => c.sales === 0).length;
        
        // Primer y último registro
        const sorted = [...db.alumnos].sort((a, b) => new Date(a.fechaRegistro) - new Date(b.fechaRegistro));
        const primero = sorted[0];
        const ultimo = sorted[sorted.length - 1];
        const primerFecha = primero ? new Date(primero.fechaRegistro).toLocaleDateString("es-AR", {day:'numeric', month:'short', year:'numeric'}) : "--";
        const ultimaFecha = ultimo ? new Date(ultimo.fechaRegistro).toLocaleDateString("es-AR", {day:'numeric', month:'short', year:'numeric'}) : "--";

        // Promedio de alumnos por curso activo
        const avgAlumnosPorCurso = cursosConAlumnos > 0 ? (total / cursosConAlumnos).toFixed(1) : 0;

        const facts = [
            { icon: "fa-user-plus", color: "#f26522", label: "Primer inscripto", value: primero ? primero.nombre : "--", sub: primerFecha },
            { icon: "fa-clock", color: "#3b82f6", label: "Último inscripto", value: ultimo ? ultimo.nombre : "--", sub: ultimaFecha },
            { icon: "fa-chart-bar", color: "#10b981", label: "Cursos con alumnos", value: `${cursosConAlumnos} de ${db.cursos.length}`, sub: `${cursosSinAlumnos} curso${cursosSinAlumnos !== 1 ? 's' : ''} sin inscriptos` },
            { icon: "fa-calculator", color: "#8b5cf6", label: "Prom. alumnos/curso", value: avgAlumnosPorCurso, sub: "por curso con alumnos" },
            { icon: "fa-trophy", color: "#f59e0b", label: "Disciplina líder", value: topCurso ? topCurso.nombre.replace("Curso de ", "") : "--", sub: `${topCurso ? topCurso.sales : 0} inscriptos` },
            { icon: "fa-calendar-day", color: "#ec4899", label: "Mes más activo", value: mayoCount >= junioCount ? "Mayo 2025" : "Junio 2025", sub: `${Math.max(mayoCount, junioCount)} inscripciones` },
            { icon: "fa-map-location-dot", color: "#0ea5e9", label: "Relación sedes", value: `${ybCount} : ${sjCount}`, sub: "Yerba Buena : San Juan 790" },
            { icon: "fa-percent", color: "#6366f1", label: "Cobertura de cursos", value: `${Math.round((cursosConAlumnos / db.cursos.length) * 100)}%`, sub: "de cursos tienen alumnos" },
        ];

        container.innerHTML = facts.map(f => `
            <div class="d-flex align-items-center gap-2 py-2" style="border-bottom: 1px solid #f1f5f9;">
                <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                     style="width:32px; height:32px; background:${f.color}22;">
                    <i class="fas ${f.icon}" style="color:${f.color}; font-size:0.75rem;"></i>
                </div>
                <div class="flex-grow-1 overflow-hidden">
                    <div class="text-muted" style="font-size:0.7rem;">${f.label}</div>
                    <div class="fw-bold text-truncate" style="font-size:0.82rem; color:#1e293b;" title="${f.value}">${f.value}</div>
                    <div class="text-muted" style="font-size:0.68rem;">${f.sub}</div>
                </div>
            </div>`).join("");
    }

    // Recent registrations dashboard table — versión extendida
    function renderRecentStudentsTable() {
        const container = document.getElementById("table-recent-students");
        if (!container) return;
        container.innerHTML = "";
        
        const recent = [...CAPELLI_DATABASE.alumnos]
            .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))
            .slice(0, 8);

        recent.forEach((a, idx) => {
            const tr = document.createElement("tr");
            const regDateStr = new Date(a.fechaRegistro).toLocaleDateString("es-AR", { day: 'numeric', month: 'short', year: '2-digit' });
            const sedeBadge = a.sede === "Yerba Buena"
                ? `<span class="badge" style="background:#f2652222; color:#f26522; font-size:0.72rem;">YB</span>`
                : `<span class="badge" style="background:#3b82f622; color:#3b82f6; font-size:0.72rem;">SJ</span>`;
            tr.innerHTML = `
                <td><strong style="color:#94a3b8;">#${a.id}</strong></td>
                <td><span class="fw-bold">${a.nombre}</span></td>
                <td><span class="text-muted small">${a.email}</span></td>
                <td><span class="text-muted small">${a.telefono}</span></td>
                <td>${sedeBadge} <small>${a.sede}</small></td>
                <td><span class="fw-semibold text-primary" style="font-size:0.82rem;">${a.cursoInscripto.replace("Curso de ", "")}</span></td>
                <td><span class="text-muted small">${regDateStr}</span></td>
            `;
            container.appendChild(tr);
        });
    }


    // ==========================================
    // 4. ADDED-VALUE BUSINESS INTELLIGENCE INSIGHTS
    // ==========================================
    function renderInsights() {
        const container = document.getElementById("bi-insights-container");
        if (!container) return;
        container.innerHTML = "";
        
        const db = CAPELLI_DATABASE;
        if (!db.alumnos || db.alumnos.length === 0) {
            container.innerHTML = `<div class="text-muted small p-3 text-center">No hay suficientes registros para compilar indicadores BI.</div>`;
            return;
        }
        const totalSubs = db.suscripciones.length;
        const activeSubs = db.suscripciones.filter(s => s.estado === "Activa").length;
        const expiredSubs = db.suscripciones.filter(s => s.estado === "Vencida").length;

        // 1. Churn & Retention Rates
        const churnRate = totalSubs > 0 ? parseFloat(((expiredSubs / totalSubs) * 100).toFixed(1)) : 0;
        const retentionRate = totalSubs > 0 ? parseFloat(((activeSubs / totalSubs) * 100).toFixed(1)) : 0;

        // 2. Branch distribution
        const ybCount = db.alumnos.filter(a => a.sede === "Yerba Buena").length;
        const sjCount = db.alumnos.filter(a => a.sede === "San Juan 790").length;
        const primarySede = ybCount > sjCount ? `Yerba Buena (${Math.round(ybCount/db.alumnos.length * 100)}%)` : `San Juan 790 (${Math.round(sjCount/db.alumnos.length * 100)}%)`;

        // 3. Peak hours according to logs
        const peakHrs = { morning: 0, evening: 0, offpeak: 0 };
        db.actividad.forEach(a => {
            const hr = new Date(a.fecha).getHours();
            if (hr >= 9 && hr <= 12) peakHrs.morning++;
            else if (hr >= 14 && hr <= 20) peakHrs.evening++;
            else peakHrs.offpeak++;
        });
        const peakTime = peakHrs.evening > peakHrs.morning ? "Tarde (14:00 - 20:00 hs)" : "Mañana (09:00 - 12:00 hs)";

        // 4. Lifetime Value projection (LTV)
        // LTV = Avg Ticket + (Monthly Sub Fee * Avg Duration * Retention Rate)
        // Assume avg duration 6 months
        const avgTicket = db.ingresos.filter(i => i.tipo === "Curso").reduce((sum, item) => sum + item.monto, 0) / db.alumnos.length;
        const ltv = Math.round(avgTicket + (18000 * 6 * (retentionRate / 100)));

        const insights = [
            {
                icon: "fa-chart-line",
                text: `<strong>Lifetime Value (LTV) del Alumno:</strong> Se estima un valor medio proyectado por alumno de <strong>$${ltv.toLocaleString("es-AR")}</strong> según tasas de permanencia actuales.`
            },
            {
                icon: "fa-shield-halved",
                text: `<strong>Retención del Alumnado:</strong> Mantenemos una tasa de fidelización mensual del <strong>${retentionRate}%</strong>. La tasa de abandono o Churn Rate se sitúa en un estable <strong>${churnRate}%</strong>.`
            },
            {
                icon: "fa-map-location-dot",
                text: `<strong>Focalización Territorial:</strong> La sede con mayor densidad estudiantil activa es <strong>${primarySede}</strong>. El campus San Juan 790 lidera las inscripciones del mes.`
            },
            {
                icon: "fa-clock",
                text: `<strong>Ocupación de la Plataforma Virtual:</strong> Los horarios pico de conexión de los alumnos se registran en la banda de la <strong>${peakTime}</strong>, ideal para notificaciones de tutorías.`
            }
        ];

        insights.forEach(ins => {
            const div = document.createElement("div");
            div.className = "alert-bi";
            div.innerHTML = `
                <span class="alert-bi-icon"><i class="fas ${ins.icon}"></i></span>
                <div>${ins.text}</div>
            `;
            container.appendChild(div);
        });
    }

    // ==========================================
    // 5. CHART.JS GRAPHICAL CHARTS
    // ==========================================
    function renderCharts() {
        const db = CAPELLI_DATABASE;

        // Group data by last 6 months dynamically based on database time context
        const endMonth = db.today.getMonth();
        const endYear = db.today.getFullYear();

        const monthsNames = [];
        const monthIndices = [];
        const monthLabelNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        for (let i = 5; i >= 0; i--) {
            let m = endMonth - i;
            let y = endYear;
            if (m < 0) {
                m += 12;
                y -= 1;
            }
            monthsNames.push(monthLabelNames[m]);
            monthIndices.push({ year: y, month: m });
        }
        
        // Dynamic income per month
        const ingresosPorMes = [0, 0, 0, 0, 0, 0];
        db.ingresos.forEach(i => {
            const d = new Date(i.fecha);
            const m = d.getMonth();
            const y = d.getFullYear();

            const idx = monthIndices.findIndex(mi => mi.year === y && mi.month === m);
            if (idx !== -1) {
                ingresosPorMes[idx] += i.monto;
            }
        });

        // Dynamic registration growth per month
        const altasPorMes = [0, 0, 0, 0, 0, 0];
        db.alumnos.forEach(a => {
            const d = new Date(a.fechaRegistro);
            const m = d.getMonth();
            const y = d.getFullYear();

            const idx = monthIndices.findIndex(mi => mi.year === y && mi.month === m);
            if (idx !== -1) {
                altasPorMes[idx]++;
            }
        });

        // Course distributions
        const courseLabels = db.cursos.map(c => c.nombre.replace("Curso de ", ""));
        const courseCounts = db.cursos.map(c => c.sales);

        // Chart 1: Line chart for monthly revenue (skip if canvas hidden)
        const ctxIngresosEl = document.getElementById("chart-ingresos");
        if (ctxIngresosEl && ctxIngresosEl.style.display !== 'none') {
            if (chartIngresosInstance) chartIngresosInstance.destroy();
            const ctxIngresos = ctxIngresosEl.getContext("2d");
            chartIngresosInstance = new Chart(ctxIngresos, {
                type: "line",
                data: {
                    labels: monthsNames,
                    datasets: [{
                        label: "Facturación ($ ARS)",
                        data: ingresosPorMes,
                        borderColor: "#f26522",
                        backgroundColor: "rgba(242, 101, 34, 0.05)",
                        borderWidth: 3,
                        tension: 0.35,
                        fill: true,
                        pointBackgroundColor: "#f26522",
                        pointRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { grid: { color: "#f1f5f9" }, ticks: { callback: value => `$${value/1000}k` } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // Chart 2: Bar chart for registration growth
        if (chartSubsInstance) chartSubsInstance.destroy();
        const ctxSubs = document.getElementById("chart-suscripciones").getContext("2d");
        chartSubsInstance = new Chart(ctxSubs, {
            type: "bar",
            data: {
                labels: monthsNames,
                datasets: [{
                    label: "Nuevos Alumnos",
                    data: altasPorMes,
                    backgroundColor: "#3b82f6",
                    borderRadius: 8,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: "#f1f5f9" } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Chart 3: Donut chart for course distributions
        if (chartCursosInstance) chartCursosInstance.destroy();
        const ctxCursos = document.getElementById("chart-cursos-pie").getContext("2d");
        chartCursosInstance = new Chart(ctxCursos, {
            type: "doughnut",
            data: {
                labels: courseLabels,
                datasets: [{
                    data: courseCounts,
                    backgroundColor: ["#f26522", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"],
                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                        labels: { boxWidth: 12, font: { size: 10 } }
                    }
                },
                cutout: "70%"
            }
        });
    }

    // ==========================================
    // 6. SECONDARY TABS & DETAILED TABLES
    // ==========================================

    // Dynamic rendering of Alumnos lists
    window.renderAlumnosTable = () => {
        const tbody = document.getElementById("table-alumnos-list");
        tbody.innerHTML = "";

        const search = document.getElementById("alumno-search").value.toLowerCase();
        const statusFilter = document.getElementById("alumno-filter-status").value;
        const sedeFilter = document.getElementById("alumno-filter-sede").value;

        const filtered = CAPELLI_DATABASE.alumnos.filter(a => {
            const matchesSearch = a.nombre.toLowerCase().includes(search) || a.email.toLowerCase().includes(search);
            const matchesStatus = statusFilter === "todos" || (statusFilter === "activos" && a.activo) || (statusFilter === "inactivos" && !a.activo);
            const matchesSede = sedeFilter === "todas" || a.sede === sedeFilter;
            return matchesSearch && matchesStatus && matchesSede;
        });

        filtered.forEach(a => {
            const tr = document.createElement("tr");
            const dateStr = new Date(a.fechaRegistro).toLocaleDateString("es-AR");
            const badgeClass = a.activo ? "active" : "inactive";
            const badgeText = a.activo ? "Activo" : "Inactivo";

            tr.innerHTML = `
                <td><strong>#${a.id}</strong></td>
                <td><span class="fw-bold">${a.nombre}</span></td>
                <td>${a.email}</td>
                <td>${a.telefono}</td>
                <td><span class="badge bg-light text-dark">${a.sede}</span></td>
                <td><span class="fw-semibold text-primary">${a.cursoInscripto.replace("Curso de ", "")}</span></td>
                <td>${dateStr}</td>
                <td><span class="badge-status ${badgeClass}">${badgeText}</span></td>
            `;
            tbody.appendChild(tr);
        });
    };

    // Performance table for courses - enhanced with real student counts
    window.renderCursosTable = () => {
        const tbody = document.getElementById("table-cursos-list");
        tbody.innerHTML = "";
        
        const db = CAPELLI_DATABASE;
        const cardsContainer = document.getElementById("cursos-performance-cards");
        cardsContainer.innerHTML = "";
        const totalAlumnos = db.alumnos.length;

        // Sort to find best and worst
        const sortedBySales = [...db.cursos].sort((a, b) => b.sales - a.sales);
        const bestCurso = sortedBySales[0];
        const worstCurso = sortedBySales[sortedBySales.length - 1];
        const cursosConAlumnos = db.cursos.filter(c => c.sales > 0).length;

        // Top 3 courses mini cards
        cardsContainer.innerHTML = `
            <div class="col-md-4">
                <div class="panel-card border-start border-success border-4 h-100">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="text-muted uppercase mb-1">Curso con Mayor Demanda</h6>
                            <h5 class="fw-bold text-success m-0">${bestCurso.nombre.replace('Curso de ','')}</h5>
                            <p class="text-muted small mt-2 mb-0">
                                <strong>${bestCurso.sales} alumno${bestCurso.sales !== 1 ? 's' : ''}</strong> inscriptos
                                &bull; ${totalAlumnos > 0 ? Math.round((bestCurso.sales/totalAlumnos)*100) : 0}% del total
                            </p>
                        </div>
                        <div class="fs-1 text-success opacity-75"><i class="fas fa-crown"></i></div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="panel-card border-start border-warning border-4 h-100">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="text-muted uppercase mb-1">Menor Demanda Actual</h6>
                            <h5 class="fw-bold text-warning m-0">${worstCurso.nombre.replace('Curso de ','')}</h5>
                            <p class="text-muted small mt-2 mb-0">
                                <strong>${worstCurso.sales} alumno${worstCurso.sales !== 1 ? 's' : ''}</strong> inscriptos &bull; Oportunidad de campaña
                            </p>
                        </div>
                        <div class="fs-1 text-warning opacity-75"><i class="fas fa-triangle-exclamation"></i></div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="panel-card border-start border-info border-4 h-100">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="text-muted uppercase mb-1">Cobertura de Cursos</h6>
                            <h5 class="fw-bold text-info m-0">${cursosConAlumnos} / ${db.cursos.length}</h5>
                            <p class="text-muted small mt-2 mb-0">
                                Disciplinas con alumnos activos
                                &bull; ${db.cursos.length - cursosConAlumnos} sin inscriptos aún
                            </p>
                        </div>
                        <div class="fs-1 text-info opacity-75"><i class="fas fa-graduation-cap"></i></div>
                    </div>
                </div>
            </div>
        `;

        // Sort by sales descending for table
        [...db.cursos].sort((a, b) => b.sales - a.sales).forEach(c => {
            const tr = document.createElement("tr");
            const pctTotal = totalAlumnos > 0 ? ((c.sales / totalAlumnos) * 100).toFixed(1) : 0;
            const barColor = c.sales === bestCurso.sales ? '#10b981' : (c.sales === 0 ? '#ef4444' : '#3b82f6');
            
            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${c.img}" alt="${c.nombre}" width="35" height="35" class="rounded" style="object-fit:cover;">
                        <span class="fw-bold">${c.nombre.replace('Curso de ','')}</span>
                    </div>
                </td>
                <td class="text-center">
                    <span class="fw-bold fs-5" style="color:${barColor}">${c.sales}</span>
                    <div style="font-size:0.7rem; color:#94a3b8;">${pctTotal}% del total</div>
                </td>
                <td>
                    <div class="progress" style="height:8px; border-radius:4px; min-width:80px;">
                        <div class="progress-bar" style="width:${totalAlumnos > 0 ? (c.sales/Math.max(...db.cursos.map(x=>x.sales),1))*100 : 0}%; background:${barColor}; border-radius:4px;"></div>
                    </div>
                    <small class="text-muted">${c.activos} activo${c.activos !== 1 ? 's' : ''}</small>
                </td>
                <td><i class="fas fa-star text-warning me-1"></i> <strong>${c.rating}</strong></td>
                <td><span class="badge bg-light text-dark">${c.duracion}</span></td>
                <td class="fw-semibold">$${c.precio.toLocaleString("es-AR")}</td>
            `;
            tbody.appendChild(tr);
        });
    };

    // Subscriptions tab
    window.renderSuscripcionesTable = () => {
        const tbody = document.getElementById("table-suscripciones-list");
        tbody.innerHTML = "";

        const search = document.getElementById("sub-search").value.toLowerCase();
        const statusFilter = document.getElementById("sub-filter-status").value;
        const db = CAPELLI_DATABASE;

        // Update counts
        const activeCount = db.suscripciones.filter(s => s.estado === "Activa").length;
        const expiredCount = db.suscripciones.filter(s => s.estado === "Vencida").length;
        const retentionRate = db.suscripciones.length > 0 ? Math.round((activeCount / db.suscripciones.length) * 100) : 0;

        document.getElementById("sub-active-cnt").textContent = activeCount;
        document.getElementById("sub-expired-cnt").textContent = expiredCount;
        document.getElementById("sub-retention-rate").textContent = `${retentionRate}%`;

        const filtered = db.suscripciones.filter(s => {
            const matchesSearch = s.alumnoNombre.toLowerCase().includes(search);
            const matchesStatus = statusFilter === "todos" || s.estado === statusFilter;
            return matchesSearch && matchesStatus;
        });

        filtered.forEach(s => {
            const tr = document.createElement("tr");
            const startStr = new Date(s.fechaInicio).toLocaleDateString("es-AR");
            const venceStr = new Date(s.fechaVence).toLocaleDateString("es-AR");
            const badgeClass = s.estado === "Activa" ? "active" : "expired";
            
            tr.innerHTML = `
                <td><span class="fw-bold">${s.alumnoNombre}</span></td>
                <td><span class="fw-semibold text-secondary">${s.cursoNombre.replace("Curso de ", "")}</span></td>
                <td class="fw-bold text-success">$${s.montoMensual.toLocaleString("es-AR")}</td>
                <td>${startStr}</td>
                <td>${venceStr}</td>
                <td><span class="badge-status ${badgeClass}">${s.estado}</span></td>
            `;
            tbody.appendChild(tr);
        });
    };

    // Revenue Ledger tab
    window.renderIngresosTable = () => {
        const tbody = document.getElementById("table-ingresos-list");
        tbody.innerHTML = "";

        const tipoFilter = document.getElementById("ingresos-filter-tipo").value;
        const db = CAPELLI_DATABASE;

        // Compile counts
        const total = db.ingresos.reduce((sum, item) => sum + item.monto, 0);
        const cursosVal = db.ingresos.filter(i => i.tipo === "Curso").reduce((sum, item) => sum + item.monto, 0);
        const subsVal = db.ingresos.filter(i => i.tipo === "Suscripción").reduce((sum, item) => sum + item.monto, 0);
        const avg = db.alumnos.length > 0 ? Math.round(cursosVal / db.alumnos.length) : 0;

        document.getElementById("ingresos-total-hist").textContent = `$${total.toLocaleString("es-AR")}`;
        document.getElementById("ingresos-total-cursos").textContent = `$${cursosVal.toLocaleString("es-AR")}`;
        document.getElementById("ingresos-total-subs").textContent = `$${subsVal.toLocaleString("es-AR")}`;
        document.getElementById("ingresos-prom-alumno").textContent = `$${avg.toLocaleString("es-AR")}`;

        const filtered = db.ingresos.filter(i => tipoFilter === "todos" || i.tipo === tipoFilter);

        filtered.forEach(i => {
            const tr = document.createElement("tr");
            const dateStr = new Date(i.fecha).toLocaleDateString("es-AR");
            const badgeClass = i.tipo === "Curso" ? "bg-primary-subtle text-primary" : "bg-success-subtle text-success";
            
            tr.innerHTML = `
                <td><strong>#TX-${i.id.toString().padStart(5, '0')}</strong></td>
                <td><span class="fw-bold">${i.alumnoNombre}</span></td>
                <td>${i.concepto}</td>
                <td class="fw-bold text-success">$${i.monto.toLocaleString("es-AR")}</td>
                <td>${dateStr}</td>
                <td><span class="badge ${badgeClass}">${i.tipo}</span></td>
            `;
            tbody.appendChild(tr);
        });
    };

    // Report preview dynamic generation
    window.renderReportPreview = () => {
        const type = document.getElementById("report-type").value;
        const preview = document.getElementById("report-preview-text");
        
        let reportText = `==================================================\n`;
        reportText += `CLUB CAPELLI - REPORTE DE CONTROL DE GESTIÓN\n`;
        reportText += `Fecha Emisión: 30 de Mayo de 2026\n`;
        reportText += `Filtro de Datos: Consolidado Anual\n`;
        reportText += `==================================================\n\n`;

        const db = CAPELLI_DATABASE;

        if (type === "alumnos") {
            reportText += `TIPO REPORTE: LISTADO DE ALUMNOS REGISTRADOS\n`;
            reportText += `Cantidad de Registros: ${db.alumnos.length} estudiantes\n\n`;
            reportText += `ID   | Alumno                 | Sede         | Curso                   | Estado\n`;
            reportText += `---------------------------------------------------------------------------------\n`;
            db.alumnos.slice(0, 15).forEach(a => {
                const name = a.nombre.padEnd(22, ' ').substring(0, 22);
                const sede = a.sede.padEnd(12, ' ').substring(0, 12);
                const curso = a.cursoInscripto.replace("Curso de ", "").padEnd(23, ' ').substring(0, 23);
                const active = a.activo ? "Activo  " : "Inactivo";
                reportText += `#${a.id.toString().padEnd(3)} | ${name} | ${sede} | ${curso} | ${active}\n`;
            });
            reportText += `\n... y ${db.alumnos.length - 15} estudiantes más registrados en la base de datos de Excel.`;
        } else if (type === "cursos") {
            reportText += `TIPO REPORTE: RENDIMIENTO COMERCIAL DE CURSOS\n`;
            reportText += `Cantidad de Cursos: ${db.cursos.length} disciplinas\n\n`;
            reportText += `Curso                          | Matrícula | Ventas | Facturación | Calificación\n`;
            reportText += `---------------------------------------------------------------------------------\n`;
            db.cursos.forEach(c => {
                const name = c.nombre.padEnd(30, ' ').substring(0, 30);
                const price = `$${c.precio.toLocaleString("es-AR")}`.padEnd(9);
                const sales = c.sales.toString().padEnd(6);
                const rev = `$${c.revenue.toLocaleString("es-AR")}`.padEnd(11);
                reportText += `${name} | ${price} | ${sales} | ${rev} | Star: ${c.rating}\n`;
            });
        } else if (type === "suscripciones") {
            reportText += `TIPO REPORTE: ESTADO DE SUSCRIPCIONES\n`;
            const active = db.suscripciones.filter(s => s.estado === "Activa").length;
            const expired = db.suscripciones.filter(s => s.estado === "Vencida").length;
            reportText += `Total Membresías: ${db.suscripciones.length} | Activas: ${active} | Vencidas: ${expired}\n\n`;
            reportText += `Alumno                 | Curso Asociado          | Inicio     | Vence      | Acceso\n`;
            reportText += `---------------------------------------------------------------------------------\n`;
            db.suscripciones.slice(0, 15).forEach(s => {
                const name = s.alumnoNombre.padEnd(22, ' ').substring(0, 22);
                const cName = s.cursoNombre.replace("Curso de ", "").padEnd(23, ' ').substring(0, 23);
                const start = new Date(s.fechaInicio).toLocaleDateString("es-AR").padEnd(10);
                const vence = new Date(s.fechaVence).toLocaleDateString("es-AR").padEnd(10);
                reportText += `${name} | ${cName} | ${start} | ${vence} | ${s.estado}\n`;
            });
            reportText += `\n... y ${db.suscripciones.length - 15} membresías mensuales más registradas en la base contable.`;
        } else if (type === "ingresos") {
            reportText += `TIPO REPORTE: FACTURACIÓN HISTÓRICA DETALLADA\n`;
            const total = db.ingresos.reduce((sum, item) => sum + item.monto, 0);
            reportText += `Total Cobros Recibidos: $${total.toLocaleString("es-AR")} ARS\n\n`;
            reportText += `ID Transacción | Alumno                 | Concepto Cobro                    | Monto     \n`;
            reportText += `---------------------------------------------------------------------------------\n`;
            db.ingresos.slice(0, 15).forEach(i => {
                const txId = `#TX-${i.id.toString().padStart(5, '0')}`.padEnd(14);
                const name = i.alumnoNombre.padEnd(22, ' ').substring(0, 22);
                const conc = i.concepto.padEnd(33, ' ').substring(0, 33);
                const val = `$${i.monto.toLocaleString("es-AR")}`.padEnd(9);
                reportText += `${txId} | ${name} | ${conc} | ${val}\n`;
            });
            reportText += `\n... y ${db.ingresos.length - 15} transacciones más de cobro en libro de diario.`;
        } else if (type === "ejecutivo") {
            reportText += `TIPO REPORTE: RESUMEN EJECUTIVO GENERAL (BI STRATEGY)\n\n`;
            reportText += `1. INDICADORES DE ALUMNOS & MATRÍCULAS\n`;
            reportText += `   - Total de alumnos registrados: ${db.alumnos.length}\n`;
            reportText += `   - Alumnos activos (cursando): ${db.alumnos.filter(a => a.activo).length}\n`;
            reportText += `   - Alumnos inactivos: ${db.alumnos.filter(a => !a.activo).length}\n\n`;
            reportText += `2. ESTADÍSTICA DE ACCESO MENSUAL (MEMBRESÍAS)\n`;
            const active = db.suscripciones.filter(s => s.estado === "Activa").length;
            const expired = db.suscripciones.filter(s => s.estado === "Vencida").length;
            reportText += `   - Suscripciones Cursos habilitadas: ${active}\n`;
            reportText += `   - Suscripciones Cursos suspendidas: ${expired}\n`;
            reportText += `   - Retención de estudiantes: ${db.suscripciones.length > 0 ? Math.round((active/db.suscripciones.length)*100) : 0}%\n\n`;
            reportText += `3. INFORMACIÓN FINANCIERA CONSOLIDADA\n`;
            const total = db.ingresos.reduce((sum, item) => sum + item.monto, 0);
            const coursesVal = db.ingresos.filter(i => i.tipo === "Curso").reduce((sum, item) => sum + item.monto, 0);
            const subsVal = db.ingresos.filter(i => i.tipo === "Suscripción").reduce((sum, item) => sum + item.monto, 0);
            reportText += `   - Facturación Total acumulada: $${total.toLocaleString("es-AR")}\n`;
            reportText += `   - Ventas registradas de Cursos: $${coursesVal.toLocaleString("es-AR")}\n`;
            reportText += `   - Recaudación por mensualidades: $${subsVal.toLocaleString("es-AR")}\n`;
            reportText += `   - Ticket promedio por estudiante: $${(db.alumnos.length > 0 ? Math.round(coursesVal / db.alumnos.length) : 0).toLocaleString("es-AR")}\n`;
        }

        preview.innerHTML = `<pre style="margin:0; white-space: pre-wrap;">${reportText}</pre>`;
    };

    function setupSecondaryFilters() {
        // Manual sheets sync button trigger
        const btnSyncSheets = document.getElementById("btn-sync-sheets");
        if (btnSyncSheets) {
            btnSyncSheets.addEventListener("click", (e) => {
                e.preventDefault();
                // Add micro-animation rotate class
                const icon = btnSyncSheets.querySelector("i");
                if (icon) icon.classList.add("fa-spin");
                syncGoogleSheets(true);
            });
        }

        // Alumnos filters
        document.getElementById("alumno-search").addEventListener("input", renderAlumnosTable);
        document.getElementById("alumno-filter-status").addEventListener("change", renderAlumnosTable);
        document.getElementById("alumno-filter-sede").addEventListener("change", renderAlumnosTable);

        // Subscriptions filters
        document.getElementById("sub-search").addEventListener("input", renderSuscripcionesTable);
        document.getElementById("sub-filter-status").addEventListener("change", renderSuscripcionesTable);

        // Incomes filters
        document.getElementById("ingresos-filter-tipo").addEventListener("change", renderIngresosTable);

        // Report preview trigger
        document.getElementById("report-type").addEventListener("change", renderReportPreview);

        // Save simulated parameters
        document.getElementById("btn-save-credentials").addEventListener("click", () => {
            const pwd = document.getElementById("cfg-new-pwd").value;
            if (pwd.trim()) {
                showToast("Configuración", "Contraseña actualizada correctamente en base de datos.", "success");
                document.getElementById("cfg-new-pwd").value = "";
            } else {
                showToast("Error", "Ingrese una contraseña válida.", "error");
            }
        });

        document.getElementById("btn-save-cfg-params").addEventListener("click", () => {
            const fee = document.getElementById("cfg-sub-fee").value;
            showToast("Configuración", `Parámetros del sistema actualizados. Cuota mensual fijada en $${fee}.`, "success");
        });

        // Fast export buttons
        document.getElementById("btn-export-alumnos").addEventListener("click", () => {
            exportAlumnosExcel();
        });
    }

    // ==========================================
    // 7. REPORTS GENERATION & EXPORTS ENGINE
    // ==========================================

    // ─── A. CSV EXPORTS ───────────────────────
    function exportCSV(type) {
        const db = CAPELLI_DATABASE;
        let csvContent = "";
        let fileName = `Reporte_${type}.csv`;

        if (type === "alumnos") {
            csvContent = "ID,Nombre,Email,Telefono,Sede,Curso Inscripto,Fecha Registro,Estado\n";
            db.alumnos.forEach(a => {
                const date = new Date(a.fechaRegistro).toLocaleDateString("es-AR");
                const state = a.activo ? "Activo" : "Inactivo";
                csvContent += `"${a.id}","${a.nombre}","${a.email}","${a.telefono}","${a.sede}","${a.cursoInscripto}","${date}","${state}"\n`;
            });
        } else if (type === "cursos") {
            csvContent = "ID,Curso,Matricula,Vistas,Ventas,Facturado Matricula,Alumnos Activos,Calificacion\n";
            db.cursos.forEach(c => {
                csvContent += `"${c.id}","${c.nombre}","${c.precio}","${c.views}","${c.sales}","${c.revenue}","${c.activos}","${c.rating}"\n`;
            });
        } else if (type === "suscripciones") {
            csvContent = "Alumno,Curso,Monto Mensual,Fecha Inicio,Fecha Vence,Estado\n";
            db.suscripciones.forEach(s => {
                const start = new Date(s.fechaInicio).toLocaleDateString("es-AR");
                const vence = new Date(s.fechaVence).toLocaleDateString("es-AR");
                csvContent += `"${s.alumnoNombre}","${s.cursoNombre}","${s.montoMensual}","${start}","${vence}","${s.estado}"\n`;
            });
        } else if (type === "ingresos") {
            csvContent = "ID Transaccion,Alumno,Concepto,Monto,Fecha,Tipo\n";
            db.ingresos.forEach(i => {
                const date = new Date(i.fecha).toLocaleDateString("es-AR");
                csvContent += `"TX-${i.id}","${i.alumnoNombre}","${i.concepto}","${i.monto}","${date}","${i.tipo}"\n`;
            });
        } else if (type === "ejecutivo") {
            csvContent = "Metrica,Valor\n";
            csvContent += `Alumnos Totales,${db.alumnos.length}\n`;
            csvContent += `Alumnos Activos,${db.alumnos.filter(a => a.activo).length}\n`;
            csvContent += `Suscripciones Cursos Activas,${db.suscripciones.filter(s => s.estado === "Activa").length}\n`;
            csvContent += `Suscripciones Cursos Vencidas,${db.suscripciones.filter(s => s.estado === "Vencida").length}\n`;
            csvContent += `Facturacion Acumulada Cursos,${db.ingresos.filter(i => i.tipo === "Curso").reduce((sum, item) => sum + item.monto, 0)}\n`;
            csvContent += `Facturacion Acumulada Cuotas,${db.ingresos.filter(i => i.tipo === "Suscripción").reduce((sum, item) => sum + item.monto, 0)}\n`;
        }

        downloadBlob(csvContent, fileName, "text/csv;charset=utf-8;");
    }

    function downloadBlob(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // ─── B. EXCEL EXPORTS (SHEETJS) ────────────
    function exportExcel(type) {
        const db = CAPELLI_DATABASE;
        let data = [];
        let sheetName = "Reporte";

        if (type === "alumnos") {
            data = db.alumnos.map(a => ({
                ID: a.id,
                Nombre: a.nombre,
                Email: a.email,
                Telefono: a.telefono,
                Sede: a.sede,
                "Curso Inscrito": a.cursoInscripto,
                "Fecha Alta": new Date(a.fechaRegistro).toLocaleDateString("es-AR"),
                Estado: a.activo ? "Activo" : "Inactivo"
            }));
            sheetName = "Alumnos";
        } else if (type === "cursos") {
            data = db.cursos.map(c => ({
                ID: c.id,
                Curso: c.nombre,
                Matrícula: c.precio,
                Vistas: c.views,
                Ventas: c.sales,
                "Total Facturado": c.revenue,
                "Alumnos Activos": c.activos,
                Calificación: c.rating
            }));
            sheetName = "Cursos";
        } else if (type === "suscripciones") {
            data = db.suscripciones.map(s => ({
                Alumno: s.alumnoNombre,
                Curso: s.cursoNombre,
                "Monto Mensual": s.montoMensual,
                "Fecha Inicio": new Date(s.fechaInicio).toLocaleDateString("es-AR"),
                "Fecha Vencimiento": new Date(s.fechaVence).toLocaleDateString("es-AR"),
                Estado: s.estado
            }));
            sheetName = "Suscripciones";
        } else if (type === "ingresos") {
            data = db.ingresos.map(i => ({
                "ID Transacción": `TX-${i.id}`,
                Alumno: i.alumnoNombre,
                Concepto: i.concepto,
                Monto: i.monto,
                Fecha: new Date(i.fecha).toLocaleDateString("es-AR"),
                Tipo: i.tipo
            }));
            sheetName = "Facturación";
        } else if (type === "ejecutivo") {
            data = [
                { Indicador: "Total alumnos registrados", Valor: db.alumnos.length },
                { Indicador: "Alumnos activos", Valor: db.alumnos.filter(a => a.activo).length },
                { Indicador: "Suscripciones activas", Valor: db.suscripciones.filter(s => s.estado === "Activa").length },
                { Indicador: "Suscripciones vencidas", Valor: db.suscripciones.filter(s => s.estado === "Vencida").length },
                { Indicador: "Tasa de fidelidad mensual", Valor: db.suscripciones.length > 0 ? `${Math.round((db.suscripciones.filter(s => s.estado === "Activa").length / db.suscripciones.length) * 100)}%` : "0%" },
                { Indicador: "Facturación total acumulada", Valor: db.ingresos.reduce((sum, item) => sum + item.monto, 0) },
                { Indicador: "Facturación por Cursos", Valor: db.ingresos.filter(i => i.tipo === "Curso").reduce((sum, item) => sum + item.monto, 0) },
                { Indicador: "Facturación por Mensualidades", Valor: db.ingresos.filter(i => i.tipo === "Suscripción").reduce((sum, item) => sum + item.monto, 0) }
            ];
            sheetName = "Resumen Ejecutivo";
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `Reporte_Capelli_${sheetName}.xlsx`);
    }

    function exportAlumnosExcel() {
        exportExcel("alumnos");
    }

    // ─── C. PDF EXPORTS (JSPDF + AUTOTABLE) ────
    function exportPDF(type) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("p", "pt", "a4");
        const db = CAPELLI_DATABASE;
        const dateStr = new Date().toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' });

        // Add Header Frame with Brand Identity
        doc.setFillColor(15, 23, 42); // slate 900
        doc.rect(40, 40, 515, 60, "F");

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text("CLUB CAPELLI - PANEL DE CONTROL BI", 55, 75);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(242, 101, 34); // orange brand
        doc.text(`REPORTE GENERAL: ${type.toUpperCase()}`, 55, 90);

        doc.setTextColor(100, 116, 139); // slate 500
        doc.setFontSize(9);
        doc.text(`Fecha Emisión: ${dateStr}`, 40, 125);
        doc.text("Fuente de Datos: Conexión Activa Excel Consolidado", 320, 125);

        doc.line(40, 132, 555, 132);

        // Process tables according to selected type
        if (type === "alumnos") {
            const headers = [["ID", "Nombre", "Email", "Sede", "Curso", "Estado"]];
            const rows = db.alumnos.slice(0, 30).map(a => [
                a.id,
                a.nombre,
                a.email,
                a.sede,
                a.cursoInscripto.replace("Curso de ", ""),
                a.activo ? "Activo" : "Inactivo"
            ]);

            doc.autoTable({
                head: headers,
                body: rows,
                startY: 150,
                styles: { fontSize: 8, font: "Helvetica" },
                headStyles: { fillColor: [242, 101, 34] },
                margin: { left: 40, right: 40 }
            });

            if (db.alumnos.length > 30) {
                const finalY = doc.lastAutoTable.finalY + 20;
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(`... y ${db.alumnos.length - 30} estudiantes registrados más. Descargue la versión Excel para el padrón completo.`, 40, finalY);
            }
        } else if (type === "cursos") {
            const headers = [["Curso", "Precio", "Vistas", "Ventas", "Facturado", "Rating"]];
            const rows = db.cursos.map(c => [
                c.nombre,
                `$${c.precio.toLocaleString("es-AR")}`,
                c.views,
                c.sales,
                `$${c.revenue.toLocaleString("es-AR")}`,
                c.rating
            ]);

            doc.autoTable({
                head: headers,
                body: rows,
                startY: 150,
                styles: { fontSize: 8, font: "Helvetica" },
                headStyles: { fillColor: [59, 130, 246] },
                margin: { left: 40, right: 40 }
            });
        } else if (type === "suscripciones") {
            const headers = [["Alumno", "Curso", "Cuota", "Inicio", "Vence", "Estado"]];
            const rows = db.suscripciones.slice(0, 30).map(s => [
                s.alumnoNombre,
                s.cursoNombre.replace("Curso de ", ""),
                `$${s.montoMensual.toLocaleString("es-AR")}`,
                new Date(s.fechaInicio).toLocaleDateString("es-AR"),
                new Date(s.fechaVence).toLocaleDateString("es-AR"),
                s.estado
            ]);

            doc.autoTable({
                head: headers,
                body: rows,
                startY: 150,
                styles: { fontSize: 8, font: "Helvetica" },
                headStyles: { fillColor: [16, 185, 129] },
                margin: { left: 40, right: 40 }
            });
        } else if (type === "ingresos") {
            const headers = [["Código TX", "Alumno", "Concepto de Pago", "Monto", "Fecha", "Tipo"]];
            const rows = db.ingresos.slice(0, 30).map(i => [
                `TX-${i.id}`,
                i.alumnoNombre,
                i.concepto,
                `$${i.monto.toLocaleString("es-AR")}`,
                new Date(i.fecha).toLocaleDateString("es-AR"),
                i.tipo
            ]);

            doc.autoTable({
                head: headers,
                body: rows,
                startY: 150,
                styles: { fontSize: 8, font: "Helvetica" },
                headStyles: { fillColor: [139, 92, 246] },
                margin: { left: 40, right: 40 }
            });
        } else if (type === "ejecutivo") {
            // General Executive overview rendered visually in PDF
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(15, 23, 42);
            doc.text("RESUMEN DE METRICAS PRINCIPALES", 40, 160);

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);

            let yOffset = 190;
            const activeSubs = db.suscripciones.filter(s => s.estado === "Activa").length;
            const expiredSubs = db.suscripciones.filter(s => s.estado === "Vencida").length;
            const totalIncomes = db.ingresos.reduce((sum, item) => sum + item.monto, 0);

            const items = [
                `Total de Alumnos Registrados: ${db.alumnos.length}`,
                `Alumnos Activos en Clases: ${db.alumnos.filter(a => a.activo).length}`,
                `Suscripciones Activas Habilitadas: ${activeSubs}`,
                `Suscripciones Vencidas Suspendidas: ${expiredSubs}`,
                `Tasa de Retención Estudiantil: ${db.suscripciones.length > 0 ? Math.round((activeSubs / db.suscripciones.length)*100) : 0}%`,
                `Facturación Consolidada Histórica: $${totalIncomes.toLocaleString("es-AR")} ARS`,
                `Facturación Específica por Inscripción Cursos: $${db.ingresos.filter(i => i.tipo === "Curso").reduce((sum, item) => sum + item.monto, 0).toLocaleString("es-AR")} ARS`,
                `Facturación Específica por Cuotas de Suscripción: $${db.ingresos.filter(i => i.tipo === "Suscripción").reduce((sum, item) => sum + item.monto, 0).toLocaleString("es-AR")} ARS`
            ];

            items.forEach(item => {
                doc.text(`•  ${item}`, 50, yOffset);
                yOffset += 22;
            });
        }

        doc.save(`Reporte_ClubCapelli_${type}.pdf`);
    }

    // ─── D. REPORT PREVIEW & BINDINGS ──────────
    window.renderReportPreview = () => {
        const typeEl = document.getElementById("report-type");
        const previewEl = document.getElementById("report-preview-text");
        if (!typeEl || !previewEl) return;
        
        const type = typeEl.value;
        const db = CAPELLI_DATABASE;
        const totalAlumnos = db.alumnos.length;
        const totalCursos = db.cursos.length;
        const totalRev = db.ingresos.reduce((sum, item) => sum + item.monto, 0);
        const today = new Date().toLocaleDateString('es-AR');

        let text = `========================================================\n`;
        text += `       SIMULACIÓN DE ESTRUCTURA DEL REPORTE\n`;
        text += `========================================================\n\n`;
        text += `FECHA DE EMISIÓN: ${today}\n`;
        text += `SISTEMA: Capelli BI Reporting Module\n\n`;

        if (type === "alumnos") {
            text += `TIPO: Listado de Alumnos Completo\n`;
            text += `REGISTROS A EXPORTAR: ${totalAlumnos}\n\n`;
            text += `Columnas incluidas:\n - ID Interno\n - Nombre y Apellido\n - Email\n - Teléfono\n - Sede Asignada\n - Curso Inscripto\n - Fecha de Alta\n - Estado del Alumno\n\n`;
            text += `Observación: Este padrón incluye tanto a los alumnos activos como a los que se encuentran inactivos o con la suscripción vencida.`;
        } else if (type === "cursos") {
            text += `TIPO: Rendimiento Comercial de Cursos\n`;
            text += `REGISTROS A EXPORTAR: ${totalCursos} disciplinas\n\n`;
            text += `Columnas incluidas:\n - Nombre del Curso\n - Precio Matrícula\n - Vistas Catálogo\n - Ventas Realizadas\n - Total Facturado\n - Alumnos Activos\n - Calificación Promedio\n\n`;
            text += `Observación: Útil para identificar qué disciplinas requieren ajustes en la inversión publicitaria.`;
        } else if (type === "suscripciones") {
            text += `TIPO: Estado de Suscripciones\n`;
            text += `REGISTROS A EXPORTAR: ${db.suscripciones.length}\n\n`;
            text += `Columnas incluidas:\n - Alumno\n - Curso Asociado\n - Monto Mensual de Cuota\n - Fecha de Inicio\n - Fecha de Próximo Vencimiento\n - Estado Financiero\n\n`;
            text += `Observación: Reporte ideal para el equipo de cobranzas y seguimiento de retención estudiantil.`;
        } else if (type === "ingresos") {
            text += `TIPO: Resumen de Facturación Contable\n`;
            text += `REGISTROS A EXPORTAR: ${db.ingresos.length} transacciones\n`;
            text += `FACTURACIÓN TOTAL IDENTIFICADA: $${totalRev.toLocaleString("es-AR")}\n\n`;
            text += `Columnas incluidas:\n - ID de Transacción\n - Alumno Pagador\n - Concepto del Pago\n - Monto Percibido\n - Fecha de Cobro\n - Tipo (Curso/Suscripción)\n\n`;
            text += `Observación: Refleja los ingresos teóricos proyectados según los registros.`;
        } else if (type === "ejecutivo") {
            text += `TIPO: Resumen Ejecutivo (KPIs)\n`;
            text += `METRICAS CLAVE A EXPORTAR: 8 indicadores consolidados\n\n`;
            text += `Este reporte generará una tabla simple con los totales globales:\n`;
            text += ` - Alumnos Totales\n - Alumnos Activos\n - Suscripciones al Día\n - Suscripciones Atrasadas\n - Tasa de Retención (%)\n - Facturación Global Acumulada\n\n`;
        }

        previewEl.innerText = text;
    };

    const btnGenerateReport = document.getElementById("btn-generate-report");
    const reportTypeSelect = document.getElementById("report-type");
    if (btnGenerateReport && reportTypeSelect) {
        reportTypeSelect.addEventListener("change", renderReportPreview);
        
        btnGenerateReport.addEventListener("click", () => {
            const formatEl = document.querySelector('input[name="report-format"]:checked');
            if (!formatEl) return;
            const format = formatEl.value;
            const type = reportTypeSelect.value;
            
            const originalText = btnGenerateReport.innerHTML;
            btnGenerateReport.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i> Generando...`;
            btnGenerateReport.disabled = true;

            setTimeout(() => {
                try {
                    if (format === "pdf") {
                        exportPDF(type);
                    } else if (format === "excel" || format === "csv") {
                        exportExcel(type);
                    }
                } catch (e) {
                    console.error("Error generating report", e);
                    showToast("Error", "Se produjo un error al intentar generar el reporte.", "error");
                }
                btnGenerateReport.innerHTML = originalText;
                btnGenerateReport.disabled = false;
            }, 800);
        });
    }

    // ==========================================================================
    // 8. INTERACTIVE EXCEL DYNAMIC PARSER (DRAG & DROP)
    // ==========================================================================
    const fileInput = document.getElementById('excel-upload-input');
    const dropzone = document.getElementById('excel-dropzone');
    const successMsg = document.getElementById('excel-success-msg');

    if (fileInput && dropzone) {
        // Drag over visual feedback
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.parentElement.style.backgroundColor = "rgba(16, 185, 129, 0.08)";
                dropzone.parentElement.style.borderColor = "#10b981";
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.parentElement.style.backgroundColor = "rgba(16, 185, 129, 0.02)";
                dropzone.parentElement.style.borderColor = "#10b981";
            }, false);
        });

        // Drop file event
        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                handleExcelFile(files[0]);
            }
        });

        // File input click change event
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleExcelFile(e.target.files[0]);
            }
        });
    }

    function handleExcelFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Parse rows to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    showToast("Archivo vacío", "El archivo cargado está vacío o no tiene un formato de Excel válido.", "error");
                    return;
                }
                
                processUploadedExcelData(jsonData);
                
                // Show dynamic success feedback
                successMsg.classList.remove('d-none');
                dropzone.classList.add('d-none');
                showToast("Excel cargado", `${jsonData.length} registros importados correctamente.`, "success");
                
                setTimeout(() => {
                    successMsg.classList.add('d-none');
                    dropzone.classList.remove('d-none');
                }, 4000);
            } catch (err) {
                console.error(err);
                showToast("Error de proceso", "Error al procesar el archivo Excel. Verifique que las columnas tengan títulos correctos.", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function processUploadedExcelData(rows) {
        const newAlumnos = [];
        const newIngresos = [];
        const newSuscripciones = [];
        const newActividad = [];
        let txId = 1;
        
        // Helper to match column names flexibly (accent-insensitive, case-insensitive, partial match)
        const getVal = (rowObj, possibleKeys) => {
            for (const key of Object.keys(rowObj)) {
                const cleanKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                if (possibleKeys.some(pk => cleanKey === pk || cleanKey.includes(pk) || pk.includes(cleanKey))) {
                    const val = rowObj[key];
                    if (val !== undefined && val !== null && val !== "") return val;
                }
            }
            return null;
        };

        rows.forEach((row, index) => {
            // Support both direct column names (from Google Forms) and flexible partial matching
            const firstName = getVal(row, ["nombre", "alumno", "estudiante", "client", "socio"]) || `Alumno`;
            const lastName = getVal(row, ["apellido", "lastname"]) || "";
            const nombre = (firstName.toString().trim() + " " + lastName.toString().trim()).trim() || `Alumno ${index + 1}`;

            const email = getVal(row, ["email", "correo electronico", "correo", "mail"]) || `alumno${index+1}@gmail.com`;
            const phone = getVal(row, ["telefono", "celular", "phone", "contacto"]) || `381${Math.floor(154000000 + Math.random() * 2000000)}`;
            
            // Handle "Selecciona Sucursa" and similar partial names from Google Forms
            const sedeRaw = getVal(row, ["sede", "sucursal", "sucursa", "branch", "selecciona sucursa"]) || "";
            let sede = "San Juan 790";
            if (sedeRaw.toString().toLowerCase().includes("yerba")) {
                sede = "Yerba Buena";
            } else if (sedeRaw.toString().toLowerCase().includes("san juan")) {
                sede = "San Juan 790";
            }

            // Handle "Selecciona tu Curso de Interes" from Google Forms
            const cursoNameRaw = getVal(row, ["curso de interes", "curso", "interes", "materia", "selecciona tu curso", "class", "product"]) || "Curso de Peluquería Profesional";
            
            const cursoRawLower = cursoNameRaw.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            let cursoId = 1; // default: Peluqueria
            if (cursoRawLower.includes("barberia") || cursoRawLower.includes("barbero")) cursoId = 2;
            else if (cursoRawLower.includes("manicura") || cursoRawLower.includes("unas")) cursoId = 3;
            else if (cursoRawLower.includes("maquillaje") || cursoRawLower.includes("makeup")) cursoId = 4;
            else if (cursoRawLower.includes("pestana") || cursoRawLower.includes("pestania") || cursoRawLower.includes("cejas") || cursoRawLower.includes("lashes")) cursoId = 5;
            else if (cursoRawLower.includes("tratamiento") || cursoRawLower.includes("capilar")) cursoId = 6;

            const coursesMapping = {
                1: "Curso de Peluquería Profesional",
                2: "Curso de Barbería Clásica",
                3: "Curso de Manicura Integral",
                4: "Curso de Maestría en Maquillaje",
                5: "Curso de Especialización de Pestañas y Cejas",
                6: "Curso de Tratamientos Capilares"
            };
            const cursoName = coursesMapping[cursoId];
            
            const estado = getVal(row, ["estado", "status", "activo"]) || "Activo";
            
            let regDate = new Date();
            // Handle "Marca temporal" from Google Forms responses
            const rawDate = getVal(row, ["marca temporal", "temporal", "fecha", "alta", "registro", "date", "timestamp"]);
            if (rawDate) {
                if (typeof rawDate === 'number') {
                    // Excel numeric date serial
                    regDate = new Date((rawDate - 25569) * 86400 * 1000);
                } else {
                    const dateStr = rawDate.toString().trim();
                    const parts = dateStr.split(/[\/\s:]+/);
                    if (parts.length >= 3) {
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1; // 0-indexed
                        const year = parseInt(parts[2], 10);
                        
                        let hour = 10;
                        let min = 0;
                        let sec = 0;
                        if (parts.length >= 6) {
                            hour = parseInt(parts[3], 10);
                            min = parseInt(parts[4], 10);
                            sec = parseInt(parts[5], 10);
                        }
                        
                        const parsedDate = new Date(year, month, day, hour, min, sec);
                        if (!isNaN(parsedDate.getTime())) {
                            regDate = parsedDate;
                        }
                    } else {
                        const d = new Date(rawDate);
                        if (!isNaN(d.getTime())) {
                            regDate = d;
                        }
                    }
                }
            }
            
            const rawMonto = getVal(row, ["monto", "importe", "pago", "precio", "value", "price"]);
            const montoVal = rawMonto ? parseFloat(rawMonto.toString().replace(/[^\d.]/g, '')) : 80000;
            
            const isActive = estado.toLowerCase().includes("activo") || estado.toLowerCase().includes("activa") || estado.toLowerCase().includes("habilitado") || estado.toLowerCase() === "true" || estado.toLowerCase() === "si" || estado.toLowerCase() === "";

            const id = index + 1;
            
            newAlumnos.push({
                id,
                nombre,
                email,
                telefono: phone,
                sede,
                fechaRegistro: regDate,
                cursoInscripto: cursoName,
                cursoId,
                activo: isActive
            });

            newSuscripciones.push({
                id,
                alumnoId: id,
                alumnoNombre: nombre,
                cursoId,
                cursoNombre: cursoName,
                fechaInicio: regDate,
                fechaVence: new Date(regDate.getTime() + 30 * 24 * 60 * 60 * 1000),
                montoMensual: 18000,
                estado: isActive ? "Activa" : "Vencida"
            });

            newIngresos.push({
                id: txId++,
                alumnoId: id,
                alumnoNombre: nombre,
                concepto: `Inscripción - ${cursoName}`,
                monto: montoVal,
                fecha: regDate,
                tipo: "Curso"
            });

            if (isActive) {
                newIngresos.push({
                    id: txId++,
                    alumnoId: id,
                    alumnoNombre: nombre,
                    concepto: `Mensualidad Suscripción Cursos`,
                    monto: 18000,
                    fecha: new Date(regDate.getTime() + 15 * 24 * 60 * 60 * 1000),
                    tipo: "Suscripción"
                });
            }

            newActividad.push({
                id: index + 1,
                alumnoId: id,
                alumnoNombre: nombre,
                fecha: regDate,
                duracionMinutos: 30 + Math.floor(Math.random() * 60),
                cursoNombre: cursoName
            });
        });

        // Compute max date for time context dynamically
        let maxDate = new Date("2025-05-15T10:00:00");
        newAlumnos.forEach(a => {
            if (a.fechaRegistro > maxDate) {
                maxDate = new Date(a.fechaRegistro);
            }
        });
        maxDate.setDate(maxDate.getDate() + 1);

        // Re-inject in global database!
        CAPELLI_DATABASE.today = maxDate;
        CAPELLI_DATABASE.alumnos = newAlumnos;
        CAPELLI_DATABASE.suscripciones = newSuscripciones;
        CAPELLI_DATABASE.ingresos = newIngresos;
        CAPELLI_DATABASE.actividad = newActividad;
        
        // Re-compile courses metrics
        CAPELLI_DATABASE.cursos = CAPELLI_DATABASE.cursos.map(c => {
            const regCount = newAlumnos.filter(a => a.cursoId === c.id).length;
            const totalRev = newIngresos.filter(i => i.concepto.includes(c.nombre)).reduce((sum, item) => sum + item.monto, 0);
            const activeCount = newAlumnos.filter(a => a.cursoId === c.id && a.activo).length;
            return {
                ...c,
                sales: regCount,
                revenue: totalRev,
                activos: activeCount,
                views: Math.max(10, regCount * 8.5)
            };
        });

        // Reinitialize the dashboard stats & refresh the Chart.js visual instances
        initializeDashboard();
        
        // Re-render subpanels instantly in case they are active
        renderAlumnosTable();
        renderCursosTable();
        renderSuscripcionesTable();
        renderIngresosTable();
        renderReportPreview();
    }

    // =====================================================================
    // FALLBACK DATA LOADER - Carga inmediata de registros reales del formulario
    // =====================================================================
    function loadFallbackData() {
        const fallbackRows = [
            { "Marca temporal": "17/5/2025 20:12:19", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "esteban", "Apellido": "lopez", "DNI": "31323182", "Correo electrónico": "lopezestebanalegandro@gmail.com", "Telefono (sin 0 y sin 15)": "3813159106", "Selecciona Sucursa": "Sucursal Yerba Buena" },
            { "Marca temporal": "17/5/2025 20:37:43", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "EZEQUIEL", "Apellido": "SALAS", "DNI": "31588156", "Correo electrónico": "esalaslascabral@hotmail.com", "Telefono (sin 0 y sin 15)": "3814484845", "Selecciona Sucursa": "Sucursal Yerba Buena" },
            { "Marca temporal": "17/5/2025 21:35:51", "Selecciona tu Curso de Interes": "Curso de Barbería Clásica", "Nombre": "anabel", "Apellido": "sanchez", "DNI": "34764304", "Correo electrónico": "aanabel.s90@gmail.com", "Telefono (sin 0 y sin 15)": "3816560404", "Selecciona Sucursa": "Sucursal Yerba Buena" },
            { "Marca temporal": "19/5/2025 10:21:39", "Selecciona tu Curso de Interes": "Curso de Maestría en Maquillaje", "Nombre": "esteban", "Apellido": "lopez", "DNI": "31323182", "Correo electrónico": "lopezesteban@gmail.com", "Telefono (sin 0 y sin 15)": "3815910600", "Selecciona Sucursa": "Sucursal Yerba Buena" },
            { "Marca temporal": "19/5/2025 10:36:57", "Selecciona tu Curso de Interes": "Curso de Manicura Integral", "Nombre": "Araceli", "Apellido": "Gonzalez", "DNI": "41180718", "Correo electrónico": "arigonzalez1998@gmail.com", "Telefono (sin 0 y sin 15)": "3815578162", "Selecciona Sucursa": "Sucursal Yerba Buena" },
            { "Marca temporal": "20/5/2025 19:06:05", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "Carolina Abigail", "Apellido": "Salvatierra", "DNI": "44742659", "Correo electrónico": "salvatierracarolina@gmail.com", "Telefono (sin 0 y sin 15)": "3815742567", "Selecciona Sucursa": "Sucursal Yerba Buena" },
            { "Marca temporal": "21/5/2025 10:47:39", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "Cristian", "Apellido": "Bertazzo", "DNI": "31619331", "Correo electrónico": "bertazzocristian@gmail.com", "Telefono (sin 0 y sin 15)": "3815114372", "Selecciona Sucursa": "Sucursal Yerba Buena" },
            { "Marca temporal": "22/5/2025 14:34:18", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "Patricia yanina", "Apellido": "Diaz", "DNI": "31870009", "Correo electrónico": "yaninadiaz@gmail.com", "Telefono (sin 0 y sin 15)": "3816534803", "Selecciona Sucursa": "Sucursal Yerba Buena" },
            { "Marca temporal": "28/5/2025 1:30:23", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "Yuliana", "Apellido": "Gonzalez", "DNI": "45659769", "Correo electrónico": "yg958493@gmail.com", "Telefono (sin 0 y sin 15)": "3816093634", "Selecciona Sucursa": "Sucursal San Juan" },
            { "Marca temporal": "29/5/2025 19:22:33", "Selecciona tu Curso de Interes": "Curso de Especialización de Pestañas y Cejas", "Nombre": "Cecilia", "Apellido": "Vasquez", "DNI": "39141273", "Correo electrónico": "ceci.vasquez41@gmail.com", "Telefono (sin 0 y sin 15)": "3815526323", "Selecciona Sucursa": "Sucursal San Juan" },
            { "Marca temporal": "6/6/2025 15:10:12", "Selecciona tu Curso de Interes": "Curso de Especialización de Pestañas y Cejas", "Nombre": "Daiana", "Apellido": "Saavedra", "DNI": "39452234", "Correo electrónico": "dayyhjk123@gmail.com", "Telefono (sin 0 y sin 15)": "3854134078", "Selecciona Sucursa": "Sucursal San Juan" },
            { "Marca temporal": "9/6/2025 15:53:17", "Selecciona tu Curso de Interes": "Curso de Barbería Clásica", "Nombre": "Daniela Agostina", "Apellido": "Villafañe", "DNI": "45428496", "Correo electrónico": "agostinavillafane947@gmail.com", "Telefono (sin 0 y sin 15)": "3813302234", "Selecciona Sucursa": "Sucursal Yerba Buena" },
            { "Marca temporal": "9/6/2025 17:28:48", "Selecciona tu Curso de Interes": "Curso de Especialización de Pestañas y Cejas", "Nombre": "luisana", "Apellido": "barba", "DNI": "50105820", "Correo electrónico": "luisanabarba10@icloud.com", "Telefono (sin 0 y sin 15)": "3816615672", "Selecciona Sucursa": "Sucursal San Juan" },
            { "Marca temporal": "11/6/2025 13:34:35", "Selecciona tu Curso de Interes": "Curso de Barbería Clásica", "Nombre": "salvador", "Apellido": "daniele", "DNI": "49696463", "Correo electrónico": "salvidaniele08@gmail.com", "Telefono (sin 0 y sin 15)": "2665129137", "Selecciona Sucursa": "Sucursal Yerba Buena" }
        ];
        processUploadedExcelData(fallbackRows);
    }

    function syncGoogleSheets(force = false) {
        if (googleSheetsSynced && !force) return;
        googleSheetsSynced = true;

        const sheetId = "1RhMtB7PznB89qWIq0R7DOwFmE_TqS5Mh2OIEJuKCYZs";
        const gid = "729153219"; 
        
        // Add visual loader if manually forced
        const syncIcon = document.getElementById("btn-sync-sheets")?.querySelector("i");
        if (syncIcon) syncIcon.classList.add("fa-spin");

        const badge = document.getElementById("connection-status-badge");
        if (badge) {
            badge.className = "badge bg-warning text-dark p-2";
        }

        // JSONP CORS Bypass
        const callbackName = 'capelliSyncCallback_' + Math.floor(Math.random() * 100000);
        
        window[callbackName] = function(json) {
            delete window[callbackName];
            const scriptEl = document.getElementById(callbackName);
            if (scriptEl) scriptEl.remove();

            if (json && json.table && json.table.rows) {
                const headers = json.table.cols.map(c => c.label || c.id || "");
                const jsonData = json.table.rows.map(row => {
                    const obj = {};
                    row.c.forEach((cell, i) => {
                        obj[headers[i]] = cell ? (cell.f !== undefined ? cell.f : (cell.v !== null ? cell.v : '')) : '';
                    });
                    return obj;
                });

                if (jsonData.length > 0) {
                    processUploadedExcelData(jsonData);
                    
                    if (badge) {
                        badge.className = "badge bg-success p-2 text-white";
                        badge.innerHTML = `<i class="fas fa-cloud me-1"></i> Google Sheets En Vivo`;
                    }
                    
                    showToast("Sincronizado", "Datos actualizados desde Google Sheets.", "success");
                    hideSplash();
                } else {
                    handleSyncError("Hoja vacía");
                }
            } else {
                handleSyncError("Formato JSONP inválido");
            }
            
            if (syncIcon) setTimeout(() => syncIcon.classList.remove("fa-spin"), 800);
        };

        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&gid=${gid}&callback=${callbackName}`;
        
        const script = document.createElement("script");
        script.id = callbackName;
        script.src = url;
        script.onerror = function() {
            delete window[callbackName];
            script.remove();
            handleSyncError("Error de carga de script (posible bloqueo CORS local o red)");
            if (syncIcon) setTimeout(() => syncIcon.classList.remove("fa-spin"), 800);
        };
        
        document.body.appendChild(script);

        function handleSyncError(reason) {
            console.warn("Google Sheets en vivo no disponible:", reason);

            const fallbackData = [
                { "Marca temporal": "17/5/2025 20:12:19", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "esteban", "Apellido": "lopez", "DNI": "31323182", "Correo electrónico": "lopezestebanalegandro@gmail.com", "Telefono (sin 0 y sin 15)": "3813159106", "Selecciona Sucursa": "Sucursal Yerba Buena" },
                { "Marca temporal": "17/5/2025 20:37:43", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "EZEQUIEL", "Apellido": "SALAS", "DNI": "31588156", "Correo electrónico": "esalaslascabral@hotmail.com", "Telefono (sin 0 y sin 15)": "3814484845", "Selecciona Sucursa": "Sucursal Yerba Buena" },
                { "Marca temporal": "17/5/2025 21:35:51", "Selecciona tu Curso de Interes": "Curso de Barbería Clásica", "Nombre": "anabel", "Apellido": "sanchez", "DNI": "34764304", "Correo electrónico": "aanabel.s90@gmail.com", "Telefono (sin 0 y sin 15)": "3816560404", "Selecciona Sucursa": "Sucursal Yerba Buena" },
                { "Marca temporal": "19/5/2025 10:21:39", "Selecciona tu Curso de Interes": "Curso de Maestría en Maquillaje", "Nombre": "esteban", "Apellido": "lopez", "DNI": "31323182", "Correo electrónico": "lopezesteban@gmail.com", "Telefono (sin 0 y sin 15)": "3815910600", "Selecciona Sucursa": "Sucursal Yerba Buena" },
                { "Marca temporal": "19/5/2025 10:36:57", "Selecciona tu Curso de Interes": "Curso de Manicura Integral", "Nombre": "Araceli", "Apellido": "Gonzalez", "DNI": "41180718", "Correo electrónico": "arigonzalez1998@gmail.com", "Telefono (sin 0 y sin 15)": "3815578162", "Selecciona Sucursa": "Sucursal Yerba Buena" },
                { "Marca temporal": "20/5/2025 19:06:05", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "Carolina Abigail", "Apellido": "Salvatierra", "DNI": "44742659", "Correo electrónico": "salvatierracarolina@gmail.com", "Telefono (sin 0 y sin 15)": "3815742567", "Selecciona Sucursa": "Sucursal Yerba Buena" },
                { "Marca temporal": "21/5/2025 10:47:39", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "Cristian", "Apellido": "Bertazzo", "DNI": "31619331", "Correo electrónico": "bertazzocristian@gmail.com", "Telefono (sin 0 y sin 15)": "3815114372", "Selecciona Sucursa": "Sucursal Yerba Buena" },
                { "Marca temporal": "22/5/2025 14:34:18", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "Patricia yanina", "Apellido": "Diaz", "DNI": "31870009", "Correo electrónico": "yaninadiaz@gmail.com", "Telefono (sin 0 y sin 15)": "3816534803", "Selecciona Sucursa": "Sucursal Yerba Buena" },
                { "Marca temporal": "28/5/2025 1:30:23", "Selecciona tu Curso de Interes": "Curso de Peluquería Profesional", "Nombre": "Yuliana", "Apellido": "Gonzalez", "DNI": "45659769", "Correo electrónico": "yg958493@gmail.com", "Telefono (sin 0 y sin 15)": "3816093634", "Selecciona Sucursa": "Sucursal San Juan" },
                { "Marca temporal": "29/5/2025 19:22:33", "Selecciona tu Curso de Interes": "Curso de Especialización de Pestañas y Cejas", "Nombre": "Cecilia", "Apellido": "Vasquez", "DNI": "39141273", "Correo electrónico": "ceci.vasquez41@gmail.com", "Telefono (sin 0 y sin 15)": "3815526323", "Selecciona Sucursa": "Sucursal San Juan" },
                { "Marca temporal": "6/6/2025 15:10:12", "Selecciona tu Curso de Interes": "Curso de Especialización de Pestañas y Cejas", "Nombre": "Daiana", "Apellido": "Saavedra", "DNI": "39452234", "Correo electrónico": "dayyhjk123@gmail.com", "Telefono (sin 0 y sin 15)": "3854134078", "Selecciona Sucursa": "Sucursal San Juan" },
                { "Marca temporal": "9/6/2025 15:53:17", "Selecciona tu Curso de Interes": "Curso de Barbería Clásica", "Nombre": "Daniela Agostina", "Apellido": "Villafañe", "DNI": "45428496", "Correo electrónico": "agostinavillafane947@gmail.com", "Telefono (sin 0 y sin 15)": "3813302234", "Selecciona Sucursa": "Sucursal Yerba Buena" },
                { "Marca temporal": "9/6/2025 17:28:48", "Selecciona tu Curso de Interes": "Curso de Especialización de Pestañas y Cejas", "Nombre": "luisana", "Apellido": "barba", "DNI": "50105820", "Correo electrónico": "luisanabarba10@icloud.com", "Telefono (sin 0 y sin 15)": "3816615672", "Selecciona Sucursa": "Sucursal San Juan" },
                { "Marca temporal": "11/6/2025 13:34:35", "Selecciona tu Curso de Interes": "Curso de Barbería Clásica", "Nombre": "salvador", "Apellido": "daniele", "DNI": "49696463", "Correo electrónico": "salvidaniele08@gmail.com", "Telefono (sin 0 y sin 15)": "2665129137", "Selecciona Sucursa": "Sucursal Yerba Buena" }
            ];

            processUploadedExcelData(fallbackData);

            if (badge) {
                badge.className = "badge bg-secondary p-2 text-white";
                badge.innerHTML = `<i class="fas fa-database me-1"></i> Datos Locales`;
                badge.title = "Visualizando datos de respaldo por falta de conexión.";
            }

            hideSplash();
        }
    }

    // Start application lifecycle
    checkSession();
});
