import { createBackend } from "./app.ts";
const backend = createBackend();
const port = Number(process.env.PORT) || 4318;
const server = backend.app.listen(port, "127.0.0.1", () =>
  console.log(`Conflict Desk API ready at http://127.0.0.1:${port}`),
);
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  server.close();
  await backend.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
