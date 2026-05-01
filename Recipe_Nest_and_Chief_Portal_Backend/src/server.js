require("dotenv").config();

const net = require("net");
const app = require("./app");
const connectDB = require("./config/database");
const { PORT } = require("./config/config");

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const tester = net.createServer()
      .once("error", () => resolve(false))
      .once("listening", () => tester.close(() => resolve(true)))
      .listen(port, "0.0.0.0");
  });

const findAvailablePort = async (startingPort) => {
  let port = startingPort;
  while (!(await isPortAvailable(port))) {
    port += 1;
  }
  return port;
};

const listenOnPort = (port) =>
  new Promise((resolve, reject) => {
    const server = app.listen(port);

    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });

const startServer = async (port = Number(PORT)) => {
  await connectDB();

  let currentPort = await findAvailablePort(port);

  while (true) {
    try {
      if (currentPort !== port) {
        console.warn(`Port ${port} is in use, switching to ${currentPort}.`);
      }

      await listenOnPort(currentPort);
      console.log(`Server running on http://localhost:${currentPort}`);
      return;
    } catch (error) {
      if (error.code === "EADDRINUSE") {
        currentPort += 1;
        continue;
      }

      console.error("Server failed to start:", error.message);
      process.exit(1);
    }
  }
};

startServer().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
