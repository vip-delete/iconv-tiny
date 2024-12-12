import express from "express";
import serveStatic from "serve-static";
const app = express();

app.use(serveStatic("public", { index: ["index.html"] }));

app.listen(3001);
console.log("Listening \x1b[92mhttp://localhost:3000\x1b[0m");
