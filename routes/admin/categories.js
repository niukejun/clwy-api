const express = require('express');
const router = express.Router();
const { Category } = require('../../models');
const { Op } = require('sequelize');   // 用于模糊查询
const {
    NotFoundError,
    success,
    failure,
} = require('../../utils/response');  // 封装各种错误信息和请求信息


/**
 * 查询分类列表
 * GET /admin/categories
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

        // 如果有 name 查询参数，就添加到 where 条件中
        if (query.name) {
            condition.where = {
                name: {
                    [Op.like]: `%${query.name}%`
                }
            };
        }

        // 查询数据
        // 将 findAll 方法改为 findAndCountAll 方法
        // findAndCountAll 方法会返回一个对象，对象中有两个属性，一个是 count，一个是 rows，
        // count 是查询到的数据的总数，rows 中才是查询到的数据
        const { count, rows } = await Category.findAndCountAll(condition);

        // 返回查询结果
        // res.json({
        //     status: true,
        //     message: '查询分类列表成功。',
        //     data: {
        //         categories: rows,     // 最终查到的数据
        //         pagination: {
        //             total: count,   // 查询的数据总数
        //             currentPage,    // 每一页和当前页显示多少条
        //             pageSize,
        //         },
        //     }
        // });

    //     上述返回结果用封装的函数简化
        // 查询分类列表
        success(res, '查询分类列表成功。', {
            categories: rows,
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
        //     message: '查询分类列表失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});


/**
 * 查询分类详情
 * GET /admin/categories/:id
 */
router.get('/:id', async function (req, res) {
    try {
        // // 获取分类 ID
        // const { id } = req.params;
        //
        // // 查询分类
        // const category = await Category.findByPk(id);

        const category = await getCategory(req);

        // if (category) {

            // res.json({
            //     status: true,
            //     message: '查询分类成功。',
            //     data: category
            // });

        success(res, '查询分类成功。', { category });

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '分类未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '查询分类失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 创建分类
 * POST /admin/categories
 */
router.post('/', async function (req, res)  {
    // res.json({
    //     data: req.body
    // });

    try {
        // 白名单过滤
        // 因为用户提交的数据可能会包含一些我们不需要的数据，所以我们需要过滤一下
        // 只获取 name 和 rank
        // const body = {
        //     name: req.body.name,
        //     rank: req.body.rank,
        // }

        // 白名单过滤 - 使用公告的方法简化
        const body = filterBody(req);

        // 使用 req.body 获取到用户通过 POST 提交的数据，然后创建分类
        // const category = await Category.create(req.body);

        // 使用过滤好的 body 数据，创建分类
        const category = await Category.create(body);

        // res.status(201).json({
        //     status: true,
        //     message: '创建分类成功。',
        //     data: category
        // });

        success(res, '创建分类成功。', { category }, 201);

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
        //         message: '创建分类失败。',
        //         errors: [error.message]
        //     });
        // }

        failure(res, error);

        // res.status(500).json({
        //     status: false,
        //     message: '创建分类失败。',
        //     errors: [error.message]
        // });
    }

});

/**
 * 删除分类
 * DELETE /admin/categories
 */
router.delete('/:id', async function (req, res) {
    try {
        // // 获取分类 ID
        // const { id } = req.params;
        //
        // // 查询分类
        // const category = await Category.findByPk(id);

        const category = await getCategory(req);

        // if (category) {
            // 删除分类
            await category.destroy();

            // res.json({
            //     status: true,
            //     message: '删除分类成功。'
            // });

        // 删除分类。分类已经被删掉了，不存在了，所以不需要传 data
        success(res, '删除分类成功。');

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '分类未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '删除分类失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 更新分类
 * PUT /admin/categories/:id
 */
router.put('/:id', async function (req, res) {
    try {
        // 白名单过滤  -- 使用公共方法简化
        const body = filterBody(req);

        // const { id } = req.params;
        // const category = await Category.findByPk(id);

        const category = await getCategory(req);

        // if (category) {
            // await category.update(req.body);

            await category.update(body);

            // res.json({
            //     status: true,
            //     message: '更新分类成功。',
            //     data: category
            // });

        success(res, '更新分类成功。', { category });

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '分类未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '更新分类失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 模糊搜索
 * GET /admin/categories/:id
 */
router.get('/', async function (req, res) {
    try {
        // 获取查询参数
        const query = req.query;

        // 定义查询条件
        const condition = {
            order: [['id', 'DESC']]
        };

        // 如果有 name 查询参数，就添加到 where 条件中
        if(query.name) {
            condition.where = {
                name: {
                    [Op.like]: `%${query.name}%`
                }
            };
        }

        // 查询数据
        const categories = await Category.findAll(condition);

        // 返回查询结果
        res.json({
            status: true,
            message: '查询分类列表成功。',
            data: {
                categories
            }
        });
    } catch (error) {
        // 返回错误信息
        // res.status(500).json({
        //     status: false,
        //     message: '查询分类列表失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});


/**
 * 公共方法白名单
 * @param req
 * @returns {{name, rank: (number|*)}}
 */
function filterBody(req) {
    return {
        name: req.body.name,
        rank: req.body.rank
    };
}

/**
 * 公共方法：查询当前分类
 */
async function getCategory(req) {
    // 获取分类 ID
    const { id } = req.params;

    // 查询当前分类
    const category = await Category.findByPk(id);

    // 如果没有找到，就抛出异常
    if (!category) {
        throw new NotFoundError(`ID: ${ id }的分类未找到。`)
    }

    return category;
}


module.exports = router;
