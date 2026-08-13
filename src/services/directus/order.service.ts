import { Order, OrderItem, CreateOrderInput, OrderStatus } from '../../types';
import { directusFetch } from './client';
import { AuthService } from './auth.service';

export class OrderService {
  constructor(private authService: AuthService) {}

  async getOrders(): Promise<Order[]> {
    try {
      const currentUser = this.authService.getCurrentUser();
      const token = currentUser?.token || null;
      const response = await directusFetch('/items/orders?fields=*,order_items.*&sort=-date_created', { token });
      if (!response.ok) {
        console.warn("Failed to fetch orders from Directus");
        return [];
      }
      const data = await response.json();
      return data?.data || [];
    } catch (err) {
      console.warn("Error fetching orders from Directus:", err);
      return [];
    }
  }

  async getOrderById(id: number): Promise<Order | null> {
    try {
      const currentUser = this.authService.getCurrentUser();
      const token = currentUser?.token || null;
      const response = await directusFetch(`/items/orders/${id}?fields=*,order_items.*`, { token });
      if (!response.ok) return null;
      const data = await response.json();
      return data?.data || null;
    } catch (err) {
      console.warn("Error fetching order by ID:", err);
      return null;
    }
  }

  async createOrder(orderInput: CreateOrderInput): Promise<Order> {
    try {
      const currentUser = this.authService.getCurrentUser();
      const token = currentUser?.token || null;

      const calculatedTotal = orderInput.items.reduce((sum, item) => sum + (item.item_quantity * item.item_price), 0);
      const totalAmount = orderInput.order_total && orderInput.order_total > 0 ? orderInput.order_total : calculatedTotal;

      // 1. Create order record in orders collection
      const orderRes = await directusFetch('/items/orders', {
        method: 'POST',
        token,
        body: JSON.stringify({
          status: orderInput.status || 'published',
          order_total: totalAmount,
          date_created: new Date().toISOString()
        })
      });

      if (!orderRes.ok) {
        const errBody = await orderRes.json().catch(() => ({}));
        throw new Error(errBody?.errors?.[0]?.message || 'خطا در ثبت سفارش در سرور ابری');
      }

      const orderData = await orderRes.json();
      const createdOrder: Order = orderData?.data;
      const createdItems: OrderItem[] = [];

      // 2. Create order_items and deduct from inventory stock
      for (const item of orderInput.items) {
        const itemTotal = item.item_quantity * item.item_price;
        const itemRes = await directusFetch('/items/order_items', {
          method: 'POST',
          token,
          body: JSON.stringify({
            order_id: createdOrder.id,
            item_inventory: item.item_inventory,
            item_quantity: item.item_quantity,
            item_price: item.item_price,
            item_total: itemTotal
          })
        });

        if (itemRes.ok) {
          const itemData = await itemRes.json();
          createdItems.push(itemData?.data);
        }

        // 3. Deduct stock from inventory table
        try {
          const invRes = await directusFetch(`/items/inventory/${item.item_inventory}`, { token });
          if (invRes.ok) {
            const invData = await invRes.json();
            const currentStock = Number(invData?.data?.stock) || 0;
            const updatedStock = Math.max(0, currentStock - item.item_quantity);

            await directusFetch(`/items/inventory/${item.item_inventory}`, {
              method: 'PATCH',
              token,
              body: JSON.stringify({ stock: updatedStock })
            });
          }
        } catch (invErr) {
          console.warn(`Failed to deduct inventory stock for item_inventory ${item.item_inventory}:`, invErr);
        }
      }

      createdOrder.order_items = createdItems;
      return createdOrder;
    } catch (err: any) {
      console.error("Failed to create order in Directus:", err);
      throw err;
    }
  }

  async updateOrderStatus(id: number, status: OrderStatus | string): Promise<boolean> {
    try {
      const currentUser = this.authService.getCurrentUser();
      const token = currentUser?.token || null;
      const response = await directusFetch(`/items/orders/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status })
      });
      return response.ok;
    } catch (err) {
      console.warn("Failed to update order status:", err);
      return false;
    }
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      const currentUser = this.authService.getCurrentUser();
      const token = currentUser?.token || null;
      const response = await directusFetch(`/items/orders/${id}`, {
        method: 'DELETE',
        token
      });
      return response.ok;
    } catch (err) {
      console.warn("Failed to delete order:", err);
      return false;
    }
  }
}
