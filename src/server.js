import "dotenv/config";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

function start() {
  const config = loadConfig();
  const app = createApp({ config });
  app.listen(config.port, () => {
    console.log(`jwt-for-beginners listening on :${config.port}`);
  });
}

start();
