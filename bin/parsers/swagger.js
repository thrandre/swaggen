"use strict";
var lodash_1 = require("lodash");
var metadata_1 = require("../metadata");
function resolveJsonRef(root, ref) {
    var allPathSegments = ref.split("/");
    var pathSegments = allPathSegments[0] === "#" ?
        allPathSegments.slice(1) :
        allPathSegments;
    return {
        type: lodash_1.last(pathSegments),
        format: null,
        $ref: null,
        items: null
    };
}
function isComplexType(type) {
    return !!type.$ref;
}
function isCollection(type) {
    return type && type.type && type.type.toLowerCase() === "array";
}
function mapSchema(schema, data) {
    if (isCollection(schema)) {
        return metadata_1.getTypeDescription(mapSchema(schema.items, data).name, true);
    }
    if (isComplexType(schema)) {
        return metadata_1.getTypeDescription(mapSchema(resolveJsonRef(data, schema.$ref || ""), data).name);
    }
    return metadata_1.getTypeDescription(schema.type);
}
function getModels(data) {
    return Object.keys(data.definitions)
        .map(function (name) {
        var model = data.definitions[name];
        return {
            name: name,
            builtin: false,
            properties: Object.keys(model.properties)
                .map(function (pname) {
                var property = model.properties[pname];
                return {
                    name: pname,
                    typeDescription: mapSchema(property, data)
                };
            })
        };
    });
}
exports.getModels = getModels;
function getEndpointMethodName(identifier) {
    return lodash_1.last(identifier.split("_"));
}
function getEndpoints(data) {
    return Object.keys(data.paths)
        .map(function (uri) {
        var path = data.paths[uri];
        return {
            uri: uri,
            methods: Object.keys(path)
                .map(function (methodType) {
                var method = path[methodType];
                return {
                    methodType: methodType,
                    name: getEndpointMethodName(method.operationId),
                    tags: method.tags,
                    parameters: (method.parameters || [])
                        .map(function (p) { return ({
                        name: p.name,
                        in: p.in,
                        required: p.required,
                        typeDescription: mapSchema(p.schema || p, data)
                    }); }),
                    responses: Object.keys(method.responses)
                        .map(function (code) {
                        var response = method.responses[code];
                        return {
                            code: code,
                            typeDescription: code === "200" && response.schema
                                ? mapSchema(response.schema, data)
                                : metadata_1.getTypeDescription("void")
                        };
                    })
                };
            })
        };
    });
}
exports.getEndpoints = getEndpoints;
//# sourceMappingURL=swagger.js.map