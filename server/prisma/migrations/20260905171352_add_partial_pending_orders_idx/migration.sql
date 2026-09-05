-- Create Partial Index for PENDING orders
CREATE INDEX "idx_orders_pending" ON "Order"("createdAt") WHERE "status" = 'PENDING';
