import { Namespace } from "socket.io";
import { debounce } from "../libs/utils.js";

/**
 * 生成房间号
 * @param {number} length 房间号长度，默认 4 位
 */
const generateRoomCode = (length = 4) => {
    const chars = "0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
    }
    return code;
};

/**
 * 列出所有非用户个人的房间
 * @param {Namespace} nsp 
 */
const getAllRooms = (nsp) => {
    const rooms = [];
    for (const [roomName, clients] of nsp.adapter.rooms) {
        // 如果房间名等于某个 socket.id，则是 socket 自己的默认房间
        const isSocketRoom = nsp.sockets.has(roomName);
        if (!isSocketRoom) {
            rooms.push({
                name: roomName,
                size: clients.size,
            });
        }
    }
    return rooms;
};

/**
 * socket.io 房间路由
 * @param {Namespace} nsp socket.io 命名空间实例
 */
const rooms = (nsp) => {
    nsp.on("connection", (socket) => {
        let userName = "";
        let roomCode = "";

        // 创建房间
        socket.on("createRoom", ({ userName: givenUserName }) => {
            userName = givenUserName;
            roomCode = generateRoomCode();

            socket.join(roomCode);
            socket.emit("roomCreated", roomCode);

            console.log(`${userName}创建了房间#${roomCode}`);
            console.log(`当前房间列表：${getAllRooms(nsp).map((room) => room.name)}`);
        });

        // 加入房间
        socket.on("joinRoom", (givenRoomCode, { userName: givenUserName }) => {
            userName = givenUserName;
            roomCode = givenRoomCode;
            const isRoomExist = nsp.adapter.rooms.has(roomCode);

            socket.join(roomCode);
            if (!isRoomExist) {
                socket.emit("roomCreated", roomCode);
            } else {
                socket.emit("roomJoined");
                nsp.to(roomCode).emit("roomMessage", {
                    userName: "系统消息",
                    text: `${userName}来了`,
                });
            }

            console.log(`${userName}加入房间#${roomCode}`);
        });

        // 房间消息
        socket.on("roomMessage", (roomCode, { userName, text }) => {
            nsp.to(roomCode).emit("roomMessage", { userName, text });
            console.log(`${userName}在房间#${roomCode}说: ${text}`);
        });

        // 断开连接
        socket.on("disconnect", () => {
            // 过滤掉无效连接
            if (!userName || !roomCode) {
                return;
            }
            console.log(`${userName}离开了房间#${roomCode}`);

            // 房间为空，关闭房间
            if (!nsp.adapter.rooms.has(roomCode)) {
                console.log(`房间#${roomCode}已关闭`);
                console.log(`当前房间列表：${getAllRooms(nsp).map((room) => room.name)}`);
            }
            // 房间非空，通知其他用户有人离开
            else {
                nsp.to(roomCode).emit("roomMessage", {
                    userName: "系统消息",
                    text: `${userName}走了`,
                });
            }
        });
    });
};

export default rooms;
