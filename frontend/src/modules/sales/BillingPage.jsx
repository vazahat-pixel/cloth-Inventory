import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import PaymentIcon from '@mui/icons-material/Payment';
import { addSale, fetchSales } from './salesSlice';
import { fetchStockOverview } from '../inventory/inventorySlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchPricingRules, fetchSchemes, fetchCoupons, evaluateOffers } from '../pricing/pricingSlice';
import { fetchItems } from '../items/itemsSlice';
import { fetchLoyaltyConfig, fetchCreditNotes } from '../customers/customersSlice';
import api from '../../services/api';
import PaymentDialog from './PaymentDialog';
import LoyaltyRedeemDialog from './LoyaltyRedeemDialog';
import ExchangeInvoicePrint from './ExchangeInvoicePrint';
import StandardInvoicePrint from './StandardInvoicePrint';
import ExchangeDialog from './ExchangeDialog';
import { sendWhatsAppInvoice } from '../../utils/whatsapp';
import { useNotification } from '../../context/NotificationProvider';
import { useLoading } from '../../context/LoadingProvider';


const DEFAULT_WALK_IN_NAME = 'Walk-in Customer';
const EMPTY_ARR = [];

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const calculateLine = (line, promoDiscount = 0) => {
  const gross = toNumber(line.quantity) * toNumber(line.rate);
  const manualDisc = (gross * toNumber(line.discount)) / 100;
  const taxableAmount = Math.max(0, gross - manualDisc - toNumber(promoDiscount));
  
  // Default tax rate is 5%
  const taxRate = toNumber(line.tax || 5);
  const taxAmount = (taxableAmount * taxRate) / 100;

  return {
    gross,
    discount: manualDisc + toNumber(promoDiscount),
    taxAmount,
    amount: taxableAmount + taxAmount,
  };
};

const calculateTotals = (lines, billDiscount, loyaltyRedeemed, couponDiscount = 0, schemeDiscount = 0, creditNoteAmount = 0, saleType = 'retail', promoItems = []) => {
  const totals = lines.reduce((acc, l) => {
    // Find promo discount for this specific line
    const promo = promoItems?.find(pi => pi.variantId === l.productId);
    const lineRes = calculateLine(l, promo?.promoDiscount || 0);

    acc.gross += lineRes.gross;
    acc.lineDiscount += lineRes.discount;
    acc.taxAmount += lineRes.taxAmount;
    acc.totalQuantity += toNumber(l.quantity);
    return acc;
  }, { gross: 0, lineDiscount: 0, taxAmount: 0, totalQuantity: 0 });

  const totalPromo = promoItems?.reduce((acc, pi) => acc + (pi.promoDiscount || 0), 0) || 0;
  const net = totals.gross - totals.lineDiscount - toNumber(billDiscount) - toNumber(couponDiscount) - toNumber(schemeDiscount) + totals.taxAmount - toNumber(loyaltyRedeemed) - toNumber(creditNoteAmount);

  return {
    ...totals,
    totalItems: lines.length,
    grossAmount: totals.gross,
    billDiscount: toNumber(billDiscount),
    couponDiscount,
    schemeDiscount,
    loyaltyRedeemed,
    creditNoteAmount,
    promoDiscount: totalPromo,
    netPayable: saleType === 'exchange' ? net : (net > 0 ? net : 0),
  };
};

