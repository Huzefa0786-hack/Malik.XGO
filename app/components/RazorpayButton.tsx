"use client";

import { useState } from "react";
import api from "../lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayButtonProps {
  amount: number;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
  buttonText?: string;
  className?: string;
}

export default function RazorpayButton({
  amount,
  onSuccess,
  onError,
  buttonText = "Pay with Razorpay",
  className = "",
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Create order
      const response = await api.post("/payment/create-order", {
        amount: amount,
      });

      const { order } = response.data;

      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "Malik.XGO",
          description: "Deposit to wallet",
          image: "/logo.png",
          order_id: order.id,
          handler: function (response: any) {
            // Verify payment
            api
              .post("/payment/verify-payment", {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                transactionId: order.transactionId,
              })
              .then((res) => {
                onSuccess(res.data);
              })
              .catch((err) => {
                onError(err);
              });
          },
          prefill: {
            name: "User",
            email: "user@example.com",
            contact: "9999999999",
          },
          theme: {
            color: "#22c55e",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        setLoading(false);
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error("Payment error:", error);
      onError(error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading || !amount}
      className={`bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-bold py-3 px-6 rounded-xl transition disabled:opacity-50 ${className}`}
    >
      {loading ? "Processing..." : buttonText}
    </button>
  );
}