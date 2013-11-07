/*jslint browser:true, continue:true, devel:true */
/*global jQuery, THREE, URL, webkitURL */

window.onload = function () {
    'use strict';
    var dropTarget = document.getElementById("theta-viewer");

    dropTarget.ondragenter = function (event) {
        var types = event.dataTransfer.types;
        if (!types ||
                (types.contains && types.contains('Files')) ||
                (types.indexOf && types.indexOf("Files") !== -1)) {
            dropTarget.classList.add("active");
            return false;
        }
    };

    dropTarget.ondragleave = function () {
        dropTarget.classList.remove("active");
    };

    dropTarget.ondragover = function () {
        return false;
    };

    dropTarget.ondrop = function (event) {
        var files = event.dataTransfer.files,
            getBlobURL,
            revokeBlobURL,
            type,
            img,
            i;

        function onLoad() {
            var texture = new THREE.Texture(undefined, undefined);
            texture.needsUpdate = true;
            texture.image = this;
            jQuery('#theta-viewer').empty()
                .createThetaViewerWithTexture(texture);
            revokeBlobURL(this.src);
        }

        getBlobURL = (window.URL && URL.createObjectURL.bind(URL)) ||
            (window.webkitURL && webkitURL.createObjectURL.bind(webkitURL)) ||
            window.createObjectURL;

        revokeBlobURL = (window.URL && URL.revokeObjectURL.bind(URL)) ||
            (window.webkitURL && webkitURL.revokeObjectURL.bind(webkitURL)) ||
            window.revokeObjectURL;

        for (i = 0; i < files.length; i = i + 1) {
            type = files[i].type;
            if (type.substring(0, 6) !== "image/") {
                continue;
            }
            img = document.createElement("img");
            img.src = getBlobURL(files[i]);
            img.onload = onLoad;
        }

        dropTarget.classList.remove("active");
        return false;
    };
};
