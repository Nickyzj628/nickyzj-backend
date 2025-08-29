import express from "express";
import sharp from "sharp";
import { WEBDAV_PATH } from "../libs/constants.js";
import { formatQuery, getFiles, to } from "../libs/utils.js";

/** 番剧文件夹在 dufs 的相对路径 */
const DIR = "/Nickyzj/Animes";

/**
 * 初始化路由所需数据
 */

let seasons = [];
let pages = 0;

const init = async () => {
    console.time("初始化路由/animes");

    // 读取季度列表
    const files = await getFiles(DIR, (data) => data.sort((a, b) => b.name.localeCompare(a.name, "zh")));
    seasons = files.map((file) => file.name);
    pages = seasons.length;

    console.timeEnd("初始化路由/animes");
};

init();

/**
 * 路由相关逻辑
 */

const router = express.Router();

router.get("/", async (req, res) => {
    const { page } = formatQuery(req.query);
    const season = seasons[page - 1];
    if (season === undefined) {
        res.success({ page, pages, data: [] });
        return;
    }

    const files = await getFiles(`${DIR}/${season}`);
    const data = files.map((dir) => {
        return {
            title: dir.name,
            season,
            eps: dir.size,
            updated: dir.mtime,
        };
    });

    res.success({ page, pages, data });
});

router.get("/:season", async (req, res) => {
    const { season } = req.params;
    if (!seasons.includes(season)) {
        res.success({ data: [] });
        return;
    }

    const files = await getFiles(`/${DIR}/${season}`);
    const data = files.map((dir) => {
        return {
            title: dir.name,
            season,
            eps: dir.size,
            updated: dir.mtime,
        };
    });

    res.success({ data });
});

router.get("/:season/:title", async (req, res) => {
    const { season, title } = req.params;

    const files = await getFiles(`/${DIR}/${season}/${title}`);
    const episodes = files
        .map((file) => file.name)
        .sort((a, b) => a.localeCompare(b, "zh"));

    res.success({ title, season, episodes });
});

router.put("/:year/:title", async (req, res) => {
    const { title, year } = req.params;
    const { cover } = req.body;

    // 修改封面（前端传 base64）
    if (cover && typeof cover === "string") {
        const base64 = cover.includes(";base64,") ? cover.split(";base64,").pop() : cover;
        const buffer = Buffer.from(base64, "base64");

        const fileOut = `${WEBDAV_PATH}/Nickyzj/Photos/Animes/${title}.webp`;
        const [error, response] = await to(sharp(buffer).webp().toFile(fileOut));
        if (error) {
            res.fail(`封面处理失败：${error.message}`);
            return;
        }
    }

    res.success();
});

export default router;
