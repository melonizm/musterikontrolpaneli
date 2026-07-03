import mongoose, { Schema, Document, Model } from "mongoose";

export interface INote {
  content: string;
  createdAt: Date;
}

export interface ICustomer extends Document {
  fullName: string;
  phone: string;
  email?: string;
  shouldCallback: boolean;
  callbackDate?: Date;
  callbackNote?: string;
  lastCalledAt?: Date;
  personality: string[];
  interests: string[];
  notes: INote[];
  status: "potansiyel" | "kapora_odeyecek" | "kapora_odendi" | "basarisiz";
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    fullName: {
      type: String,
      required: [true, "Müşteri adı zorunludur"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Telefon numarası zorunludur"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    shouldCallback: {
      type: Boolean,
      default: false,
    },
    callbackDate: {
      type: Date,
      default: null,
    },
    callbackNote: {
      type: String,
      default: "",
    },
    lastCalledAt: {
      type: Date,
      default: null,
    },
    personality: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    notes: {
      type: [NoteSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["potansiyel", "kapora_odeyecek", "kapora_odendi", "basarisiz"],
      default: "potansiyel",
    },
  },
  {
    timestamps: true,
    collection: "müsteriler",
  }
);

// Arama için text index
CustomerSchema.index({ fullName: "text", phone: "text" });

const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;
