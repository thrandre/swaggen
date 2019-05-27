/* import { HttpMethod } from '../../parsers/swagger';
import { ReadableOptions } from 'stream';
import {
    Alias,
    DataType,
    Emitter,
    Enum,
    Module,
    Operation,
    Parameter,
    Property,
    Response,
    Schema,
    Type,
    Utils as TypeUtils
} from '../../types';
import { findOrThrow, Fn1, Hash, Helpers, readTemplate, resolveRelativePath } from '../../utils';

import { resolve } from "path";
import { compile } from "ejs";

import { use, Fn2 } from "../../utils";
import { Extension } from "../../types";

// import { groupBy } from "lodash";

type alias Record =
    { id : Int
    , artist : RecordArtist
    , title : String
    , releaseYear : Int
    , genres : List String
    , location : Maybe ComplexType
    , purchasedDate : String
    }

function getTemplate(name: string) {
    return readTemplate(resolve(__dirname, name));
}

// const dependencyDeclarationTemplate = compile(getTemplate("./dependencyTemplate.ejs"));
const aliasTemplate = compile(getTemplate("./aliasTemplate.ejs"));
const enumTemplate = compile(getTemplate("./enumTemplate.ejs"));
const schemaTemplate = compile(getTemplate("./schemaTemplate.ejs"));
const decoderTemplate = compile(getTemplate("./decoderTemplate.ejs"));
const encoderTemplate = compile(getTemplate("./encoderTemplate.ejs"));
const helpersTemplate = compile(getTemplate("./helpersTemplate.ejs"));
const requestBuilderTemplate = compile(getTemplate("./requestBuilderTemplate.ejs"));
//const operationTemplate = compile(getTemplate("./operationTemplate.ejs"));
// const helperTemplate = compile(getTemplate("./helperTemplate.ejs"));
// const indexTemplate = compile(getTemplate("./indexTemplate.ejs"));

const primitiveMap = {
    integer: "Int",
    long: "number",
    float: "number",
    double: "number",
    string: "String",
    byte: "string",
    binary: "string",
    date: "Date.Date",
    datetime: "Date.Date",
    password: "string",
    boolean: "boolean",
    void: "()"
};

const decoderMap = {
    integer: "Json.Decode.int",
    string: "Json.Decode.string",
    nullable: "Json.Decode.nullable",
    list: "Json.Decode.list",
    datetime: "decodeDate_"
};

const encoderMap = {
    integer: "Json.Encode.int",
    string: "Json.Encode.string",
    nullable: "encodeNullable_",
    list: "Json.Encode.list",
    datetime: "encodeDate_"
};

function getUtils(...extensions: Extension[]) {
    function sanitizeSymbol(str: string) {
        return str;
    }

    function getTypeName(type: Type) {
        if(TypeUtils.isOperation(type)) {
            return sanitizeSymbol(Helpers.camelCase(type.name));
        }

        if(TypeUtils.isPrimitive(type)) {
            const primitives = primitiveMap as Hash<string>;
            return sanitizeSymbol(primitives[type.name]);
        }

        return sanitizeSymbol(type.name);
    }

    function getTypeDefinition(type: Property | Parameter | Response) {
        const nullable = (typeName: string, isNullable: boolean) => isNullable
            ? `Maybe (${typeName})`
            : typeName;
        
        const list = (typeName: string, isList: boolean) => isList
            ? `(List ${typeName})`
            : typeName;
        
        return nullable(
            list(getTypeName(type.type), type.isArray),
            (type.kind === "property" || type.kind === "parameter") && !type.required
        );
    }

    function getPropertyName(property: Property) {
        return sanitizeSymbol(property.name);
    }

    function getParameterName(parameter: Parameter) {
        return sanitizeSymbol(parameter.name);
    }

    function emitProperty(property: Property) {
        return `${getPropertyName(property)} : ${getTypeDefinition(property)}`;
    }

    function emitParameter(parameter: Parameter) {
        return `${getParameterName(parameter)}`;
    }

    function emitParameterList(parameters: Parameter[]) {
        if(parameters.length === 0) {
            return primitiveMap.void;
        }

        return parameters.map(p => sanitizeSymbol(p.name)).join(" ");
    }

    function getSuccessResponse(responses: Response[]) {
        return findOrThrow(responses, r => r.code === "200");
    }

    function emitTypeDefinitionForRequestBuilder(operation: Operation) {
        return `${
            operation.parameters.length > 0 ?
                operation.parameters
                    .map(t => getTypeDefinition(t))
                    .join(" -> ") :
                primitiveMap.void
        } -> HttpBuilder.RequestBuilder ${getTypeDefinition(getSuccessResponse(operation.responses))}`;
    }

    function getRelativeModulePath(fromModule: Module, toModule: Module) {
        return resolveRelativePath(getModuleFilename(fromModule), getModuleFilename(toModule), ".elm");
    }

    function getInterpolatedUrl(url: string) {
        const interpolate = (resolveName: Fn1<string, string> = i => i) => (name: string, isLast: boolean) => 
            " ++ " + resolveName(name) + (isLast ? "" : " ++ ");

        return Helpers.interpolateUrl(
            url,
            interpolate(i => "toString " + sanitizeSymbol(i)),
            (i: string) => "\"" + i + "\"",
            (i: string) => "(" + i + ")"
        );
    }

    function getElmPair(key: string, value: string) {
        return `(${key}, ${value})`;
    }

    function getCustomDecoderName(type: Type) {
        return `decode${type.name}`;
    }

    function getCustomEncoderName(type: Type) {
        return `encode${type.name}`;
    }

    function getDecoder(type: Type) {
        const nullify = (decoder: string, isRequired: boolean) => isRequired ?
            decoder :
            `${decoderMap.nullable} <| ${decoder}`;

        const listify = (decoder: string, isArray: boolean) => isArray ?
            `${decoderMap.list} <| ${decoder}` :
            decoder;
        
        const decoders = decoderMap as Hash<string>;
        
        if(type.kind === "property" || type.kind === "response") {
            return nullify(listify(decoders[type.type.name] || getCustomDecoderName(type.type), type.isArray), type.kind === "property" ? type.required : true);
        }

        return decoders[type.name];
    }

    function getEncoder(type: Type) {
        const nullify = (encoder: string, isRequired: boolean) => isRequired ?
            encoder :
            `${encoderMap.nullable} ${encoder}`;

        const listify = (encoder: string, isArray: boolean) => isArray ?
            `${encoderMap.list} <| List.map ${encoder}` :
            encoder;
        
        const encoders = encoderMap as Hash<string>;
        
        if(type.kind === "property" || type.kind === "response" || type.kind === "parameter") {
            return nullify(listify(encoders[type.type.name] || getCustomEncoderName(type.type), type.isArray), type.kind === "property" || type.kind === "parameter" ? type.required : true);
        }

        return encoders[type.name];
    }

    function getQueryParams(parameters: Parameter[]) {
        return parameters
            .filter(p => p.in === "query");
    }

    function emitQueryParams(parameters: Parameter[]) {
        return getQueryParams(parameters)
            .map(p => getElmPair(`"${p.name}"`, `toString ${sanitizeSymbol(p.name)}`))
            .join(", ");
    }

    function getBodyParam(parameters: Parameter[]) {
        return parameters
            .find(p => p.in === "body");
    }

    return {
        sanitizeSymbol,
        getTypeName,
        getTypeDefinition,
        getPropertyName,
        getParameterName,
        emitProperty,
        emitParameter,
        emitParameterList,
        emitTypeDefinitionForRequestBuilder,
        getSuccessResponse,
        getRelativeModulePath,
        getInterpolatedUrl,
        getDecoder,
        getEncoder,
        getQueryParams,
        emitQueryParams,
        getBodyParam
    };
}

namespace Utils {
    export function convertPath(path: string) {
        return "`" + path.replace(/\{/g, "${") + "`";
    }

    export function getQuery(parameters: Parameter[]) {
        const query = parameters.filter(p => p.in === "query").reduce((p, n) => Object.assign({}, p, { [n.name]: n.name }), {});
        return JSON.stringify(query);
    }

    export function getData(parameters: Parameter[]) {
        const bodyParam = parameters.find(p => p.in === "body");

        if (bodyParam) {
            return bodyParam.name;
        }

        return "null";
    }

    export function getBodyParameter(parameters: Parameter[]) {
        return parameters.find(p => p.in === "body");
    }

    export function shouldProvideMappers(...extensions: Extension[]) {
        return extensions.includes("x-primitive-mapping");
    }

    export function shouldMap(type: Type, ...extensions: Extension[]) {
        return type && Object.keys(getPlucker(type)).length > 0;
    }

    export function getPlucker(type: Type): any {
        if(type.kind !== "schema") {
            return {};
        }

        return type.properties
            .filter(p => p.type.kind === "schema" || (p.type.kind === "primitive" && p.type.name === "datetime"))
            .reduce((prev, next) => Object.assign(
                prev,
                next.type.kind === "schema" ?
                    use(getPlucker(next.type)).in(v => Object.keys(v).length > 0 ? {[next.name]: v} : {}):
                    {[next.name]: null}
            ), {});
    }

    export function getCustomDecoderName(type: Type) {
        return `decode${type.name}`;
    }

    export function getDecoder(type: Type) {
        const nullify = (decoder: string, isRequired: boolean) => isRequired ?
            decoder :
            `${decoderMap.nullable} <| ${decoder}`;

        const listify = (decoder: string, isArray: boolean) => isArray ?
            `${decoderMap.list} <| ${decoder}` :
            decoder;
        
        const decoders = decoderMap as Hash<string>;
        
        if(type.kind === "property") {
            return listify(nullify(decoders[type.type.name] || getCustomDecoderName(type.type), type.required), type.isArray);
        }

        return decoders[type.name];
    }
}

/*function emitHelper(module: Module, dependencies: Map<Module, Type[]>, ...extensions: Extension[]) {
    return helperTemplate({});
}*/

