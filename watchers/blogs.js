import fs from "fs"
import path from "path"
import db from "../lib/sqlite.js"

const DIR = "E:/Storage/Nickyzj/Blogs"

// 同步一次本地文章
sync()

// 持续监听文章改动
watch()

async function createBlog(title, { id, updated }) {
  const sql = db.run("insert into blogs (id,title,updated,visibility) values (?,?,?,?)", id, title, updated, 0)
  if (sql.changes) console.log(`新增文章《${title}》`)
}

async function updateBlog(title, { updated }) {
  const sql = db.run("update blogs set updated=? where title=?", updated, title)
  if (sql.changes) console.log(`更新文章《${title}》`)
}

async function deleteBlog(title) {
  const sql = db.run("delete from blogs where title=?", title)
  if (sql.changes) console.log(`删除文章《${title}》`)
}

function sync() {
  console.time("blogs")
  const inserts = {}
  const updates = {}
  const deletes = []
  // 读取本地文章，全部放进插入队列
  fs.readdirSync(DIR).forEach((filename) => {
    const filepath = path.join(DIR, filename)
    const stat = fs.statSync(filepath)
    // 排除非markdown文件
    if (path.extname(filepath) !== ".md") return
    // 先全部放进插入队列(后续发现数据库中已存在再移除)
    inserts[filename.replace(".md", "")] = {
      id: stat.birthtime.getTime().toString(36),
      updated: stat.mtime.getTime(),
    }
  })
  // 读取云端文章，与本地对比时间差异
  const remoteBlogs = db.all("select * from blogs")
  remoteBlogs.forEach((remoteBlog) => {
    const localBlog = inserts[remoteBlog.title]
    // 本地不存在这篇文章：删除
    if (!localBlog) deletes.push(remoteBlog.title)
    // 本地和云端都有这篇文章，且本地较新：更新
    else if (localBlog.updated - remoteBlog.updated > 50) updates[remoteBlog.title] = localBlog
    // 从云端遍历过的文章不用再插入
    delete inserts[remoteBlog.title]
  })
  // CRUD
  for (let title in inserts) createBlog(title, inserts[title])
  for (let title in updates) updateBlog(title, updates[title])
  for (let title in deletes) deleteBlog(title)
  console.timeEnd("blogs")
}

function watch() {
  const prevFile = { filename: "", time: 0 }
  fs.watch(DIR, (event, filename) => {
    if (filename.startsWith(".~")) return
    if (!filename.endsWith(".md")) return
    const filepath = path.join(DIR, filename)
    const title = filename.slice(0, -3)
    // 修改
    if (event === "change") {
      // 防抖，修复更改一次文件触发3次change的问题
      if (prevFile.filename === filename && Date.now() - prevFile.time < 50) return
      prevFile.filename = filename
      prevFile.time = Date.now()
      // 为了修复获取文章详情时意外触发的change，要对比云端文章修改时间
      const localUpdated = fs.statSync(filepath).mtime.getTime()
      const remoteUpdated = db.get("select updated from blogs where title=?", title).updated
      if (localUpdated - remoteUpdated > 50) updateBlog(title, { updated: localUpdated })
    }
    // 新建、删除
    else if (event === "rename") {
      // 新建
      if (fs.existsSync(filepath)) {
        const stat = fs.statSync(filepath)
        createBlog(title, {
          id: stat.birthtime.getTime().toString(36),
          updated: stat.mtime.getTime(),
        })
      }
      // 删除
      else {
        const isExist = db.get("select count() from blogs where title=?", title)["count()"]
        if (isExist) deleteBlog(title)
      }
    }
  })
}
