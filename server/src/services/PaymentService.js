import crypto from 'crypto';
import config from '../config/index.js';
import BaseRepository from '../repositories/BaseRepository.js';
import Payment, { PAYMENT_STATUS, PAYMENT_METHOD } from '../models/Payment.js';
import Order, { ORDER_STATUS } from '../models/Order.js';
import notificationService from './NotificationService.js';
import ApiError, { ErrorCodes } from '../utils/ApiError.js';

class PaymentService {
  constructor() {
    this.repo = new BaseRepository(Payment);
  }

  async createPayment({ order, restaurant, customer, table, amount, method, metadata = {} }) {
    const payment = await this.repo.create({
      order,
      restaurant,
      customer,
      table,
      amount,
      method,
      status: PAYMENT_STATUS.PENDING,
      metadata,
    });
    return payment;
  }

  buildPaymentData(payment, order) {
    const base = {
      amount: payment.amount,
      taxAmount: 0,
      totalAmount: payment.amount,
      productIdentity: order.orderNumber,
      productName: `HamroMenu Order ${order.orderNumber}`,
      product_url: '',
    };
    switch (payment.method) {
      case PAYMENT_METHOD.ESEWA:
        return {
          ...base,
          type: 'esewa',
          merchantId: config.esewa.merchantId,
          merchantCode: config.esewa.productCode || config.esewa.merchantId,
        };
      case PAYMENT_METHOD.KHALTI:
        return {
          ...base,
          type: 'khalti',
          publicKey: config.khalti.publicKey,
          website_url: config.clientUrl,
        };
      case PAYMENT_METHOD.CARD:
        return { ...base, type: 'card', publishableKey: config.stripe.publishableKey };
      case PAYMENT_METHOD.CASH:
      case PAYMENT_METHOD.PAY_AFTER_MEAL:
        return { ...base, type: 'pay_after_meal' };
      default:
        return base;
    }
  }

