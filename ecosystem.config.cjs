module.exports = {
    apps: [
        {
            name: "amadeus",
            script: "app.js",
            watch: true,
            ignore_watch: ["node_modules", "v1.db", "v1.db-journal"],
            time: true,
        }
    ],
};
