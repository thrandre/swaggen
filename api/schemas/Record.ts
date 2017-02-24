import { RecordId } from "./RecordId";
import { Artist } from "./Artist";
import { RecordTitle } from "./RecordTitle";
import { Year } from "./Year";
import { Genre } from "./Genre";

export interface Record {
    id: RecordId;
    artist: Artist;
    title: RecordTitle;
    releaseYear: Year;
    genres: Genre[];
}
