Theta Viewer
============

RICOH THETAのような正距円筒図法(Equirectangular Projection)のパノラマ画像を、WebでブラウズできるHTML5ビューアーです。
[jQuery](http://jquery.com/)のプラグインになっています。
描画にはJavaScriptによる3Dライブラリ[three.js](http://threejs.org/)を使用しています。

Setup
-------------

1. jQueryとthree.jsをHTMLに先に読み込みます。以下の例は、jQueryとthree.jsをダウンロードし、jsフォルダに置いた場合のものになっています。
2. Theta ViewerをHTMLに読み込みます。以下の例は、配布しているファイルの中のbuildフォルダ中のtheta-viewer.min.jsをjsフォルダに置いた場合のものになっています。
3. HTMLのbody要素の中にTheta Viewerでパノラマ画像を表示する要素(例では#theta-viewer)を用意します。
4. パノラマ画像を表示するコードを記述します。具体的には「jQuery(パノラマ画像を表示したいセレクタ).createThetaViewer(画像ファイル);」で表示できます。以下の例では、#theta-viewerにimgフォルダの中のtheta.jpgを表示しています。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <script src="js/jquery-1.10.2.min.js"></script>
  <script src="js/jquery-migrate-1.2.1.min.js"></script>
  <script src="js/three.min.js"></script>
  <script src="js/theta-viewer.min.js"></script>
  <link rel="stylesheet" href="css/styles.css">
  <title>Sample of THETA Viewer</title>
</head>
<body>
  <div id="theta-viewer"></div>
  <script>
/*global jQuery */
(function ($) {
    'use strict';
    // #theta-viewerにパノラマ画像img/theta.jpgを表示
    $("#theta-viewer").createThetaViewer('img/theta.jpg');
}(jQuery));
  </script>
</body>
</html>
```

Manipulation
------------

- マウスのドラッグで注視点を移動
- マウスのホイールでズームイン/ズームアウト

Samples
-------

* [サンプル1(画像を指定して読み込み)](http://akokubo.github.io/ThetaViewer/demo1.html)
* [サンプル2(画像をドラッグ&ドロップ)](http://akokubo.github.io/ThetaViewer/demo2.html)

Platforms
---------

- Firefox
- Chrome
- Safari
- 対応したい: iOS、Android

Issues
------

ChangeLogs
----------

- v.0.2.0 2013/11/12 同一ページ内に複数のTheta Viewコンテンツが存在できるように修正
- v.0.1.2 2013/11/11 画像が裏表逆に表示されるのを修正
- v.0.1.1 2013/11/10 マウス操作のバグを修正
- v.0.1 2013/11/08 リリース


License
-------

MIT License

Author
------

[小久保温(Atsushi Kokubo)](http://www.dma.aoba.sendai.jp/~acchan/).
