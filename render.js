if (typeof define === 'undefined') { var define = require('define').noConflict(); }

module.exports = function(options, callback) {
  var userfile = options.user_file,
      stdin = options.stdin;


  var userfile = require('userfile');
  userfile(stdin);

  setTimeout(function() {
    callback($('body').html());
  }, 300);
};