/*function emitIndex(module: Module, dependencies: Map<Module, Type[]>, ...extensions: Extension[]) {
    return indexTemplate({
        module,
        dependencies,
        extensions,
        helpers: {
            ...Helpers,
            ...Utils
        }
    });
}

function emitHelpers() {
    return helpersTemplate({});
}

function emitDecoder(type: DataType) {
    return decoderTemplate({
        type,
        helpers: getUtils()
    });
}

function emitEncoder(type: DataType) {
    return encoderTemplate({
        type,
        helpers: getUtils()
    });
}

function emitAlias(alias: Alias, ...extensions: Extension[]) {
    return aliasTemplate({
        alias,
        helpers: getUtils(...extensions)
    });
}

function emitEnum($enum: Enum, ...extensions: Extension[]) {
    return enumTemplate({
        $enum,
        helpers: getUtils(...extensions)
    });
}

function emitSchema(schema: Schema, ...extensions: Extension[]) {
    return schemaTemplate({
        schema,
        extensions,
        helpers: getUtils(...extensions)
    });
}

function emitRequestBuilder(operation: Operation, ...extensions: Extension[]) {
    return requestBuilderTemplate({
        operation,
        extensions,
        helpers: getUtils(...extensions)
    });
}

function getModuleFilename(module: Module) {
    return `${module.name}.elm`;
}

function createModules(types: Type[], createModule: (name: string, ...types: Type[]) => Module) {
    return [
        createModule(
            "Api",
            ...types
        )
       ...Object.values(
            groupBy(
                (types as ReadonlyArray<Type>)
                .filter(isOperationType), t => t.tags[0]
            )
        )
        .map(t => createModule(t[0].tags[0], ...t)),
        HELPER_MODULE,
        use(INDEX_MODULE).in(m => {
            m.getDependencies = () => types.filter(t => isTopLevelType(t) || isOperationType(t));
            return m;
        })
    ];
}

function emitModule(
    module: Module,
    moduleDependencies: Map<Module, Type[]>,
    ...extensions: Extension[]
) {
    return [
        emitHelpers(),
        ...module.types.map(type => {
            switch (type.kind) {
                case "alias":
                    return emitAlias(type, ...extensions);
                case "enum":
                    return emitEnum(type, ...extensions);
                case "schema":
                    return emitSchema(type, ...extensions);
                default: return "";
            }
        }),
        ...(module.types as ReadonlyArray<Type>)
            .filter(TypeUtils.isCustomDataType)
            .map(type => emitDecoder(type)),
        ...(module.types as ReadonlyArray<Type>)
            .filter(TypeUtils.isCustomDataType)
            .map(type => emitEncoder(type)),
        ...(module.types as ReadonlyArray<Type>)
            .filter(TypeUtils.isOperation)
            .map(type => emitRequestBuilder(type))
    ]
        .filter(s => !!s)
        .join("\n");
}

const api: Emitter = {
    createModules,
    getModuleFilename,
    emitModule
};

export = api;
 */