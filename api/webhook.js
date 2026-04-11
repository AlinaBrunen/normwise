import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

async function sendWelcomeEmail(email, plan) {
  const planNames = {
    starter: 'Starter (€79/mo)',
    professional: 'Professional (€199/mo)',
    expert: 'Expert (€499/mo)',
  };

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'NormWise <hello@normwise.cloud>',
      to: email,
      subject: 'Welcome to NormWise 🎉',
      html: `
        <h2>Welcome to NormWise!</h2>
        <p>Thank you for subscribing to the <strong>${planNames[plan] || plan}</strong> plan.</p>
        <p>You can now log in and access your account:</p>
        <p><a href="https://normwise.cloud/login.html" style="background:#C0472A;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Log in to NormWise</a></p>
        <p>If you have any questions, just reply to this email.</p>
        <p>Best,<br>The NormWise Team</p>
      `,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['stripe-signature'];
  let event;

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const stripeCustomerId = session.customer;
    const stripeSessionId = session.id;

    let plan = 'starter';
    const lineItems = session.metadata?.plan;
    if (lineItems) {
      plan = lineItems;
    } else if (stripeSessionId.includes('professional')) {
      plan = 'professional';
    } else if (stripeSessionId.includes('expert')) {
      plan = 'expert';
    }

    console.log(`✅ Payment received for: ${email} | Plan: ${plan}`);

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
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

    // Send welcome email via Resend
    try {
      await sendWelcomeEmail(email, plan);
      console.log(`✅ Welcome email sent to: ${email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't return error — payment already processed successfully
    }
  }

  return res.status(200).json({ received: true });
}
