export interface Scan {
    customer_code: string;
    confirmed_value: number;
    image: string;
    measure_datetime: string;
    measure_type: "WATER" | "GAS";
    measured_number?: number;
    measure_uuid?: string;
}


