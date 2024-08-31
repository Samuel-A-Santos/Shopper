import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IScan extends Document {
  customer_code: string;
  confirmed_value: number;
  image: string;
  measure_datetime: string;
  measure_type: "WATER" | "GAS";
  measured_number?: number;
  measure_uuid?: string;
  archive_uuid?: string;
}

const ScanSchema: Schema = new Schema({
  customer_code: { type: String, required: true },
  confirmed_value: { type: Number, required: false },
  image: { type: String, required: true },
  measure_datetime: { type: Date, required: true },
  measure_type: { type: String, enum: ["WATER", "GAS"], required: true },
  measured_number: { type: Number },
  measure_uuid: { type: String, default: uuidv4() },
  archive_uuid: { type: String },
});

export const Scan = mongoose.model<IScan>('Scan', ScanSchema);