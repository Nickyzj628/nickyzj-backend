import cors from "cors";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { PORT } from "./lib/constants.js";
import { customResponse } from "./lib/middlewares.js";
import animes from "./routes/animes.js";
import blogs from "./routes/blogs.js";
import index from "./routes/index.js";
import rooms from "./routes/rooms.js";
import shanbay from "./routes/shanbay.js";
import wsRooms from "./sockets/rooms.js";

// 创建服务器实例
const app = express();
const server = http.createServer(app);
const chat = new WebSocketServer({
    server,
    path: "/chat",
});

// 前置中间件
app.use(
    // 跨域
    cors(),
    // 解析 application/json 格式的请求 body
    express.json({ limit: "1mb" }),
    // 自定义 success 和 fail 方法
    customResponse(),
);

// 路由
app.use("/", index);
app.use("/shanbay", shanbay);
app.use("/blogs", blogs);
app.use("/animes", animes);
app.use("/rooms", rooms);

// 启动服务器
server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
chat.on("connection", wsRooms);
