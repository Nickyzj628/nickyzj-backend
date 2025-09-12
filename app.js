import cors from "cors";
import express from "express";
import fs from "fs";
import https from "https";
import { Server as SocketIOServer } from "socket.io";
import { PORT } from "./libs/constants.js";
import { customResponse } from "./libs/middlewares.js";
import animes from "./routes/animes.js";
import blogs from "./routes/blogs.js";
import index from "./routes/index.js";
import rooms from "./routes/rooms.js";
import shanbay from "./routes/shanbay.js";

const options = {
    cert: fs.readFileSync("E:/Administrator/Documents/ssl/server.crt"),
    key: fs.readFileSync("E:/Administrator/Documents/ssl/server.key"),
};

// 创建服务器实例
const app = express();
const server = https.createServer(options, app);
const io = new SocketIOServer(server, {
    path: "/rooms",
    cors: {
        origin: ["http://localhost:3000", "https://nickyzj.run:2334"],
    },
    connectionStateRecovery: {},
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
rooms(io.of("/"));

// 启动服务器
server.listen(PORT, () => console.log(`服务器已启动：https://nickyzj.run:${PORT}`));
