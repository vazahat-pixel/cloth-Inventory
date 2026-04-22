import MasterFormDialog from '../components/MasterFormDialog';

const storeFields = [
    { name: 'name', label: 'Store Name', required: true },
    // { name: 'managerName', label: 'Manager Name', required: true },
    // { name: 'managerPhone', label: 'Manager Phone', required: true },
    { name: 'gstNumber', label: 'GST Number', required: false },
    { name: 'email', label: 'Login Email / Username', required: true, type: 'email' },
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
        helperText: 'Discount applied on Warehouse-to-Store transfers'
    },
    { name: 'city', label: 'City', required: true },
    { name: 'state', label: 'State', required: true },
    { name: 'address', label: 'Complete Address', required: true, multiline: true },
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
        city: initialValues.location?.city || initialValues.city || '',
        state: initialValues.location?.state || initialValues.state || '',
        address: initialValues.location?.address || initialValues.address || '',
    } : null;

    const handleFormSubmit = (values) => {
        const payload = {
            ...values,
            location: {
                city: values.city,
                state: values.state,
                address: values.address,
            }
        };
        delete payload.city;
        delete payload.state;
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
