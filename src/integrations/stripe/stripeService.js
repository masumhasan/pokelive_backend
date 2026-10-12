import Stripe from 'stripe';
import { env } from '../../config/env.js';

// ponytail: mock stripe engine active until real sk_test_ / sk_live_ provided in .env
const isRealKey =
  typeof env.stripeSecretKey === 'string' &&
  (env.stripeSecretKey.startsWith('sk_test_') || env.stripeSecretKey.startsWith('sk_live_'));

const stripeClient = isRealKey ? new Stripe(env.stripeSecretKey) : null;

/**
 * Creates a Stripe PaymentIntent or mock intent.
 */
export async function createPaymentIntent({ amount, currency = 'gbp', metadata = {} }) {
  const normalizedAmount = Math.max(1, Math.round(Number(amount) * 100)); // amount in pence/cents

  if (stripeClient) {
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: normalizedAmount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata,
    });
    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      isMock: false,
    };
  }

  // Mock implementation for development & testing
  const mockId = `pi_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    paymentIntentId: mockId,
    clientSecret: `${mockId}_secret_${Math.random().toString(36).slice(2, 10)}`,
    amount: Number(amount),
    currency: currency.toLowerCase(),
    status: 'succeeded',
    isMock: true,
  };
}

/**
 * Processes/confirms order payment via Stripe or mock charge.
 */
export async function processPayment({ amount, currency = 'gbp', buyerId, orderId, paymentIntentId }) {
  if (stripeClient && paymentIntentId && !paymentIntentId.startsWith('pi_mock_')) {
    const intent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    const chargeId = intent.latest_charge || intent.charges?.data?.[0]?.id || intent.id;
    return {
      success: intent.status === 'succeeded',
      stripeCode: chargeId,
      status: intent.status,
      isMock: false,
    };
  }

  // Mock charge code generation matching dashboard format
  const mockChargeCode = `ch_mock_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString().slice(-4)}`;
  return {
    success: true,
    stripeCode: mockChargeCode,
    status: 'succeeded',
    isMock: true,
  };
}

export function getStripeConfig() {
  return {
    publishableKey: env.stripePublishableKey,
    isMock: !isRealKey,
  };
}
