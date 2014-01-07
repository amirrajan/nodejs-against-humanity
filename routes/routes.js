/**
 * Created by chriss on 1/1/14.
 */
'use strict'
/*
 * GET home page.
 */

exports.index = function (req, res) {
    res.sendfile('./views/Index.html');
};

// Get Partials

exports.partials = function (req, res) {
    console.info('getting partials: ' + req.originalUrl);
    if (req.params.length === 1) {
        res.sendfile('./views/' + req.params[0]);
    }
};