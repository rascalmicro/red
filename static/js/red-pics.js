/* DISPLAY PICTURES */
// Requires rascal-1.04

/*jshint strict: true */
/*global $, console, rascal */
/*global ROOT, HOME, DEFAULT_PICTURE, editor */
/*global updateTitle */
/*global getPath */

function showPicture(path) {
    "use strict";
    var rp = rascal.picture,
        fpath = path.split(ROOT).pop(),
        frp = $('#frame-p');
    console.log('showPicture ' + fpath);
    if (!fpath.match(/static\//)) {
        fpath = DEFAULT_PICTURE;
    }
    // Set up geometry and show frame
    setPictureFrameSize(frp);
    if (frp.css('visibility') !== 'visible') {
        frp.css('visibility', 'visible')
            .hide()
            .fadeTo('fast', 1);
    }
    // Set up picture
    rp.imgRoot = HOME;
    rp.containerID = 'photo-p';
    rp.captionID = 'caption-p';
    rp.show(fpath);
    updateTitle(fpath);
}

function setPictureFrameSize(frp) {
    "use strict";
    var h;
    frp.height($('.CodeMirror').height())
        .width($('.CodeMirror').width());
    h = frp.height();
    console.log('h=' + h);
    frp.children('.photo').height(frp.height() - frp.children('.caption').outerHeight());
}

function hidePicture() {
    "use strict";
    if (rascal.picture.showing) {
        $('#frame-p').css('visibility', 'hidden');
        rascal.picture.empty();
    }
    editor.focus();
    updateTitle(getPath());
}

$('#frame-p').on('click', '.photo', function (event) {
    "use strict";
    hidePicture();
});

/* END PICTURES */
