/**
 * Theta Viewer v0.3.0
 *
 * Copyright Atsushi Kokubo
 * Released under the MIT license.
 */

/*jslint browser:true, devel:true */
/*global jQuery, THREE, Detector, MegaPixImage, Modernizr, requestAnimationFrame */

(function ($) {
    'use strict';

    var ThetaViewer = function (element, texture, mode) {

        // レンダラーの生成と要素の追加
        function createRenderer(that, element, mode) {
            if (mode === "WebGL") {
                that.renderer = new THREE.WebGLRenderer({ antialias: true });
                that.renderer.setClearColor(0x000000, 1);
            } else if (mode === "CSS3D") {
                that.renderer = new THREE.CSS3DRenderer();
            }

            that.renderer.setSize(element.width(), element.height());

            // elementにWebGLを表示するcanvas要素を追加
            $(element).append(that.renderer.domElement);
        }

        // シーンの生成
        function buildScene(that) {
            that.scene = new THREE.Scene();
        }

        // 光源の生成とシーンへの追加
        function createLight(that) {
            // 環境光を作成
            var ambient = new THREE.AmbientLight(0xFFFFFF);
            that.scene.add(ambient);
        }

        // カメラの生成とシーンへの追加
        function createCamera(that) {
            var fov    = 72, // 視野角
                aspect = element.width() / element.height(), // アスペクト比
                near   = 0.1, // 奥行きの表示範囲の最小値
                far    = 1000; // 奥行きの表示範囲の最大値

            that.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
            // カメラの注視点
            that.camera.lookAt({ x: 1, y: 0, z: 0 });
            that.scene.add(that.camera);
        }

        // 形状(球体)の生成
        function buildSphere(that, texture) {
            var radius = 1,                    // 半径
                widthSegments  = 32,           // 横方向分割数
                heightSegments = 16,           // 縦方向分割数
                phiStart       = 0,            // φ方向の開始角度
                phiLength      = 2 * Math.PI,  // φ方向の覆っている角度
                thetaStart,                    // θ方向の開始角度
                thetaLength,                   // θ方向の覆っている角度
                matrix;                        // 球体の内側と外側を反転させる行列

            // 画像の縦横比からθ方向の覆っている範囲を計算
            thetaLength = 2 * Math.PI *
                texture.image.height / texture.image.width;
            if (thetaLength > Math.PI) {
                thetaLength = Math.PI;
            }
            thetaStart = (Math.PI - thetaLength) / 2;

            // 球体を生成
            that.geometry = new THREE.SphereGeometry(
                radius,
                widthSegments,
                heightSegments,
                phiStart,
                phiLength,
                thetaStart,
                thetaLength
            );

            // 球体の内側と外側を反転
            matrix = new THREE.Matrix4().makeScale(1, 1, -1);
            that.geometry.applyMatrix(matrix);
        }

        // 材質の生成
        function buildMaterial(that, texture) {
            that.material = new THREE.MeshBasicMaterial({
                overdraw: true,
                map:      texture,
                side:     THREE.FrontSide // 外側にのみテクスチャーを貼る
            });
        }

        // 形状+材質の生成とシーンへの追加
        function createMesh(that) {
            that.mesh = new THREE.Mesh(that.geometry, that.material);
            that.scene.add(that.mesh);
        }


        // 立方体のシーンへの追加
        function createCube(that, texture) {
            var sides, R, dR, i, side, ele, object;

            R = jQuery(texture[0]).get(0).width;
            dR = (R - 2) / 2;

            sides = [
                {
                    position: [ -dR, 0, 0 ],
                    rotation: [ 0, Math.PI / 2, 0 ]
                },
                {
                    position: [ dR, 0, 0 ],
                    rotation: [ 0, -Math.PI / 2, 0 ]
                },
                {
                    position: [ 0,  dR, 0 ],
                    rotation: [ Math.PI / 2, 0, Math.PI ]
                },
                {
                    position: [ 0, -dR, 0 ],
                    rotation: [ -Math.PI / 2, 0, Math.PI ]
                },
                {
                    position: [ 0, 0,  dR ],
                    rotation: [ 0, Math.PI, 0 ]
                },
                {
                    position: [ 0, 0, -dR ],
                    rotation: [ 0, 0, 0 ]
                }
            ];

            for (i = 0; i < sides.length; i += 1) {
                side = sides[i];
                ele = jQuery(texture[i]).get(0);
                object = new THREE.CSS3DObject(ele);
                object.position.fromArray(side.position);
                object.rotation.fromArray(side.rotation);
                that.scene.add(object);
            }
        }

        // イベントリスナーの追加
        function addEventListeners(that, element) {
            var isRotating       = false, // 回転している最中か否か
                onMouseDownLat   = 0,     // マウス押し下げ位置の緯度
                onMouseDownLng   = 0,     // マウス押し下げ位置の経度
                onMouseDownX     = 0,     // マウス押し下げ位置のx座標
                onMouseDownY     = 0,     // マウス押し下げ位置のy座標
                lat              = 0,     // 現在のカメラの緯度
                lng              = 0,     // 現在のカメラの経度
                onTouchX         = 0,     // タッチした位置のx座標
                onTouchY         = 0,     // タッチした位置のy座標
                camera           = that.camera,
                renderer         = that.renderer;

            // 要素のサイズの変更時の処理
            function onResize() {
                camera.aspect = element.width() / element.height();
                camera.updateProjectionMatrix();

                renderer.setSize(element.width(), element.height());
            }

            // マウス押し下げ時の処理
            function onMouseDown(event) {
                event.preventDefault();
                isRotating = true;

                // マウス押し下げ位置の緯度経度と座標を記録
                onMouseDownLat = lat;
                onMouseDownLng = lng;
                onMouseDownX   = event.clientX;
                onMouseDownY   = event.clientY;
            }

            // マウス移動時の処理
            function onMouseMove(event) {
                var phi, theta;

                event.preventDefault();

                if (isRotating === true) {
                    // 緯度経度を求める
                    lat = (event.clientY - onMouseDownY) * 0.1 +
                        onMouseDownLat;
                    lat = Math.max(-85, Math.min(85, lat));
                    lng = (onMouseDownX - event.clientX) * 0.1 +
                        onMouseDownLng;

                    // 緯度経度からθφを導出
                    phi   = (90 - lat) * Math.PI / 180;
                    theta = lng * Math.PI / 180;

                    camera.lookAt({
                        x: Math.sin(phi) * Math.cos(theta),
                        y: Math.cos(phi),
                        z: Math.sin(phi) * Math.sin(theta)
                    });
                }
            }

            // マウス押し上げ時の処理
            function onMouseUp() {
                isRotating = false;
            }

            // タッチ時の処理
            function onTouchStart(event) {
                var touch;
                event.preventDefault();
                touch = event.touches[0];

                onTouchX = touch.screenX;
                onTouchY = touch.screenY;
            }


            // タッチしたまま移動した時の処理
            function onTouchMove(event) {
                var touch, phi, theta;
                event.preventDefault();
                touch = event.touches[0];

                lat += (touch.screenY - onTouchY) * 0.1;
                lng -= (touch.screenX - onTouchX) * 0.1;

                onTouchX = touch.screenX;
                onTouchY = touch.screenY;

                // 緯度経度からθφを導出
                phi   = (90 - lat) * Math.PI / 180;
                theta = lng * Math.PI / 180;

                camera.lookAt({
                    x: Math.sin(phi) * Math.cos(theta),
                    y: Math.cos(phi),
                    z: Math.sin(phi) * Math.sin(theta)
                });
            }

            // マウスホイール回転時の処理
            function onMouseWheel(event) {
                var fov    = camera.fov, // 視野角
                    fovMin = 20,
                    fovMax = 150;

                event.preventDefault();

                // fovの計算
                // WebKit
                if (event.wheelDeltaY) {
                    fov -= event.wheelDeltaY * 0.05;
                // Opera / Internet Explorer
                } else if (event.wheelDelta) {
                    fov -= event.wheelDelta * 0.05;
                // Firefox
                } else if (event.detail) {
                    fov += event.detail;
                }

                if (fov < fovMin) {
                    fov = fovMin;
                }
                if (fov > fovMax) {
                    fov = fovMax;
                }

                // fovの適用
                camera.fov = fov;
                camera.updateProjectionMatrix();
            }

            // イベントハンドラの設定
            $(element)
                .on("mousedown", onMouseDown)
                .on("mousemove", onMouseMove)
                .on("mouseup",   onMouseUp)
                .on("mouseout",  onMouseUp)
                .on("resize",    onResize);

            // タッチが有効なとき
            if (Modernizr.touch === true) {
                $(element).get(0)
                    .addEventListener('touchstart', onTouchStart, false);
                $(element).get(0)
                    .addEventListener('touchmove', onTouchMove, false);
            }

            $(element).get(0).addEventListener('mousewheel',     onMouseWheel, false);
            $(element).get(0).addEventListener('DOMMouseScroll', onMouseWheel, false);
        }

        // メイン・プログラム
        createRenderer(this, element, mode);
        buildScene(this);
        if (mode === "WebGL") {
            createLight(this);
        }
        createCamera(this);
        if (mode === "WebGL") {
            buildSphere(this, texture);
            buildMaterial(this, texture);
            createMesh(this);
        } else if (mode === "CSS3D") {
            createCube(this, texture);
        }
        addEventListeners(this, element);

        this.render = (function (that) {
            return function () {
                requestAnimationFrame(that.render);
                that.renderer.render(that.scene, that.camera);
            };
        }(this));
    };

    // キューブマップの生成
    function createCubemapTexture(image_url, onload, onerror) {
        var img, texture;

        // CubeMapの生成
        function buildCubeMapTextures(img) {
            var dest, canvas, context,
                x, y,
                phi, theta,
                u, v,
                dloc, sloc,
                sW, sH,
                srcCanvas, srcContext,
                dW, dH,
                R, src, i,
                megaPixImage;

            sW = img.width / 2;
            sH = img.height / 2;

            srcCanvas = jQuery('<canvas>').attr({'width': sW, 'height': sH});
            srcContext = srcCanvas.get(0).getContext('2d');

            megaPixImage = new MegaPixImage(img);
            megaPixImage.render(srcCanvas.get(0), { maxWidth: sW, maxHeight: sH});

            src = srcContext.getImageData(0, 0, sW, sH);

            dW = sW;
            dH = sH;

            R = Math.floor(dW / 8);

            dest = [];
            canvas = [];
            context = [];

            for (i = 0; i < 6; i += 1) {
                canvas[i] = jQuery('<canvas>').attr({'width': 2 * R, 'height': 2 * R});
                context[i] = canvas[i].get(0).getContext('2d');
            }

            for (i = 0; i < 6; i += 1) {
                dest[i] = context[i].createImageData(2 * R, 2 * R);
            }

            for (y = 0; y < R; y += 1) {
                for (x = 0; x < R; x += 1) {
                    phi = Math.atan(x / R);
                    theta = Math.atan(Math.sqrt(x * x + R * R) / (R - y));
                    u = Math.floor(dW * phi / Math.PI / 2);
                    v = Math.floor(dH * theta / Math.PI);

                    dloc = (R + x) + y * 2 * R;
                    sloc = u       + v * 8 * R;
                    dest[2].data[4 * dloc]     = src.data[4 * sloc];
                    dest[2].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[2].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[2].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + x) + (2 * R - y - 1) * 2 * R;
                    sloc = u       + (4 * R - v - 1) * 8 * R;
                    dest[2].data[4 * dloc]     = src.data[4 * sloc];
                    dest[2].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[2].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[2].data[4 * dloc + 3] = src.data[4 * sloc + 3];


                    dloc = (R - x - 1)     + y * 2 * R;
                    sloc = (2 * R - u - 1) + v * 8 * R;
                    dest[3].data[4 * dloc]     = src.data[4 * sloc];
                    dest[3].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[3].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[3].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R - x - 1)     + (2 * R - y - 1) * 2 * R;
                    sloc = (2 * R - u - 1) + (4 * R - v - 1) * 8 * R;
                    dest[3].data[4 * dloc]     = src.data[4 * sloc];
                    dest[3].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[3].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[3].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + x)     + y * 2 * R;
                    sloc = (2 * R + u) + v * 8 * R;
                    dest[3].data[4 * dloc]     = src.data[4 * sloc];
                    dest[3].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[3].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[3].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + x)     + (2 * R - y - 1) * 2 * R;
                    sloc = (2 * R + u) + (4 * R - v - 1) * 8 * R;
                    dest[3].data[4 * dloc]     = src.data[4 * sloc];
                    dest[3].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[3].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[3].data[4 * dloc + 3] = src.data[4 * sloc + 3];


                    dloc = (R - x - 1)     + y * 2 * R;
                    sloc = (4 * R - u - 1) + v * 8 * R;
                    dest[0].data[4 * dloc]     = src.data[4 * sloc];
                    dest[0].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[0].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[0].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R - x - 1)     + (2 * R - y - 1) * 2 * R;
                    sloc = (4 * R - u - 1) + (4 * R - v - 1) * 8 * R;
                    dest[0].data[4 * dloc]     = src.data[4 * sloc];
                    dest[0].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[0].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[0].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + x)     + y * 2 * R;
                    sloc = (4 * R + u) + v * 8 * R;
                    dest[0].data[4 * dloc]     = src.data[4 * sloc];
                    dest[0].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[0].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[0].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + x)     + (2 * R - y - 1) * 2 * R;
                    sloc = (4 * R + u) + (4 * R - v - 1) * 8 * R;
                    dest[0].data[4 * dloc]     = src.data[4 * sloc];
                    dest[0].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[0].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[0].data[4 * dloc + 3] = src.data[4 * sloc + 3];


                    dloc = (R - x - 1)     + y * 2 * R;
                    sloc = (6 * R - u - 1) + v * 8 * R;
                    dest[1].data[4 * dloc]     = src.data[4 * sloc];
                    dest[1].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[1].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[1].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R - x - 1)     + (2 * R - y - 1) * 2 * R;
                    sloc = (6 * R - u - 1) + (4 * R - v - 1) * 8 * R;
                    dest[1].data[4 * dloc]     = src.data[4 * sloc];
                    dest[1].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[1].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[1].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + x)     + y * 2 * R;
                    sloc = (6 * R + u) + v * 8 * R;
                    dest[1].data[4 * dloc]     = src.data[4 * sloc];
                    dest[1].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[1].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[1].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + x)     + (2 * R - y - 1) * 2 * R;
                    sloc = (6 * R + u) + (4 * R - v - 1) * 8 * R;
                    dest[1].data[4 * dloc]     = src.data[4 * sloc];
                    dest[1].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[1].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[1].data[4 * dloc + 3] = src.data[4 * sloc + 3];


                    dloc = (R - x - 1)     + y * 2 * R;
                    sloc = (8 * R - u - 1) + v * 8 * R;
                    dest[2].data[4 * dloc]     = src.data[4 * sloc];
                    dest[2].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[2].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[2].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R - x - 1)     + (2 * R - y - 1) * 2 * R;
                    sloc = (8 * R - u - 1) + (4 * R - v - 1) * 8 * R;
                    dest[2].data[4 * dloc]     = src.data[4 * sloc];
                    dest[2].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[2].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[2].data[4 * dloc + 3] = src.data[4 * sloc + 3];
                }
            }

            for (y = 0; y < R; y += 1) {
                for (x = 0; x <= y; x += 1) {
                    phi = Math.atan(x / y);
                    theta = Math.atan(Math.sqrt(x * x + y * y) / R);
                    u = Math.floor(dW * phi / Math.PI / 2);
                    v = Math.floor(dH * theta / Math.PI);

                    dloc = (R - y - 1) + (R + x) * 2 * R;
                    sloc = u           + v       * 8 * R;
                    dest[4].data[4 * dloc]     = src.data[4 * sloc];
                    dest[4].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[4].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[4].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R - y - 1) + (R - x - 1)     * 2 * R;
                    sloc = u           + (4 * R - v - 1) * 8 * R;
                    dest[5].data[4 * dloc]     = src.data[4 * sloc];
                    dest[5].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[5].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[5].data[4 * dloc + 3] = src.data[4 * sloc + 3];


                    dloc = (R - x - 1)     + (R + y) * 2 * R;
                    sloc = (2 * R - u - 1) + v       * 8 * R;
                    dest[4].data[4 * dloc]     = src.data[4 * sloc];
                    dest[4].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[4].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[4].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R - x - 1)     + (R - y - 1)     * 2 * R;
                    sloc = (2 * R - u - 1) + (4 * R - v - 1) * 8 * R;
                    dest[5].data[4 * dloc]     = src.data[4 * sloc];
                    dest[5].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[5].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[5].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + x)     + (R + y) * 2 * R;
                    sloc = (2 * R + u) + v       * 8 * R;
                    dest[4].data[4 * dloc]     = src.data[4 * sloc];
                    dest[4].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[4].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[4].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + x)     + (R - y - 1)     * 2 * R;
                    sloc = (2 * R + u) + (4 * R - v - 1) * 8 * R;
                    dest[5].data[4 * dloc]     = src.data[4 * sloc];
                    dest[5].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[5].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[5].data[4 * dloc + 3] = src.data[4 * sloc + 3];


                    dloc = (R + y)         + (R + x) * 2 * R;
                    sloc = (4 * R - u - 1) + v       * 8 * R;
                    dest[4].data[4 * dloc]     = src.data[4 * sloc];
                    dest[4].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[4].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[4].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + y)         + (R - x - 1)     * 2 * R;
                    sloc = (4 * R - u - 1) + (4 * R - v - 1) * 8 * R;
                    dest[5].data[4 * dloc]     = src.data[4 * sloc];
                    dest[5].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[5].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[5].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + y)     + (R - x - 1) * 2 * R;
                    sloc = (4 * R + u) + v           * 8 * R;
                    dest[4].data[4 * dloc]     = src.data[4 * sloc];
                    dest[4].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[4].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[4].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + y)     + (R + x)         * 2 * R;
                    sloc = (4 * R + u) + (4 * R - v - 1) * 8 * R;
                    dest[5].data[4 * dloc]     = src.data[4 * sloc];
                    dest[5].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[5].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[5].data[4 * dloc + 3] = src.data[4 * sloc + 3];


                    dloc = (R + x)         + (R - y - 1) * 2 * R;
                    sloc = (6 * R - u - 1) + v           * 8 * R;
                    dest[4].data[4 * dloc]     = src.data[4 * sloc];
                    dest[4].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[4].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[4].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R + x)         + (R + y)         * 2 * R;
                    sloc = (6 * R - u - 1) + (4 * R - v - 1) * 8 * R;
                    dest[5].data[4 * dloc]     = src.data[4 * sloc];
                    dest[5].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[5].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[5].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R - x - 1) + (R - y - 1) * 2 * R;
                    sloc = (6 * R + u) + v           * 8 * R;
                    dest[4].data[4 * dloc]     = src.data[4 * sloc];
                    dest[4].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[4].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[4].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R - x - 1) + (R + y)         * 2 * R;
                    sloc = (6 * R + u) + (4 * R - v - 1) * 8 * R;
                    dest[5].data[4 * dloc]     = src.data[4 * sloc];
                    dest[5].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[5].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[5].data[4 * dloc + 3] = src.data[4 * sloc + 3];


                    dloc = (R - y - 1)     + (R - x - 1) * 2 * R;
                    sloc = (8 * R - u - 1) + v           * 8 * R;
                    dest[4].data[4 * dloc]     = src.data[4 * sloc];
                    dest[4].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[4].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[4].data[4 * dloc + 3] = src.data[4 * sloc + 3];

                    dloc = (R - y - 1)     + (R + x)         * 2 * R;
                    sloc = (8 * R - u - 1) + (4 * R - v - 1) * 8 * R;
                    dest[5].data[4 * dloc]     = src.data[4 * sloc];
                    dest[5].data[4 * dloc + 1] = src.data[4 * sloc + 1];
                    dest[5].data[4 * dloc + 2] = src.data[4 * sloc + 2];
                    dest[5].data[4 * dloc + 3] = src.data[4 * sloc + 3];
                }
            }

            for (i = 0; i < 6; i += 1) {
                context[i].putImageData(dest[i], 0, 0);
            }

            texture = [
                canvas[0],
                canvas[2],
                canvas[4],
                canvas[5],
                canvas[3],
                canvas[1]
            ];
            return texture;
        }

        img = new Image();
        img.src = image_url;
        img.onload = function () {
            texture = buildCubeMapTextures(this);
            onload(texture);
        };
        img.onerror = function () {
            onerror();
        };
        return texture;
    }


    function activateThetaViewer(that, texture, mode) {
        var thetaViewer = new ThetaViewer(that, texture, mode);
        thetaViewer.render();
    }

    function imageLoadError(image_url) {
        alert('loading error: ' + image_url);
    }

    function rendererNotAvailable() {
        alert("Your browser is not available for WebGL or CSS 3D Transforms.");
    }

    // レンダラーのモードを判別して設定
    function rendererModeSelector() {
        var mode;
        if (Detector.webgl) {
            // WebGLが使用可能
            mode = "WebGL";
        } else if (Modernizr.csstransforms3d === true && Modernizr.canvas === true) {
            // CSS Transforms 3Dが使用可能
            mode = "CSS3D";
        } else {
            // WebGLもCSS Transforms 3Dも使用不可
            mode = undefined;
        }
        return mode;
    }


    // jQueryプラグイン化
    // テクチャーがロード済みの場合
    $.fn.createThetaViewerWithTexture = function (texture) {
        activateThetaViewer(this, texture, rendererModeSelector());
        return this;
    };

    // テクスチャーをこれからロードする場合
    $.fn.createThetaViewer = function (image_url) {
        var texture,
            that = this,
            mode = rendererModeSelector(),
            options = {};

        options.onload = function (texture) {
            activateThetaViewer(that, texture, mode);
        };

        options.onerror = function () {
            imageLoadError(image_url);
        };

        if (mode === "WebGL") {
            options.mapping = undefined;

            texture = THREE.ImageUtils.loadTexture(
                image_url,
                options.mapping,
                options.onload,
                options.onerror
            );
        } else if (mode === "CSS3D") {
            texture = createCubemapTexture(
                image_url,
                options.onload,
                options.onerror
            );

        } else {
            rendererNotAvailable();
        }

        return this;
    };

}(jQuery));
