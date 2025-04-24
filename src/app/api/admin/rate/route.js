import { adminDb } from '../../../../lib/firebase.js';

export async function POST(req) {
  const { password, rate } = await req.json();
  if (password !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Contraseña inválida' }), { status: 401 });
  }
  if (typeof rate !== 'number' || rate <= 0) {
    return new Response(JSON.stringify({ error: 'Tasa inválida' }), { status: 400 });
  }

  await adminDb.collection('settings').doc('exchangeRate').set({ rate });
  return new Response(JSON.stringify({ message: 'Tasa actualizada' }), { status: 200 });
}