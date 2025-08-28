import db from "../lib/sqlite.js"

// 用户连接到放映室
export default function wsRooms(client, req) {
	// 解析请求参数
	const { roomId, userId } = Object.fromEntries(
		new Map(
			req.url
				.replace(/.+\?/, "")
				.split("&")
				.map((param) => param.split("="))
		)
	)
	// 添加标识
	client.roomId = roomId
	client.userId = userId

	// 检查房间是否存在
	const isExist = db.get("select id from rooms where id=?", roomId)
	// 创建房间
	if (!isExist) db.run("insert into rooms (id, count) values (?, ?)", roomId, 1)
	// 广播用户加入信息
	broadcast.call(this, roomId, "joined", { userId, count: this.clients.size })

	// 开始通信
	client.on("message", async (e) => {
		const { type, data } = JSON.parse(e.toString())
		console.log(type, data)
		switch (type) {
			// 更新房间信息
			case "update": {
				const { animeId, title, ep } = data
				db.run("update rooms set animeId=?, title=?, ep=? where id=?", animeId, title, ep, roomId)
				broadcast.call(this, roomId, "updated", data, userId)
				break
			}
			// 发送聊天消息、房主操控播放器
			default: {
				broadcast.call(this, roomId, type + (type.at(-1) === "e" ? "d" : "ed"), data, userId)
				break
			}
		}
	})

	// 用户断开连接
	client.on("close", async () => {
		if (this.clients.size) {
			db.run("update rooms set count=? where id=?", this.clients.size, roomId)
			broadcast.call(this, roomId, "exited", {
				userId,
				ownerId: [...this.clients][0].userId,
				count: this.clients.size,
			})
		} else {
			db.run("delete from rooms where id=?", roomId)
			console.log(`close ${roomId}`)
		}
	})
}

/**
 * 向指定房间广播消息
 * @param {Number} roomId 房间号
 * @param {String} type 消息类型
 * @param {Object} data 消息体
 * @param {Number} userId 排除的用户id
 */
function broadcast(roomId, type, data, userId) {
	this.clients.forEach((client) => {
		if (client.roomId !== roomId) return
		if (userId && client.userId === userId) return
		client.send(JSON.stringify({ type, data }))
	})
}
