import Razorpay from "razorpay";
import crypto from "crypto";
import { CreateOrderParams, CreateOrderResult, PaymentProvider } from "./types";

export class RazorpayProvider implements PaymentProvider {
  private client: Razorpay | null = null;
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || this.keySecret;

    if (this.keyId && this.keySecret) {
      this.client = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret && this.client);
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    if (!this.client || !this.keyId) {
      throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) not configured");
    }

    const order = await this.client.orders.create({
      amount: params.amountInPaise,
      currency: params.currency || "INR",
      receipt: params.receipt,
      notes: params.notes as Record<string, string>,
    });

    return {
      orderId: order.id,
      amount: typeof order.amount === "number" ? order.amount : Number(order.amount),
      currency: order.currency || "INR",
      keyId: this.keyId,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;
    const secret = this.webhookSecret || this.keySecret;
    if (!secret) return false;

    try {
      if (typeof Razorpay.validateWebhookSignature === "function") {
        return Razorpay.validateWebhookSignature(rawBody, signature, secret);
      }
    } catch {
      // Fallback to manual crypto timingSafeEqual check
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    try {
      const sigBuf = Buffer.from(signature, "utf-8");
      const expBuf = Buffer.from(expectedSignature, "utf-8");
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }
}

export const razorpayProvider = new RazorpayProvider();
