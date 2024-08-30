export interface Scan {
    image: string;
    measure_datetime: string;
    measure_type: "WATER" | "GAS";
    measured_number?: number;
    measure_uuid?: string;
}


