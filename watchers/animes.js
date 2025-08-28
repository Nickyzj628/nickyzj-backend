import fs from "fs"
import path from "path"
import db from "../lib/sqlite.js"

const DIR = "E:/Storage/Nickyzj/Animes"

// 同步一次本地所有番剧
sync()

// 持续监听当季番剧改动
watch()

function createAnime(title, { id, cate, eps, updated }) {
	const sql = db.run("insert into animes (id,title,cate,eps,updated) values (?,?,?,?,?)", id, title, cate, eps, updated)
	if (sql.changes) console.log(`新增番剧《${title}》`)
}

function updateAnime(title, { eps, updated }) {
	const sql = db.run("update animes set eps=?, updated=? where title=?", eps, updated, title)
	if (sql.changes) console.log(`更新番剧《${title}》`)
}

function deleteAnime(title) {
	const sql = db.run("delete from animes where title=?", title)
	if (sql.changes) console.log(`删除番剧《${title}》`)
}

function sync() {
	console.time("animes")
	const inserts = {}
	const updates = {}
	const deletes = []
	// 读取本地番剧，全部放进插入队列
	fs.readdirSync(DIR).forEach((cate) => {
		const catepath = path.join(DIR, cate)
		fs.readdirSync(catepath).forEach((title) => {
			const animepath = path.join(DIR, cate, title)
			const stat = fs.statSync(animepath)
			// 排除非文件夹
			if (!stat.isDirectory()) return
			// 全部放进插入队列(后续发现数据库中已存在再移除)
			inserts[title] = {
				id: stat.birthtime.getTime().toString(36),
				cate,
				eps: fs.readdirSync(animepath).length,
				updated: stat.mtime.getTime(),
			}
		})
	})
	// 读取云端番剧，与本地番剧对比时间差异
	const remoteAnimes = db.all("select * from animes")
	remoteAnimes.forEach((remoteAnime) => {
		const localAnime = inserts[remoteAnime.title]
		// 本地不存在这篇番剧：删除
		if (!localAnime) deletes.push(remoteAnime.title)
		// 本地和云端都有这篇番剧，且本地较新：更新
		else if (localAnime.updated - remoteAnime.updated > 50) updates[remoteAnime.title] = localAnime
		// 从云端遍历过的番剧不用再插入
		delete inserts[remoteAnime.title]
	})
	// CRUD
	for (let title in inserts) createAnime(title, inserts[title])
	for (let title in updates) updateAnime(title, updates[title])
	for (let title in deletes) deleteAnime(title)
	console.timeEnd("animes")
}

function watch() {
	const cate = fs.readdirSync(DIR).sort((a, b) => b - a)[0]
	const catepath = path.join(DIR, cate)
	const prevFile = { title: "", time: 0 }
	fs.watch(catepath, (event, title) => {
		if (title === "新建文件夹") return
		const animepath = path.join(catepath, title)
		// 修改
		if (event === "change") {
			// 防抖，修复更改一次文件触发3次change的问题
			if (prevFile.title === title && Date.now() - prevFile.time < 50) return
			prevFile.title = title
			prevFile.time = Date.now()
			// 为了修复获取番剧详情时意外触发的change，要对比云端番剧修改时间
			const localUpdated = fs.statSync(animepath).mtime.getTime()
			const remoteUpdated = db.get("select updated from animes where title=?", title).updated
			if (localUpdated - remoteUpdated > 50) updateAnime(title, { eps: fs.readdirSync(animepath).length, updated: localUpdated })
		}
		// 新建、删除
		else if (event === "rename") {
			// 新建
			if (fs.existsSync(animepath)) {
				const stat = fs.statSync(animepath)
				createAnime(title, {
					id: stat.birthtime.getTime().toString(36),
					cate,
					eps: fs.readdirSync(animepath).length,
					updated: stat.mtime.getTime(),
				})
			}
			// 删除
			else {
				const isExist = db.get("select count() from animes where title=?", title)
				if (isExist) deleteAnime(title)
			}
		}
	})
}
