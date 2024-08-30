export interface Scan {
    image: string;
    customer_code: string;
    measure_datetime: string;
    measure_type: "WATER" | "GAS";
    measured_number?: number;
    confirmed_value?: number;
    measure_uuid?: string;
}


