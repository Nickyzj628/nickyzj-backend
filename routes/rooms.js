import express from "express"
import db from "../lib/sqlite.js"

const router = express.Router()

router.get("/", (req, res) => {
	const rooms = db.all("SELECT * FROM rooms")
	res.success(rooms)
})

export default router
