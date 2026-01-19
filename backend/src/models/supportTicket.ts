import mongoose, { Schema } from "mongoose";

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export type SupportTicketCategory = 
  | "Order Issue"
  | "Payment Problem"
  | "Shipping Delay"
  | "Product Quality"
  | "Return Request"
  | "Account Access"
  | "Other";

export interface SupportTicketReply {
  message: string;
  repliedBy: string;
  repliedAt: string;
  isAdmin: boolean;
}

export interface SupportTicketDoc {
  ticketId: string;
  userId: string;
  userEmail: string;
  userName: string;
  category: SupportTicketCategory;
  orderId?: string;
  subject?: string;
  message: string;
  adminReply?: string;
  replies?: SupportTicketReply[];
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assignedTo?: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  lastReplyBy?: 'user' | 'admin';
}

const SupportTicketSchema = new Schema<SupportTicketDoc>(
  {
    ticketId: { 
      type: String, 
      required: true, 
      unique: true,
      default: () => `TKT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    },
    userId: { type: String, required: true, ref: 'User' },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Order Issue", "Payment Problem", "Shipping Delay", "Product Quality", "Return Request", "Account Access", "Other"],
    },
    orderId: { type: String, required: false, ref: 'Order' },
    subject: { type: String, required: false },
    message: { type: String, required: true },
    adminReply: { type: String, required: false },
    replies: [{
      message: { type: String, required: true },
      repliedBy: { type: String, required: true },
      repliedAt: { type: String, required: true },
      isAdmin: { type: Boolean, required: true, default: false }
    }],
    status: {
      type: String,
      required: true,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedTo: { type: String, required: false, ref: 'User' },
    resolvedAt: { type: String, required: false },
    resolution: { type: String, required: false },
  },
  { timestamps: true }
);

// Add indexes for better query performance
SupportTicketSchema.index({ userId: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, createdAt: -1 });
SupportTicketSchema.index({ priority: 1, createdAt: -1 });
SupportTicketSchema.index({ category: 1, createdAt: -1 });
SupportTicketSchema.index({ ticketId: 1 }, { unique: true });

export const SupportTicketModel =
  (mongoose.models.SupportTicket as mongoose.Model<SupportTicketDoc> | undefined) || mongoose.model<SupportTicketDoc>("SupportTicket", SupportTicketSchema);
