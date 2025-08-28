import express from "express";
import hljs from "highlight.js";
import { Marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedHighlight } from "marked-highlight";
import sharp from "sharp";
import { WEBDAV_PATH, WEBDAV_URL } from "../lib/constants.js";
import { formatQuery, getFiles, to } from "../lib/utils.js";

/** 博客文件夹在 dufs 的相对路径 */
const DIR = "/Nickyzj/Blogs";

/** markdown 转 html */
const marked = new Marked(
    {
        // 启用 Github Flavored Markdown 标准，支持表格、列表、删除线等
        gfm: true,
        // 支持单换行，更符合写作习惯
        breaks: true,
    },
    markedHighlight({
        emptyLangClass: "hljs",
        langPrefix: "hljs language-",
        highlight: (code, lang) => {
            const language = hljs.getLanguage(lang) ? lang : "plaintext";
            const result = hljs.highlight(code, { language });
            return result.value;
        },
    }),
    gfmHeadingId(),
);

/**
 * 初始化路由所需数据
 */

let years = [];
let pages = 0;

const init = async () => {
    console.time("Route blogs inited");

    // 读取年份范围
    const files = await getFiles(DIR);
    years = files.map((file) => parseInt(file.name));
    pages = years.length;

    console.timeEnd("Route blogs inited");
};

init();

/**
 * 路由相关逻辑
 */

const router = express.Router();

router.get("/", async (req, res) => {
    const { page } = formatQuery(req.query);
    const year = years[page - 1];
    if (!year) {
        res.success({ page, pages, data: [] });
        return;
    }

    const files = await getFiles(`${DIR}/${year}`);
    const data = files.map((file) => {
        const title = file.name.replace(".md", "");
        return {
            title,
            year,
            updated: file.mtime,
        };
    });

    res.success({ page, pages, data });
});

router.get("/:year", async (req, res) => {
    const { year } = req.params;
    if (!years.includes(parseInt(year))) {
        res.success({ data: [] });
        return;
    }

    const files = await getFiles(`/${DIR}/${year}`);
    const data = files.map((dir) => {
        return {
            title: dir.name,
            year,
            eps: dir.size,
            updated: dir.mtime,
        };
    });

    res.success({ data });
});

router.get("/:year/:title", async (req, res) => {
    const { year, title } = req.params;

    const path = `${WEBDAV_URL}${DIR}/${year}/${title}.md`;
    const [error, response] = await to(fetch(path));
    if (error) {
        res.fail(`读取文章失败：${error.message}`);
        return;
    }

    const text = await response.text();
    const content = marked.parse(text);
    const minutes = Math.ceil(text.length / 500);
    res.success({ title, year, minutes, content });
});

router.put("/:year/:title", async (req, res) => {
    const { title, year } = req.params;
    const { cover } = req.body;

    // 修改封面（前端传 base64）
    if (cover && typeof cover === "string") {
        const base64 = cover.includes(";base64,") ? cover.split(";base64,").pop() : cover;
        const buffer = Buffer.from(base64, "base64");

        const fileOut = `${WEBDAV_PATH}/Nickyzj/Photos/Blogs/${title}.webp`;
        const [error, response] = await to(sharp(buffer).webp().toFile(fileOut));
        if (error) {
            res.fail(`封面处理失败：${error.message}`);
            return;
        }
    }

    res.success();
});

export default router;
