import MasterFormDialog from '../components/MasterFormDialog';

const storeFields = [
    { name: 'name', label: 'Store Name', required: true, validate: (v) => v.trim().length > 0 || 'Name cannot be empty' },
    { name: 'storeCode', label: 'Store Code', required: true, validate: (v) => v.trim().length > 0 || 'Code cannot be empty' },
    { name: 'managerName', label: 'Manager Name' },
    { name: 'managerPhone', label: 'Phone', required: true, pattern: { value: /^\d{10}$/, message: 'Phone must be exactly 10 digits' } },
    { name: 'alternatePhone', label: 'Alternate Phone', pattern: { value: /^(?:\d{10})?$/, message: 'Alternate Phone must be exactly 10 digits if provided' } },
    { name: 'gstNumber', label: 'GST Number', required: false, pattern: { value: /^(?:[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})?$/, message: 'Invalid 15-char GSTIN format' } },
    { name: 'panNo', label: 'PAN No', pattern: { value: /^(?:[A-Z]{5}[0-9]{4}[A-Z]{1})?$/, message: 'Invalid 10-char PAN format' } },
    { name: 'email', label: 'Login Email / Username', required: true, type: 'email', maxLength: 120, sx: { '& .MuiInputBase-input': { overflow: 'visible', textOverflow: 'clip' } } },
    { 
        name: 'password', 
        label: 'Login Password', 
        required: false, 
        type: 'password', 
        helperText: 'Default: Store@123 (Used for first time login)' 
    },
    { 
        name: 'transferDiscountPct', 
        label: 'Transfer Discount (%)', 
        required: false, 
        type: 'number',
        inputProps: { min: 0, max: 100, step: 0.01 },
        validate: (v) => {
            if (v === '' || v === null || v === undefined) return true;
            const num = Number(v);
            if (!Number.isFinite(num) || num < 0) return 'Transfer discount cannot be negative';
            if (num > 100) return 'Transfer discount cannot exceed 100%';
            return true;
        },
        helperText: 'Discount applied on Warehouse-to-Store transfers (0–100%)'
    },
    { name: 'openingBalance', label: 'Opening Balance', required: false, type: 'number', defaultValue: 0, validate: (v) => Number(v) >= 0 || 'Opening balance cannot be negative' },
    { name: 'city', label: 'City', required: true, pattern: { value: /^[A-Za-z\s]+$/, message: 'City can only contain alphabets and spaces' } },
    { name: 'state', label: 'State', required: true, pattern: { value: /^[A-Za-z\s]+$/, message: 'State can only contain alphabets and spaces' } },
    { name: 'pincode', label: 'Pincode', required: true, pattern: { value: /^\d{6}$/, message: 'Pincode must be exactly 6 digits' } },
    { name: 'address', label: 'Complete Address', required: true, multiline: true },
    { 
        name: 'invoicePrefix', 
        label: 'Invoice Prefix (e.g. BPL, GTB)', 
        required: true, 
        validate: (v) => (v && v.trim().length > 0) || 'Invoice Prefix is mandatory for store billing',
        pattern: { value: /^[A-Z0-9]+$/i, message: 'Prefix can only contain alphanumeric characters' },
        helperText: 'Required. Must be unique for each store to avoid invoice numbering conflict'
    },
    { 
        name: 'invoiceFooterText', 
        label: 'Invoice Footer Text', 
        required: false, 
        multiline: true,
        helperText: 'Custom greeting/terms printed at the bottom of the invoice'
    },
    {
        name: 'isActive',
        label: 'Status',
        type: 'select',
        required: true,
        defaultValue: true,
        options: [
            { value: true, label: 'Active' },
            { value: false, label: 'Inactive' },
        ],
    },
];

function StoresFormDialog({ open, onClose, onSubmit, initialValues }) {
    const isEdit = Boolean(initialValues);

    const flattenedInitialValues = initialValues ? {
        ...initialValues,
        transferDiscountPct: initialValues.transferDiscountPct || 0,
        openingBalance: initialValues.openingBalance || 0,
        city: initialValues.location?.city || initialValues.city || '',
        state: initialValues.location?.state || initialValues.state || '',
        pincode: initialValues.location?.pincode || initialValues.pincode || '',
        address: initialValues.location?.address || initialValues.address || '',
    } : null;

    const handleFormSubmit = (values) => {
        const payload = {
            ...values,
            location: {
                city: values.city,
                state: values.state,
                pincode: values.pincode,
                address: values.address,
            }
        };
        delete payload.city;
        delete payload.state;
        delete payload.pincode;
        delete payload.address;

        onSubmit(payload);
    };

    return (
        <MasterFormDialog
            open={open}
            onClose={onClose}
            onSubmit={handleFormSubmit}
            initialValues={flattenedInitialValues}
            fields={storeFields}
            title={isEdit ? 'Edit Store' : 'Add Store'}
            submitLabel={isEdit ? 'Update Store' : 'Create Store'}
        />
    );
}

export default StoresFormDialog;
