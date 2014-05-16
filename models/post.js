var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, tags, source, content, desc) {
	this.name = name;
	this.title = title;
	this.tags = tags;
	this.source = source;
	this.content = content;
	this.desc = desc;
}

module.exports = Post;

Post.prototype.save = function (callback) {
	var date = new Date();

	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear + '-' + (date.getMonth() + 1),
		day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
		minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
		    date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
	};

	var post = {
		name: this.name,
		time: time,
		title: this.title,
		source: this.source,
		content: this.content,
		desc: this.desc,
		tags: this.tags,
		comments: [],
		pv: 0
	};

	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}

		db.collection('posts', function (err, collection) {
			if (err) {
				return callback(err);
			}

			collection.insert(post, {
				safe: true
			}, function (err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

Post.getAll = function (name, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}

		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			var query = {};
			if (name) {
				query.name = name;
			}

			collection.find(query).sort({
				time: -1
			}).toArray(function (err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}

				try {
				docs.forEach(function (doc) {
					doc.content = markdown.toHTML(doc.content);
				});} catch (e) {console.log(e)}

				callback(null, docs);
			});
		});
	});
};

Post.getOne = function (name, day, title, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}

		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			collection.findOne({
				name: name,
				'time.day': day,
				title: title
			}, function (err, doc) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
				//doc.content = markdown.toHTML(doc.content);
				if (doc) {
					collection.update({
						name: name,
						"time.day": day,
						title: title,
					}, {
						$inc: {pv: 1}
					}, function (err) {
						mongodb.close();
						if (err) {
							return callback(err);
						}
					});

					doc.content = markdown.toHTML(doc.content);
					if (doc.comments) {
						doc.comments.forEach(function (comment) {
							comment.content = markdown.toHTML(comment.content);
						});
		 	        }
				}

				callback(null, doc);

			});
		});
	});
};

Post.getTen = function (name, page, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			mongodb.close();
			return callback(err);
		}

		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			var query = {};
			if (name) {
				query.name = name;
			}

			collection.count(query, function (err, total) {
				collection.find(query, {
					skip: (page - 1) * 10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function (err, docs) {
					mongodb.close();
					if (err) {
						return callback(err);
					}

					try {
						docs.forEach(function (doc) {
							doc.post = markdown.toHTML(doc.post);
						});
					} catch (e) {}

					callback(null, docs, total);
				});
			});
		});
	});
};

Post.edit = function (name, day, title, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}

		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			collection.findOne({
				name: name,
				"time.day": day,
				title: title
			}, function (err, doc) {
				mongodb.close();
				if (err) {
					return callback(err);
				}

				callback(null, doc);
			});
		});
	});
};

Post.update = function (name, day, title, content, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}

		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			collection.update({
				name: name,
				"time.day": day,
				title: title,
			}, {
				$set: {content: content}
			}, function (err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

Post.remove = function (name, day, title, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}

		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			collection.remove({
				name: name,
				"time.day": day,
				title: title
			}, {
				w: 1
			}, function (err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};