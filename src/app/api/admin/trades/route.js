import { adminDb } from '../../../../lib/firebase.js';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Contraseña inválida' }), { status: 401 });
  }
  const snapshot = await adminDb.collection('trades').orderBy('timestamp', 'desc').get();
  const trades = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return new Response(JSON.stringify({ trades }), { status: 200 });
}