import Req from 'axios';

import { Document } from './parsers/swagger';

export async function getSwaggerResponse(url: string): Promise<Document> {
  return new Promise<Document>((resolve, reject) =>
    Req.get(url)
      .then(res => resolve(res.data))
      .catch(err => reject(err))
  );
}
