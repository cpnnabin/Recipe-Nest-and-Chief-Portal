require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/database");
const { PORT } = require("./config/config");

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();