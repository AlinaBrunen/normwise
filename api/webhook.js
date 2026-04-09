import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Vercel requires raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['stripe-signature'];

  let event;

  // 1. Verify the webhook signature (security)
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // 2. Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const email = session.customer_details?.email;
    const stripeCustomerId = session.customer;
    const stripeSessionId = session.id;

    // Determine plan from price ID
    let plan = 'starter';
    const lineItems = session.metadata?.plan;
    if (lineItems) {
      plan = lineItems; // use metadata if set
    } else if (stripeSessionId.includes('professional')) {
      plan = 'professional';
    } else if (stripeSessionId.includes('expert')) {
      plan = 'expert';
    }

    console.log(`✅ Payment received for: ${email} | Plan: ${plan}`);

    // 3. Find the user in Supabase by email
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      // 4. Update existing user — activate their plan
      const { error } = await supabase
        .from('users')
        .update({
          plan: plan,
          status: 'active',
          stripe_customer_id: stripeCustomerId,
          stripe_session_id: stripeSessionId,
        })
        .eq('email', email);

      if (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: 'Failed to update user' });
      }

      console.log(`✅ User updated: ${email}`);
    } else {
      // User not found — create a new one
      const { error } = await supabase
        .from('users')
        .insert({
          email: email,
          plan: plan,
          status: 'active',
          stripe_customer_id: stripeCustomerId,
          stripe_session_id: stripeSessionId,
        });

      if (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      console.log(`✅ New user created: ${email}`);
    }
  }

  return res.status(200).json({ received: true });
}
