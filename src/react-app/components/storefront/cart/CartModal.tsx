import { CartDrawer } from "@/react-app/components/storefront/cart/CartDrawer";

type CartModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/** Casca do carrinho — drawer lateral premium (lógica em useCheckoutFlow). */
export default function CartModal({ isOpen, onClose }: CartModalProps) {
  return <CartDrawer isOpen={isOpen} onClose={onClose} />;
}
