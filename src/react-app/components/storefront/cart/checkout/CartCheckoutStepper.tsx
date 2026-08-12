import { AnimatePresence, motion } from "motion/react";
import { CheckoutOrderSuccess } from "@/react-app/components/storefront/cart/checkout/CheckoutOrderSuccess";
import { CheckoutStepIdentity } from "@/react-app/components/storefront/cart/checkout/CheckoutStepIdentity";
import { CheckoutStepIndicator } from "@/react-app/components/storefront/cart/checkout/CheckoutStepIndicator";
import { CheckoutStepPayment } from "@/react-app/components/storefront/cart/checkout/CheckoutStepPayment";
import { CheckoutStepSummary } from "@/react-app/components/storefront/cart/checkout/CheckoutStepSummary";
import { CheckoutSubmitOverlay } from "@/react-app/components/storefront/cart/checkout/CheckoutSubmitOverlay";
import type { useCheckoutFlow } from "@/react-app/hooks/storefront/useCheckoutFlow";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
  }),
};

type CheckoutFlow = ReturnType<typeof useCheckoutFlow>;

type CartCheckoutStepperProps = {
  flow: CheckoutFlow;
};

export function CartCheckoutStepper({ flow }: CartCheckoutStepperProps) {
  return (
    <div className="relative">
      <CheckoutSubmitOverlay active={flow.isSubmitting && flow.step === "payment"} />

      {flow.step !== "success" ? <CheckoutStepIndicator current={flow.step} /> : null}

      <AnimatePresence mode="wait" custom={flow.direction}>
        {flow.step === "summary" ? (
          <motion.div
            key="summary"
            custom={flow.direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <CheckoutStepSummary
              items={flow.items}
              calculateItemPrice={flow.calculateItemPrice}
              updateQuantity={flow.updateQuantity}
              removeItem={flow.removeItem}
              total={flow.total}
              shippingFee={flow.shippingFee}
              shippingOk={flow.shippingOk}
              couponDiscount={flow.couponDiscount}
              grandTotal={flow.grandTotal}
              minimumOrderValue={flow.minimumOrderValue}
              belowMinimum={flow.belowMinimum}
              hasInsufficientStock={flow.hasInsufficientStock}
              couponInput={flow.couponInput}
              setCouponInput={flow.setCouponInput}
              onApplyCoupon={flow.handleApplyCoupon}
              couponLoading={flow.couponLoading}
              couponError={flow.couponError}
              stepError={flow.stepError}
              onContinue={flow.advanceFromSummary}
              onClearCart={flow.clearCart}
            />
          </motion.div>
        ) : null}

        {flow.step === "identity" ? (
          <motion.div
            key="identity"
            custom={flow.direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <CheckoutStepIdentity
              user={flow.user}
              customerName={flow.customerName}
              setCustomerName={flow.setCustomerName}
              customerPhone={flow.customerPhone}
              setCustomerPhone={flow.setCustomerPhone}
              deliveryAddress={flow.deliveryAddress}
              setDeliveryAddress={flow.setDeliveryAddress}
              guestEmail={flow.guestEmail}
              setGuestEmail={flow.setGuestEmail}
              shippingCep={flow.shippingCep}
              setShippingCep={flow.setShippingCep}
              onQuoteShipping={flow.handleQuoteShipping}
              shippingLoading={flow.shippingLoading}
              shippingError={flow.shippingError}
              shippingFee={flow.shippingFee}
              shippingOk={flow.shippingOk}
              requireLoginToCheckout={flow.requireLoginToCheckout}
              fieldErrors={flow.fieldErrors}
              isSubmitting={flow.isSubmitting}
              onBack={flow.goBack}
              onContinue={flow.advanceFromIdentity}
            />
          </motion.div>
        ) : null}

        {flow.step === "payment" ? (
          <motion.div
            key="payment"
            custom={flow.direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <CheckoutStepPayment
              orderId={flow.orderId}
              orderTotal={flow.orderTotal}
              grandTotal={flow.grandTotal}
              paymentMethod={flow.paymentMethod}
              setPaymentMethod={flow.setPaymentMethod}
              fieldErrors={flow.fieldErrors}
              stepError={flow.stepError}
              apiError={flow.apiError}
              isSubmitting={flow.isSubmitting}
              onBack={flow.goBack}
              onSubmit={flow.submitPayment}
            />
          </motion.div>
        ) : null}

        {flow.step === "success" && flow.orderId && flow.orderTotal != null ? (
          <motion.div
            key="success"
            custom={flow.direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <CheckoutOrderSuccess
              orderId={flow.orderId}
              orderTotal={flow.orderTotal}
              pixData={flow.pixData}
              guestEmail={flow.guestEmail}
              onClose={flow.finishAndClose}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
