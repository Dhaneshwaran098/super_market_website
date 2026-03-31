import { spawn } from "node:child_process";

const commands = [
  {
    name: "server",
    child: spawn(process.execPath, ["server.mjs"], {
      stdio: "inherit",
      env: { ...process.env, PORT: process.env.PORT || "3001" },
    }),
  },
  {
    name: "vite",
    child: spawn("npm", ["run", "dev", "--", "--host", "0.0.0.0"], {
      stdio: "inherit",
      env: process.env,
      shell: true,
    }),
  },
];

let shuttingDown = false;

const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const processInfo of commands) {
    processInfo.child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 250);
};

for (const processInfo of commands) {
  processInfo.child.on("exit", (code) => {
    if (!shuttingDown) {
      console.error(`${processInfo.name} exited with code ${code ?? 0}`);
      shutdown(code ?? 0);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
