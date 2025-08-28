interface SuccessOptions {
    /** HTTP 状态码，默认 200 */
    statusCode?: number;
    /** 响应消息，默认 "success" */
    message?: string;
}

interface FailOptions {
    /** HTTP 状态码，默认 500 */
    statusCode?: number;
}

declare namespace Express {
    interface Request {
        query: {
            /** 经过 formatQuery() 处理后的 page 一定存在且为正整数 */
            page: number;
            [key: string]: any;
        };
    }

    interface Response {
        /**
         * 发送成功响应
         * @param data 要返回的数据对象
         * @param options 可选配置
         */
        success: (data?: object, options?: SuccessOptions) => void;

        /**
         * 发送失败响应
         * @param message 错误消息，默认 "failed"
         * @param options 可选配置
         */
        fail: (message?: string, options?: FailOptions) => void;
    }
}