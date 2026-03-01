/**
 * calculateGST — Pure utility for GST tax split
 * @param {Number} amount - Taxable amount
 * @param {Number} gstPercent - GST percentage (e.g. 5, 12, 18, 28)
 * @param {String} type - GstType enum (CGST_SGST or IGST)
 */
function calculateGST(amount, gstPercent, type) {
    const taxAmount = (Number(amount) * Number(gstPercent)) / 100;

    if (type === "CGST_SGST") {
        const half = taxAmount / 2;
        return {
            cgst: Number(half.toFixed(2)),
            sgst: Number(half.toFixed(2)),
            igst: 0,
            totalTax: Number(taxAmount.toFixed(2))
        };
    }

    return {
        cgst: 0,
        sgst: 0,
        igst: Number(taxAmount.toFixed(2)),
        totalTax: Number(taxAmount.toFixed(2))
    };
}

module.exports = { calculateGST };
