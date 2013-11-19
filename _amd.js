require('define');

define(['underscore'], function(_) {
  console.log(arguments);
  console.log(_);
  console.log(_.extend({ a: 100} ,{b: 103}));
});
