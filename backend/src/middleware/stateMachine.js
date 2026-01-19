// Payment status transitions (allowed)
const PAYMENT_TRANSITIONS = {
  pending: ['processing', 'failed'],
  processing: ['completed', 'failed'],
  completed: ['refunded'],
  failed: ['pending'],
  refunded: [], // terminal
};

// Order status transitions (allowed)
const ORDER_TRANSITIONS = {
  new: ['processing', 'cancelled'],
  processing: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  paid_but_shipment_failed: ['paid', 'shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [], // terminal
  cancelled: [], // terminal
  returned: [], // terminal
};

// Shipment status transitions (allowed)
const SHIPMENT_TRANSITIONS = {
  new: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [], // terminal
  cancelled: [], // terminal
  returned: [], // terminal
};

function isValidTransition(type, from, to) {
  const map = {
    payment: PAYMENT_TRANSITIONS,
    order: ORDER_TRANSITIONS,
    shipment: SHIPMENT_TRANSITIONS,
  }[type];
  if (!map || !map[from]) return false;
  return map[from].includes(to);
}

function validateTransition(type, from, to) {
  const valid = isValidTransition(type, from, to);
  if (!valid) {
    throw new Error(`Invalid ${type} status transition: ${from} -> ${to}`);
  }
  return true;
}

module.exports = {
  PAYMENT_TRANSITIONS,
  ORDER_TRANSITIONS,
  SHIPMENT_TRANSITIONS,
  isValidTransition,
  validateTransition,
};
