const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const { Op } = require('sequelize');   // 用于模糊查询
const {
    NotFoundError,
    success,
    failure,
} = require('../../utils/response');  // 封装各种错误信息和请求信息


/**
 * 查询用户列表
 * GET /admin/users
 */
router.get('/', async function (req, res) {
    try {
        // 获取查询参数
        const query = req.query;

        // 获取分页所需要的两个参数，currentPage 和 pageSize
        // 如果没有传递这两个参数，就使用默认值
        // 默认是第1页
        // 默认每页显示 10 条数据
        // Math.abs => 取绝对值  Number=>转化为数字类型
        const currentPage = Math.abs(Number(query.currentPage)) || 1;   // 当前页
        const pageSize = Math.abs(Number(query.pageSize)) || 10;        // 当前页的数据数量

        // 计算offset
        const offset = (currentPage - 1) * pageSize;

        // 定义查询条件
        const condition = {
            order: [['id', 'DESC']],

            // 在查询条件中添加 limit 和 offset
            limit: pageSize,
            offset: offset
        };

        // 如果有 title 查询参数，就添加到 where 条件中
        if (query.title) {
            condition.where = {
                title: {
                    [Op.like]: `%${query.title}%`
                }
            };
        }

        // 查询数据
        // 将 findAll 方法改为 findAndCountAll 方法
        // findAndCountAll 方法会返回一个对象，对象中有两个属性，一个是 count，一个是 rows，
        // count 是查询到的数据的总数，rows 中才是查询到的数据
        const { count, rows } = await User.findAndCountAll(condition);

        // 返回查询结果
        // res.json({
        //     status: true,
        //     message: '查询用户列表成功。',
        //     data: {
        //         users: rows,     // 最终查到的数据
        //         pagination: {
        //             total: count,   // 查询的数据总数
        //             currentPage,    // 每一页和当前页显示多少条
        //             pageSize,
        //         },
        //     }
        // });

    //     上述返回结果用封装的函数简化
        // 查询用户列表
        success(res, '查询用户列表成功。', {
            users: rows,
            pagination: {
                total: count,
                currentPage,
                pageSize,
            }
        });
    } catch (error) {
        // 返回错误信息
        // res.status(500).json({
        //     status: false,
        //     message: '查询用户列表失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});


/**
 * 查询用户详情
 * GET /admin/users/:id
 */
router.get('/:id', async function (req, res) {
    try {
        // // 获取用户 ID
        // const { id } = req.params;
        //
        // // 查询用户
        // const user = await User.findByPk(id);

        const user = await getUser(req);

        // if (user) {

            // res.json({
            //     status: true,
            //     message: '查询用户成功。',
            //     data: user
            // });

        success(res, '查询用户成功。', { user });

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '用户未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '查询用户失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 创建用户
 * POST /admin/users
 */
router.post('/', async function (req, res)  {
    // res.json({
    //     data: req.body
    // });

    try {
        // 白名单过滤
        // 因为用户提交的数据可能会包含一些我们不需要的数据，所以我们需要过滤一下
        // 只获取 title 和 content
        // const body = {
        //     title: req.body.title,
        //     content: req.body.content,
        // }

        // 白名单过滤 - 使用公告的方法简化
        const body = filterBody(req);

        // 使用 req.body 获取到用户通过 POST 提交的数据，然后创建用户
        // const user = await User.create(req.body);

        // 使用过滤好的 body 数据，创建用户
        const user = await User.create(body);

        // res.status(201).json({
        //     status: true,
        //     message: '创建用户成功。',
        //     data: user
        // });

        success(res, '创建用户成功。', { user }, 201);

    } catch (error) {
        // res.json({error})  // 查看error返回结果

        // if (error.name === 'SequelizeValidationError') {
        //     const errors = error.errors.map(e => e.message);
        //
        //     res.status(400).json({
        //         status: false,
        //         message: '请求参数错误。',
        //         errors
        //     });
        // } else {
        //     res.status(500).json({
        //         status: false,
        //         message: '创建用户失败。',
        //         errors: [error.message]
        //     });
        // }

        failure(res, error);

        // res.status(500).json({
        //     status: false,
        //     message: '创建用户失败。',
        //     errors: [error.message]
        // });
    }

});

/**
 * 删除用户
 * DELETE /admin/users
 */
router.delete('/:id', async function (req, res) {
    try {
        // // 获取用户 ID
        // const { id } = req.params;
        //
        // // 查询用户
        // const user = await User.findByPk(id);

        const user = await getUser(req);

        // if (user) {
            // 删除用户
            await user.destroy();

            // res.json({
            //     status: true,
            //     message: '删除用户成功。'
            // });

        // 删除用户。用户已经被删掉了，不存在了，所以不需要传 data
        success(res, '删除用户成功。');

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '用户未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '删除用户失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 更新用户
 * PUT /admin/users/:id
 */
router.put('/:id', async function (req, res) {
    try {
        // 白名单过滤  -- 使用公共方法简化
        const body = filterBody(req);

        // const { id } = req.params;
        // const user = await User.findByPk(id);

        const user = await getUser(req);

        // if (user) {
            // await user.update(req.body);

            await user.update(body);

            // res.json({
            //     status: true,
            //     message: '更新用户成功。',
            //     data: user
            // });

        success(res, '更新用户成功。', { user });

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '用户未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '更新用户失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 模糊搜索
 * GET /admin/users/:id
 */
router.get('/', async function (req, res) {
    try {
        // 获取查询参数
        const query = req.query;

        // 定义查询条件
        const condition = {
            order: [['id', 'DESC']]
        };

        // 如果有 title 查询参数，就添加到 where 条件中
        if (query.email) {
            condition.where = {
                email: {
                    [Op.eq]: query.email
                }
            };
        }

        if (query.username) {
            condition.where = {
                username: {
                    [Op.eq]: query.username
                }
            };
        }

        if (query.nickname) {
            condition.where = {
                nickname: {
                    [Op.like]: `%${ query.nickname }%`
                }
            };
        }

        if (query.role) {
            condition.where = {
                role: {
                    [Op.eq]: query.role
                }
            };
        }


        // 查询数据
        const users = await User.findAll(condition);

        // 返回查询结果
        res.json({
            status: true,
            message: '查询用户列表成功。',
            data: {
                users
            }
        });
    } catch (error) {
        // 返回错误信息
        // res.status(500).json({
        //     status: false,
        //     message: '查询用户列表失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});



/**
 * 公共方法：白名单过滤
 * @param req
 * @returns {{password, role: (number|string|*), introduce: ({type: *}|*), sex: ({allowNull: boolean, type: *, validate: {notNull: {msg: string}, notEmpty: {msg: string}, isIn: {args: [number[]], msg: string}}}|{defaultValue: number, allowNull: boolean, type: *}|*), nickname: (string|*), company: ({type: *}|*), avatar: ({type: *, validate: {isUrl: {msg: string}}}|*), email: (string|*), username}}
 */
function filterBody(req) {
    return {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        nickname: req.body.nickname,
        sex: req.body.sex,
        company: req.body.company,
        introduce: req.body.introduce,
        role: req.body.role,
        avatar: req.body.avatar
    };
}


/**
 * 公共方法：查询当前用户
 */
async function getUser(req) {
    // 获取用户 ID
    const { id } = req.params;

    // 查询当前用户
    const user = await User.findByPk(id);

    // 如果没有找到，就抛出异常
    if (!user) {
        throw new NotFoundError(`ID: ${ id }的用户未找到。`)
    }

    return user;
}


module.exports = router;
