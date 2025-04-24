import { adminDb } from '../../../../lib/firebase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');

  if (password !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Contraseña incorrecta' }), { status: 401 });
  }

  try {
    const rateDoc = await adminDb.collection('config').doc('rate').get();
    const rate = rateDoc.exists ? rateDoc.data().value : null;
    return new Response(JSON.stringify({ rate }), { status: 200 });
  } catch (error) {
    console.error('Error al obtener la tasa:', error);
    return new Response(JSON.stringify({ error: 'Error en el servidor' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { password, rate } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Contraseña incorrecta' }), { status: 401 });
    }
    if (typeof rate !== 'number' || rate <= 0) {
      return new Response(JSON.stringify({ error: 'Tasa inválida' }), { status: 400 });
    }

    await adminDb.collection('config').doc('rate').set({ value: rate });
    return new Response(JSON.stringify({ message: 'Tasa actualizada' }), { status: 200 });
  } catch (error) {
    console.error('Error al actualizar la tasa:', error);
    return new Response(JSON.stringify({ error: 'Error en el servidor' }), { status: 500 });
  }
}
