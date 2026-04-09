/**
 * SMART WHATSAPP MARKETING UTILITY
 * This handles sending professional invoices and thank-you messages to customers.
 */
export const sendWhatsAppInvoice = (payload) => {
    const { customerPhone, customerName, amount, orderId, shopName = 'VAZAHAT' } = payload;

    if (!customerPhone) {
        console.error('No phone number provided for WhatsApp.');
        return;
    }

    // Clean phone number (remove spaces, dashes)
    const cleanPhone = customerPhone.replace(/\D/g, '');
    
    // Add country code if not present (defaulting to +91 India for your setup)
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    const message = `*INVOICE FROM ${shopName.toUpperCase()}* 🛍️\n\nNamaste *${customerName || 'valued customer'}*! 🙏\n\nThank you for shopping with us. Your purchase of *₹${Number(amount).toFixed(2)}* (Inv: #${orderId}) was successful.\n\nClick below to view your digital invoice: \n🔗 ${window.location.origin}/invoice/view/${orderId}\n\nWe value your visit and look forward to seeing you again! ✨\n\n*Have a wonderful day!*`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
};

export const sendWelcomeMessage = (customerName, customerPhone) => {
    if (!customerPhone) return;
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    const message = `Hello *${customerName}*! 👋\n\nWelcome to *VAZAHAT* Loyalty Program! 🛍️✨\n\nYou will now receive special offers and updates directly on WhatsApp.\n\nThank you for joining us! 🤝`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
};
