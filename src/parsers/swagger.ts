import { flatMap, last } from "lodash";

import { Hash, use } from "../utils";

export interface Document {
  swagger: string;
  info: Info;
  basePath: string;
  paths: Hash<Path>;
  components: {schemas: Hash<Schema | undefined>};
}

export interface Info {
  version: string;
  title: string;
}

export interface Path extends Hash<Operation | undefined> {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
}

export interface Operation {
  tags: string[];
  summary: string | undefined;
  operationId: string;
  consumes: string[];
  produces: string[];
  parameters?: OperationParameter[];
  responses: Hash<OperationResponse | undefined>;
}

export interface OperationResponse {
  description: string | undefined;
  content:{ "text/plain": { schema: SchemaReference } };
}

export type PropertySchema = SchemaReference;

export type PrimitiveType =
  | "string"
  | "integer"
  | "number"
  | "boolean"
  | "object"
  | "array";
export type Format =
  | "int32"
  | "int64"
  | "float"
  | "double"
  | "byte"
  | "binary"
  | "date"
  | "date-time"
  | "password"
  | "uuid";
export type ParameterSource = "path" | "body" | "query";
export type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

function asPrimitiveType(type: string): PrimitiveType {
  switch (type) {
    case "string":
      return type;
    case "integer":
      return type;
    case "number":
      return type;
    case "boolean":
      return type;
    case "object":
      return type;
    case "array":
      return type;
    default:
      throw new Error(`Unknown primitive type ${type}`);
  }
}

function asFormat(format: string): Format {
  switch (format) {
    case "int32":
      return format;
    case "int64":
      return format;
    case "float":
      return format;
    case "double":
      return format;
    case "byte":
      return format;
    case "binary":
      return format;
    case "date":
      return format;
    case "date-time":
      return format;
    case "password":
      return format;
    case "uuid":
      return format;
    default:
      throw new Error(`Unknown format ${format}`);
  }
}

function asParameterSource(source: string): ParameterSource {
  switch (source) {
    case "path":
      return source;
    case "body":
      return source;
    case "query":
      return source;
    default:
      throw new Error(`Unknown parameter source ${source}`);
  }
}

function asHttpMethod(method: string): HttpMethod {
  switch (method) {
    case "get":
      return method;
    case "post":
      return method;
    case "put":
      return method;
    case "delete":
      return method;
    case "patch":
      return method;
    default:
      throw new Error(`Unknown HTTP-method ${method}`);
  }
}

function isLanguageSpecificType(schemaName: string) {
  return schemaName.startsWith("Tuple");
}

export interface OperationParameter extends SchemaReference {
  name: string;
  description: string | undefined;
  in: ParameterSource;
  required: boolean;
  schema?: SchemaReference;
}

export interface Schema {
  type: PrimitiveType;
  properties: Hash<PropertySchema>;
  enum?: string[];
  required?: string[];
}

export interface SchemaReference {
  type: PrimitiveType;
  format?: string;
  $ref?: string;
  items?: SchemaReference;
  additionalProperties?: AdditionalPropertiesSchema;
}

export interface ArraySchemaReference extends SchemaReference {
  items: SchemaReference;
}

export interface ComplexSchemaReference extends SchemaReference {
  $ref: string;
}

export interface AdditionalPropertiesSchema {
  type: string;
}

function resolveSchemaReference(document: Document, reference: string): string {
  return use(reference.split("/")).in(segments => {
    const schema = (segments[0] === "#" ? segments.slice(1) : segments).reduce(
      (p, n) => p[n],
      document as any
    );

    if (!schema) {
      throw new Error(`Unable to resolve schema with reference ${reference}`);
    }

    return last(segments) || "";
  });
}

function isComplexSchemaReference(
  schemaReference: SchemaReference
): schemaReference is ComplexSchemaReference {
  return !!schemaReference.$ref;
}

function isArraySchemaReference(
  schemaReference: SchemaReference
): schemaReference is ArraySchemaReference {
  return schemaReference.type === "array" && !!schemaReference.items;
}

export interface IMetadata {
  name: string;
}

export type EntityMetadata = SchemaMetadata | OperationMetadata;

export interface TypeMetadata {
  name: string;
  additionalProperties?: AdditionalPropertiesSchema;
}

export interface TypeReferenceMetadata {
  type: TypeMetadata;
  isArray: boolean;
}

export interface PropertyMetadata {
  name: string;
  required: boolean;
  typeReference: TypeReferenceMetadata;
}

export interface SchemaMetadata extends IMetadata {
  kind: "schema";
  type: PrimitiveType;
  isLanguageSpesificType: boolean;
  properties: PropertyMetadata[];
  enum: string[];
}

export interface ParameterMetadata {
  name: string;
  description: string;
  in: ParameterSource;
  required: boolean;
  typeReference: TypeReferenceMetadata;
}

export interface ResponseMetadata {
  description: string;
  responseCode: string;
  typeReference: TypeReferenceMetadata;
}

export interface OperationMetadata extends IMetadata {
  kind: "operation";
  path: string;
  method: HttpMethod;
  tags: string[];
  description: string;
  parameters: ParameterMetadata[];
  responses: ResponseMetadata[];
}

export interface PathMetadata extends IMetadata {
  kind: "path";
  path: string;
  operations: OperationMetadata[];
}

