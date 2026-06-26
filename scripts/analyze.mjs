process.env.ANALYZE = "true";
import { execSync } from "node:child_process";

execSync("npx prisma generate && next build", { stdio: "inherit" });
