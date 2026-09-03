#!/usr/bin/env node
import { BoxRenderable, TextRenderable, createCliRenderer } from "@opentui/core";
import { spawn } from "child_process";
import { existsSync } from "fs";

async function main() {
const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  backgroundColor: "#0C0F12",
});

const steps = [
  { id: "clone", label: "Cloning puter-pool" },
  { id: "env", label: "Copying .env (SQLite)" },
  { id: "backend", label: "Installing backend deps" },
  { id: "dashboard", label: "Installing dashboard deps" },
  { id: "build", label: "Building dist + global bin" },
  { id: "link", label: "Linking global puter-pool" },
  { id: "ready", label: "Ready → http://localhost:5173" },
];

let current = 0;
const status: Record<string, string> = {};

const root = new BoxRenderable(renderer, {
  width: "100%",
  height: "100%",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#0C0F12",
  padding: 1,
});

const card = new BoxRenderable(renderer, {
  width: 72,
  flexDirection: "column",
  backgroundColor: "#FDFBF3",
  borderColor: "#0C0F12",
  borderStyle: "single",
  padding: 1,
  gap: 1,
});

const title = new TextRenderable(renderer, {
  content: "▓ Puter Pool — Free AI API Installer",
  fg: "#0C0F12",
  attributes: 1,
});
const sub = new TextRenderable(renderer, {
  content: "1000 credits per verified mobile • drivers/call • 928 models",
  fg: "#7A838F",
});

const listBox = new BoxRenderable(renderer, {
  flexDirection: "column",
  gap: 0,
});

const logBox = new BoxRenderable(renderer, {
  height: 6,
  backgroundColor: "#0C0F12",
  padding: 1,
  flexDirection: "column",
});
const logText = new TextRenderable(renderer, {
  content: "starting…",
  fg: "#7A838F",
});

function renderSteps() {
  listBox.children.slice().forEach(c => listBox.remove(c));
  steps.forEach((s, i) => {
    const state = status[s.id] || (i < current ? "done" : i === current ? "run" : "pending");
    const icon = state === "done" ? "✔" : state === "run" ? "◐" : "○";
    const fg = state === "done" ? "#00A85A" : state === "run" ? "#FFB800" : "#7A838F";
    const row = new TextRenderable(renderer, {
      content: ` ${icon} ${s.label} ${state === "run" ? "…" : ""}`,
      fg,
    });
    listBox.add(row);
  });
}

card.add(title);
card.add(sub);
card.add(listBox);
card.add(logBox);
logBox.add(logText);
root.add(card);
renderer.root.add(root);
renderSteps();

function log(msg: string) {
  logText.content = msg.slice(0, 68);
}

function run(cmd: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    log(`$ ${cmd} ${args.join(" ")}`);
    const p = spawn(cmd, args, { cwd, shell: false, stdio: "pipe" });
    let out = "";
    p.stdout?.on("data", d => { out += d.toString(); log(d.toString().split("\n").pop() || ""); });
    p.stderr?.on("data", d => { log(d.toString().split("\n").pop() || ""); });
    p.on("close", code => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${out.slice(-200)}`))));
    p.on("error", reject);
  });
}

renderer.keyInput.on("keypress", k => {
  if (k.name === "q" || k.name === "escape") {
    renderer.destroy();
    process.exit(0);
  }
});

(async () => {
  try {
    const REPO = "https://github.com/Parithosh-Varma/puter-pool.git";
    const DIR = "puter-pool";
    status.clone = "run";
    renderSteps();
    if (existsSync(DIR)) {
      log("updating existing puter-pool…");
      await run("git", ["pull"], DIR);
    } else {
      await run("git", ["clone", REPO]);
    }
    status.clone = "done";
    current = 1;
    renderSteps();
    status.env = "run";
    renderSteps();
    await run("bash", ["-c", "cp -n .env.example .env || true"], DIR);
    status.env = "done";
    current = 2;
    renderSteps();
    status.backend = "run";
    renderSteps();
    await run("npm", ["install"], DIR);
    status.backend = "done";
    current = 3;
    renderSteps();
    status.dashboard = "run";
    renderSteps();
    await run("npm", ["install"], `${DIR}/dashboard`);
    status.dashboard = "done";
    current = 4;
    renderSteps();
    status.build = "run";
    renderSteps();
    await run("npm", ["run", "build"], DIR);
    try { await run("bash", ["-c", "chmod +x dist/index.js"], DIR); } catch {}
    status.build = "done";
    current = 5;
    renderSteps();
    status.link = "run";
    renderSteps();
    try { await run("npm", ["link"], DIR); } catch { log("npm link skipped"); }
    status.link = "done";
    current = 6;
    renderSteps();
    status.ready = "done";
    renderSteps();
    logText.content = "✓ installed — press Enter to start pool (or q to quit)";
    logText.fg = "#00A85A" as any;

    renderer.keyInput.on("keypress", async k => {
      if (k.name === "return" || k.name === "enter") {
        renderer.destroy();
        const { spawn: spawn2 } = await import("child_process");
        spawn2("npm", ["run", "dev"], { cwd: DIR, stdio: "inherit", shell: true });
      }
    });
  } catch (e: any) {
    logText.content = `✗ ${e.message.slice(0, 60)}`;
    logText.fg = "#FF3B1F" as any;
  }
})();
}
main().catch(e => { console.error(e); process.exit(1); });
