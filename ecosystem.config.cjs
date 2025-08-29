module.exports = {
    apps: [
        {
            name: "amadeus",
            script: "app.js",
            watch: true,
            ignore_watch: ["node_modules", ".git"],
            time: true,
        }
    ],
};
