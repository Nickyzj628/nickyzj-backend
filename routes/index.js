import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
    res.send(`
        <h1>El Psy Kongroo.</h1>
        <p>当前世界线变动率：1.048596%。</p>
        <ul>
            <li><a href="/shanbay">扇贝每日一句</a></li>
            <li><a href="/blogs">博客</a></li>
            <li><a href="/animes">番剧</a></li>
            <li><a href="/rooms">聊天室</a></li>
        </ul>
    `);
});

export default router;
