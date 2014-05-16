var express = require('express');
var router = express.Router();

var crypto = require('crypto'),
    fs = require('fs'),
    User = require('../models/users.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');


router.get('/post', checkLogin);
router.post('/post', checkLogin);

router.get('/logout', checkLogin);


/* GET home page. */
router.get('/', function(req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;

    Post.getTen(null, page, function (err, posts, total) {
        if (err) {
          posts = [];
        }

        res.render('index', {
            title: '主页',
            posts: posts,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 10) + posts.length === total,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString() 
        });
    });
});

router.get('/reg', function (req, res) {
	res.render('reg', { 
		title: '注册',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString() 
	});
});

router.post('/reg', function (req, res) {
  var name = req.body.name,
      password = req.body.password,
      password_re = req.body['password-repeat'];
  //检验用户两次输入的密码是否一致
  if (password_re != password) {
    req.flash('error', '两次输入的密码不一致!'); 
    return res.redirect('/reg');//返回注册页
  }

  //生成密码的 md5 值
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
  });
  //检查用户名是否已经存在 
  User.get(newUser.name, function (err, user) {
    if (user) {
      req.flash('error', '用户已存在!');
      return res.redirect('/reg');//返回注册页
    }
    //如果不存在则新增用户
    newUser.save(function (err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/reg');//注册失败返回主册页
      }
      req.session.user = user;//用户信息存入 session
      req.flash('success', '注册成功!');
      res.redirect('/');//注册成功后返回主页
    });
  });
});

router.get('/login', function (req, res) {
	res.render('login', { 
		title: '登录',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()  
	});
});

router.post('/login', function (req, res) {
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    User.get(req.body.name, function (err, user) {
    	if (!user) {
    		req.flash('error', '用户不存在');
    		return res.redirect('/login');
    	}

    	if (user.password !== password) {
    		req.flash('error', '密码错误');
    		return res.redirect('/login');
    	}

    	req.session.user = user;
    	req.flash('success', '登录成功');
      console.log(req.session);
    	res.redirect('/');
    })
});

router.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/');
});

// 上传
router.get('/upload', checkLogin);
router.get('/upload', function (req, res) {
  res.render('upload', {
    title: '上传文件',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
});

router.post('/upload', checkLogin);
router.post('/upload', function (req, res) {

  for (var i in req.files) {
    if (req.files[i].size == 0) {
      fs.unlinkSync(req.fiels[i].path);
      console.log('successfully removed an emty file');
    } else {
      var targetPath = './public/images/' + req.files[i].name;

      fs.renameSync(req.files[i].path, targetPath);
      console.log('successfully renamed a file!');
    }
  }

  req.flash('success', '文件上传成功');
  res.redirect('/upload');
});

// 获取用户个人文章
router.get('/u/:name', function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;

    User.get(req.params.name, function (err, user) {
        if (!user) {
            req.flash('error', '用户不存在');
            return res.redirect('/');
        }

        Post.getTen(user.name, function (err, posts, total) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            res.render('user', {
                title: user.name,
                posts: posts,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + posts.length) === total,
                user: req.session.user,
                success: req.flash('sucess').toString(),
                error: req.flash('error').toString()
            });
        });
    });
});

router.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err); 
            return res.redirect('/');
        }
        res.render('article', {
            title: req.params.title,
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '' +
            date.getHours() + ':' + (date.getMinutes() < 10 ? '0'+ date.getMinutes() : date.getMinutes());

    var comment = {
        name: req.body.name,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };

    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }

        req.flash('success', '留言成功');
        req.redirect('back');
    });
});

// 编辑文章
router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }

        res.render('edit', {
            title: '编辑',
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});


// 更新文章
router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;

    Post.update(currentUser.name, req.params.day, req.params.title, req.body.content, function (err) {
        var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;
        if (err) {
            req.flash('error', err);
            return res.redirect(url);
        }

        req.flash('success', '修改成功');
        req.redirect(url);
    });
});

// 删除文章
router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;

    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }

        req.flash('success', '删除成功');
        req.redirect('/');
    });
});


router.get('/post', function (req, res) {
  res.render('post', { 
    title: '发表',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()  
  });
});

// app.post('/post', checkLogin);
router.post('/post', function (req, res) {
    var currentUser = req.session.user,
        tags = [req.body.tag1, req.body.tag2, req.body.tag3],
        post = new Post(currentUser.name, req.body.title, tags, req.body.source, req.body.content, req.body.desc);

    post.save(function (err) {
    	if (err) {
    		req.flash('error', err);
    		return res.redirect('/');
    	}

    	req.flash('success', '发布成功');
    	res.redirect('/');
    });
});


router.use(function (req, res) {
  res.render('404');
});


function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录');
        req.redirect('/login');
    }
    next();
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录');
        res.redirect('back');
    }
    next();
}



module.exports = router;
