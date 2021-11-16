import Twilio from 'twilio';
import { WalletOfSatoshi } from './walletofsatoshi.js';
import express from 'express';
import { Low, JSONFile } from 'lowdb';
import BigNumber from 'bignumber.js';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const limiter = rateLimit({
  windowMs: 300 * 1000,
  max: 20
});

const db = new Low(new JSONFile('./db.json'))

await db.read();
db.data ||= { payments: {} };
await db.write();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const twilio = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const app = express();

app.use(express.json());
app.use(limiter);
app.use(cors());

async function sendTwilioMessage(number, message) {
  const res = await twilio.messages.create({
    body: message,
    to: number,
    messagingServiceSid: 'MGf4bd128121e8f444353d3f0d92a63987',
  });

  console.log(res);

  return res;
}

// await sendTwilioMessage('+5562981158215', 'testando twilio ltest.com');

app.post('/requestinvoicetonumber', async (req, res) => {
  const { number, amount } = req.body;

  console.log(req.body);

  if (!number || !amount) {
    return res.status(400).send('Missing number or amount');
  }


  const bnAmount = new BigNumber(amount).minus(0.00001);

  if (bnAmount.isLessThanOrEqualTo(0)) {
    return res.status(400).send('Amount (with 1000 sats fee debited) must be greater than 0');
  }

  const invoice = await WalletOfSatoshi.createInvoice(amount, `Enviando pagamento a [${number}]`, 1 * 60 * 60); // 1 hour

  res.send(invoice);
});

app.post('/claim', async (req, res) => {
  const { code, invoice } = req.body;

  console.log(req.body);

  if (!code || !invoice) {
    return res.status(400).send('Missing code or invoice');
  }

  try {
    await db.read();

    const payment = await (async () => {
      for (const pId of Object.keys(db.data.payments)) {
        const payment = db.data.payments[pId];

        if (payment._claimCode === code && !payment._claimed) {
          payment._claimed = true;
          return payment;
        }
      }

      await db.write();
    })();

    if (!payment) {
      return res.status(400).send('Invalid code');
    }

    const bnAmount = new BigNumber(payment.amount).minus(0.00001);

    const wosPayment = await WalletOfSatoshi.makePayment(invoice, 'LIGHTNING', bnAmount.toFixed());

    console.log(wosPayment);

    if (wosPayment.status === 'FAILED') {
      payment._claimed = false;

      await db.write();

      res.status(500).send('Payment is failed.');
    } else {
      res.status(200).send('ok');
      console.log('sent ok')
    }


  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

app.listen(5555);

while (true) {
  const payments = await WalletOfSatoshi.listPayments(100);

  await db.read();

  for (const payment of payments) {

    if (payment.type === 'CREDIT' && payment.status === 'PAID' && !db.data.payments?.[payment.id]?._sentSMS) {

      const bnAmount = new BigNumber(payment.amount).minus(0.00001);

      const number = payment.description.match(/\[(.*?)\]/)?.[1];

      const code = (Math.random() + 1).toString(36).substring(5);

      if (number) {
        await sendTwilioMessage(number, `Recibiste a pagamento de ${bnAmount.toFixed()} BTC. Retira en lnsms.ga/#/claim/${code}`);
        payment._sentSMS = true;
        payment._claimCode = code;
      }
    }

    db.data.payments[payment.id] = {
      ...(db.data.payments?.[payment.id] || {}),
      ...payment,
    };
  }

  await db.write();

  await sleep(2000);
}
