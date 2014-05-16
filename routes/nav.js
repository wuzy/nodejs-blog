var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('nav', { title: '网址导航' });
});

module.exports = router;
