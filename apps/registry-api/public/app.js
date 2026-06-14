const registryBase = window.location.origin;
const cliInstallCommand = "npm install -g @aipm-registry/cli";
const cliReleaseDownloadUrl = "https://github.com/abhisri2090/aipm/releases/download/cli-v0.2.12";
const cliInstallOptions = [
  "# npm",
  cliInstallCommand,
  "",
  "# macOS/Linux standalone",
  `curl -fsSL ${cliReleaseDownloadUrl}/install.sh | sh`,
  "",
  "# Windows PowerShell",
  `irm ${cliReleaseDownloadUrl}/install.ps1 | iex`,
].join("\n");

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function encodePackageName(name) {
  return encodeURIComponent(name);
}

function installCommand(pkg, target = pkg.targets?.[0] ?? "cursor") {
  return `aipm add ${pkg.name}@${pkg.version} --target ${target} --ci`;
}

function detailUrl(pkg) {
  return `/skill/?name=${encodeURIComponent(pkg.name)}&version=${encodeURIComponent(pkg.version)}`;
}

function renderEmpty(container, message) {
  container.innerHTML = `<div class="empty">${escapeHtml(message)}</div>`;
}

function packageCard(pkg, compact = false) {
  return `
    <article class="result-card${compact ? " compact-card" : ""}">
      <div>
        <h3><a href="${detailUrl(pkg)}">${escapeHtml(pkg.name)}@${escapeHtml(pkg.version)}</a></h3>
        <p>${escapeHtml(pkg.description)}</p>
        <div class="meta">
          <span class="pill">${escapeHtml(pkg.type)}</span>
          ${pkg.targets.map((target) => `<span class="pill">${escapeHtml(target)}</span>`).join("")}
          <span class="pill">${escapeHtml(formatDate(pkg.createdAt))}</span>
        </div>
      </div>
      <button class="copy" type="button" data-copy="${escapeHtml(installCommand(pkg))}">
        Copy
      </button>
    </article>
  `;
}

function renderPackages(container, countEl, packages, options = {}) {
  if (countEl) {
    countEl.textContent =
      packages.length === 1 ? "1 package found" : `${packages.length} packages found`;
  }

  if (packages.length === 0) {
    renderEmpty(container, options.emptyMessage ?? "No matching skills found.");
    return;
  }

  const limit = options.limit ?? packages.length;
  container.innerHTML = packages
    .slice(0, limit)
    .map((pkg) => packageCard(pkg, Boolean(options.compact)))
    .join("");
}

async function fetchPackages(query = "") {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const suffix = params.toString() ? `?${params}` : "";
  const response = await fetch(`/v1/packages${suffix}`);
  if (!response.ok) throw new Error(`Registry search failed: ${response.status}`);
  const data = await response.json();
  return data.packages ?? [];
}

function fillRegistryCommands() {
  qsa("[data-template]").forEach((node) => {
    const type = node.dataset.template;
    if (type === "install-cli") {
      node.textContent = cliInstallOptions;
    }
    if (type === "init") {
      node.textContent = "aipm init";
    }
    if (type === "add") {
      node.textContent = "aipm add @scope/name@1.0.0 --target cursor --ci";
    }
    if (type === "list") {
      node.textContent = "aipm list";
    }
    if (type === "publish") {
      node.textContent = `AIPM_TOKEN=<5-minute-token> aipm publish ./path/to/skill --registry ${registryBase}`;
    }
  });
}

function setupCopyButtons() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-copy], button[data-copy-source]");
    if (!button) return;

    const value = button.dataset.copySource
      ? qs(`#${button.dataset.copySource}`)?.textContent
      : button.dataset.copy;
    if (!value) return;

    await navigator.clipboard.writeText(value);
    const previous = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = previous;
    }, 1400);
  });
}

