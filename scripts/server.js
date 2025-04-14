import express from "express";
import serveStatic from "serve-static";
const app = express();

app.use(serveStatic("."));

app.listen(3000);
console.log("Listening \x1b[92mhttp://localhost:3000\x1b[0m");
