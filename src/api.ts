import * as Promise from "bluebird";
import * as Req from "superagent";

import { Response } from "./parsers/swagger";

export function getSwaggerResponse(url: string): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
        Req.get(url, (err, res) => {
            if(err) {
                return reject(err);
            }

            if(!res || !res.body) {
                return reject(res);
            }

            return resolve(res.body);
        });
    });
}
