import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    MenuItem, 
    Stack 
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

const LOGIC_OPTIONS = [
    { value: 'PERCENTAGE', label: 'Percentage (%) Discount' },
    { value: 'FLAT', label: 'Flat Amount (₹) Discount' },
    { value: 'BOGO', label: 'BOGO (Buy 1 Get 1 Free)' },
    { value: 'BUY_X_GET_Y', label: 'Buy X, Get Y Free' },
    { value: 'FIXED_PRICE', label: 'Combo Price (e.g. 3 for ₹999)' },
    { value: 'FREE_GIFT', label: 'Free Gift on Purchase' },
];

function PromotionTypeFormDialog({ open, onClose, onSubmit, initialValues }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            baseLogic: 'PERCENTAGE',
            description: '',
            isActive: true
        }
    });

    useEffect(() => {
        if (initialValues) {
            reset(initialValues);
        } else {
            reset({ name: '', baseLogic: 'PERCENTAGE', description: '', isActive: true });
        }
    }, [initialValues, reset, open]);

    const handleFormSubmit = (data) => {
        onSubmit(data);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 800 }}>
                {initialValues ? 'Edit Promotion Plan' : 'Define New Promotion Plan'}
            </DialogTitle>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Promotion Name (Label)"
                            placeholder="e.g. Midnight Flash Sale"
                            {...register('name', { required: 'Name is required' })}
                            error={!!errors.name}
                            helperText={errors.name?.message}
                        />
                        <TextField
                            fullWidth
                            select
                            label="Calculation Logic (Math Type)"
                            {...register('baseLogic', { required: true })}
                        >
                            {LOGIC_OPTIONS.map(opt => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={2}
                            {...register('description')}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={onClose} sx={{ color: '#64748b' }}>Cancel</Button>
                    <Button type="submit" variant="contained">Save to Master List</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default PromotionTypeFormDialog;
