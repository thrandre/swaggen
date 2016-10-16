import * as Promise from "bluebird";
import { Response } from "./parsers/swagger";
export declare function getSwaggerResponse(url: string): Promise<Response>;
