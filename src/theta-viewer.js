/**
 * Theta Viewer v0.1
 *
 * Copyright Atsushi Kokubo
 * Released under the MIT license.
 */

/*jslint browser:true, devel:true */
/*global jQuery, THREE, requestAnimationFrame */

(function ($) {
    'use strict';

    var THETA_VIEWER = {};

    // レンダラの生成
    THETA_VIEWER.createRenderer = function (element) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(element.width(), element.height());
        this.renderer.setClearColor(0x000000, 1);

        // elementにWebGLを表示するcanvas要素が追加される
        $(element).append(this.renderer.domElement);
    };

    // シーンの作成
    THETA_VIEWER.createScene = function () {
        this.scene = new THREE.Scene();
    };

    // 光源の作成
    THETA_VIEWER.createLight = function () {
        // 環境光を作成
        var ambient = new THREE.AmbientLight(0xFFFFFF);
        this.scene.add(ambient);
    };

    // カメラの作成
    THETA_VIEWER.createCamera = function (element) {
        var fov    = 72, // 視野角
            aspect = element.width() / element.height(), // アスペクト比
            near   = 0.1, // 奥行きの表示範囲の最小値
            far    = 1000; // 奥行きの表示範囲の最大値

        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

        // カメラの注視点
        this.camera.lookAt({ x: 1, y: 0, z: 0 });

        this.scene.add(this.camera);
    };

    // 表示する球体の作成
    THETA_VIEWER.createSphereWithTexture = function (texture) {
        var material,
            geometry,
            mesh;

        function createGeometry(texture) {
            var radius = 1,                    // 半径
                widthSegments  = 32,           // 横方向分割数
                heightSegments = 16,           // 縦方向分割数
                phiStart       = 0,            // φ方向の開始角度
                phiLength      = 2 * Math.PI,  // φ方向の覆っている角度
                thetaStart,                    // θ方向の開始角度
                thetaLength;                   // θ方向の覆っている角度

            // 画像の縦横比からθ方向の覆っている範囲を計算
            thetaLength = 2 * Math.PI
                * texture.image.height / texture.image.width;
            if (thetaLength > Math.PI) {
                thetaLength = Math.PI;
            }
            thetaStart = (Math.PI - thetaLength) / 2;

            return new THREE.SphereGeometry(
                radius,
                widthSegments,
                heightSegments,
                phiStart,
                phiLength,
                thetaStart,
                thetaLength
            );
        }

        material = new THREE.MeshBasicMaterial({
            overdraw: true,
            map:      texture,
            side:     THREE.BackSide // 内側にのみテクスチャーを貼る
        });

        geometry = createGeometry(texture);

        mesh = new THREE.Mesh(geometry, material);

        THETA_VIEWER.scene.add(mesh);
    };

    // イベントリスナーの設定
    THETA_VIEWER.addEventListeners = function (element) {
        var isRotating       = false, // 回転している最中か否か
            onMouseDownLat   = 0,     // マウス押し下げ位置の緯度
            onMouseDownLng   = 0,     // マウス押し下げ位置の経度
            onMouseDownX     = 0,     // マウス押し下げ位置のx座標
            onMouseDownY     = 0,     // マウス押し下げ位置のy座標
            lat              = 0,     // 現在のカメラの緯度
            lng              = 0;     // 現在のカメラの経度

        // 要素のサイズの変更時の処理
        function onResize() {
            THETA_VIEWER.camera.aspect = element.width() / element.height();
            THETA_VIEWER.camera.updateProjectionMatrix();

            THETA_VIEWER.renderer.setSize(element.width(), element.height());
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
            if (isRotating === true) {
                // 緯度経度を求める
                lat = (event.clientY - onMouseDownY) * 0.1
                    + onMouseDownLat;
                lat = Math.max(-85, Math.min(85, lat));
                lng = (onMouseDownX - event.clientX) * 0.1
                    + onMouseDownLng;

                // 緯度経度からθφを導出
                phi   = (90 - lat) * Math.PI / 180;
                theta = lng * Math.PI / 180;

                THETA_VIEWER.camera.lookAt({
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
            var fov    = THETA_VIEWER.camera.fov,
                fovMin = 20,
                fovMax = 150;

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

            THETA_VIEWER.camera.fov = fov;
            THETA_VIEWER.camera.updateProjectionMatrix();
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
    };


    // レンダリング
    THETA_VIEWER.render = function () {
        requestAnimationFrame(THETA_VIEWER.render);
        THETA_VIEWER.renderer.render(THETA_VIEWER.scene, THETA_VIEWER.camera);
    };

    THETA_VIEWER.initWithTexture = function (that, texture) {
        THETA_VIEWER.createRenderer(that);
        THETA_VIEWER.createScene();
        THETA_VIEWER.createCamera(that);
        THETA_VIEWER.createSphereWithTexture(texture);
        THETA_VIEWER.addEventListeners(that);
        THETA_VIEWER.render();
    };

    // jQueryプラグイン化
    $.fn.createThetaViewerWithTexture = function (texture) {
        THETA_VIEWER.initWithTexture(this, texture);
        return this;
    };

    $.fn.createThetaViewer = function (image_url) {
        var texture,
            mapping,
            that = this,
            success = function () {
                THETA_VIEWER.initWithTexture(that, texture);
            },
            error   = function () {
                console.log('loading error: ' + image_url);
            };

        mapping = undefined;
        texture = THREE.ImageUtils.loadTexture(image_url, mapping, success, error);
        return this;
    };

}(jQuery));
