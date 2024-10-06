const express = require('express');
const router = express.Router();
const { Article } = require('../../models');
const { Op } = require('sequelize');   // 用于模糊查询
const {
    NotFoundError,
    success,
    failure,
} = require('../../utils/response');  // 封装各种错误信息和请求信息


/**
 * 查询文章列表
 * GET /admin/articles
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
        const { count, rows } = await Article.findAndCountAll(condition);

        // 返回查询结果
        // res.json({
        //     status: true,
        //     message: '查询文章列表成功。',
        //     data: {
        //         articles: rows,     // 最终查到的数据
        //         pagination: {
        //             total: count,   // 查询的数据总数
        //             currentPage,    // 每一页和当前页显示多少条
        //             pageSize,
        //         },
        //     }
        // });

    //     上述返回结果用封装的函数简化
        // 查询文章列表
        success(res, '查询文章列表成功。', {
            articles: rows,
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
        //     message: '查询文章列表失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});


/**
 * 查询文章详情
 * GET /admin/articles/:id
 */
router.get('/:id', async function (req, res) {
    try {
        // // 获取文章 ID
        // const { id } = req.params;
        //
        // // 查询文章
        // const article = await Article.findByPk(id);

        const article = await getArticle(req);

        // if (article) {

            // res.json({
            //     status: true,
            //     message: '查询文章成功。',
            //     data: article
            // });

        success(res, '查询文章成功。', { article });

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '文章未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '查询文章失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 创建文章
 * POST /admin/articles
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

        // 使用 req.body 获取到用户通过 POST 提交的数据，然后创建文章
        // const article = await Article.create(req.body);

        // 使用过滤好的 body 数据，创建文章
        const article = await Article.create(body);

        // res.status(201).json({
        //     status: true,
        //     message: '创建文章成功。',
        //     data: article
        // });

        success(res, '创建文章成功。', { article }, 201);

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
        //         message: '创建文章失败。',
        //         errors: [error.message]
        //     });
        // }

        failure(res, error);

        // res.status(500).json({
        //     status: false,
        //     message: '创建文章失败。',
        //     errors: [error.message]
        // });
    }

});

/**
 * 删除文章
 * DELETE /admin/articles
 */
router.delete('/:id', async function (req, res) {
    try {
        // // 获取文章 ID
        // const { id } = req.params;
        //
        // // 查询文章
        // const article = await Article.findByPk(id);

        const article = await getArticle(req);

        // if (article) {
            // 删除文章
            await article.destroy();

            // res.json({
            //     status: true,
            //     message: '删除文章成功。'
            // });

        // 删除文章。文章已经被删掉了，不存在了，所以不需要传 data
        success(res, '删除文章成功。');

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '文章未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '删除文章失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 更新文章
 * PUT /admin/articles/:id
 */
router.put('/:id', async function (req, res) {
    try {
        // 白名单过滤  -- 使用公共方法简化
        const body = filterBody(req);

        // const { id } = req.params;
        // const article = await Article.findByPk(id);

        const article = await getArticle(req);

        // if (article) {
            // await article.update(req.body);

            await article.update(body);

            // res.json({
            //     status: true,
            //     message: '更新文章成功。',
            //     data: article
            // });

        success(res, '更新文章成功。', { article });

        // } else {
        //     res.status(404).json({
        //         status: false,
        //         message: '文章未找到。',
        //     });
        // }
    } catch (error) {
        // res.status(500).json({
        //     status: false,
        //     message: '更新文章失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});

/**
 * 模糊搜索
 * GET /admin/articles/:id
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
        const articles = await Article.findAll(condition);

        // 返回查询结果
        res.json({
            status: true,
            message: '查询文章列表成功。',
            data: {
                articles
            }
        });
    } catch (error) {
        // 返回错误信息
        // res.status(500).json({
        //     status: false,
        //     message: '查询文章列表失败。',
        //     errors: [error.message]
        // });

        failure(res, error);
    }
});



/**
 * 公共方法：白名单过滤
 * @param req
 * @returns {{title, content: (string|string|DocumentFragment|*)}}
 */
function filterBody(req) {
    return {
        title: req.body.title,
        content: req.body.content
    };
}

/**
 * 公共方法：查询当前文章
 */
async function getArticle(req) {
    // 获取文章 ID
    const { id } = req.params;

    // 查询当前文章
    const article = await Article.findByPk(id);

    // 如果没有找到，就抛出异常
    if (!article) {
        throw new NotFoundError(`ID: ${ id }的文章未找到。`)
    }

    return article;
}


module.exports = router;
