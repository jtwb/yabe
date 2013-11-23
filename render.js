var jsdom = require('jsdom').jsdom;
var nodejquery = require('jquery');

module.exports = function(options, callback) {

  var userfile = options.user_file,
      stdin = options.stdin;

  var document = jsdom(stdin || null);
  var $ = nodejquery.create(document.parentWindow);

  var usercode = require(userfile);
  usercode(document, $);

  process.on('exit', function() {
    console.log('on exit');
    console.log($('body').html());
    callback($('body').html());
  });
};
