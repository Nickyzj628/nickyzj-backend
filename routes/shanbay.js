import { Router } from "express";
import { to } from "../libs/utils.js";

const router = Router();
const data = {};

router.get("/", async (req, res) => {
    if (Object.keys(data).length > 0) {
        res.success(data);
        return;
    }

    const [error, response] = await to(fetch("https://apiv3.shanbay.com/weapps/dailyquote/quote"));
    if (error) {
        res.fail(`Failed to fetch data from Shanbay: ${error.message}`);
        return;
    }

    const json = await response.json();
    Object.assign(data, {
        content: json.content,
        translation: json.translation,
        author: json.author,
        image: json.origin_img_urls[0],
        href: json.share_img_urls[0],
    });
    res.success(data);
});

export default router;