export const VOID: TypeMetadata = { name: "void" };
export const STRING: TypeMetadata = { name: "string" };
export const BYTE: TypeMetadata = { name: "byte" };
export const BINARY: TypeMetadata = { name: "binary" };
export const DATE: TypeMetadata = { name: "date" };
export const DATETIME: TypeMetadata = { name: "datetime" };
export const PASSWORD: TypeMetadata = { name: "password" };
export const INTEGER: TypeMetadata = { name: "integer" };
export const LONG: TypeMetadata = { name: "long" };
export const FLOAT: TypeMetadata = { name: "float" };
export const DOUBLE: TypeMetadata = { name: "double" };
export const BOOLEAN: TypeMetadata = { name: "boolean" };
export const UUID: TypeMetadata = { name: "uuid" };
export const OBJECT: (
  additionalProperties?: AdditionalPropertiesSchema
) => TypeMetadata = (additionalProperties?: AdditionalPropertiesSchema) => {
  const name =
    additionalProperties && additionalProperties.type
      ? `map_${additionalProperties.type}`
      : "object";
  return {
    additionalProperties,
    name: "object"
  };
};
export const ARRAY: TypeMetadata = { name: "array" };

export function getPrimitiveType(schemaReference: SchemaReference) {
  switch (asPrimitiveType(schemaReference.type)) {
    case "string":
      if (schemaReference.format) {
        switch (asFormat(schemaReference.format)) {
          case "byte":
            return BYTE;
          case "binary":
            return BINARY;
          case "date":
            return DATE;
          case "date-time":
            return DATETIME;
          case "password":
            return PASSWORD;
          case "uuid":
            return UUID;
          default:
            throw new Error(
              `Unable to parse type ${schemaReference.type} with format ${
                schemaReference.format
              }`
            );
        }
      } else {
        return STRING;
      }
    case "integer":
      if (schemaReference.format) {
        switch (asFormat(schemaReference.format)) {
          case "int32":
            return INTEGER;
          case "int64":
            return LONG;
          case "float":
            return FLOAT;
          case "double":
            return DOUBLE;
          default:
            throw new Error(
              `Unable to parse type ${schemaReference.type} with format ${
                schemaReference.format
              }`
            );
        }
      } else {
        return INTEGER;
      }
    case "number":
      if (schemaReference.format) {
        switch (asFormat(schemaReference.format)) {
          case "int32":
            return INTEGER;
          case "int64":
            return LONG;
          case "float":
            return FLOAT;
          case "double":
            return DOUBLE;
          default:
            throw new Error(
              `Unable to parse type ${schemaReference.type} with format ${
                schemaReference.format
              }`
            );
        }
      } else {
        return INTEGER;
      }
    case "boolean":
      return BOOLEAN;
    case "object":
      return OBJECT(schemaReference.additionalProperties);
    case "array":
      return ARRAY;
    default:
      throw new Error(`Unable to parse type ${schemaReference.type}`);
  }
}

export function getType(
  document: Document,
  schemaReference: SchemaReference
): TypeMetadata {
  if (isArraySchemaReference(schemaReference)) {
    return getType(document, schemaReference.items);
  }

  if (isComplexSchemaReference(schemaReference)) {
    return {
      name: resolveSchemaReference(document, schemaReference.$ref)
    };
  }

  return getPrimitiveType(schemaReference);
}

const VOID_REFERENCE: TypeReferenceMetadata = { type: VOID, isArray: false };

export function getTypeReference(
  document: Document,
  schemaReference: SchemaReference
) {
  return {
    type: getType(document, schemaReference),
    isArray: isArraySchemaReference(schemaReference)
  };
}

function getParameterSchema(parameter: OperationParameter) {
  return (parameter as any)["x-schema"] || parameter.schema || parameter;
}

export function getSchemas(document: Document): SchemaMetadata[] {
  return (Object.entries(document.components.schemas) as ReadonlyArray<
    [string, Schema | undefined]
  >)
    .filter((x: any): x is [string, Schema] => !!x[1])
    .map<SchemaMetadata>(([schemaName, schema]) => ({
      kind: "schema",
      name: schemaName,
      type: asPrimitiveType(schema.type),
      isLanguageSpesificType: isLanguageSpecificType(schemaName),
      properties: Object.entries(schema.properties).map(
        ([propertyName, property]) => ({
          name: propertyName,
          required: schema.required
            ? schema.required.some(r => r === propertyName)
            : false,
          typeReference: getTypeReference(document, property)
        })
      ),
      enum: schema.enum || []
    }));
}

export function getOperations(document: Document): OperationMetadata[] {
  return flatMap(
    (Object.entries(document.paths) as ReadonlyArray<
      [string, Path | undefined]
    >).filter((x: any): x is [string, Path] => !!x[1]),
    ([path, pathDefinition]) =>
      (Object.entries(pathDefinition) as ReadonlyArray<
        [string, Operation | undefined]
      >)
        .filter((x: any): x is [string, Operation] => !!x[1])
        .map<OperationMetadata>(([method, operation]) => ({
          kind: "operation",
          path: path,
          method: asHttpMethod(method),
          name: operation.operationId || operation.tags[0] + "_" + method,
          tags: operation.tags,
          description: operation.summary || "",
          parameters: (operation.parameters || []).map(p => ({
            name: p.name,
            description: p.description || "",
            in: asParameterSource(p.in),
            required: p.required,
            typeReference: getTypeReference(document, getParameterSchema(p))
          })),
          responses: (Object.entries(operation.responses) as ReadonlyArray<
            [string, OperationResponse | undefined]
          >)
            .filter((x: any): x is [string, OperationResponse] => !!x[1])
            .map(([responseCode, response]) => ({
              description: response.description || "",
              responseCode,
              typeReference: response.content && response.content["text/plain"] && response.content["text/plain"].schema
                ? getTypeReference(document, response.content["text/plain"].schema)
                : VOID_REFERENCE
            }))
        }))
  );
}
