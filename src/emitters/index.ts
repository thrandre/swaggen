export interface EmitterEntry {
    path: string;
    postprocess?: (file: string) => string[];
}

const emitters = {
    ts: {
        path: "./emitters/typescript"
    } as EmitterEntry,
    elm: {
        path: "./emitters/elm",
        postprocess: (file: string) => ["elm-format", file, "--yes"]
    } as EmitterEntry
};

export default emitters;
