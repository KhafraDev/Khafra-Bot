declare type Radius = 1 | 5 | 10 | 25 | 50;
interface FeatureCollection {
    type: 'FeatureCollection';
    query: [number];
    features: {
        id: string;
        type: 'Feature';
        place_type: ['postcode'];
        relevance: number;
        properties: unknown;
        text: string;
        place_name: string;
        bbox: [number, number, number, number];
        center: [number, number];
        geometry: {
            type: 'Point';
            coordinates: [number, number];
        };
        context: {
            id: string;
            wikidata: string;
            short_code?: string;
            text: string;
        }[];
    }[];
    attribution: string;
}
interface VaccineLocations {
    providers: {
        guid: string;
        name: string;
        address1: string;
        address2: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
        distance: number;
        lat: number;
        long: number;
        in_stock: boolean;
    }[];
    current_page: 1;
    total_pages: 1;
}
export declare const fetchLocation: (zipcode: string) => Promise<FeatureCollection>;
export declare const fetchAppointments: (zipcode: string, radius?: Radius) => Promise<VaccineLocations | undefined>;
export {};
