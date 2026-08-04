(() => {
  "use strict";

  const terminal = document.querySelector("[data-terminal]");
  const output = document.querySelector("[data-terminal-output]");
  const form = document.querySelector("[data-terminal-form]");
  const input = document.querySelector("#terminal-input");
  if (!terminal || !output || !form || !input) return;

  const body = document.body;
  const history = [];
  let historyIndex = 0;
  let lastFocus = null;

  const ASCII = [
    "  ______      _     __                    ____  _____ ",
    " / ____/   __(_)___/ /__  ____  ________ / __ \\/ ___/ ",
    "/ __/ | | / / / __  / _ \\/ __ \\/ ___/ _ \\ / / / /\\__ \\  ",
    "/ /___ | |/ / / /_/ /  __/ / / / /__/  __/ /_/ /___/ /___ ",
    "/_____/ |___/_/\\__,_/\\___/_/ /_/\\___/\\___/\\____//____/  "
  ].join("\n");

  const line = (text, tone = "output") => {
    const row = document.createElement("div");
    row.className = `terminal-line ${tone}`;
    row.textContent = text;
    output.append(row);
    output.scrollTop = output.scrollHeight;
  };

  const promptLine = (command) => {
    const row = document.createElement("div");
    row.className = "terminal-line";
    const prompt = document.createElement("span");
    prompt.className = "prompt";
    prompt.textContent = "evidenceos@ray:~$";
    const text = document.createElement("span");
    text.textContent = command;
    row.append(prompt, text);
    output.append(row);
  };

  const openTerminal = () => {
    lastFocus = document.activeElement;
    terminal.hidden = false;
    body.classList.add("terminal-open");
    document.querySelectorAll("[data-open-terminal]").forEach((button) => button.setAttribute("aria-expanded", "true"));
    window.setTimeout(() => input.focus(), 10);
    if (!output.dataset.initialized) {
      output.dataset.initialized = "true";
      line(ASCII);
      line("EvidenceOS command interface online. Type 'help' to inspect the environment.");
      line("No command grants authority. This interface only navigates public research evidence.");
    }
  };

  const closeTerminal = () => {
    terminal.hidden = true;
    body.classList.remove("terminal-open");
    document.querySelectorAll("[data-open-terminal]").forEach((button) => button.setAttribute("aria-expanded", "false"));
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  };

  const navigate = (selector, label) => {
    const target = document.querySelector(selector);
    if (!target) {
      line(`module not found: ${selector}`, "error");
      return;
    }
    closeTerminal();
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => target.setAttribute("tabindex", "-1"), 10);
    line(`routing to ${label}`);
  };

  const openUrl = (url, label) => {
    line(`opening ${label}: ${url}`);
    window.location.href = url;
  };

  const systemList = () => {
    const systems = window.EvidenceOSData?.systems || [];
    return systems.map((system) => `${system.status.padEnd(11)} ${system.short}`).join("\n");
  };

  const missionList = () => {
    const missions = window.EvidenceOSData?.missions || {};
    return Object.values(missions)
      .sort((a, b) => a.order - b.order)
      .map((mission) => `${mission.id.padEnd(9)} ${mission.label} [${mission.code}]`)
      .join("\n");
  };

  const status = () => {
    const current = window.EvidenceOS?.getState?.() || { mission: "research" };
    const mission = window.EvidenceOSData?.missions?.[current.mission];
    return [
      `mission: ${mission?.label || current.mission}`,
      `code: ${mission?.code || "unknown"}`,
      "evidence admission: enforced",
      "unknown handling: preserved",
      "decision execution: deterministic sample environment",
      "human authority: retained",
      "network data: public GitHub API, fail-closed"
    ].join("\n");
  };

  const help = () => [
    "MISSION ROUTING",
    "  missions                    list mission pathways",
    "  mission <research|secure|pqc|quantum|lab>",
    "  research | secure | pqc | quantum | lab",
    "",
    "MODULES",
    "  control | graph             open mission control",
    "  situation                   open cyber situation room",
    "  tdaf | replay               run decision replay",
    "  network | earth             open research network",
    "  chip | architectures        open quantum explorer",
    "  timeline                    open research timeline",
    "  systems | ls                list research systems",
    "",
    "PUBLIC SYSTEMS",
    "  open scout                  Quantum Research Scout",
    "  open warroom                PQC Readiness War Room",
    "  open oncology               Quantum Oncology Benchmark",
    "  open inventory              Crypto Inventory Demo",
    "  open github | open linkedin",
    "",
    "INTERFACE",
    "  status | whoami | about | clear | exit",
    "  shortcut: ` opens this terminal"
  ].join("\n");

  const run = (rawCommand) => {
    const command = rawCommand.trim();
    if (!command) return;
    promptLine(command);
    history.push(command);
    historyIndex = history.length;
    const [head, ...rest] = command.toLowerCase().split(/\s+/);
    const argument = rest.join(" ");

    if (head === "help" || head === "?") return line(help());
    if (head === "clear") { output.textContent = ""; return; }
    if (head === "exit" || head === "quit") { line("closing terminal"); closeTerminal(); return; }
    if (head === "whoami") return line("Ray Beecham // quantum security engineer // U.S. Navy veteran // emerging-technology researcher");
    if (head === "about") return line("EvidenceOS is a public interactive research environment connecting quantum security, PQC migration, quantum evaluation, strategic intelligence, and accountable technology decisions.");
    if (head === "status") return line(status());
    if (head === "missions") return line(missionList());
    if (head === "systems" || head === "ls") return line(systemList());

    if (["research", "secure", "pqc", "quantum", "lab"].includes(head)) {
      window.EvidenceOS?.selectMission?.(head);
      line(`mission loaded: ${head}`);
      navigate("#top", "mission selector");
      return;
    }
    if (head === "mission") {
      if (!["research", "secure", "pqc", "quantum", "lab"].includes(argument)) {
        line("usage: mission <research|secure|pqc|quantum|lab>", "error");
        return;
      }
      window.EvidenceOS?.selectMission?.(argument);
      line(`mission loaded: ${argument}`);
      navigate("#top", "mission selector");
      return;
    }

    if (head === "control" || head === "graph") return navigate("#mission-control", "mission control");
    if (head === "situation") return navigate("#situation-room", "cyber situation room");
    if (head === "tdaf" || head === "replay") return navigate("#decision-replay", "decision replay");
    if (head === "network" || head === "earth" || head === "globe") return navigate("#research-earth", "research network");
    if (head === "chip" || head === "architectures") return navigate("#quantum-explorer", "quantum computer explorer");
    if (head === "timeline") return navigate("#timeline", "research timeline");

    if (head === "open") {
      const routes = {
        scout: ["https://raybeecham.github.io/quantum-research-scout/", "Quantum Research Scout"],
        warroom: ["https://pqc-readiness-war-room.raybeecham2009.workers.dev/", "PQC Readiness War Room"],
        oncology: ["https://github.com/raybeecham/quantum-oncology-benchmark", "Quantum Oncology Benchmark"],
        inventory: ["https://github.com/raybeecham/crypto-inventory-demo", "Crypto Inventory Demo"],
        github: ["https://github.com/raybeecham", "GitHub profile"],
        linkedin: ["https://linkedin.com/in/RaymondBeecham", "LinkedIn profile"]
      };
      if (!routes[argument]) {
        line("open targets: scout, warroom, oncology, inventory, github, linkedin", "error");
        return;
      }
      openUrl(routes[argument][0], routes[argument][1]);
      return;
    }

    if (head === "sudo") return line("authority boundary: denied. EvidenceOS never escalates itself into an accountable owner.", "error");
    if (head === "matrix") return line("The evidence is real. The green rain is intentionally omitted.");
    if (head === "coffee") return line("coffee.status = required; deployment.status = pending human review");

    line(`command not found: ${command}\nType 'help' for available commands.`, "error");
  };

  document.querySelectorAll("[data-open-terminal]").forEach((button) => button.addEventListener("click", openTerminal));
  document.querySelector("[data-close-terminal]")?.addEventListener("click", closeTerminal);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const command = input.value;
    input.value = "";
    run(command);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] || "";
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || "";
    }
  });
  terminal.addEventListener("click", (event) => {
    if (event.target === terminal) closeTerminal();
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
    if (event.key === "`" && !typing) {
      event.preventDefault();
      terminal.hidden ? openTerminal() : closeTerminal();
    }
    if (event.key === "Escape" && !terminal.hidden) closeTerminal();
  });
})();
