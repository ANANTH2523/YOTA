import { existsSync, readFileSync } from "fs";

const filesToCheck = ["index.html", "app.js", "styles.css", "agents/nlp-agent.js", "agents/payment-agent.js"];
const forbiddenClientEnv = ["SOLVAPAY_SECRET_KEY", "SOLVAPAY_API_BASE_URL"];
const leaked = [];

for (const file of filesToCheck) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, "utf8");
  for (const envName of forbiddenClientEnv) {
    if (content.includes(envName)) {
      leaked.push(`${file}: references ${envName}`);
    }
  }
}

if (existsSync(".env")) {
  const envContent = readFileSync(".env", "utf8");
  if (/^VITE_.*SOLVAPAY_SECRET_KEY/m.test(envContent) || /^NEXT_PUBLIC_.*SOLVAPAY_SECRET_KEY/m.test(envContent)) {
    leaked.push(".env: exposes SOLVAPAY_SECRET_KEY through a public env prefix");
  }
}

if (leaked.length) {
  console.error("SolvaPay env safety check failed:");
  leaked.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log("SolvaPay env safety check passed.");