  async initPayment({ orderId, method, customerId }) {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found', null, ErrorCodes.NOT_FOUND);
    if (order.grandTotal <= 0) throw new ApiError(400, 'Invalid amount');

    let payment = await this.repo.findOne({ order: orderId, status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.SUCCESS] } });
    if (!payment) {
      payment = await this.createPayment({
        order: orderId,
        restaurant: order.restaurant,
        customer: customerId,
        table: order.table,
        amount: order.grandTotal,
        method,
      });
    }
    return { payment, paymentData: this.buildPaymentData(payment, order) };
  }

  /**
   * eSewa v2 browser flow: build the signed form fields the client submits
   * to the gateway (or a clearly-labelled demo payload when sandbox keys
   * are not configured).
   */
  async esewaStart({ orderId, customerId }) {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found', null, ErrorCodes.NOT_FOUND);

    let payment = await this.repo.findOne({ order: orderId, status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.SUCCESS] } });
    if (!payment) {
      payment = await this.createPayment({
        order: orderId,
        restaurant: order.restaurant,
        customer: customerId,
        table: order.table,
        amount: order.grandTotal,
        method: PAYMENT_METHOD.ESEWA,
      });
    }

    const demoMode = !config.esewa.merchantId || !config.esewa.productCode;
    const productCode = config.esewa.productCode || 'EPAYTEST';
    const merchantId = config.esewa.merchantId || 'EPAYTEST';
    const transaction = crypto.randomBytes(12).toString('hex');
    const tAmt = Number(payment.amount).toFixed(2);
    const pid = order.orderNumber;
    const su = `${config.clientUrl}/checkout?order=${order._id}&status=esewa-success`;
    const fu = `${config.clientUrl}/checkout?order=${order._id}&status=esewa-failed`;

    let fields = {
      amt: tAmt,
      psc: '0',
      pdc: '0',
      txAmt: tAmt,
      tAmt: tAmt,
      pid,
      scd: productCode,
      su,
      fu,
      merchantId,
    };

    if (!demoMode) {
      const canonical = `total_amount=${tAmt},transaction_uuid=${transaction},product_code=${productCode}`;
      fields.signature = crypto.createHmac('sha256', config.esewa.secretKey).update(canonical).digest('base64');
      fields.productCode = productCode;
    }

    payment.metadata = { ...(payment.metadata || {}), signature: fields.signature || '', transaction_uuid: transaction };
    await payment.save();

    return {
      demoMode,
      gateway: demoMode ? null : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
      fields,
      paymentId: payment._id,
      payment,
    };
  }

  async verifyEsewa({ paymentId, refId, transactionId, oid, amt, signature }) {
    const payment = await this.repo.findById(paymentId);
    if (!payment) throw new ApiError(404, 'Payment not found');

    if (config.esewa.environment === 'sandbox' && config.esewa.secretKey) {
      const canonical = `total_amount=${amt},transaction_uuid=${oid},product_code=${config.esewa.productCode}`;
      const expected = crypto.createHmac('sha256', config.esewa.secretKey).update(canonical).digest('base64');
      const provided = signature || payment.metadata?.signature || '';
      if (!provided) throw new ApiError(400, 'Missing eSewa signature', null, 'PAYMENT_VERIFICATION_FAILED');
      if (expected !== provided)
        throw new ApiError(400, 'eSewa signature mismatch', null, 'PAYMENT_VERIFICATION_FAILED');
    }

    payment.method = PAYMENT_METHOD.ESEWA;
    payment.status = PAYMENT_STATUS.SUCCESS;
    payment.gatewayRef = transactionId || refId;
    payment.transactionId = transactionId || refId;
    payment.paidAt = new Date();
    payment.verified = true;
    await payment.save();
    await this.markOrderPaid(payment.order, PAYMENT_METHOD.ESEWA);
    return payment;
  }

  async verifyKhalti(paymentId, token) {
    const payment = await this.repo.findById(paymentId);
    if (!payment) throw new ApiError(404, 'Payment not found');
    const order = await Order.findById(payment.order);

    // Demo mode: no sandbox key configured → accept and mark paid for demos.
    if (!config.khalti.secretKey) {
      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.transactionId = token || 'demo-token';
      payment.gatewayRef = token || 'demo-token';
      payment.paidAt = new Date();
      payment.verified = true;
      await payment.save();
      await this.markOrderPaid(payment.order, PAYMENT_METHOD.KHALTI);
      return { success: true, data: { state: 'Demo' }, payment };
    }

    // Khalti verification endpoint in sandbox
    const res = await fetch('https://khalti.com/api/v2/payment/verify/', {
      method: 'POST',
      headers: {
        Authorization: `Key ${config.khalti.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, amount: Math.round(payment.amount * 100) }),
    }).catch(() => ({
      ok: false,
      json: async () => ({}),
    }));

    const body = res.ok ? await res.json() : {};
    if (res.ok && body.state && ['Completed', 'Verified'].includes(body.state)) {
      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.transactionId = body.idx || token;
      payment.gatewayRef = token;
      payment.paidAt = new Date();
      payment.verified = true;
      await payment.save();
      await this.markOrderPaid(payment.order, PAYMENT_METHOD.KHALTI);
      return { success: true, data: body, payment };
    }
    return { success: false, data: body, payment };
  }

  async markCashPaid(paymentId, receivedBy) {
    const payment = await this.repo.findById(paymentId);
    if (!payment) throw new ApiError(404, 'Payment not found');
    payment.method = PAYMENT_METHOD.CASH;
    payment.status = PAYMENT_STATUS.SUCCESS;
    payment.paidAt = new Date();
    payment.receivedBy = receivedBy;
    payment.verified = true;
    await payment.save();
    await this.markOrderPaid(payment.order, PAYMENT_METHOD.CASH);
    return payment;
  }

  async payAfterMeal({ orderId, customerId }) {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found', null, ErrorCodes.NOT_FOUND);
    let payment = await this.repo.findOne({ order: orderId });
    if (!payment) {
      payment = await this.createPayment({
        order: orderId,
        restaurant: order.restaurant,
        customer: customerId,
        table: order.table,
        amount: order.grandTotal,
        method: PAYMENT_METHOD.PAY_AFTER_MEAL,
      });
    }
    order.paymentStatus = 'unpaid';
    order.paymentMethod = PAYMENT_METHOD.PAY_AFTER_MEAL;
    payment.status = PAYMENT_STATUS.PENDING;
    payment.method = PAYMENT_METHOD.PAY_AFTER_MEAL;
    await order.save();
    await payment.save();
    return { order, payment };
  }

  async markOrderPaid(orderId, method) {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: 'paid', paymentMethod: method },
      { new: true }
    );
    const payment = await this.repo.findOne({ order: orderId });
    if (!payment) {
      await this.repo.create({
        order: orderId,
        restaurant: order?.restaurant,
        customer: order?.customer,
        table: order?.table,
        amount: order?.grandTotal,
        method,
        status: PAYMENT_STATUS.SUCCESS,
        paidAt: new Date(),
      });
    }
    notificationService.emitToRestaurant(order?.restaurant, 'payment:success', { orderId: order?._id, method });
    notificationService.emitToCustomer(order?.customer, 'payment:success', { orderId: order?._id, method });
    return order;
  }

  async getForOrder(orderId) {
    return this.repo.findOne({ order: orderId });
  }

  async listForRestaurant(restaurantId, { page = 1, limit = 20 } = {}) {
    return this.repo.paginate({ restaurant: restaurantId }, { page, limit, sort: { createdAt: -1 } });
  }
}

export default new PaymentService();