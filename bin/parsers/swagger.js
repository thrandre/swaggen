"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
function asParameterSource(source) {
    switch (source) {
        case "path": return source;
        case "body": return source;
        case "query": return source;
        default: throw new Error(`Unknown parameter source ${source}`);
    }
}
function asPrimitiveType(type) {
    switch (type) {
        case "string": return type;
        case "integer": return type;
        case "object": return type;
        case "array": return type;
        default: throw new Error(`Unknown primitive type ${type}`);
    }
}
function asHttpMethod(method) {
    switch (method) {
        case "get": return method;
        case "post": return method;
        case "put": return method;
        case "delete": return method;
        case "patch": return method;
        default: throw new Error(`Unknown HTTP-method ${method}`);
    }
}
function resolveSchemaReference(document, reference) {
    return utils_1.use(reference.split("/"))
        .in(segments => {
        const schema = (segments[0] === "#" ? segments.slice(1) : segments)
            .reduce((p, n) => p[n], document);
        if (schema) {
            return lodash_1.last(segments);
        }
        throw new Error(`Unable to resolve schema with reference ${reference}`);
    });
}
function isComplexSchemaReference(schemaReference) {
    return !!schemaReference.$ref;
}
function isArraySchemaReference(schemaReference) {
    return schemaReference.type === "array" && !!schemaReference.items;
}
const VOID = { name: "void" };
function getType(document, schemaReference) {
    if (isArraySchemaReference(schemaReference)) {
        return getType(document, schemaReference.items);
    }
    if (isComplexSchemaReference(schemaReference)) {
        return {
            name: resolveSchemaReference(document, schemaReference.$ref)
        };
    }
    return {
        name: schemaReference.type
    };
}
exports.getType = getType;
const VOID_REFERENCE = { type: VOID, isArray: false };
function getTypeReference(document, schemaReference) {
    return {
        type: getType(document, schemaReference),
        isArray: isArraySchemaReference(schemaReference)
    };
}
exports.getTypeReference = getTypeReference;
function xSchema(operationParameter) {
    return operationParameter["x-schema"];
}
function getSchemas(document, ...parseExtensions) {
    return Object.entries(document.definitions)
        .filter((x) => !!x[1])
        .map(([schemaName, schema]) => ({
        kind: "schema",
        name: schemaName,
        type: asPrimitiveType(schema.type),
        properties: Object.entries(schema.properties)
            .map(([propertyName, property]) => ({
            name: propertyName,
            typeReference: getTypeReference(document, property)
        })),
        enum: schema.enum || []
    }));
}
exports.getSchemas = getSchemas;
function getOperations(document, ...parseExtensions) {
    return lodash_1.flatMap(Object.entries(document.paths)
        .filter((x) => !!x[1]), ([path, pathDefinition]) => Object.entries(pathDefinition)
        .filter((x) => !!x[1])
        .map(([method, operation]) => ({
        kind: "operation",
        path: path,
        method: asHttpMethod(method),
        name: operation.operationId,
        tags: operation.tags,
        parameters: (operation.parameters || [])
            .map(p => ({
            name: p.name,
            in: asParameterSource(p.in),
            required: p.required,
            typeReference: getTypeReference(document, (parseExtensions.some(e => e === "x-schema") ?
                xSchema(p) :
                p.schema) || p)
        })),
        responses: Object.entries(operation.responses)
            .filter((x) => !!x[1])
            .map(([responseCode, response]) => ({
            responseCode,
            typeReference: response.schema ?
                getTypeReference(document, response.schema) :
                VOID_REFERENCE
        }))
    })));
}
exports.getOperations = getOperations;
//# sourceMappingURL=swagger.js.map