import axios from "axios";

import { Document } from "./parsers/swagger";

function stripBom(x: string) {
  if (x.charCodeAt(0) === 0xfeff) {
    return x.slice(1);
  }
  return x;
}

export async function getSwaggerResponse(url: string): Promise<Document> {
  return new Promise<Document>((resolve, reject) =>
    axios
      .get(url, { transformResponse: data => JSON.parse(stripBom(data)) })
      .then(res => resolve(res.data))
      .catch(err => reject(err))
  );
}