function setupHomeSearch() {
  const form = qs("#home-search-form");
  const input = qs("#home-search-input");
  const results = qs("#home-results");
  const count = qs("#home-result-count");
  if (!form || !input || !results) return;

  async function load(query = "") {
    count.textContent = "Searching";
    renderEmpty(results, "Loading skills...");
    try {
      const packages = await fetchPackages(query);
      renderPackages(results, count, packages, {
        compact: true,
        limit: 3,
        emptyMessage:
          "No public skills are listed yet. Demo packages are hidden while the first useful starter skills are prepared.",
      });
    } catch {
      count.textContent = "Search unavailable";
      renderEmpty(results, "The registry search API is not available right now.");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    load(input.value.trim());
  });

  load();
}

function setupRegistryPage() {
  const form = qs("#registry-search-form");
  const input = qs("#registry-search-input");
  const results = qs("#registry-results");
  const count = qs("#registry-result-count");
  const filterButtons = qsa("[data-target-filter]");
  if (!form || !input || !results) return;

  let currentPackages = [];
  let activeTarget = "all";

  function applyFilter() {
    const filtered =
      activeTarget === "all"
        ? currentPackages
        : currentPackages.filter((pkg) => pkg.targets.includes(activeTarget));
    renderPackages(results, count, filtered, {
      emptyMessage:
        "No public skills are listed yet. Demo packages are hidden while starter skills are prepared.",
    });
  }

  async function load(query = "") {
    count.textContent = "Searching";
    renderEmpty(results, "Loading skills...");
    try {
      currentPackages = await fetchPackages(query);
      applyFilter();
    } catch {
      count.textContent = "Search unavailable";
      renderEmpty(results, "The registry search API is not available right now.");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    load(input.value.trim());
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeTarget = button.dataset.targetFilter;
      filterButtons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
      applyFilter();
    });
  });

  load();
}

async function setupSkillPage() {
  const title = qs("#skill-title");
  const description = qs("#skill-description");
  const metadata = qs("#skill-metadata");
  const initCommand = qs("#skill-init-command");
  const installCommandEl = qs("#skill-install-command");
  const error = qs("#skill-error");
  if (!title || !description || !metadata) return;

  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  const version = params.get("version");

  if (!name || !version) {
    title.textContent = "Choose a skill from the registry";
    description.textContent = "This page needs a package name and version.";
    error.classList.remove("hidden");
    error.textContent = "Open a skill from the registry results to see its details.";
    return;
  }

  try {
    const response = await fetch(`/v1/packages/${encodePackageName(name)}/versions/${encodeURIComponent(version)}`);
    if (!response.ok) throw new Error(`Skill lookup failed: ${response.status}`);
    const pkg = await response.json();
    const summary = {
      name: pkg.name,
      version: pkg.version,
      description: pkg.manifest.description,
      type: pkg.manifest.type,
      targets: pkg.manifest.targets,
      license: pkg.manifest.license ?? null,
      integrity: pkg.integrity,
      sizeBytes: pkg.sizeBytes,
      createdAt: pkg.createdAt,
    };

    title.textContent = `${summary.name}@${summary.version}`;
    description.textContent = summary.description;
    initCommand.textContent = `${cliInstallOptions}\naipm init`;
    installCommandEl.textContent = installCommand(summary);
    metadata.innerHTML = `
      <div><dt>Package</dt><dd>${escapeHtml(summary.name)}</dd></div>
      <div><dt>Version</dt><dd>${escapeHtml(summary.version)}</dd></div>
      <div><dt>Targets</dt><dd>${summary.targets.map(escapeHtml).join(", ")}</dd></div>
      <div><dt>License</dt><dd>${escapeHtml(summary.license ?? "Not specified")}</dd></div>
      <div><dt>Published</dt><dd>${escapeHtml(formatDate(summary.createdAt))}</dd></div>
      <div><dt>Size</dt><dd>${Number(summary.sizeBytes).toLocaleString()} bytes</dd></div>
    `;
  } catch {
    title.textContent = "Skill not found";
    description.textContent = "The registry could not return this package version.";
    error.classList.remove("hidden");
    error.textContent = "Check the package name, version, and registry status.";
  }
}

fillRegistryCommands();
setupCopyButtons();
setupHomeSearch();
setupRegistryPage();
setupSkillPage();
