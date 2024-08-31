export function uploadScanResponseMapping(scan: any) {
  return {
    measure_datetime: scan.measure_datetime,
    measure_type: scan.measure_type,
    measured_number: scan.measured_number,
    measure_uuid: scan.measure_uuid,
    customer_code: scan.customer_code,
    image: scan.image,
  };
}