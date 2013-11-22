if (typeof define === 'undefined') { var define = require('define').noConflict(); }

define('templates', ['./jade-runtime'], function(jade) {
  var Templates = {
   "#angry_cats-template": function(locals) {
      var buf = [];
      buf.push("<thead><tr class=\"header\"><th>Rank</th><th>Votes</th><th>Name</th><th>Image</th><th></th><th></th></tr></thead><tbody></tbody>");;return buf.join("");
    },
   "#angry_cat-template": function(locals) {
      var buf = [];
      var locals_ = (locals || {}),rank = locals_.rank,votes = locals_.votes,name = locals_.name,image_path = locals_.image_path;buf.push("<td>" + (jade.escape(null == (jade.interp = rank) ? "" : jade.interp)) + "</td><td>" + (jade.escape(null == (jade.interp = votes) ? "" : jade.interp)) + "</td><td>" + (jade.escape(null == (jade.interp = name) ? "" : jade.interp)) + "</td><td><img" + (jade.attrs({ 'src':(image_path), "class": [('angry_cat_pic')] }, {"src":true})) + "/></td><td><div class=\"rank_up\"><img src=\"assets/images/up.gif\"/></div><div class=\"rank_down\"><img src=\"assets/images/down.gif\"/></div></td><td><a href=\"#\" class=\"disqualify\">Disqualify</a></td>");;return buf.join("");
    }
  };
  return Templates;
});
