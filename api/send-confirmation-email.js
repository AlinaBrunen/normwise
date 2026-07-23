import { Webhook } from 'standardwebhooks';

// ── Supabase Auth Hook Secret (aus dem Supabase Dashboard, siehe Anleitung) ──
const hookSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;

export const config = {
  api: {
    bodyParser: false, // wir brauchen den Raw-Body für die Signaturprüfung
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

// ── Sprachtemplates ──────────────────────────────────────────────────────────
const templates = {
  en: {
    subject: 'Welcome to NormWise – Please confirm your email',
    greeting: 'Welcome to NormWise! 👋',
    body: 'Thank you for signing up. You have <strong>5 free questions</strong> waiting for you — your AI-powered ISO assistant is ready to help with ISO 9001, 14001, and 45001.',
    cta: 'Confirm Email & Start Free Trial',
    ignore: "If you didn't create a NormWise account, you can safely ignore this email.",
  },
  de: {
    subject: 'Willkommen bei NormWise – Bitte bestätigen Sie Ihre E-Mail',
    greeting: 'Willkommen bei NormWise! 👋',
    body: 'Vielen Dank für Ihre Anmeldung. <strong>5 kostenlose Fragen</strong> warten auf Sie — Ihr KI-gestützter ISO-Assistent hilft Ihnen bei ISO 9001, 14001 und 45001.',
    cta: 'E-Mail bestätigen & kostenlos starten',
    ignore: 'Wenn Sie kein NormWise-Konto erstellt haben, können Sie diese E-Mail ignorieren.',
  },
  fr: {
    subject: 'Bienvenue chez NormWise – Veuillez confirmer votre e-mail',
    greeting: 'Bienvenue chez NormWise ! 👋',
    body: 'Merci de votre inscription. <strong>5 questions gratuites</strong> vous attendent — votre assistant IA pour l\'ISO est prêt à vous aider sur ISO 9001, 14001 et 45001.',
    cta: 'Confirmer l\'e-mail et démarrer',
    ignore: "Si vous n'avez pas créé de compte NormWise, vous pouvez ignorer cet e-mail.",
  },
};

function buildHtml(lang, confirmUrl) {
  const t = templates[lang] || templates.en;
  return `
    <div style="background:#070c18;color:#fff;font-family:'Space Grotesk',sans-serif;padding:40px 32px;border-radius:14px;max-width:480px;margin:0 auto;">
      <h1 style="font-size:26px;margin-bottom:20px;">
        <span style="color:#fff;">Norm</span><span style="color:#c0392b;">Wise</span>
      </h1>
      <h2 style="font-size:22px;margin-bottom:16px;">${t.greeting}</h2>
      <p style="font-size:15px;line-height:1.6;color:rgba(255,255,255,.75);margin-bottom:28px;">${t.body}</p>
      <a href="${confirmUrl}" style="display:inline-block;background:#c0392b;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        ${t.cta} →
      </a>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,.1);margin:32px 0 20px;"/>
      <p style="font-size:12px;color:rgba(255,255,255,.5);">${t.ignore}</p>
      <p style="font-size:12px;"><a href="https://normwise.cloud" style="color:#6a9fd8;">normwise.cloud</a></p>
    </div>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);

  // ── Signatur prüfen (Supabase signiert jeden Hook-Call) ──────────────────
  let payload;
  try {
    const wh = new Webhook(hookSecret);
    payload = wh.verify(rawBody, req.headers);
  } catch (err) {
    console.error('Hook signature verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { user, email_data } = payload;

  // Nur für die Registrierungsbestätigung zuständig — andere Auth-Mails
  // (Passwort-Reset etc.) an Supabase-Default zurückgeben, falls gewünscht
  if (email_data.email_action_type !== 'signup') {
    return res.status(200).json({ skipped: true });
  }

  const lang = user.user_metadata?.lang || 'en';

  // Supabase baut den Confirm-Link aus token_hash + redirect_to zusammen
  const confirmUrl =
    `${email_data.site_url}/auth/v1/verify` +
    `?token=${email_data.token_hash}` +
    `&type=${email_data.email_action_type}` +
    `&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;

  const t = templates[lang] || templates.en;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NormWise <hello@updates.normwise.cloud>',
        to: user.email,
        subject: t.subject,
        html: buildHtml(lang, confirmUrl),
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend error:', errText);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (err) {
    console.error('Failed to send confirmation email:', err.message);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  return res.status(200).json({});
}
