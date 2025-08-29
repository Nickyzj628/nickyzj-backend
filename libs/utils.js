import { WEBDAV_URL } from "./constants.js";

/** 
 * Go 语言风格的异步处理方式
 * @template T
 * @param {Promise<T>} promise
 * @returns {Promise<[null, T] | [Error, null]>}
 */
export const to = (promise) => {
    return promise
        .then((result) => {
            if (result?.success === false) {
                throw new Error(result.message);
            }
            return [null, result];
        })
        .catch((error) => [error, null]);
};

/** 
 * 修正 req.query 里的常见参数
 * @param {Record<string, string>} query
 * @returns {Record<string, any>}
 */
export const formatQuery = (query = {}) => {
    const result = { ...query };

    /**
     * 修正 page 为正整数
     * 0、1、负数、其他字符都算作1;
     */

    let formattedPage = parseInt(query.page);

    // 判断是否为正整数，且大于 1
    if (!Number.isInteger(formattedPage) || formattedPage < 1) {
        formattedPage = 1;
    }
    result.page = formattedPage;

    return result;
};

/**
 * 获取目录下的文件列表
 * @param {string} relativePath 
 * @param {(data: File[]) => File[]} [sorter] - 排序函数，默认按修改时间降序排列
 * @returns {Promise<File[]>}
 */
export const getFiles = async (
    relativePath,
    sorter = (data) => data.sort((a, b) => b.mtime - a.mtime),
) => {
    const path = `${WEBDAV_URL}${relativePath}?json`;
    const [error, response] = await to(fetch(path));
    if (error) {
        console.log(`获取目录${relativePath}下的文件列表失败：${error.message}`);
        return [];
    }

    const data = (await response.json()).paths;
    const sortedData = sorter(data);
    return sortedData;
};

/**
 * 防抖
 * @param {(...args: any[]) => void} func 
 * @param {number} delay 距离上次调用多久之后执行函数，默认 1000 毫秒
 */
export const debounce = (func, delay = 1000) => {
    let timer;
    return (...args) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            func(args);
        }, delay);
    };
};
