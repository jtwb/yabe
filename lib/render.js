var fs = require('fs');
var jsdom = require('jsdom').jsdom;
var nodejquery = require('jquery');

var prefix = fs.readFileSync('lib/wrap.prefix', 'utf8');
var suffix = fs.readFileSync('lib/wrap.suffix', 'utf8');

module.exports = function(options, callback) {

  var userfile = options.user_file,
      stdin = options.stdin;

  var document = jsdom(stdin || null);
  var $ = nodejquery.create(document.parentWindow);

  var usercode = fs.readFileSync(userfile, 'utf8');
  eval(prefix + usercode + suffix);
  runusercode(document, $);

  process.on('exit', function() {
    callback($('html').html());
  });
};
