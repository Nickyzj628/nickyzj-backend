export default {
    input: "app.js",
    output: {
        file: "dist/bundle.cjs",
        format: "cjs",
        minify: true,
    },
    platform: "node",
    external: ["sharp"],
};
