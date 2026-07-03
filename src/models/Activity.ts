import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  action: string;
  customerId?: mongoose.Types.ObjectId;
  customerName?: string;
  details?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["ekledi", "güncelledi", "sildi", "not_ekledi", "arandi_isaretledi"],
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: {
      type: String,
    },
    details: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "aktiviteler",
  }
);

// Son aktiviteler için index
ActivitySchema.index({ createdAt: -1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;
