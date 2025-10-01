import express from "express";
import getChapters from "./api/chapters";
import getEvents from "./api/nard";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/chapters", getChapters);
app.get("/api/nard", getEvents);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
