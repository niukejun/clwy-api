const express = require('express');
const router = express.Router();
const { Course, Category, User } = require('../../models');
const { Op } = require('sequelize');   // 用于模糊查询
const {
    NotFoundError,
    success,
    failure,
} = require('../../utils/response');  // 封装各种错误信息和请求信息


/**
 * 查询课程列表
 * GET /admin/courses
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
            attributes: { exclude: ['CategoryId', 'UserId'] },
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar']
                }
            ],
            order: [['id', 'DESC']],
            limit: pageSize,
            offset: offset
        };

        // 如果有 title 查询参数，就添加到 where 条件中
        if (query.categoryId) {
            condition.where = {
                categoryId: {
                    [Op.eq]: query.categoryId
                }
            };
        }

        if (query.userId) {
            condition.where = {
                userId: {
                    [Op.eq]: query.userId
                }
            };
        }

        if (query.name) {
            condition.where = {
                name: {
                    [Op.like]: `%${ query.name }%`
                }
            };
        }

        if (query.recommended) {
            condition.where = {
                recommended: {
                    // 需要转布尔值
                    [Op.eq]: query.recommended === 'true'
                }
            };
        }

        if (query.introductory) {
            condition.where = {
                introductory: {
                    [Op.eq]: query.introductory === 'true'
                }
            };
        }


        // 查询数据
        // 将 findAll 方法改为 findAndCountAll 方法
        // findAndCountAll 方法会返回一个对象，对象中有两个属性，一个是 count，一个是 rows，
        // count 是查询到的数据的总数，rows 中才是查询到的数据
        const { count, rows } = await Course.findAndCountAll(condition);

        // 返回查询结果
        // res.json({
        //     status: true,
        //     message: '查询课程列表成功。',
        //     data: {
        //         courses: rows,     // 最终查到的数据
        //         pagination: {
        //             total: count,   // 查询的数据总数
        //             currentPage,    // 每一页和当前页显示多少条
        //             pageSize,
        //         },
        //     }
        // });

        //     上述返回结果用封装的函数简化
        // 查询课程列表
        success(res, '查询课程列表成功。', {
            courses: rows,
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
        //     message: '查询课程列表失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});


/**
 * 查询课程详情
 * GET /admin/courses/:id
 */
router.get('/:id', async function (req, res) {
    try {
        // // 获取课程 ID
        // const { id } = req.params;
        //
        // // 查询课程
        // const course = await Course.findByPk(id);

        const course = await getCourse(req);

        // if (course) {

        // res.json({
        //     status: true,
        //     message: '查询课程成功。',
        //     data: course
        // });

        success(res, '查询课程成功。', { course });

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '课程未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '查询课程失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 创建课程
 * POST /admin/courses
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

        // 使用 req.body 获取到用户通过 POST 提交的数据，然后创建课程
        // const course = await Course.create(req.body);

        // 使用过滤好的 body 数据，创建课程
        const course = await Course.create(body);

        // res.status(201).json({
        //     status: true,
        //     message: '创建课程成功。',
        //     data: course
        // });

        success(res, '创建课程成功。', { course }, 201);

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
        //         message: '创建课程失败。',
        //         errors: [error.message]
        //     });
        // }

        failure(res, error);

        // res.status(500).json({
        //     status: false,
        //     message: '创建课程失败。',
        //     errors: [error.message]
        // });
    }

});

/**
 * 删除课程
 * DELETE /admin/courses
 */
router.delete('/:id', async function (req, res) {
    try {
        // // 获取课程 ID
        // const { id } = req.params;
        //
        // // 查询课程
        // const course = await Course.findByPk(id);

        const course = await getCourse(req);

        // if (course) {
        // 删除课程
        await course.destroy();

        // res.json({
        //     status: true,
        //     message: '删除课程成功。'
        // });

        // 删除课程。课程已经被删掉了，不存在了，所以不需要传 data
        success(res, '删除课程成功。');

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '课程未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '删除课程失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 更新课程
 * PUT /admin/courses/:id
 */
router.put('/:id', async function (req, res) {
    try {
        // 白名单过滤  -- 使用公共方法简化
        const body = filterBody(req);

        // const { id } = req.params;
        // const course = await Course.findByPk(id);

        const course = await getCourse(req);

        // if (course) {
        // await course.update(req.body);

        await course.update(body);

        // res.json({
        //     status: true,
        //     message: '更新课程成功。',
        //     data: course
        // });

        success(res, '更新课程成功。', { course });

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '课程未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '更新课程失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 模糊搜索
 * GET /admin/courses/:id
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
        if(query.title) {
            condition.where = {
                title: {
                    [Op.like]: `%${query.title}%`
                }
            };
        }

        // 查询数据
        const courses = await Course.findAll(condition);

        // 返回查询结果
        res.json({
            status: true,
            message: '查询课程列表成功。',
            data: {
                courses
            }
        });
    } catch (error) {
        // 返回错误信息
        // res.status(500).json({
        //     status: false,
        //     message: '查询课程列表失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});



/**
 * 公共方法：白名单过滤
 * @param req
 * @returns {{image: *, name, introductory: (boolean|*), userId: (number|*), categoryId: (number|*), content, recommended: (boolean|*)}}
 */
function filterBody(req) {
    return {
        categoryId: req.body.categoryId,
        userId: req.body.userId,
        name: req.body.name,
        image: req.body.image,
        recommended: req.body.recommended,
        introductory: req.body.introductory,
        content: req.body.content
    };
}


/**
 * 公共方法：查询当前课程
 */
async function getCourse(req) {
    // 获取课程 ID
    const { id } = req.params;

    // 查询当前课程
    const course = await Course.findByPk(id);

    // 如果没有找到，就抛出异常
    if (!course) {
        throw new NotFoundError(`ID: ${ id }的课程未找到。`)
    }

    return course;
}


module.exports = router;
