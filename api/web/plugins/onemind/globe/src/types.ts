export interface GlobeState {
    active:    boolean;
    ready:     boolean;
    latitude:  number;
    longitude: number;
    altitude:  number;
    heading:   number;
    pitch:     number;
    ionToken:  string | null;
}

export interface GlobeCameraPosition {
    latitude:  number;
    longitude: number;
    altitude:  number;
    heading:   number;
    pitch:     number;
}
