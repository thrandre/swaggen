"use strict";
var utils_1 = require("./utils");
var lodash_1 = require("lodash");
var helpers = {
    expandVar: function (name, typeInfo, required, escape) {
        if (required === void 0) { required = true; }
        if (escape === void 0) { escape = true; }
        return "" + (escape ? this.escapeName(name) : name) + (!required ? "?" : "") + ": " + this.expandType(typeInfo);
    },
    expandType: function (typeInfo) {
        return "" + typeInfo.type.name + (typeInfo.isCollection ? "[]" : "");
    },
    escapeName: function (name) {
        return name.replace(/\./g, "_");
    },
    ifNotNull: function (target, func) {
        target && func(target);
    },
    createObject: function (keys, escape) {
        var _this = this;
        if (escape === void 0) { escape = true; }
        return keys.length > 0
            ? "{ " + keys.map(function (key) { return ("" + (escape ? (_this.escapeName(key) !== key ? ("\"" + key + "\": ") + _this.escapeName(key) : key) : key)); }).join(", ") + " }"
            : "{}";
    },
    formatUri: function (uri) {
        var _this = this;
        return "`" + uri.replace(/\{(.*?)\}/g, function (sub) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return "${ " + _this.escapeName(args[0]) + " }";
        }) + "`";
    },
    fixPath: function (path) {
        return utils_1.nixPath(path);
    }
};
function emitEndpointModule(module) {
    return lodash_1.template(utils_1.readTemplate("./endpoint.template.tpl"))(lodash_1.assign({}, { module: module }, { helpers: helpers }));
}
exports.emitEndpointModule = emitEndpointModule;
function emitModelModule(module) {
    return lodash_1.template(utils_1.readTemplate("./model.template.tpl"))(lodash_1.assign({}, { module: module }, { helpers: helpers }));
}
exports.emitModelModule = emitModelModule;
//# sourceMappingURL=testEmitter.js.map