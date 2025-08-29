import cors from "cors";
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { PORT } from "./libs/constants.js";
import { customResponse } from "./libs/middlewares.js";
import animes from "./routes/animes.js";
import blogs from "./routes/blogs.js";
import index from "./routes/index.js";
import rooms from "./routes/rooms.js";
import shanbay from "./routes/shanbay.js";

// 创建服务器实例
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    path: "/rooms",
    cors: {
        origin: ["http://localhost:5173", "http://nickyzj.run:2333"],
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
server.listen(PORT, () => console.log(`服务器已启动：http://localhost:${PORT}`));
