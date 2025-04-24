import { handleUpdate } from '../../../utils/bot';

   export default async function handler(req, res) {
     if (req.method === 'POST') {
       try {
         await handleUpdate(req.body);
         res.status(200).send('OK');
       } catch (error) {
         console.error('Webhook error:', error);
         res.status(500).send('Error');
       }
     } else {
       res.status(405).send('Method Not Allowed');
     }
   }