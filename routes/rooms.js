import { Namespace } from "socket.io";

const SYSTEM_USER_NAME = "NeiKos496";

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
        // 创建房间
        socket.on("createRoom", ({ userName: givenUserName }) => {
            const roomCode = socket.roomCode = generateRoomCode();
            const userName = socket.userName = givenUserName;
            socket.isHost = true;

            socket.join(roomCode);
            socket.emit("roomCreated", roomCode);

            console.log(`${userName}创建了房间#${roomCode}`);
            console.log(`当前房间列表：${getAllRooms(nsp).map((room) => room.name)}`);
        });

        // 加入房间
        socket.on("joinRoom", (givenRoomCode, { userName: givenUserName }) => {
            const roomCode = socket.roomCode = givenRoomCode;
            const userName = socket.userName = givenUserName;
            const isRoomExist = nsp.adapter.rooms.has(roomCode);
            socket.isHost = !isRoomExist;
            socket.join(roomCode);

            if (!isRoomExist) {
                socket.emit("roomCreated", roomCode);
            } else {
                socket.emit("roomJoined");
                nsp.to(roomCode).except(socket.id).emit("roomMessage", {
                    type: "system",
                    userName: SYSTEM_USER_NAME,
                    text: `${userName}来了`,
                });
            }

            console.log(`${userName}${isRoomExist ? "加入" : "创建"}了房间#${roomCode}`);
        });

        // 房间消息
        socket.on("roomMessage", ({ userName, isHost, text }) => {
            const { roomCode } = socket;
            const type = isHost ? "host" : "user";
            nsp.to(roomCode).emit("roomMessage", { type, userName, text });
            console.log(`${userName}在房间#${roomCode}说: ${text}`);
        });

        // 断开连接
        socket.on("disconnect", () => {
            // 过滤无效连接
            const { userName, roomCode } = socket;
            if (!userName || !roomCode) {
                return;
            }

            console.log(`${userName}离开了房间#${roomCode}`);

            // 房间已经不存在
            const roomSockets = nsp.adapter.rooms.get(roomCode);
            if (!roomSockets) {
                console.log(`房间#${roomCode}已关闭`);
                console.log(`当前房间列表：${getAllRooms(nsp).map((room) => room.name)}`);
                return;
            }

            // 房间还在，通知其他用户有人离开
            nsp.to(roomCode).emit("roomMessage", {
                type: "system",
                userName: SYSTEM_USER_NAME,
                text: `${userName}走了`,
            });

            // 交接房主权限
            if (!socket.isHost) {
                return;
            }
            const nextHostId = Array.from(roomSockets)[0];
            const nextHost = nsp.sockets.get(nextHostId);
            nextHost.isHost = true;
            nextHost.emit("hostChanged");
        });

        /**
         * 房主视频控制事件
         */

        socket.on("play", () => {
            nsp.to(socket.roomCode).except(socket.id).emit("played");
        });

        socket.on("pause", () => {
            nsp.to(socket.roomCode).except(socket.id).emit("paused");
        });

        socket.on("seek", (time) => {
            nsp.to(socket.roomCode).except(socket.id).emit("seeked", time);
        });

        socket.on("rateChange", (rate) => {
            nsp.to(socket.roomCode).except(socket.id).emit("rateChanged", rate);
        });

        socket.on("epChange", (ep) => {
            nsp.to(socket.roomCode).except(socket.id).emit("epChanged", ep);
        });

        socket.on("syncVideo", () => {
            const { roomCode } = socket;
            const roomSockets = nsp.adapter.rooms.get(roomCode);
            const hostId = Array.from(roomSockets)[0];

            nsp.to(hostId).emit("syncVideo", socket.id);
        });

        socket.on("videoInfo", (targetId, videoInfo) => {
            nsp.to(targetId).emit("videoInfo", videoInfo);
        });
    });
};

export default rooms;
