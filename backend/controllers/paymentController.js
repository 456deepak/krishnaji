const axios = require('axios');

const CASHFREE_API_URL = 'https://sandbox.cashfree.com/pg';
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

const createOrder = async (req, res) => {
  try {
    const { order_amount, order_currency, customer_details } = req.body;

    // Validate required fields
    if (!order_amount || !order_currency || !customer_details) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate unique order ID
    const order_id = `ORDER_${Date.now()}`;

    // Prepare order data for Cashfree
    const orderData = {
      order_id,
      order_amount,
      order_currency,
      customer_details,
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment/success?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
      },
      order_expiry_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    };

    // Create order with Cashfree
    const response = await axios.post(`${CASHFREE_API_URL}/orders`, orderData, {
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    });

    // Return the payment session ID to the frontend
    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error creating order:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to create order'
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { order_id } = req.params;

    const response = await axios.get(`${CASHFREE_API_URL}/orders/${order_id}`, {
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01'
      }
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error verifying payment:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to verify payment'
    });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const { order_id, order_status, payment_id } = req.body;

    // Verify webhook signature
    // TODO: Implement webhook signature verification

    // Update order status in your database
    // TODO: Update order status based on order_status

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ success: false });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook
}; 