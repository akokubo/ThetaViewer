Theta Viewer
============

RICOH THETAのような正距円筒図法(Equirectangular Projection)のパノラマ画像を、WebでブラウズできるHTML5ビューアーです。
[jQuery](http://jquery.com/)のプラグインになっています。

描画にはJavaScriptによる3Dライブラリ[three.js](http://threejs.org/)を使用しています。
ブラウザが[WebGL](http://www.khronos.org/webgl/)に対応していれば、WebGLを用いて、球面にパノラマ画像をマッピングして表示します。
WebGLに対応せず、[CSS Transforms Module Level 1](http://www.w3.org/TR/css-transforms-1/)の3DとCanvasに対応している場合には、キューブマップによる描画を試みます。
WebGL、CSS Transforms Module Level 1の3Dに対応せず、Canvasに対応している場合には、Canvasによる描画を試みます。
いずれにも対応していない場合には、描画しません。
現時点では、パノラマ画像の正距円筒図法からキューブマップへの変換には、最近傍補間(Nearest Neighbor Interpolation)を用いていて、あまりきれいな変換にはなっていません。
また、[Mega pixel image rendering library for iOS6 Safari](https://github.com/stomita/ios-imagefile-megapixel)を用いて、キューブマップへの変換時にテクスチャーの画像を最大2048x1024にダウンサンプリングします。
これは、キューブマップの描画はiOSの場合を想定していて、iOSのMobile Safariではcanvasの描画の限界が2048x1024である場合があることによるものです。

ブラウザのHTML5 canvas、CSS Transformsの3D、タッチ・イベントへの対応状況を調べるために[Modernizr](http://modernizr.com/)を使用しています。

Setup
-------------

1. jQuery、Modernizr、Mega pixel image rendering library for iOS6 SafariをHTMLに先に読み込みます。以下の例では、これらをすべてjsフォルダに置いています。Modernizrは、production版でCSS 3D Transforms、Canvas、Touch Eventsのチェックのみを有効にして生成し、それをmodernizr-2.7.1-csstransforms3d-canvas-touch.jsという名前で保存したものを使用しています。
2. 次にthree.jsと、three.jsに付属のDetector.js、CSS3DRenderer.jsを読み込ませます。以下の例では、これらをすべてjsフォルダに置いています。three.jsは、ミニファイ版three.min.jsを指定しています。ミニファイ版three.min.jsは、three.jsをダウンロードして展開してできるbuildフォルダにあります。Detector.jsは、examples/jsフォルダにあります。CSS3DRenderer.jsは、examples/js/renderersフォルダにあります。
2. Theta ViewerをHTMLに読み込みます。以下の例は、配布しているファイルの中のbuildフォルダ中のtheta-viewer.min.jsをjsフォルダに置いた場合のものになっています。
3. HTMLのbody要素の中にTheta Viewerでパノラマ画像を表示する要素(例では#theta-viewer)を用意します。
4. パノラマ画像を表示するコードを記述します。具体的には「jQuery(パノラマ画像を表示したいセレクタ).createThetaViewer(画像ファイル);」で表示できます。以下の例では、#theta-viewerにimgフォルダの中のtheta.jpgを表示しています。

```html
<!DOCTYPE html>
<html lang="ja" class="no-js">
<head>
  <meta charset="UTF-8">
  <script src="js/jquery-1.10.2.min.js"></script>
  <script src="js/modernizr-2.7.1-csstransforms3d-canvas-touch.js"></script>
  <script src="js/megapix-image.js"></script>
  <script src="js/three.min.js"></script>
  <script src="js/Detector.js"></script>
  <script src="js/CSS3DRenderer.js"></script>
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

Manipulations
-------------

- マウス/タッチのドラッグで注視点を移動
- マウスのホイールでズームイン/ズームアウト

Samples
-------

* [サンプル1(画像を指定して読み込み)](http://akokubo.github.io/ThetaViewer/demo1.html)
* [サンプル2(画像をドラッグ&ドロップ)](http://akokubo.github.io/ThetaViewer/demo2.html)

Platforms
---------

- Chrome
- Safari
- Firefox
- Internet Explorer 11
- iOS、Android

Problems
--------

- OS X MarvericksでFirefox v.25の場合(他の環境では未確認)、スクロールによりウィンドウ内外にTheta Viewerコンテンツを移動するとハングする。three.jsのWebGLRendererを使用してアニメーションを実行しているためだと思われる。

ChangeLogs
----------

- v.0.3.3 2014/01/07 CSS Transforms Module Level 1使用時の表示のバグの修正
- v.0.3.2 2014/01/05 Canvasレンダラーへの対応とバグの修正
- v.0.3.1 2014/01/01 WebGLが利用可能かどうかを判定する部分のバグを修正
- v.0.3.0 2014/01/01 iOS、Androidに対応(CSS Transforms Module Level 1の3Dを使用)
- v.0.2.0 2013/11/12 同一ページ内に複数のTheta Viewerコンテンツが存在できるように修正
- v.0.1.2 2013/11/11 画像が裏表逆に表示されるのを修正
- v.0.1.1 2013/11/10 マウス操作のバグを修正
- v.0.1 2013/11/08 リリース

Articles
--------

- [小久保温、「全周パノラマ画像WebGL/CSS 3D Transformsビューアーの開発」、平成25年度第4回芸術科学会東北支部研究会 研究会論文25-04-09、2014年3月29日、日本大学工学部](http://akokubo.github.io/ThetaViewer/pdf/as-tohoku-25-04-09-resume.pdf)

License
-------

MIT License

Author
------

[小久保温(Atsushi Kokubo)](http://www.dma.aoba.sendai.jp/~acchan/).
