export const guestEmailOk = (email: string): boolean => {
  const t = email.trim();
  return t.length > 4 && t.includes("@") && !t.includes(" ");
};

export const orderIdOk = (id: string): boolean => {
  const t = id.trim();
  return t.length >= 8;
};

export const guestOrderStatusColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "paid":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "processing":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const guestOrderStatusText = (status: string): string => {
  switch (status) {
    case "pending":
      return "Aguardando Pagamento";
    case "paid":
      return "Pagamento Aprovado";
    case "processing":
      return "Em Separação";
    case "shipped":
      return "Enviado";
    case "delivered":
      return "Entregue";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
};
