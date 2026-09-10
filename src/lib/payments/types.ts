export interface CreateOrderParams {
  amountInPaise: number; // Smallest unit: 100 paise = 1 INR
  currency?: string;     // Defaults to INR
  receipt: string;
  notes: {
    tenantId: string;
    memberId: string;
    membershipId?: string;
    planId?: string;
    [key: string]: string | undefined;
  };
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface PaymentProvider {
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}

export interface ManualPaymentInput {
  memberId: string;
  membershipId?: string;
  planId?: string;
  amount: number;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  tenantId: string;
  memberId: string;
  membershipId: string | null;
  amount: string;
  method: "razorpay" | "manual";
  status: "pending" | "paid" | "failed";
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  notes: string | null;
  paidAt: Date | null;
  createdAt: Date;
  memberName?: string;
  memberEmail?: string;
  planName?: string | null;
}
