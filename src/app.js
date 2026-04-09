const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Recipe Nest and Chief Portal Backend is running",
	});
});

app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: "Route not found",
	});
});

module.exports = app;
