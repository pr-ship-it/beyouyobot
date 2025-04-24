import { adminDb } from '../../../../lib/firebase.js';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Contraseña inválida' }), { status: 401 });
  }
  const doc = await adminDb.collection('settings').doc('admins').get();
  const ids = doc.exists ? doc.data().ids : [];
  return new Response(JSON.stringify({ admins: ids }), { status: 200 });
}

export async function POST(req) {
  const { password, action, adminId } = await req.json();
  if (password !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Contraseña inválida' }), { status: 401 });
  }
  if (!adminId || typeof adminId !== 'string') {
    return new Response(JSON.stringify({ error: 'ID de administrador inválido' }), { status: 400 });
  }

  const adminDoc = adminDb.collection('settings').doc('admins');
  const doc = await adminDoc.get();
  let ids = doc.exists ? doc.data().ids : [];

  if (action === 'add') {
    if (!ids.includes(adminId)) {
      ids.push(adminId);
      await adminDoc.set({ ids });
      return new Response(JSON.stringify({ message: 'Administrador agregado' }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'El administrador ya existe' }), { status: 400 });
  } else if (action === 'remove') {
    if (ids.includes(adminId)) {
      ids = ids.filter((id) => id !== adminId);
      await adminDoc.set({ ids });
      return new Response(JSON.stringify({ message: 'Administrador eliminado' }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Administrador no encontrado' }), { status: 400 });
  }
  return new Response(JSON.stringify({ error: 'Acción inválida' }), { status: 400 });
}