function BillingPage({
  listPath = '/sales',
  pageTitle = 'POS Billing',
  pageDescription = 'Fast, store-level checkout for walk-in and repeat customers.',
  listLabel = 'Back to Sales List',
  backButtonLabel = 'Back to Sales',
  returnPathBuilder = (saleId) => `/sales/${saleId}/return`,
}) {
  const { id } = useParams();
  const isDetailMode = Boolean(id);

  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const sales = useSelector((state) => state.sales.records || EMPTY_ARR);
  const customers = useSelector((state) => state.masters.customers || EMPTY_ARR);
  const salesmen = useSelector((state) => state.masters.salesmen || EMPTY_ARR);
  const warehouses = useSelector((state) => state.masters.warehouses || EMPTY_ARR);
  const stockRows = useSelector((state) => state.inventory.stock || EMPTY_ARR);
  const items = useSelector((state) => state.items.records || EMPTY_ARR);
  const schemes = useSelector((state) => state.pricing.schemes || EMPTY_ARR);
  const coupons = useSelector((state) => state.pricing.coupons || EMPTY_ARR);
  const priceLists = useSelector((state) => state.pricing.priceLists || EMPTY_ARR);
  const loyaltyConfig = useSelector((state) => state.customerRewards?.loyaltyConfig) ?? {};
  const vouchers = useSelector((state) => state.customerRewards?.vouchers) ?? EMPTY_ARR;
  const purchaseConfig = useSelector((state) => state.settings.purchaseVoucherConfig) ?? {};
  const deliveryOrders = useSelector((state) => state.orders?.deliveryOrders) ?? EMPTY_ARR;
  const creditNotes = useSelector((state) => state.customerRewards?.creditNotes) ?? EMPTY_ARR;
  const user = useSelector((state) => state.auth.user);
  const stores = useSelector((state) => state.masters.stores || EMPTY_ARR);
  const { eligibleOffers, evaluateLoading, totalPromoDiscount, promoItems } = useSelector((state) => state.pricing);

  const isStoreStaff = user?.role !== 'Admin';

  const availableLocations = useMemo(() => {
    const combined = [...warehouses, ...stores];
    if (isStoreStaff && user?.shopId) {
      return combined.filter(l => l.id === user.shopId);
    }
    return combined;
  }, [warehouses, stores, isStoreStaff, user?.shopId]);

  const existingSale = useMemo(
    () => (isDetailMode ? sales.find((entry) => entry.id === id) : null),
    [id, isDetailMode, sales],
  );

  const [billDate, setBillDate] = useState(getTodayDate());
  const [storeId, setStoreId] = useState(user?.shopId || warehouses[0]?.id || stores[0]?.id || '');
  const [salesmanId, setSalesmanId] = useState('');
  const [mobileInput, setMobileInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [billDiscount, setBillDiscount] = useState('');
  const [loyaltyRedeemed, setLoyaltyRedeemed] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);

  const [activeTab, setActiveTab] = useState(0);
  const [lines, setLines] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [loyaltyRedeemOpen, setLoyaltyRedeemOpen] = useState(false);
  const [billingMode, setBillingMode] = useState('manual');
  const [deliveryOrderId, setDeliveryOrderId] = useState('');
  const [creditNoteId, setCreditNoteId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [saleType, setSaleType] = useState('retail');
  const [completedSaleData, setCompletedSaleData] = useState(null);
  const autoPrintTriggeredRef = useRef(false);
  const { showNotification } = useNotification();
  const { showLoading, hideLoading } = useLoading();
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeItems, setExchangeItems] = useState([]);
  const [originalSaleId, setOriginalSaleId] = useState(null);
  const [originalSaleNumber, setOriginalSaleNumber] = useState('');

  const pendingDOsForCustomer = useMemo(() => {
    if (!customerId || billingMode !== 'fromDO') return [];
    return deliveryOrders.filter(
      (do_) =>
        do_.customerId === customerId &&
        String(do_.status || '').toLowerCase() === 'pending',
    );
  }, [customerId, billingMode, deliveryOrders]);

  useEffect(() => {
    dispatch(fetchMasters('customers'));
    dispatch(fetchMasters('salesmen'));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('stores'));
    dispatch(fetchItems());
    dispatch(fetchStockOverview());
    dispatch(fetchPricingRules());
    dispatch(fetchSchemes());
    dispatch(fetchCoupons());
    dispatch(fetchSales());
  }, [dispatch]);

  // Synchronized Total Calculations (Moved up to prevent TDZ error)
  const customerMap = useMemo(
    () =>
      customers.reduce((accumulator, customer) => {
        accumulator[customer.id] = customer;
        return accumulator;
      }, {}),
    [customers],
  );

  const selectedCustomer = customerId ? customerMap[customerId] : null;
  const availableLoyalty = toNumber(selectedCustomer?.loyaltyPoints);

  const availableCreditNotes = useMemo(() => {
    if (!customerId) return EMPTY_ARR;
    return (creditNotes || []).filter(
      (n) =>
        n.customerId === customerId &&
        String(n.status || '').toLowerCase() === 'available',
    );
  }, [customerId, creditNotes]);

  const selectedCreditNote = useMemo(
    () => creditNotes.find((n) => n.id === creditNoteId),
    [creditNotes, creditNoteId],
  );
  const creditNoteAmount = toNumber(selectedCreditNote?.amount);

  const calculatedGross = lines.reduce((acc, l) => acc + (toNumber(l.quantity) * toNumber(l.rate)), 0);

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'PERCENTAGE') {
      return (calculatedGross * toNumber(appliedCoupon.value)) / 100;
    }
    return toNumber(appliedCoupon.value);
  }, [appliedCoupon, calculatedGross]);

  const schemeDiscountAmount = useMemo(() => {
    if (!selectedScheme) return 0;
    return toNumber(selectedScheme.discount);
  }, [selectedScheme]);

  const returnTotalCredit = useMemo(() => {
    return exchangeItems.reduce((acc, i) => {
        const itemTotal = (toNumber(i.rate) * toNumber(i.quantity));
        const itemTax = (toNumber(i.taxAmount) || 0); // use existing tax for accurate return
        return acc + itemTotal + itemTax;
    }, 0);
  }, [exchangeItems]);

  const totals = useMemo(
    () => {
      const basic = calculateTotals(
        lines,
        billDiscount,
        loyaltyRedeemed,
        couponDiscountAmount,
        schemeDiscountAmount,
        creditNoteAmount,
        saleType,
        promoItems
      );
      return {
        ...basic,
        returnTotalCredit,
        netPayable: Math.max(0, basic.netPayable - returnTotalCredit),
      };
    },
    [billDiscount, lines, loyaltyRedeemed, couponDiscountAmount, schemeDiscountAmount, creditNoteAmount, saleType, returnTotalCredit, promoItems],
  );

  // Real-time Offer Evaluation
  useEffect(() => {
    if (lines.length > 0) {
      const evaluationPayload = {
        items: lines.map(l => ({
          productId: l.productId,
          quantity: l.quantity,
          price: l.rate,
          brand: l.brand,
          category: l.category
        })),
        totalAmount: calculatedGross,
        storeId
      };
      dispatch(evaluateOffers(evaluationPayload));
    }
  }, [lines, calculatedGross, storeId, customerId, dispatch]);

  // Sync storeId when warehouses/stores load or user changes
  useEffect(() => {
    if (!storeId) {
      const defaultId = user?.shopId || warehouses[0]?.id || stores[0]?.id;
      if (defaultId) setStoreId(defaultId);
    }
  }, [storeId, user, warehouses, stores]);

  const loadLinesFromDO = (doId) => {
    const do_ = deliveryOrders.find((d) => d.id === doId);
    if (!do_?.items?.length) return;
    const loaded = do_.items.map((item, idx) => ({
      id: `${item.variantId}-${idx}-${Date.now()}`,
      variantId: item.variantId,
      itemName: item.itemName,
      styleCode: item.styleCode,
      size: item.size,
      color: item.color,
      sku: item.sku,
      quantity: toNumber(item.quantity),
      rate: toNumber(item.rate),
      discount: toNumber(item.discount),
      tax: toNumber(item.tax),
      available: toNumber(item.quantity),
    }));
    setLines(loaded);
    setSelectedOption(null);
    setBarcodeInput('');
  };

  const activeCustomers = useMemo(
    () => customers.filter((customer) => String(customer.status).toLowerCase() === 'active'),
    [customers],
  );
  const activeSalesmen = useMemo(() => {
    const raw = salesmen || [];
    // 1. Basic Status Filter
    const active = raw.filter((entry) => 
        entry.isActive !== false && (
            !entry.status || 
            ['active', 'on duty'].includes(String(entry.status).toLowerCase())
        )
    );
    
    // 2. Store-Specific Filter (Privacy)
    // If you're a store staff, you should ONLY see salesmen assigned to your store.
    if (isStoreStaff && storeId) {
        return active.filter(s => String(s.shopId || s.storeId || '') === String(storeId));
    }
    
    return active;
  }, [salesmen, isStoreStaff, storeId]);



  const variantSellingPriceMap = useMemo(() => {
    const map = {};
    (items || []).forEach((item) => {
      map[item.id] = {
        rate: toNumber(item.salePrice || 0),
        itemName: item.name,
        styleCode: item.sku || '',
        barcode: item.barcode || '', // ADDED
        itemId: item.id,
        brand: item.brand,
        category: item.category,
      };
    });
    return map;
  }, [items]);

  const itemGroups = useSelector((state) => state.masters.itemGroups) || EMPTY_ARR;
  const brands = useSelector((state) => state.masters.brands) || EMPTY_ARR;

  const warehouseStock = useMemo(
    () => stockRows.filter((row) => row.storeId === storeId || row.warehouseId === storeId),
    [stockRows, storeId],
  );

  const variantOptions = useMemo(() => {
    console.log('DEBUG: warehouseStock data', warehouseStock);
    const options = warehouseStock
      .map((stock) => {
        const available = toNumber(stock.availableStock ?? stock.quantity);
        // CRITICAL FIX: The discount and rate should come from the populated productId object
        // since stock.productId is now the populated Variant object from our manual population.
        const rate = toNumber(stock.salePrice || (stock.productId && typeof stock.productId === 'object' ? stock.productId.salePrice : 0));
        
        const option = {
          productId: stock.productId?._id || stock.productId || stock.variantId,
          variantId: stock.productId?._id || stock.productId || stock.variantId,
          itemName: stock.itemName || stock.name || (stock.productId && typeof stock.productId === 'object' ? stock.productId.name : 'Unknown Item'),
          styleCode: stock.itemCode || stock.sku || (stock.productId && typeof stock.productId === 'object' ? stock.productId.sku : ''),
          size: stock.size || (stock.productId && typeof stock.productId === 'object' ? stock.productId.size : ''),
          color: stock.color || (stock.productId && typeof stock.productId === 'object' ? stock.productId.color : ''),
          sku: stock.itemCode || stock.sku || (stock.productId && typeof stock.productId === 'object' ? stock.productId.sku : ''),
          barcode: stock.barcode || (stock.productId && typeof stock.productId === 'object' ? stock.productId.barcode : ''),
          available: available > 0 ? available : 0,
          rate: toNumber(stock.salePrice || (stock.productId && typeof stock.productId === 'object' ? stock.productId.salePrice : 0)),
          mrp: toNumber(stock.mrp || (stock.productId && typeof stock.productId === 'object' ? stock.productId.mrp : 0)),
          tax: 0,
          category: stock.productId?.categoryId || stock.category,
          brand: stock.productId?.brand || stock.brand,
        };
        return option;
      })
      .filter((option) => option.available > 0);
    
    console.log('DEBUG: variantOptions generated', options);
    return options;
  }, [variantSellingPriceMap, warehouseStock]);

  const handleMobileChange = (value) => {
    setMobileInput(value);
    if (!isDetailMode && value?.trim() && value.length >= 10) {
      const matched = activeCustomers.find((customer) => customer.mobileNumber === value.trim());
      if (matched) {
        setCustomerId(matched.id);
        setCustomerName(matched.customerName || '');
        setCustomerAddress(matched.address || '');
        setLoyaltyRedeemed('');
      } else {
        setCustomerId('');
        setCustomerName('');
        setCustomerAddress('');
      }
    }
  };


  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Enter coupon code.');
      return;
    }
    const coupon = coupons.find((c) => c.code.toUpperCase() === code);
    if (!coupon) {
      setCouponError('Invalid coupon code.');
      return;
    }
    if (String(coupon.status).toLowerCase() !== 'active') {
      setCouponError('Coupon is expired or inactive.');
      return;
    }
    if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
      setCouponError('Coupon has expired.');
      return;
    }
    const usageLimit = toNumber(coupon.usageLimit, Infinity);
    if (usageLimit !== Infinity && toNumber(coupon.usageCount) >= usageLimit) {
      setCouponError('Coupon usage limit reached.');
      return;
    }
    setAppliedCoupon(coupon);
    setCouponError('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const upsertLine = (option) => {
    setLines((previous) => {
      const existing = previous.find((line) => line.productId === option.productId);
      if (existing) {
        return previous.map((line) => {
          if (line.productId !== option.productId) {
            return line;
          }

          const nextQty = Math.min(toNumber(line.quantity) + 1, toNumber(line.available));
          return { ...line, quantity: nextQty };
        });
      }

      return [
        ...previous,
        {
          id: `${option.productId}-${Date.now()}`,
          productId: option.productId,
          variantId: option.productId, // Fallback
          itemName: option.itemName,
          styleCode: option.styleCode,
          size: option.size,
          color: option.color,
          sku: option.sku,
          barcode: option.barcode || '',
          quantity: 1,
          rate: option.rate,
          discount: 0,
          tax: option.tax || 0,
          mrp: option.mrp,
          available: option.available,
          category: option.category,
          brand: option.brand,
        },
      ];
    });
  };

  const handleAddSelected = () => {
    if (!selectedOption) {
      return;
    }

    if (toNumber(selectedOption.available) <= 0) {
      setErrorMessage(`${selectedOption.itemName} (${selectedOption.size}/${selectedOption.color}) is Out of Stock.`);
      return;
    }

    upsertLine(selectedOption);
    setSelectedOption(null);
    setErrorMessage('');
  };

  const handleBarcodeAdd = async (scannedValue) => {
    const rawCode = typeof scannedValue === 'string' ? scannedValue : barcodeInput;
    const scannedCode = (rawCode || '').trim();
    if (!scannedCode) return;

    try {
      setErrorMessage('');
      // Use the dedicated Sales barcode endpoint that checks store specific stock
      const response = await api.get(`/sales/barcode/${scannedCode}?storeId=${storeId}`);
      const product = response.data.product || response.data.data;
      
      if (!product) {
        setErrorMessage('Product not found for this barcode in this store.');
        return;
      }

      // Check real-time stock from our inventory list (or handle lack of it)
      const stock = warehouseStock.find(s => (s.productId === product._id || s.barcode === product.barcode));
      const available = product.available || 0;

      upsertLine({
        productId: product._id,
        variantId: product._id,
        itemName: product.name || 'Unknown Item',
        styleCode: product.sku || '',
        size: product.size || '',
        color: product.color || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        available: available,
        rate: toNumber(product.salePrice || product.price),
        mrp: toNumber(product.mrp || product.salePrice),
        tax: 0, 
        category: product.category,
        brand: product.brand
      });
      setBarcodeInput('');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error fetching product by barcode');
    }
  };

  const updateLineField = (lineId, field, value) => {
    setLines((previous) =>
      previous.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        if (field === 'quantity') {
          const qty = toNumber(value);
          const limit = saleType === 'exchange' ? -999 : 1;
          const newQty = Math.max(limit, qty);
          return {
            ...line,
            quantity: newQty > 0 ? Math.min(newQty, toNumber(line.available)) : newQty,
          };
        }

        if (field === 'discount') {
          const discount = Math.max(0, Math.min(toNumber(value), 100));
          return { ...line, discount };
        }

        if (field === 'rate') {
          const rate = Math.max(0, toNumber(value));
          return { ...line, rate };
        }

        return line;
      }),
    );
  };

  const removeLine = (lineId) => {
    setLines((previous) => previous.filter((line) => line.id !== lineId));
  };

  const handleProceedPayment = () => {
    setErrorMessage('');

    if (!storeId) {
      setErrorMessage('Select store before billing.');
      return;
    }

    if (!lines.length) {
      setErrorMessage('Add at least one item to continue.');
      return;
    }

    const invalidQty = lines.find(
      (line) => toNumber(line.quantity) <= 0 || toNumber(line.quantity) > toNumber(line.available),
    );
    if (invalidQty) {
      setErrorMessage(`Quantity exceeds stock for ${invalidQty.sku}.`);
      return;
    }

    // Prevent proceeding when nothing is actually payable
    const effectiveNet =
      saleType === 'exchange'
        ? totals.netPayable - creditNoteAmount
        : Math.max(0, totals.netPayable - creditNoteAmount);

    if (effectiveNet <= 0) {
      setErrorMessage('Net payable must be greater than 0 to proceed.');
      return;
    }

    if (toNumber(loyaltyRedeemed) > availableLoyalty) {
      setErrorMessage('Loyalty redeemed cannot exceed available customer points.');
      return;
    }

    setPaymentOpen(true);
  };

  const handlePaymentConfirm = (payment) => {
    // 1. Align with backend products array: [{ productId, quantity, price, total }]
    const preparedProducts = lines.map((line) => {
      const promo = promoItems?.find(pi => pi.variantId === line.productId);
      const calcs = calculateLine(line, promo?.promoDiscount || 0);
      return {
        productId: line.productId || line.variantId,
        barcode: line.barcode || line.sku || '',
        quantity: toNumber(line.quantity),
        price: toNumber(line.rate),
        discount: toNumber(line.discount),
        promoDiscount: promo?.promoDiscount || 0,
        taxPercentage: toNumber(line.taxRate || 5),
        taxAmount: calcs.taxAmount,
        total: calcs.amount,
      };
    });

    // 2. Build backend-compliant payload
    const payload = {
      storeId,
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || selectedCustomer?.customerName || customerName,
      customerMobile: selectedCustomer?.mobileNumber || mobileInput,
      customerAddress: selectedCustomer?.address || customerAddress,
      products: preparedProducts,
      subTotal: totals.grossAmount,
      discount: toNumber(billDiscount) + toNumber(couponDiscountAmount) + toNumber(schemeDiscountAmount) + toNumber(totalPromoDiscount),
      tax: totals.taxAmount,
      grandTotal: totals.netPayable,
      amountPaid: payment.amountPaid,
      dueAmount: payment.dueAmount,
      paymentMode: payment.method || 'CASH',
      redeemPoints: Math.max(0, toNumber(loyaltyRedeemed)),
      creditNoteId: creditNoteId || null,
      schemeId: selectedScheme?._id || null,
      schemeDiscount: schemeDiscountAmount,
      type: (saleType || 'retail').toUpperCase(),
      exchangeDetails: exchangeItems.length > 0 ? {
          originalSaleId,
          items: exchangeItems.map(i => ({
              barcode: i.barcode,
              quantity: i.quantity,
              rate: i.rate
          }))
      } : null,
    };

    showLoading('Finalizing transaction and generating invoice...');
    dispatch(addSale(payload))
      .unwrap()
      .then((res) => {
        setCompletedSaleData(res);
        setShowPrint(true);
        showNotification('Sale completed successfully!', 'success');
      })
      .catch((err) => {
        setErrorMessage(err || 'Failed to save sale');
        showNotification(err || 'Failed to save sale', 'error');
      })
      .finally(() => {
        hideLoading();
      });

    setPaymentOpen(false);
  };

  if (isDetailMode) {
    if (!existingSale) {
      return (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
            Sales invoice not found
          </Typography>
          <Button variant="contained" onClick={() => navigate(listPath)}>
            {listLabel}
          </Button>
        </Paper>
      );
    }

    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 2 }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              Invoice {existingSale.saleNumber || existingSale.invoiceNumber}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Read-only invoice view
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(listPath)}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<KeyboardReturnOutlinedIcon />}
              onClick={() => navigate(returnPathBuilder(existingSale.id))}
            >
              Create Return
            </Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <InfoCell label="Date" value={existingSale.date} />
          <InfoCell label="Customer" value={existingSale.customerName || DEFAULT_WALK_IN_NAME} />
          <InfoCell label="Mobile" value={existingSale.customerMobile || '-'} />
          <InfoCell label="Payment" value={existingSale.payment?.status || 'Pending'} />
        </Stack>

        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Qty
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Rate
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Discount %
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Amount
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(existingSale.items || []).map((item, index) => (
                <TableRow key={`${item.variantId}-${index}`}>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell>{`${item.size}/${item.color}`}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{Number(item.rate).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(item.discount).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(item.amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
          <SummaryCard label="Gross" value={existingSale.totals?.grossAmount ?? 0} />
          <SummaryCard
            label="Discount"
            value={(existingSale.totals?.lineDiscount ?? 0) + (existingSale.totals?.billDiscount ?? 0)}
          />
          <SummaryCard label="Tax" value={existingSale.totals?.taxAmount ?? 0} />
          <SummaryCard label="Net" value={existingSale.totals?.netPayable ?? 0} strong />
        </Stack>
      </Paper>
    );
  }

  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
            {pageTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            {pageDescription}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(listPath)}
          sx={{ borderRadius: 999 }}
        >
          {backButtonLabel}
        </Button>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #E5E7EB',
              borderRadius: 2.5,
              p: 3,
              mb: 2.5,
              background: '#FFFFFF',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              Customer & Bill Info
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button
                variant={billingMode === 'manual' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  setBillingMode('manual');
                  setDeliveryOrderId('');
                  setLines([]);
                }}
              >
                Manual Entry
              </Button>
              <Button
                variant={billingMode === 'fromDO' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  setBillingMode('fromDO');
                  setLines([]);
                  setDeliveryOrderId('');
                }}
              >
                From Delivery Order
              </Button>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Bill Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={billDate}
                  onChange={(event) => setBillDate(event.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Sale Type"
                  value={saleType}
                  onChange={(event) => {
                    setSaleType(event.target.value);
                  }}
                >
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="exchange">Exchange</MenuItem>
                </TextField>
              </Grid>
              {!isStoreStaff && (
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Store"
                    value={storeId}
                    onChange={(event) => {
                      setStoreId(event.target.value);
                      setLines([]);
                      setSelectedOption(null);
                      setBarcodeInput('');
                    }}
                  >
                    {warehouses.map((w) => (
                      <MenuItem key={w.id} value={w.id}>
                        {w.name} (W)
                      </MenuItem>
                    ))}
                    {stores.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name} (S)
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Assign Salesman"
                  value={salesmanId}
                  onChange={(event) => setSalesmanId(event.target.value)}
                >
                  <MenuItem value="">Not Assigned</MenuItem>
                  {activeSalesmen.map((salesman) => (
                    <MenuItem key={salesman._id || salesman.id} value={salesman._id || salesman.id}>
                      {salesman.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Mobile Number"
                  value={mobileInput}
                  autoComplete="off"
                  onChange={(event) => handleMobileChange(event.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                   fullWidth
                   size="small"
                   label="Customer Full Name (Walk-in)"
                   value={customerName}
                   autoComplete="off"
                   onChange={(e) => setCustomerName(e.target.value)}
                   disabled={Boolean(customerId)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                   fullWidth
                   size="small"
                   label="Customer Address"
                   value={customerAddress}
                   autoComplete="off"
                   onChange={(e) => setCustomerAddress(e.target.value)}
                   disabled={Boolean(customerId)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Select Registered Customer"
                  value={customerId}
                  onChange={(event) => {
                    const selectedId = event.target.value;
                    setCustomerId(selectedId);
                    const selected = customerMap[selectedId];
                    if (selected) {
                        setMobileInput(selected.mobileNumber || '');
                        setCustomerName(selected.customerName || '');
                        setCustomerAddress(selected.address || '');
                    } else {
                        setMobileInput('');
                        setCustomerName('');
                        setCustomerAddress('');
                    }
                    setLoyaltyRedeemed('');
                    setCreditNoteId('');
                    if (billingMode === 'fromDO') {
                      setDeliveryOrderId('');
                      setLines([]);
                    }
                  }}
                >
                  <MenuItem value="">-- No Record Found / Manual Entry --</MenuItem>
                  {activeCustomers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {`${customer.customerName} (${customer.mobileNumber})`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setCustomerId('');
                    setMobileInput('');
                    setCustomerName('');
                    setCustomerAddress('');
                    setLoyaltyRedeemed('');
                    setCreditNoteId('');
                  }}
                  sx={{ height: 32, textTransform: 'none', px: 3, borderRadius: 2 }}
                >
                  Clear Fields / Reset to Walk-in
                </Button>
              </Grid>
              {billingMode === 'fromDO' && customerId && (
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Delivery Order"
                    value={deliveryOrderId}
                    onChange={(e) => {
                      const doId = e.target.value;
                      const do_ = deliveryOrders.find((d) => d.id === doId);
                      if (do_?.storeId || do_?.warehouseId) setStoreId(do_.storeId || do_.warehouseId);
                      setDeliveryOrderId(doId);
                      loadLinesFromDO(doId);
                    }}
                    sx={{ maxWidth: 400 }}
                  >
                    <MenuItem value="">Select delivery order</MenuItem>
                    {pendingDOsForCustomer.map((do_) => (
                      <MenuItem key={do_.id} value={do_.id}>
                        {do_.doNumber} - {do_.date} - ₹{Number(do_.totals?.netAmount ?? 0).toFixed(2)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
            </Grid>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ mt: 2, alignItems: { sm: 'center' } }}
            >
              <InfoCell label="Customer" value={selectedCustomer?.customerName || DEFAULT_WALK_IN_NAME} />
              <InfoCell label="Loyalty Points" value={availableLoyalty} />
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              border: '1px solid #E5E7EB',
              borderRadius: 2.5,
              p: 3,
              background: '#FFFFFF',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 1.5 }}>
              Item Entry
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
              <Autocomplete
                fullWidth
                size="small"
                options={variantOptions}
                value={selectedOption}
                onChange={(_, value) => setSelectedOption(value)}
                getOptionLabel={(option) =>
                  `${option.itemName} (${option.size}/${option.color}) - SKU: ${option.sku || ''} - BC: ${option.barcode || ''} [Stock: ${option.available}]`
                }
                renderInput={(params) => (
                  <TextField {...params} label="Search item or SKU" placeholder="Type item or sku" />
                )}
              />
              <Button
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAddSelected}
                disabled={!selectedOption}
              >
                Add
              </Button>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Barcode / SKU"
                value={barcodeInput}
                onChange={(event) => setBarcodeInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleBarcodeAdd(event.target.value);
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCodeScannerIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button variant="outlined" onClick={handleBarcodeAdd}>
                Scan Add
              </Button>
              <Button
                variant="outlined"
                color="warning"
                sx={{ minWidth: 160, borderStyle: 'dashed', borderRadius: 2 }}
                startIcon={<KeyboardReturnOutlinedIcon />}
                onClick={() => setExchangeOpen(true)}
              >
                Add Exchange
              </Button>
            </Stack>

            {lines.length ? (
              <TableContainer sx={{ border: '1px solid #E5E7EB', borderRadius: 2, maxHeight: 420 }}>
                <Table size="medium" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Qty
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Rate
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Discount %
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Amount
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remove</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line) => {
                        const promo = promoItems?.find(pi => pi.variantId === line.productId);
                        const lineRes = calculateLine(line, promo?.promoDiscount || 0);

                        return (
                          <TableRow key={line.id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {line.itemName}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="textSecondary">
                                  {line.sku} | {line.size}/{line.color}
                                </Typography>
                                {promo?.promoDiscount > 0 && (
                                  <Chip 
                                    label="OFFER APPLIED" 
                                    size="small" 
                                    color="success" 
                                    sx={{ height: 16, fontSize: '0.65rem', fontWeight: 800 }} 
                                  />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Box>
                                <Typography variant="body2">₹{toNumber(line.rate).toFixed(2)}</Typography>
                                {promo?.promoDiscount > 0 && (
                                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                                    Promo: -₹{(promo.promoDiscount / line.quantity).toFixed(2)}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                size="small"
                                value={line.quantity}
                                onChange={(event) => updateLineField(line.id, 'quantity', event.target.value)}
                                sx={{ width: 70 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                size="small"
                                value={line.discount}
                                onChange={(event) => updateLineField(line.id, 'discount', event.target.value)}
                                sx={{ width: 90 }}
                                disabled={isStoreStaff}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {lineRes.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <IconButton color="error" size="small" onClick={() => removeLine(line.id)}>
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No items in bill yet. Add via search or barcode.
                </Typography>
              </Box>
            )}
          </Paper>

          {exchangeItems.length > 0 && (
            <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2.5, p: 3, background: '#FFFFFF', mt: 2 }}>
              <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                  Returned Items (Exchange Credit)
                </Typography>
                <IconButton color="error" size="small" onClick={() => { setExchangeItems([]); setOriginalSaleId(null); setOriginalSaleNumber(''); }}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
              <TableContainer sx={{ border: '1px solid #FED7AA', borderRadius: 2, bgcolor: '#FFFBEB' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Credit Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exchangeItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.itemName || item.name}</Typography>
                          <Typography variant="caption" color="textSecondary">{item.barcode} | Ref: {originalSaleNumber}</Typography>
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#10B981' }}>
                          ₹{((toNumber(item.rate) * toNumber(item.quantity)) + (toNumber(item.taxAmount) || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              p: 2.5,
              position: { lg: 'sticky' },
              top: { lg: 16 },
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
              Bill Summary
            </Typography>

            <Stack spacing={1.2}>
              <SummaryRow label="Total Items" value={totals.totalItems} />
              <SummaryRow label="Total Quantity" value={totals.totalQuantity} />
              <SummaryRow label="Gross Amount" value={totals.grossAmount.toFixed(2)} />
              {totals.promoDiscount > 0 && (
                <SummaryRow label="Promotion Offer" value={`-${totals.promoDiscount.toFixed(2)}`} color="#10b981" />
              )}
              <SummaryRow label="Line Discount" value={totals.lineDiscount.toFixed(2)} />
              <SummaryRow label="Tax Amount" value={totals.taxAmount.toFixed(2)} />
              {totals.returnTotalCredit > 0 && (
                <SummaryRow label="Exchange Credit" value={`-${totals.returnTotalCredit.toFixed(2)}`} color="#10b981" />
              )}

              <TextField
                fullWidth
                size="small"
                label="Bill Discount"
                type="number"
                value={billDiscount}
                onChange={(event) => setBillDiscount(event.target.value)}
                disabled={isStoreStaff}
              />

              {totals.schemeDiscount > 0 && (
                <SummaryRow label="Scheme Discount" value={totals.schemeDiscount.toFixed(2)} />
              )}

              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  fullWidth
                  size="small"
                  label="Coupon Code"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  error={Boolean(couponError)}
                  helperText={couponError || (appliedCoupon ? `Applied: ${appliedCoupon.code} (-₹${couponDiscountAmount.toFixed(2)})` : '')}
                />
                {appliedCoupon ? (
                  <Button size="small" color="error" onClick={handleRemoveCoupon} sx={{ mt: 0.5 }}>
                    Remove
                  </Button>
                ) : (
                  <Button size="small" variant="outlined" onClick={handleApplyCoupon} sx={{ mt: 0.5 }}>
                    Apply
                  </Button>
                )}
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  label="Loyalty Redeemed"
                  type="number"
                  value={loyaltyRedeemed}
                  onChange={(event) => setLoyaltyRedeemed(event.target.value)}
                  helperText={selectedCustomer ? `Available: ${availableLoyalty}` : 'Select customer to redeem points'}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setLoyaltyRedeemOpen(true)}
                  disabled={!selectedCustomer || availableLoyalty < 1}
                  sx={{ mt: 0.5, whiteSpace: 'nowrap' }}
                >
                  Redeem
                </Button>
              </Stack>

              {selectedCustomer && availableCreditNotes.length > 0 && (
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <TextField
                    size="small"
                    select
                    fullWidth
                    label="Apply Credit Note"
                    value={creditNoteId}
                    onChange={(e) => setCreditNoteId(e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {availableCreditNotes.map((cn) => (
                      <MenuItem key={cn.id} value={cn.id}>
                        ₹{toNumber(cn.amount).toFixed(2)} - {cn.reason || 'Credit'}
                      </MenuItem>
                    ))}
                  </TextField>
                  {creditNoteAmount > 0 && (
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Credit applied: ₹{creditNoteAmount.toFixed(2)}
                    </Typography>
                  )}
                </Stack>
              )}

              <Divider />

              {/* ELIGIBLE OFFERS SECTION */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
                  Eligible Offers {evaluateLoading && ' (Evaluating...)'}
                </Typography>
                {eligibleOffers.length > 0 ? (
                  <Stack spacing={1}>
                    {eligibleOffers.map((offer) => (
                      <Paper
                        key={offer._id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          borderColor: selectedScheme?._id === offer._id ? '#10b981' : '#e2e8f0',
                          backgroundColor: selectedScheme?._id === offer._id ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: '#10b981', transform: 'translateY(-1px)' }
                        }}
                        onClick={() => setSelectedScheme(selectedScheme?._id === offer._id ? null : offer)}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                              {offer.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {offer.description || offer.type}
                            </Typography>
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#10b981' }}>
                            -₹{Number(offer.discount).toFixed(2)}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    No offers applicable for this cart yet.
                  </Typography>
                )}
              </Box>

              <Divider />

              <SummaryRow
                label="Net Payable"
                value={(saleType === 'exchange' ? totals.netPayable - creditNoteAmount : Math.max(0, totals.netPayable - creditNoteAmount)).toFixed(2)}
                strong
              />
            </Stack>

            {errorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PaymentIcon />}
              sx={{ mt: 2 }}
              onClick={handleProceedPayment}
            >
              Proceed to Payment
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        netAmount={saleType === 'exchange' ? totals.netPayable - creditNoteAmount : Math.max(0, totals.netPayable - creditNoteAmount)}
        onConfirm={handlePaymentConfirm}
        vouchers={vouchers}
      />

      <LoyaltyRedeemDialog
        open={loyaltyRedeemOpen}
        onClose={() => setLoyaltyRedeemOpen(false)}
        customer={selectedCustomer}
        loyaltyConfig={loyaltyConfig}
        onRedeem={(pts) => setLoyaltyRedeemed(String(pts))}
      />

      <Dialog open={showPrint} onClose={() => navigate(listPath)} maxWidth="md" fullWidth>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Sale Completed Successfully!</Typography>
          {completedSaleData?.saleType === 'exchange' ? (
            <ExchangeInvoicePrint sale={completedSaleData} />
          ) : (
            <StandardInvoicePrint sale={completedSaleData} />
          )}
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => navigate(listPath)}>Close</Button>
            <Button 
                variant="contained" 
                color="success" 
                onClick={() => sendWhatsAppInvoice({
                    customerPhone: completedSaleData?.customerMobile,
                    customerName: completedSaleData?.customerName,
                    amount: completedSaleData?.grandTotal,
                    orderId: completedSaleData?.saleNumber || completedSaleData?.invoiceNumber || completedSaleData?.id,
                    shopName: 'VAZAHAT'
                })}
            >
                WhatsApp Invoice
            </Button>
            <Button variant="contained" onClick={() => window.print()}>Print Now</Button>
          </Stack>
        </Box>
      </Dialog>
      <ExchangeDialog
        open={exchangeOpen}
        loyaltyConfig={loyaltyConfig}
      />

      <Dialog open={showPrint} onClose={() => setShowPrint(false)} maxWidth="md" fullWidth>
        <Box sx={{ p: 2, textAlign: 'right', bgcolor: '#f8fafc' }}>
            <Button 
                variant="contained" 
                color="success"
                size="small" 
                onClick={() => sendWhatsAppInvoice({
                    customerPhone: completedSaleData?.customerMobile,
                    customerName: completedSaleData?.customerName,
                    amount: completedSaleData?.grandTotal,
                    orderId: completedSaleData?.saleNumber || completedSaleData?.invoiceNumber || completedSaleData?.id,
                    shopName: 'VAZAHAT'
                })} 
                sx={{ mr: 1 }}
            >
                WhatsApp Invoice
            </Button>
            <Button variant="contained" size="small" onClick={() => window.print()} sx={{ mr: 1 }}>Print</Button>
            <Button variant="outlined" size="small" onClick={() => setShowPrint(false)}>Close</Button>
        </Box>
        <Box sx={{ p: 1, maxHeight: '80vh', overflowY: 'auto' }}>
            {completedSaleData?.type === 'EXCHANGE' ? <ExchangeInvoicePrint sale={completedSaleData} /> : <StandardInvoicePrint sale={completedSaleData} />}
        </Box>
      </Dialog>

      <ExchangeDialog
        open={exchangeOpen}
        onClose={() => setExchangeOpen(false)}
        storeId={storeId}
        onAddItems={(data) => {
          setOriginalSaleId(data.originalSaleId);
          setOriginalSaleNumber(data.originalSaleNumber);
          setExchangeItems(data.items);
          setSaleType('exchange');
        }}
      />
    </>
  );
}

function InfoCell({ label, value }) {
  return (
    <Box sx={{ minWidth: 160 }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: '#0f172a', fontWeight: strong ? 800 : 700 }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function SummaryCard({ label, value, strong }) {
  return (
    <Box
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        px: 1.5,
        py: 1,
        minWidth: 120,
        textAlign: 'right',
      }}
    >
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: strong ? 800 : 700 }}>
        {Number(value || 0).toFixed(2)}
      </Typography>
    </Box>
  );
}

export default BillingPage;
