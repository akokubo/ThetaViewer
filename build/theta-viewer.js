/**
 * Theta Viewer v0.2
 *
 * Copyright Atsushi Kokubo
 * Released under the MIT license.
 */

/*jslint browser:true, devel:true */
/*global jQuery, THREE, requestAnimationFrame */

(function ($) {
    'use strict';

    var ThetaViewer = function (element, texture) {

        // レンダラーの生成と要素の追加
        function createRenderer(that, element) {
            that.renderer = new THREE.WebGLRenderer({ antialias: true });
            that.renderer.setSize(element.width(), element.height());
            that.renderer.setClearColor(0x000000, 1);

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
        function buildGeomtry(that, texture) {
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

        // イベントリスナーの追加
        function addEventListeners(that, element) {
            var isRotating       = false, // 回転している最中か否か
                onMouseDownLat   = 0,     // マウス押し下げ位置の緯度
                onMouseDownLng   = 0,     // マウス押し下げ位置の経度
                onMouseDownX     = 0,     // マウス押し下げ位置のx座標
                onMouseDownY     = 0,     // マウス押し下げ位置のy座標
                lat              = 0,     // 現在のカメラの緯度
                lng              = 0,     // 現在のカメラの経度
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

            $(element).get(0).addEventListener('mousewheel',     onMouseWheel, false);
            $(element).get(0).addEventListener('DOMMouseScroll', onMouseWheel, false);
        }

        // メイン・プログラム
        createRenderer(this, element);
        buildScene(this);
        createLight(this);
        createCamera(this);
        buildGeomtry(this, texture);
        buildMaterial(this, texture);
        createMesh(this);
        addEventListeners(this, element);

        this.render = (function (that) {
            return function () {
                requestAnimationFrame(that.render);
                that.renderer.render(that.scene, that.camera);
            };
        }(this));
    };

    // jQueryプラグイン化
    $.fn.createThetaViewerWithTexture = function (texture) {
        var thetaViewer = new ThetaViewer(this, texture);
        thetaViewer.render();
        return this;
    };

    $.fn.createThetaViewer = function (image_url) {
        var texture,
            mapping,
            that = this,
            success = function () {
                var thetaViewer = new ThetaViewer(that, texture);
                thetaViewer.render();
            },
            error   = function () {
                console.log('loading error: ' + image_url);
            };

        mapping = undefined;
        texture = THREE.ImageUtils.loadTexture(image_url, mapping, success, error);
        return this;
    };

}(jQuery));
