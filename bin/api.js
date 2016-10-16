"use strict";
var Promise = require("bluebird");
var Req = require("superagent");
function getSwaggerResponse(url) {
    return new Promise(function (resolve, reject) {
        Req.get(url, function (err, res) {
            if (err) {
                return reject(err);
            }
            if (!res || !res.body) {
                return reject(res);
            }
            return resolve(res.body);
        });
    });
}
exports.getSwaggerResponse = getSwaggerResponse;
//# sourceMappingURL=api.js.map