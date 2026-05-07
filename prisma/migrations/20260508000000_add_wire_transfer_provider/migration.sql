-- Wire-transfer payment provider value. Used by the admin
-- "Označi uplatu primljenu" action when a customer pays a
-- predračun (proforma) via bank transfer. Stamped onto
-- Order.paymentProvider together with paymentStatus=completed
-- so the post-payment hook (issueInvoice + email) fires the
-- same way it does for PayPal/card captures.

ALTER TYPE "PaymentProvider" ADD VALUE 'wire_transfer';
