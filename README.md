Isocode
=======

Isomorphic Javascript renderer

Uses node-jquery, jsdom, contextify, htmlparser, xmlhttprequest and describe to run the target code in a big fake browser environment which writes out an HTML string at the end.

Inspired by AirBnB Rendr and Facebook React.

Experimental.

Usage
=====

```bash

ζ npm install -g isocode

ζ cat ./examples/combined-angry-cats/index.html | isocode ./examples/combined-angry-cats/application.js
<div id="content"><table id="angry_cats" class="table-striped table-bordered"><thead><tr class="header"><th>Rank</th><th>Votes</th><th>Name</th><th>Image</th><th></th><th></th></tr></thead><tbody><tr class="angry_cat"><td>1</td><td>0</td><td>Wet Cat</td><td><img src="assets/images/cat2.jpg" class="angry_cat_pic" /></td><td><div class="rank_up"><img src="assets/images/up.gif" /></div><div class="rank_down"><img src="assets/images/down.gif" /></div></td><td><a href="#" class="disqualify">Disqualify</a></td></tr><tr class="angry_cat"><td>2</td><td>0</td><td>Bitey Cat</td><td><img src="assets/images/cat1.jpg" class="angry_cat_pic" /></td><td><div class="rank_up"><img src="assets/images/up.gif" /></div><div class="rank_down"><img src="assets/images/down.gif" /></div></td><td><a href="#" class="disqualify">Disqualify</a></td></tr><tr class="angry_cat"><td>3</td><td>0</td><td>Surprised Cat</td><td><img src="assets/images/cat3.jpg" class="angry_cat_pic" /></td><td><div class="rank_up"><img src="assets/images/up.gif" /></div><div class="rank_down"><img src="assets/images/down.gif" /></div></td><td><a href="#" class="disqualify">Disqualify</a></td></tr><tr class="angry_cat"><td>4</td><td>0</td><td>Cranky Cat</td><td><img src="assets/images/cat4.jpg" class="angry_cat_pic" /></td><td><div class="rank_up"><img src="assets/images/up.gif" /></div><div class="rank_down"><img src="assets/images/down.gif" /></div></td><td><a href="#" class="disqualify">Disqualify</a></td></tr></tbody></table></div>
```


Contributing
============

Try it out! Pull requests welcome, issues welcome.


Miscellany
==========

The example app is https://github.com/davidsulc/backbone.marionette-collection-example (excellent book at https://leanpub.com/marionette-gentle-introduction).
