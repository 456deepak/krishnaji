import { load } from "@cashfreepayments/cashfree-js";
import axios from 'axios';
import { ENDPOINTS } from '@/utils/config';

function Checkout() {
  let cashfree;
  var initializeSDK = async function () {
    cashfree = await load({
      mode: "sandbox",
    });
  };
  initializeSDK();

  const createOrder = async () => {
    try {
      const response = await axios.get(ENDPOINTS.PAYMENTS.CREATE);
      console.log('Order creation response:', response.data);

      const { paymentSessionId } = response.data;
      console.log('Payment Session ID:', paymentSessionId);

      let checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then((result) => {
        if (result.error) {
          console.log("Payment Error:", result.error);
        }
        if (result.redirect) {
          console.log("Payment will be redirected");
        }
        if (result.paymentDetails) {
          console.log("Payment completed:", result.paymentDetails);
        }
      });
    } catch (error) {
      console.error("Error creating order:", error.message);
    }
  };

  return (
    <div className="row">
      <p>Click below to open the checkout page in popup</p>
      <button type="submit" className="btn btn-primary" id="renderBtn" onClick={createOrder}>
        Pay Now
      </button>
    </div>
  );
}

export default Checkout;