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

const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://localhost:2334",
    "https://nickyzj.run:2334",
];

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
        origin: ALLOWED_ORIGINS,
    },
    connectionStateRecovery: {},
});

// 前置中间件
app.use(
    // 跨域
    cors({
        origin: (origin, callback) => {
            // 允许白名单里的源、同源请求访问
            if (ALLOWED_ORIGINS.includes(origin) || origin === undefined) {
                callback(null, true);
            } else {
                callback(new Error("跨域请求已被拦截"));
            }
        },
    }),
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
