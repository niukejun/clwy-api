// es6中继承的方法

/**
 * 自定义 404 错误类
 */
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

/**
 * 请求成功
 * @param res
 * @param message
 * @param data
 * @param code
 */
//  message 接收提示信息   data：数据库中返回的数据  code：状态码 默认200
function success(res, message, data = {}, code = 200) {
    res.status(code).json({
        status: true,
        message,
        data
    });
}

/**
 * 请求失败
 * @param res
 * @param error
 */
function failure(res, error) {
    if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(e => e.message);
        return res.status(400).json({
            status: false,
            message: '请求参数错误',
            errors
        });
    }

    if (error.name === 'NotFoundError') {
        return res.status(404).json({
            status: false,
            message: '资源不存在',
            errors: [error.message]
        });
    }

    res.status(500).json({
        status: false,
        message: '服务器错误',
        errors: [error.message]
    });
}


// 把上面的类导出
module.exports = {
    NotFoundError,
    success,
    failure
}


