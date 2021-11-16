import axios from 'axios';
import { createHmac } from 'crypto';

/**
 * Wallet of Satoshi Payment Type
 * @typedef {Object} WOSPayment
 * @property {string} id
 * @property {string} time
 * @property {string} type
 * @property {string} status
 * @property {string} amount
 * @property {string} fees
 * @property {string} currency
 * @property {string} audEstimate
 * @property {string} transactionId
 * @property {string} description
 * @property {string} paymentGroupId
 */

const _signRequest = (url, nonce, request, token, secret) => {

  const strToBeSigned = `${url}${nonce}${token}${JSON.stringify(request)}`;
  const hashBuffer = Buffer.from(strToBeSigned);

  return createHmac('sha256', secret).update(hashBuffer).digest('hex');
}

class WalletOfSatoshi {
  constructor() {
    this._walletOfSatoshiToken = process.env.WALLET_OF_SATOSHI_API_TOKEN;
    this._walletOfSatoshiSecret = process.env.WALLET_OF_SATOSHI_API_SECRET;
    this._walletOfSatoshiClient = axios.create({
      baseURL: process.env.WALLET_OF_SATOSHI_BASE_URL,
      timeout: 60000,
    });
  }

  _checkCredentials() {
    if (!this._walletOfSatoshiToken || !this._walletOfSatoshiSecret) {
      throw new Error('Wallet of Satoshi credentials was not provided.');
    }
    return true;
  }

  /**
   * @returns {Promise<{
   * btcDepositAddress: string,
   * maxBtcLimit: number}>}
   */
  async getAccountInfo() {
    this._checkCredentials();
    const url = '/api/v1/wallet/account';

    const { data } = await this._walletOfSatoshiClient.get(url, {
      headers: { 'api-token': this._walletOfSatoshiToken },
    });

    return data;
  }

  /**
   * @param {string} amount
   * @param {string} description
   * @param {number} [expiry]
   * @returns {Promise<{
   * id: string,
   * invoice: string,
   * btcAmount: string,
   * }>}
   */
  async createInvoice(amount, description, expiry) {
    this._checkCredentials();
    const url = '/api/v1/wallet/createInvoice';

    const nonce = (Date.now() * 1000).toString()

    const request = {
      amount,
      description,
      expiry,
    };

    const { data } = await this._walletOfSatoshiClient.post(url, request, {
      headers: {
        'api-token': this._walletOfSatoshiToken,
        nonce,
        signature: _signRequest(url, nonce, request, this._walletOfSatoshiToken, this._walletOfSatoshiSecret),
      },
    });

    return data;
  }

  /**
   * @param {string} invoice Invoice string
   * @returns {Promise<WOSPayment>}
   */
  async cancelInvoice(invoice) {
    this._checkCredentials();
    const url = '/api/v1/wallet/cancelInvoice';

    const nonce = (Date.now() * 1000).toString()

    const request = {
      invoice,
    };

    const { data } = await this._walletOfSatoshiClient.post(url, request, {
      headers: {
        'api-token': this._walletOfSatoshiToken,
        nonce,
        signature: _signRequest(url, nonce, request, this._walletOfSatoshiToken, this._walletOfSatoshiSecret),
      },
    });

    return data;
  }

  /**
   * @returns {Promise<{
   * btc: string,
   * btcUnconfirmed: string,
   * lightning: string,
   * aud: string,
   * audEstimate: string
   * }>}
   */
  async getBalance() {
    this._checkCredentials();
    const url = '/api/v1/wallet/balance';

    const { data } = await this._walletOfSatoshiClient.get(url, {
      headers: { 'api-token': this._walletOfSatoshiToken },
    });

    const { btc, btcUnconfirmed, lightning, aud, audEstimate } = data;

    return {
      btc: BN(btc).toFixed(),
      btcUnconfirmed: BN(btcUnconfirmed).toFixed(),
      lightning: BN(lightning).toFixed(),
      aud: BN(aud).toFixed(),
      audEstimate: BN(audEstimate).toFixed(),
    };
  }

  /**
   * @returns {Promise<{
   * btcFixedFee: string,
   * btcMinerFeePerKb: string,
   * lightningFee: any,
   * sendMaxLightningFee: any,
   * wosInvoice: boolean
   * audLowerEstimate: string,
   * audUpperEstimate: string,
   * }>} */
  async getFeeEstimate() {
    this._checkCredentials();
    const url = '/api/v1/wallet/feeEstimate';

    const { data } = await this._walletOfSatoshiClient.get(url, {
      headers: { 'api-token': this._walletOfSatoshiToken },
    });

    return data;
  }

  /**
   * @param {number} limit
   * @param {number} skip
   * @returns {Promise<WOSPayment[]>}
   */
  async listPayments(limit, skip) {
    this._checkCredentials();
    const url = '/api/v1/wallet/payments';

    const { data } = await this._walletOfSatoshiClient.get(url, {
      headers: { 'api-token': this._walletOfSatoshiToken },
      params: {
        limit,
        skip,
      },
    });

    return data;
  }

  /**
   * @param {string} id
   * @returns {Promise<WOSPayment>}
   */
  async findPaymentById(id) {
    this._checkCredentials();
    const url = `/api/v1/wallet/payment/${id}`;

    const { data } = await this._walletOfSatoshiClient.get(url, {
      headers: { 'api-token': this._walletOfSatoshiToken },
    });

    return data;
  }

  /**
   *
   * @param {string} address
   * @param {string} currency
   * @param {number} [amount]
   * @param {string} [description]
   * @param {boolean} [sendMaxLightning]
   * @returns {Promise<WOSPayment>}
   */
  async makePayment(address, currency, amount, description, sendMaxLightning) {
    this._checkCredentials();
    const url = '/api/v1/wallet/payment';

    const nonce = (Date.now() * 1000).toString()

    const request = {
      address,
      currency,
      amount,
      description,
      sendMaxLightning,
    };

    const { data } = await this._walletOfSatoshiClient.post(url, request, {
      headers: {
        'api-token': this._walletOfSatoshiToken,
        nonce,
        signature: _signRequest(url, nonce, request, this._walletOfSatoshiToken, this._walletOfSatoshiSecret),
      },
    });

    return data;
  }

}


const instance = new WalletOfSatoshi();
export { instance as WalletOfSatoshi };
