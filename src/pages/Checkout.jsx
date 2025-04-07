import { load } from "@cashfreepayments/cashfree-js";
import axios from 'axios';
import { ENDPOINTS } from '@/utils/config';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

function Checkout() {
  const [loading, setLoading] = useState(false);
  const [cashfree, setCashfree] = useState(null);

  useEffect(() => {
    initializeSDK();
  }, []);

  const initializeSDK = async () => {
    try {
      const cashfreeInstance = await load({
        mode: "sandbox",
      });
      setCashfree(cashfreeInstance);
    } catch (error) {
      console.error("Error initializing Cashfree SDK:", error);
      toast.error("Failed to initialize payment system");
    }
  };

  const createOrder = async () => {
    if (!cashfree) {
      toast.error("Payment system is not ready. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to continue');
      }

      // Create order on your backend
      const response = await axios.post(ENDPOINTS.PAYMENTS.CREATE, {
        order_amount: 100, // You should get this from your cart/order details
        order_currency: "INR",
        customer_details: {
          customer_id: "CUST_" + Date.now(), // You should use actual customer ID
          customer_name: "John Doe", // Get from user profile
          customer_email: "john@example.com", // Get from user profile
          customer_phone: "9999999999" // Get from user profile
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const { data } = response.data;
      
      if (!data?.payment_session_id) {
        throw new Error('Payment session ID not received');
      }

      // Configure checkout options
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self",
        onSuccess: (data) => {
          console.log("Payment Success:", data);
          toast.success("Payment successful!");
          // Handle successful payment (e.g., update order status, redirect to success page)
        },
        onFailure: (data) => {
          console.error("Payment Failed:", data);
          toast.error("Payment failed. Please try again.");
        },
        onClose: () => {
          console.log("Payment window closed");
          setLoading(false);
        }
      };

      // Open Cashfree checkout
      await cashfree.checkout(checkoutOptions);

    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row">
      <p>Click below to open the checkout page</p>
      <button 
        type="submit" 
        className="btn btn-primary" 
        id="renderBtn" 
        onClick={createOrder}
        disabled={loading}
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}

export default Checkout;