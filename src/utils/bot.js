import TelegramBot from 'node-telegram-bot-api';
import { adminDb, admin } from '../lib/firebase.js';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const userState = {};
const processedCallbacks = new Set(); // Almacena callbacks procesados

export async function handleUpdate(update) {
  const message = update.message || update.callback_query?.message;
  const callbackQuery = update.callback_query;
  const chatId = message?.chat.id;
  const userId = update.message?.from.id || update.callback_query?.from.id;
  const text = message?.text;
  const data = callbackQuery?.data;
  const callbackId = callbackQuery?.id;

  // Ignorar si no hay mensaje ni callback
  if (!chatId || (!text && !data)) {
    if (callbackId) {
      await bot.answerCallbackQuery(callbackId);
    }
    return;
  }

  // Fetch current rate and admin IDs from Firestore
  const rateDoc = await adminDb.collection('config').doc('rate').get();
  const usdtToMxnRate = rateDoc.exists ? rateDoc.data().value : null;
  const adminDoc = await adminDb.collection('settings').doc('admins').get();
  const adminIds = adminDoc.exists ? adminDoc.data().ids : ['8099115476'];

  // Handle case when rate is not set
  if (!usdtToMxnRate) {
    await bot.sendMessage(chatId, 'No se ha configurado una tasa de cambio. Contacta al administrador.');
    if (callbackId) {
      await bot.answerCallbackQuery(callbackId);
    }
    return;
  }

  // Handle /start command
  if (text === '/start') {
    userState[userId] = { step: 'initial' };
    await bot.sendMessage(chatId, `Hola, bienvenido a BeYouYoBot!\nTasa actual: ${usdtToMxnRate.toFixed(3)} MXN/USDT\n¿Qué deseas cotizar?`, {
      reply_markup: {
        inline_keyboard: [[{ text: 'Cotizar USDT', callback_data: 'quote_usdt' }]],
      },
    });
    return;
  }

  // Handle callback queries
  if (callbackQuery) {
    // Evitar procesar el mismo callback varias veces
    const callbackKey = `${callbackId}_${data}`;
    if (processedCallbacks.has(callbackKey)) {
      await bot.answerCallbackQuery(callbackId);
      return;
    }
    processedCallbacks.add(callbackKey);

    try {
      if (data === 'quote_usdt') {
        userState[userId] = { step: 'choose_currency' };
        await bot.sendMessage(chatId, '¿Cómo deseas cotizar?', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Ingresar USDT', callback_data: 'input_usdt' }],
              [{ text: 'Ingresar MXN', callback_data: 'input_mxn' }],
            ],
          },
        });
      } else if (data === 'input_usdt') {
        userState[userId] = { step: 'awaiting_usdt_amount' };
        await bot.sendMessage(chatId, '¿Cuántos USDT deseas gastar?');
      } else if (data === 'input_mxn') {
        userState[userId] = { step: 'awaiting_mxn_amount' };
        await bot.sendMessage(chatId, '¿Cuántos MXN deseas gastar?');
      } else if (data.startsWith('accept_')) {
        const [_, amount, currency] = data.split('_');
        const amountNumber = parseFloat(amount);
        let usdtAmount, mxnAmount;

        if (currency === 'MXN') {
          mxnAmount = amountNumber;
          usdtAmount = mxnAmount / usdtToMxnRate;
        } else {
          usdtAmount = amountNumber;
          mxnAmount = usdtAmount * usdtToMxnRate;
        }

        const formattedMxn = mxnAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        const formattedUsdt = usdtAmount.toFixed(3).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        const formattedRate = usdtToMxnRate.toFixed(3).replace(/\d(?=(\d{3})+\.)/g, '$&,');

        await bot.sendMessage(
          chatId,
          `Trade a realizar. Detalles: ${formattedUsdt} USDT a ${formattedRate} por un total de $${formattedMxn} MXN`
        );

        // Notify all admins
        const username = callbackQuery.from.username || callbackQuery.from.first_name || 'Desconocido';
        for (const adminId of adminIds) {
          await bot.sendMessage(
            adminId,
            `Nuevo trade solicitado:\nUsuario: @${username}\nDetalles: ${formattedUsdt} USDT a ${formattedRate} por un total de $${formattedMxn} MXN`
          );
        }

        // Save trade to Firestore with detailed error handling
        let tradeData = null;
        try {
          tradeData = {
            userId,
            username,
            usdtAmount: parseFloat(formattedUsdt.replace(/,/g, '')),
            mxnAmount: parseFloat(formattedMxn.replace(/,/g, '')),
            rate: parseFloat(formattedRate.replace(/,/g, '')),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          };
          console.log('Intentando guardar trade en Firestore:', JSON.stringify(tradeData));
          const tradeRef = await adminDb.collection('trades').add(tradeData);
          console.log('Trade guardado exitosamente con ID:', tradeRef.id);
        } catch (error) {
          console.error('Error al guardar el trade en Firestore:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
            tradeData: tradeData ? JSON.stringify(tradeData) : 'No disponible',
          });
          await bot.sendMessage(chatId, 'Trade confirmado, pero ocurrió un error al guardarlo. Contacta al administrador.');
        }

        // Limpiar estado inmediatamente
        delete userState[userId];
      } else if (data === 'cancel') {
        await bot.sendMessage(chatId, 'Esperamos puedas elegirnos nuevamente!');
        delete userState[userId];
      }
    } finally {
      await bot.answerCallbackQuery(callbackId);
      // Limpiar processedCallbacks después de un tiempo
      setTimeout(() => processedCallbacks.delete(callbackKey), 60000);
    }
    return;
  }

  // Handle text messages
  if (text && !text.startsWith('/') && userState[userId]) {
    if (userState[userId].step === 'awaiting_usdt_amount') {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        await bot.sendMessage(chatId, 'Por favor, ingresa un número válido mayor a 0.');
        return;
      }

      const mxnAmount = amount * usdtToMxnRate;
      const formattedMxn = mxnAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
      const formattedUsdt = amount.toFixed(3).replace(/\d(?=(\d{3})+\.)/g, '$&,');
      const formattedRate = usdtToMxnRate.toFixed(3).replace(/\d(?=(\d{3})+\.)/g, '$&,');

      await bot.sendMessage(
        chatId,
        `${formattedUsdt} USDT / ${formattedRate} MXN = $${formattedMxn} MXN`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Aceptar', callback_data: `accept_${amount}_USDT` }],
              [{ text: 'Cancelar', callback_data: 'cancel' }],
            ],
          },
        }
      );

      userState[userId] = { step: 'awaiting_confirmation' };
    } else if (userState[userId].step === 'awaiting_mxn_amount') {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        await bot.sendMessage(chatId, 'Por favor, ingresa un número válido mayor a 0.');
        return;
      }

      const usdtAmount = amount / usdtToMxnRate;
      const formattedMxn = amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
      const formattedUsdt = usdtAmount.toFixed(3).replace(/\d(?=(\d{3})+\.)/g, '$&,');
      const formattedRate = usdtToMxnRate.toFixed(3).replace(/\d(?=(\d{3})+\.)/g, '$&,');

      await bot.sendMessage(
        chatId,
        `$${formattedMxn} MXN / ${formattedRate} MXN = ${formattedUsdt} USDT`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Aceptar', callback_data: `accept_${amount}_MXN` }],
              [{ text: 'Cancelar', callback_data: 'cancel' }],
            ],
          },
        }
      );

      userState[userId] = { step: 'awaiting_confirmation' };
    }
  }
}
