"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadScanResponseMapping = uploadScanResponseMapping;
function uploadScanResponseMapping(scan) {
    return {
        measure_datetime: scan.measure_datetime,
        measure_type: scan.measure_type,
        measured_number: scan.measured_number,
        measure_uuid: scan.measure_uuid,
        customer_code: scan.customer_code,
        image: scan.image,
    };
}
//# sourceMappingURL=scan.mapping.js.map