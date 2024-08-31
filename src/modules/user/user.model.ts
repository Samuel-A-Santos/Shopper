import mongoose, { Schema, Document } from 'mongoose';
import { IScan } from '../scan/scan.model';

export interface IUser extends Document {
  customer_code: string;
  scans: IScan[];
}

const UserSchema: Schema = new Schema({
  customer_code: { type: String, required: true },
  scans: [{ type: Schema.Types.ObjectId, ref: 'Scan' }],
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;