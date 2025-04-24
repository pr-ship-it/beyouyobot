import { handleUpdate } from '../../../../utils/bot.js';

export async function POST(req) {
  try {
    const body = await req.json();
    await handleUpdate(body);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}