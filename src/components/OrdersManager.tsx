import React, { useState, useEffect, useRef } from 'react';
import { storageManager } from '../storage/index';
import { Order, OrderItem, Product, InventoryItem, Color, Size, CreateOrderItemInput, OrderStatus } from '../types';
import { ShoppingCart, Plus, Trash2, Eye, Printer, CheckCircle2, AlertCircle, Search, Receipt, Package, X, RefreshCw, Layers, FolderUp, Download, Upload, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';

interface OrdersManagerProps {
  t: (key: string) => string;
  lang: 'fa' | 'en';
  darkMode?: boolean;
}

interface DraftCartItem {
  id: string; // temp unique id
  inventory_id: number;
  product_id: number;
  product_name: string;
  color_name: string;
  color_hex?: string;
  size_name: string;
  quantity: number;
  price: number;
  available_stock: number;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({ t, lang, darkMode = true }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals & Views
  const [showNewOrderModal, setShowNewOrderModal] = useState<boolean>(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // New Order Form state
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | ''>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('published');
  const [draftCart, setDraftCart] = useState<DraftCartItem[]>([]);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [fetchedOrders, fetchedProds, fetchedInv, fetchedColors, fetchedSizes] = await Promise.all([
        storageManager.getOrders(),
        storageManager.getProducts(),
        storageManager.getInventory(),
        storageManager.getColors(),
        storageManager.getSizes()
      ]);

      setOrders(fetchedOrders);
      setProducts(fetchedProds);
      setInventory(fetchedInv);
      setColors(fetchedColors);
      setSizes(fetchedSizes);
    } catch (err) {
      console.error("Error loading order management data:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper resolvers for displaying inventory items
  const resolveInventoryDetails = (invId: number) => {
    const inv = inventory.find(i => i.id === invId);
    if (!inv) return null;
    const prod = products.find(p => p.id === inv.product_id);
    const col = colors.find(c => c.id === inv.color_id);
    const sz = sizes.find(s => s.id === inv.size_id);
    return {
      inv,
      productName: prod ? (lang === 'fa' ? prod.name_fa : prod.name_en || prod.name_fa) : `کالا کد ${inv.product_id}`,
      colorName: col ? col.name_fa : `رنگ کد ${inv.color_id}`,
      colorHex: col?.hex_code,
      sizeName: sz ? sz.name : `سایز کد ${inv.size_id}`,
      stock: inv.stock,
      price: inv.price || prod?.base_price || 0
    };
  };

  // Available inventory variants for currently selected product
  const availableProductVariants = selectedProductId
    ? inventory.filter(inv => inv.product_id === Number(selectedProductId))
    : [];

  const handleProductChange = (prodId: number) => {
    setSelectedProductId(prodId);
    setSelectedInventoryId('');
    setItemQuantity(1);
    
    // Auto-select first variant if available
    const vars = inventory.filter(i => i.product_id === prodId);
    if (vars.length > 0) {
      const firstVar = vars[0];
      setSelectedInventoryId(firstVar.id);
      const prod = products.find(p => p.id === prodId);
      setItemUnitPrice(firstVar.price || prod?.base_price || 0);
    }
  };

  const handleVariantChange = (invId: number) => {
    setSelectedInventoryId(invId);
    const details = resolveInventoryDetails(invId);
    if (details) {
      setItemUnitPrice(details.price);
    }
  };

  const handleAddItemToCart = () => {
    if (!selectedInventoryId) {
      showToast('لطفاً یک متغیر رنگ و سایز انتخاب کنید.', 'error');
      return;
    }
    const details = resolveInventoryDetails(Number(selectedInventoryId));
    if (!details) return;

    if (itemQuantity <= 0) {
      showToast('تعداد باید حداقل ۱ باشد.', 'error');
      return;
    }

    if (itemQuantity > details.stock) {
      showToast(`${t('insufficient_stock')} (موجودی فعلی: ${details.stock})`, 'error');
      return;
    }

    // Check if item already exists in draft cart
    const existingIndex = draftCart.findIndex(c => c.inventory_id === Number(selectedInventoryId));
    if (existingIndex !== -1) {
      const newQty = draftCart[existingIndex].quantity + itemQuantity;
      if (newQty > details.stock) {
        showToast(`مجموع تعداد انتخابی در فاکتور (${newQty}) بیشتر از موجودی انبار (${details.stock}) است!`, 'error');
        return;
      }
      const updatedCart = [...draftCart];
      updatedCart[existingIndex].quantity = newQty;
      updatedCart[existingIndex].price = itemUnitPrice;
      setDraftCart(updatedCart);
    } else {
      const newItem: DraftCartItem = {
        id: Date.now().toString() + Math.random().toString(),
        inventory_id: Number(selectedInventoryId),
        product_id: details.inv.product_id,
        product_name: details.productName,
        color_name: details.colorName,
        color_hex: details.colorHex,
        size_name: details.sizeName,
        quantity: itemQuantity,
        price: itemUnitPrice,
        available_stock: details.stock
      };
      setDraftCart([...draftCart, newItem]);
    }

    // Reset item quantity input
    setItemQuantity(1);
    showToast('قلم به فاکتور اضافه شد', 'success');
  };

  const handleRemoveItemFromCart = (cartItemId: string) => {
    setDraftCart(draftCart.filter(item => item.id !== cartItemId));
  };

  const calculateCartTotal = () => {
    return draftCart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSubmitOrder = async () => {
    if (draftCart.length === 0) {
      showToast(t('empty_cart'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsInput: CreateOrderItemInput[] = draftCart.map(c => ({
        item_inventory: c.inventory_id,
        item_quantity: c.quantity,
        item_price: c.price
      }));

      await storageManager.createOrder({
        status: orderStatus,
        order_total: calculateCartTotal(),
        items: itemsInput
      });

      showToast(t('order_success'), 'success');
      setShowNewOrderModal(false);
      setDraftCart([]);
      setSelectedProductId('');
      setSelectedInventoryId('');

      // Refresh orders list and inventory
      await loadAllData();
    } catch (err: any) {
      console.error("Failed to submit order:", err);
      showToast(err?.message || 'خطا در ثبت سفارش', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (window.confirm('آیا از حذف این سفارش اطمینان دارید؟')) {
      try {
        await storageManager.deleteOrder(id);
        showToast('سفارش با موفقیت حذف شد', 'success');
        await loadAllData();
      } catch (err) {
        showToast('خطا در حذف سفارش', 'error');
      }
    }
  };

  // --- ORDER IMPORT / EXPORT HANDLERS ---
  const orderImportFileInputRef = useRef<HTMLInputElement>(null);
  const [showOrderImportExportModal, setShowOrderImportExportModal] = useState(false);
  const [importingOrders, setImportingOrders] = useState(false);

  const handleExportOrdersJSON = () => {
    if (orders.length === 0) {
      showToast(lang === 'fa' ? 'هیچ سفارشی برای خروجی گرفتن وجود ندارد.' : 'No orders available to export.', 'error');
      return;
    }
    const exportData = orders.map(o => ({
      id: o.id,
      date_created: o.date_created,
      status: o.status,
      order_total: o.order_total,
      items: (o.order_items || []).map(i => ({
        product_name: i.product_name || '',
        color_name: i.color_name || '',
        size_name: i.size_name || '',
        item_quantity: i.item_quantity || 1,
        item_price: i.item_price || 0,
        item_total: i.item_total || ((i.item_quantity || 1) * (i.item_price || 0))
      }))
    }));

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tankhor_orders_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(lang === 'fa' ? `خروجی JSON با موفقیت دریافت شد (${orders.length} فاکتور)` : `Exported JSON (${orders.length} orders)`, 'success');
  };

  const handleExportOrdersCSV = () => {
    if (orders.length === 0) {
      showToast(lang === 'fa' ? 'هیچ سفارشی برای خروجی گرفتن وجود ندارد.' : 'No orders available to export.', 'error');
      return;
    }
    const headers = ['Order_ID', 'Date', 'Status', 'Total_Price', 'Items_Count', 'Items_Summary'];
    const csvRows = [headers.join(',')];

    orders.forEach(o => {
      const itemsSummary = (o.order_items || []).map(i => `${i.product_name || ''} (${i.color_name || ''}/${i.size_name || ''}) x${i.item_quantity}`).join(' | ');
      const row = [
        o.id,
        `"${(o.date_created || '').replace(/"/g, '""')}"`,
        `"${(o.status || 'published').replace(/"/g, '""')}"`,
        o.order_total || 0,
        (o.order_items || []).length,
        `"${itemsSummary.replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tankhor_orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(lang === 'fa' ? `خروجی CSV با موفقیت دریافت شد (${orders.length} فاکتور)` : `Exported CSV (${orders.length} orders)`, 'success');
  };

  const handleDownloadSampleOrdersTemplate = (type: 'json' | 'csv') => {
    const sampleData = [
      {
        status: 'published',
        order_total: 1360000,
        items: [
          {
            item_inventory: inventory[0]?.id || 1,
            item_quantity: 2,
            item_price: 680000
          }
        ]
      }
    ];

    if (type === 'json') {
      const jsonStr = JSON.stringify(sampleData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tankhor_orders_sample.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['status', 'order_total', 'item_inventory', 'item_quantity', 'item_price'];
      const rows = [headers.join(',')];
      rows.push(['published', 1360000, inventory[0]?.id || 1, 2, 680000].join(','));
      const csvContent = '\uFEFF' + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tankhor_orders_sample.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportOrdersFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setImportingOrders(true);

    try {
      const text = await file.text();
      let importedList: any[] = [];

      if (file.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(text);
        importedList = Array.isArray(parsed) ? parsed : [parsed];
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
            const matches: string[] = [];
            let match;
            while ((match = regex.exec(lines[i])) !== null) {
              if (match[1] !== undefined) matches.push(match[1]);
              else if (match[2] !== undefined) matches.push(match[2]);
            }
            if (matches.length > 0) {
              const item: any = {};
              headers.forEach((h, idx) => {
                item[h] = matches[idx] || '';
              });
              importedList.push(item);
            }
          }
        }
      } else {
        throw new Error(lang === 'fa' ? "فرمت فایل نامعتبر است. لطفاً فایل JSON یا CSV انتخاب کنید." : "Invalid file format. Please upload JSON or CSV.");
      }

      if (importedList.length === 0) {
        throw new Error(lang === 'fa' ? "هیچ سطر یا داده سفارشی در فایل یافت نشد." : "No valid order rows found in file.");
      }

      let count = 0;
      for (const item of importedList) {
        const status = item.status || 'published';
        const orderTotal = parseInt(item.order_total || item.total || 0, 10) || 0;
        let itemsInput: CreateOrderItemInput[] = [];

        if (Array.isArray(item.items) && item.items.length > 0) {
          itemsInput = item.items.map((it: any) => ({
            item_inventory: parseInt(it.item_inventory || it.inventory_id || inventory[0]?.id || 1, 10),
            item_quantity: parseInt(it.item_quantity || it.quantity || 1, 10),
            item_price: parseInt(it.item_price || it.price || 0, 10)
          }));
        } else if (item.item_inventory) {
          itemsInput = [{
            item_inventory: parseInt(item.item_inventory, 10),
            item_quantity: parseInt(item.item_quantity || 1, 10),
            item_price: parseInt(item.item_price || orderTotal, 10)
          }];
        } else if (inventory.length > 0) {
          itemsInput = [{
            item_inventory: inventory[0].id,
            item_quantity: 1,
            item_price: orderTotal || inventory[0].price || 100000
          }];
        }

        await storageManager.createOrder({
          status: status as OrderStatus,
          order_total: orderTotal || itemsInput.reduce((sum, i) => sum + (i.item_quantity * i.item_price), 0),
          items: itemsInput
        });
        count++;
      }

      await loadAllData();
      setShowOrderImportExportModal(false);
      showToast(lang === 'fa' ? `تعداد ${count} فاکتور جدید با موفقیت وارد شد.` : `Successfully imported ${count} orders.`, 'success');
    } catch (err: any) {
      showToast(err.message || (lang === 'fa' ? "خطا در وارد کردن فایل سفارشات." : "Failed to import orders file."), 'error');
    } finally {
      setImportingOrders(false);
      if (orderImportFileInputRef.current) {
        orderImportFileInputRef.current.value = '';
      }
    }
  };

  // Filtered orders list
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toString().includes(searchQuery) ||
      (order.order_items || []).some(item => 
        item.product_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatPrice = (price: number) => {
    return price.toLocaleString('fa-IR');
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '-';
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white font-medium transition-all transform animate-bounce ${
          notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl shadow-sm border transition-all ${
        darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${
            darkMode ? 'text-neutral-100' : 'text-slate-800'
          }`}>
            <Receipt className="w-6 h-6 text-indigo-500" />
            {t('orders_management')}
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
            ثبت فاکتور، مدیریت فروش و کسر مستقیم از موجودی ماتریسی انبار
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowOrderImportExportModal(true)}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
              darkMode ? 'bg-neutral-800/80 border-neutral-700 hover:bg-neutral-700 text-neutral-200' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm'
            }`}
            title={lang === 'fa' ? "ورود و خروجی فایل فاکتورها (JSON / CSV)" : "Import & Export Orders"}
          >
            <FolderUp className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">{lang === 'fa' ? "ایمپورت / اکسپورت" : "Import & Export"}</span>
          </button>

          <button
            onClick={loadAllData}
            disabled={loading}
            className={`p-2.5 rounded-xl transition-colors ${
              darkMode ? 'text-neutral-300 hover:bg-neutral-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="بروزرسانی لیست"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>

          <button
            onClick={() => setShowNewOrderModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 sm:px-5 py-2.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer text-xs sm:text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>{t('new_order')}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="جستجو با شماره فاکتور یا نام کالا..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pr-10 pl-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-100 placeholder-neutral-500' : 'bg-white border-slate-200 text-slate-800'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className={`text-sm font-medium whitespace-nowrap ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>وضعیت:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <option value="all" className={darkMode ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-slate-800'}>همه وضعیت‌ها</option>
            <option value="published" className={darkMode ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-slate-800'}>تکمیل شده (Published)</option>
            <option value="draft" className={darkMode ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-slate-800'}>پیش‌نویس (Draft)</option>
            <option value="archived" className={darkMode ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-slate-800'}>بایگانی شده (Archived)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`rounded-2xl shadow-sm border overflow-hidden transition-all ${
        darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {loading ? (
          <div className="py-16 text-center text-neutral-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            <p>{t('loading')}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 space-y-3">
            <Package className="w-12 h-12 mx-auto text-neutral-500 opacity-50" />
            <p className="font-semibold">{t('no_orders')}</p>
            <p className="text-xs text-neutral-500">برای ایجاد اولین فاکتور فروش، دکمه «ثبت سفارش جدید» را بزنید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className={`text-xs font-bold uppercase tracking-wider border-b ${
                  darkMode ? 'bg-neutral-950/80 text-neutral-400 border-neutral-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <th className="py-4 px-5 whitespace-nowrap">{t('order_id')}</th>
                  <th className="py-4 px-5 whitespace-nowrap">{t('order_date')}</th>
                  <th className="py-4 px-5 whitespace-nowrap">{t('order_items')}</th>
                  <th className="py-4 px-5 whitespace-nowrap">{t('order_total')}</th>
                  <th className="py-4 px-5 whitespace-nowrap">{t('order_status')}</th>
                  <th className="py-4 px-5 text-center whitespace-nowrap">عملیات</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-sm ${darkMode ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                {filteredOrders.map((order) => {
                  const itemsCount = order.order_items?.length || 0;
                  return (
                    <tr key={order.id} className={`transition-colors ${
                      darkMode ? 'hover:bg-neutral-800/50' : 'hover:bg-slate-50/80'
                    }`}>
                      <td className="py-4 px-5 font-mono font-bold whitespace-nowrap">
                        #{order.id}
                      </td>
                      <td className={`py-4 px-5 text-xs dir-ltr whitespace-nowrap ${darkMode ? 'text-neutral-300' : 'text-slate-600'}`}>
                        {formatDate(order.date_created)}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          darkMode ? 'bg-neutral-800 text-neutral-200 border border-neutral-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          {itemsCount} قلم کالا
                        </span>
                      </td>
                      <td className="py-4 px-5 font-bold text-emerald-400 whitespace-nowrap">
                        {formatPrice(order.order_total || 0)} تومان
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.status === 'published' || order.status === 'completed'
                            ? (darkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-700')
                            : order.status === 'draft'
                            ? (darkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-100 text-amber-700')
                            : (darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-100 text-slate-600')
                        }`}>
                          {order.status === 'published' || order.status === 'completed' ? 'تکمیل شده' : order.status === 'draft' ? 'پیش‌نویس' : 'بایگانی'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedOrderForInvoice(order)}
                            className={`p-2 rounded-lg transition-colors cursor-pointer ${
                              darkMode ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-indigo-600 hover:bg-indigo-50'
                            }`}
                            title="مشاهده فاکتور"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className={`p-2 rounded-lg transition-colors cursor-pointer ${
                              darkMode ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-600 hover:bg-rose-50'
                            }`}
                            title="حذف سفارش"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Create New Order (POS) */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className={`rounded-3xl shadow-2xl border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 ${
            darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              darkMode ? 'border-neutral-800 bg-neutral-950/50' : 'border-slate-200 bg-slate-50/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  darkMode ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {t('new_order')}
                  </h3>
                  <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                    انتخاب کالا، تعیین تعداد و ثبت فاکتور نهایی با کسر هوشمند از انبار
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNewOrderModal(false)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Product & Variant Selector Box */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                darkMode ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  افزودن کالا به سبد فاکتور
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Select Product */}
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                      {t('select_product')}
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductChange(Number(e.target.value))}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="" className={darkMode ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-slate-800'}>-- انتخاب محصول --</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id} className={darkMode ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-slate-800'}>
                          {lang === 'fa' ? prod.name_fa : prod.name_en || prod.name_fa}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Inventory Variant */}
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                      {t('select_variant')}
                    </label>
                    <select
                      value={selectedInventoryId}
                      onChange={(e) => handleVariantChange(Number(e.target.value))}
                      disabled={!selectedProductId}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
                        darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="" className={darkMode ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-slate-800'}>-- انتخاب رنگ و سایز --</option>
                      {availableProductVariants.map((inv) => {
                        const col = colors.find(c => c.id === inv.color_id);
                        const sz = sizes.find(s => s.id === inv.size_id);
                        return (
                          <option key={inv.id} value={inv.id} className={darkMode ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-slate-800'}>
                            {col?.name_fa || `رنگ ${inv.color_id}`} / {sz?.name || `سایز ${inv.size_id}`} (موجودی: {inv.stock})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Quantity & Add button */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                        {t('quantity')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(Math.max(1, Number(e.target.value)))}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItemToCart}
                      disabled={!selectedInventoryId}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {t('add_item')}
                    </button>
                  </div>
                </div>

                {/* Stock Indicator Banner */}
                {selectedInventoryId && (
                  <div className={`pt-2 text-xs flex items-center justify-between border-t ${
                    darkMode ? 'text-neutral-400 border-neutral-800' : 'text-slate-500 border-slate-200'
                  }`}>
                    <span>قیمت واحد تعیین‌شده: <strong className="text-emerald-400 font-semibold">{formatPrice(itemUnitPrice)} تومان</strong></span>
                    {(() => {
                      const details = resolveInventoryDetails(Number(selectedInventoryId));
                      return details ? (
                        <span className={`font-semibold ${details.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t('available_stock')}: {details.stock} عدد
                        </span>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              {/* Draft Cart Items Table */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center justify-between">
                  <span>اقلام اضافه شده به فاکتور ({draftCart.length})</span>
                  <span className={`text-xs font-normal ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                    مبلغ کل: <strong className="text-emerald-400 text-sm font-bold">{formatPrice(calculateCartTotal())} تومان</strong>
                  </span>
                </h4>

                {draftCart.length === 0 ? (
                  <div className={`py-10 border-2 border-dashed rounded-2xl text-center text-sm ${
                    darkMode ? 'border-neutral-800 text-neutral-500' : 'border-slate-200 text-slate-400'
                  }`}>
                    {t('empty_cart')}
                  </div>
                ) : (
                  <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'border-neutral-800' : 'border-slate-200'}`}>
                    <table className="w-full text-right text-xs">
                      <thead className={`font-semibold border-b ${
                        darkMode ? 'bg-neutral-950/80 text-neutral-400 border-neutral-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <tr>
                          <th className="py-3 px-4">نام کالا</th>
                          <th className="py-3 px-4">رنگ و سایز</th>
                          <th className="py-3 px-4">تعداد</th>
                          <th className="py-3 px-4">قیمت واحد</th>
                          <th className="py-3 px-4">مبلغ کل</th>
                          <th className="py-3 px-4 text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                        {draftCart.map((item) => (
                          <tr key={item.id} className={darkMode ? 'hover:bg-neutral-800/40' : 'hover:bg-slate-50'}>
                            <td className="py-3 px-4 font-medium">
                              {item.product_name}
                            </td>
                            <td className={`py-3 px-4 ${darkMode ? 'text-neutral-300' : 'text-slate-600'}`}>
                              <div className="flex items-center gap-1.5">
                                {item.color_hex && (
                                  <span className="w-3 h-3 rounded-full border border-neutral-600 inline-block" style={{ backgroundColor: item.color_hex }} />
                                )}
                                <span>{item.color_name} - سایز {item.size_name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-bold">
                              {item.quantity} عدد
                            </td>
                            <td className={`py-3 px-4 ${darkMode ? 'text-neutral-300' : 'text-slate-600'}`}>
                              {formatPrice(item.price)} تومان
                            </td>
                            <td className="py-3 px-4 font-semibold text-emerald-400">
                              {formatPrice(item.quantity * item.price)} تومان
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleRemoveItemFromCart(item.id)}
                                className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
              darkMode ? 'border-neutral-800 bg-neutral-950/50' : 'border-slate-200 bg-slate-50/50'
            }`}>
              <div className="text-right w-full sm:w-auto">
                <span className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>جمع فاکتور:</span>
                <div className="text-xl font-black text-emerald-400">
                  {formatPrice(calculateCartTotal())} تومان
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                    darkMode ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  انصراف
                </button>

                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || draftCart.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{t('submit_order')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal 2: View Order Invoice Details & Print */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #invoice-printable-area, #invoice-printable-area * {
                visibility: visible !important;
                color: #000 !important;
                background: #fff !important;
              }
              #invoice-printable-area {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 24px !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}</style>
          <div className={`rounded-3xl shadow-2xl border w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 ${
            darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            
            {/* Printable Invoice Container */}
            <div className="p-8 space-y-6" id="invoice-printable-area">
              
              {/* Invoice Header */}
              <div className={`flex items-center justify-between border-b pb-6 ${darkMode ? 'border-neutral-800' : 'border-slate-200'}`}>
                <div>
                  <h2 className="text-2xl font-black">
                    فاکتور فروش کالا
                  </h2>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                    پلتفرم هوشمند مدیریت پوشاک تن‌خور (tankhor.com)
                  </p>
                </div>

                <div className="text-left font-mono">
                  <div className="text-sm font-bold text-indigo-400">
                    شماره سفارش: #{selectedOrderForInvoice.id}
                  </div>
                  <div className={`text-xs mt-1 dir-ltr ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                    {formatDate(selectedOrderForInvoice.date_created)}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className={`text-xs font-bold uppercase ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                  اقلام فاکتور
                </h4>

                <div className={`border rounded-xl overflow-hidden ${darkMode ? 'border-neutral-800' : 'border-slate-200'}`}>
                  <table className="w-full text-right text-xs">
                    <thead className={`font-semibold border-b ${
                      darkMode ? 'bg-neutral-950/80 text-neutral-400 border-neutral-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      <tr>
                        <th className="py-2.5 px-3">کد / عنوان متغیر</th>
                        <th className="py-2.5 px-3 text-center">تعداد</th>
                        <th className="py-2.5 px-3">قیمت واحد</th>
                        <th className="py-2.5 px-3">جمع کل</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                      {(selectedOrderForInvoice.order_items || []).map((item, idx) => {
                        const details = resolveInventoryDetails(item.item_inventory);
                        return (
                          <tr key={idx} className={darkMode ? 'hover:bg-neutral-800/30' : 'hover:bg-slate-50'}>
                            <td className="py-2.5 px-3 font-medium">
                              {details ? (
                                <span>{details.productName} ({details.colorName} - {details.sizeName})</span>
                              ) : (
                                <span>متغیر کالا ID #{item.item_inventory}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {item.item_quantity}
                            </td>
                            <td className={darkMode ? 'py-2.5 px-3 text-neutral-300' : 'py-2.5 px-3 text-slate-600'}>
                              {formatPrice(item.item_price)} تومان
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-emerald-400">
                              {formatPrice(item.item_total || (item.item_quantity * item.item_price))} تومان
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className={`p-4 rounded-xl flex items-center justify-between border ${
                darkMode ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-sm font-semibold ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                  {t('order_total')}:
                </span>
                <span className="text-xl font-black text-emerald-400">
                  {formatPrice(selectedOrderForInvoice.order_total)} تومان
                </span>
              </div>

            </div>

            {/* Modal Controls */}
            <div className={`p-6 border-t flex items-center justify-between ${
              darkMode ? 'border-neutral-800 bg-neutral-950/50' : 'border-slate-200 bg-slate-50/50'
            }`}>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t('print_invoice')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderForInvoice(null)}
                className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                  darkMode ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                بستن
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- IMPORT / EXPORT ORDERS MODAL --- */}
      {showOrderImportExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative w-full max-w-xl p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button
              onClick={() => setShowOrderImportExportModal(false)}
              className="absolute top-4 left-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                <FolderUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black">
                  {lang === 'fa' ? "ورود و خروجی فاکتورها (Orders Import & Export)" : "Orders Import & Export"}
                </h3>
                <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                  {lang === 'fa' ? "پشتیبان‌گیری از سوابق سفارشات یا ثبت گروهی فاکتورها با فایل JSON و CSV" : "Backup order records or bulk import invoices with JSON / CSV files."}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* EXPORT SECTION */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-xs font-black text-indigo-400 mb-2 flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  <span>{lang === 'fa' ? "۱. خروجی گرفتن از فاکتورها (Export)" : "1. Export Invoices"}</span>
                </h4>
                <p className={`text-[11px] mb-3 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {lang === 'fa' ? `تعداد ${orders.length} فاکتور ثبت‌شده در سیستم موجود است. فرمت خروجی را انتخاب کنید:` : `${orders.length} registered orders available. Select export format:`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportOrdersJSON}
                    disabled={orders.length === 0}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <FileJson className="w-4 h-4" />
                    <span>{lang === 'fa' ? "خروجی کامل JSON" : "Export JSON"}</span>
                  </button>
                  <button
                    onClick={handleExportOrdersCSV}
                    disabled={orders.length === 0}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{lang === 'fa' ? "خروجی CSV (اکسل)" : "Export CSV (Excel)"}</span>
                  </button>
                </div>
              </div>

              {/* IMPORT SECTION */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-xs font-black text-emerald-400 mb-2 flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  <span>{lang === 'fa' ? "۲. ورود گروهی فاکتورها از فایل (Import)" : "2. Bulk Import Orders"}</span>
                </h4>
                <p className={`text-[11px] mb-3 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {lang === 'fa' ? "فایل JSON یا CSV خود شامل لیست سفارشات را آپلود کنید تا به طور خودکار به سیستم افزوده شوند." : "Upload a JSON or CSV file containing orders to bulk insert into database."}
                </p>

                <input
                  type="file"
                  ref={orderImportFileInputRef}
                  accept=".json,.csv"
                  onChange={handleImportOrdersFile}
                  className="hidden"
                />

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => orderImportFileInputRef.current?.click()}
                    disabled={importingOrders}
                    className={`w-full py-3 px-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      darkMode 
                        ? 'border-neutral-700 hover:border-emerald-500 bg-neutral-900/80 text-neutral-200 hover:text-emerald-400' 
                        : 'border-slate-300 hover:border-emerald-600 bg-white text-slate-700 hover:text-emerald-600'
                    }`}
                  >
                    {importingOrders ? (
                      <>
                        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                        <span className="text-xs font-bold">{lang === 'fa' ? "در حال ثبت سفارشات..." : "Importing orders..."}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-extrabold">{lang === 'fa' ? "انتخاب و آپلود فایل JSON / CSV" : "Choose JSON or CSV File"}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/40 text-[11px]">
                    <span className={darkMode ? 'text-neutral-400' : 'text-slate-500'}>
                      {lang === 'fa' ? "نمونه فایل ساختار یافته فاکتورها:" : "Sample order templates:"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadSampleOrdersTemplate('json')}
                        className="text-indigo-400 hover:underline font-bold cursor-pointer"
                      >
                        {lang === 'fa' ? "نمونه JSON" : "Sample JSON"}
                      </button>
                      <span className="text-neutral-600">•</span>
                      <button
                        onClick={() => handleDownloadSampleOrdersTemplate('csv')}
                        className="text-emerald-400 hover:underline font-bold cursor-pointer"
                      >
                        {lang === 'fa' ? "نمونه CSV" : "Sample CSV"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowOrderImportExportModal(false)}
                className={`px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
              >
                {lang === 'fa' ? "بستن" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrdersManager;
