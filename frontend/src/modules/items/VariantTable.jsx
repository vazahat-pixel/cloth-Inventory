import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { Controller, useForm } from 'react-hook-form';
import { buildSizeLabelLookup, resolveSizeLabel } from '../../common/sizeDisplay';

const COLOR_OPTIONS = ['Black', 'Blue', 'Red', 'White', 'Green', 'Grey', 'Navy', 'Yellow', 'Pink', 'Cream', 'Olive', 'Multi'];

const createVariantId = () => `var-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const sanitizeSkuPart = (value, fallback) => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  return normalized || fallback;
};

const generateSku = (styleCode, size, color) =>
  `${sanitizeSkuPart(styleCode, 'STYLE')}-${sanitizeSkuPart(size, 'SIZE')}-${sanitizeSkuPart(color, 'COLOR')}`;

const createVariantPayload = (overrides = {}) => ({
  id: createVariantId(),
  size: '',
  color: '',
  sku: '',
  barcodePrefix: '',
  costPrice: 0,
  salePrice: 0,
  mrp: 0,
  stock: 0,
  status: 'Active',
  ...overrides,
});

function VariantTable({ variants, onChange, styleCode, readOnly = false, sizeOptions = [] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [autoGenerateSku, setAutoGenerateSku] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [generatorFeedback, setGeneratorFeedback] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: createVariantPayload({
      sku: generateSku(styleCode, '', ''),
    }),
  });

  const selectedSize = watch('size');
  const selectedColor = watch('color');
  const normalizedSizeOptions = useMemo(
    () =>
      sizeOptions
        .map((option) =>
          typeof option === 'string'
            ? { value: option, label: option }
            : {
                value: option?.value || option?.sizeCode || option?.name || option?.sizeLabel || '',
                label: option?.label || option?.sizeLabel || option?.name || option?.value || option?.sizeCode || '',
              },
        )
        .filter((option) => option.value),
    [sizeOptions],
  );
  const sizeLabelLookup = useMemo(
    () =>
      buildSizeLabelLookup(
        normalizedSizeOptions.map((option) => ({
          sizeCode: option.value,
          sizeLabel: option.label,
        })),
      ),
    [normalizedSizeOptions],
  );

  const getSizeLabel = (value) => resolveSizeLabel(value, sizeLabelLookup);

  useEffect(() => {
    if (!autoGenerateSku) {
      return;
    }

    setValue('sku', generateSku(styleCode, selectedSize, selectedColor), {
      shouldValidate: true,
    });
  }, [autoGenerateSku, selectedColor, selectedSize, setValue, styleCode]);

  const totalStock = useMemo(
    () => variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0),
    [variants],
  );

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingVariant(null);
  };

  const openAddDialog = () => {
    if (readOnly) {
      return;
    }
    setEditingVariant(null);
    setAutoGenerateSku(true);
    reset(
      createVariantPayload({
        sku: generateSku(styleCode, '', ''),
        barcodePrefix: sanitizeSkuPart(styleCode, 'BAR'),
      }),
    );
    setDialogOpen(true);
  };

  const openEditDialog = (variant) => {
    if (readOnly) {
      return;
    }
    setEditingVariant(variant);
    const generatedSku = generateSku(styleCode, variant.size, variant.color);
    setAutoGenerateSku(variant.sku === generatedSku);
    reset(createVariantPayload(variant));
    setDialogOpen(true);
  };

  const handleDeleteVariant = (variantId) => {
    if (readOnly) {
      return;
    }
    onChange(variants.filter((variant) => variant.id !== variantId));
  };

  const handleVariantSave = (formValues) => {
    const payload = createVariantPayload({
      ...formValues,
      id: editingVariant?.id || createVariantId(),
      costPrice: Number(formValues.costPrice),
      salePrice: Number(formValues.salePrice),
      mrp: Number(formValues.mrp),
      stock: Number(formValues.stock),
    });

    if (editingVariant) {
      onChange(variants.map((variant) => (variant.id === editingVariant.id ? payload : variant)));
    } else {
      onChange([...variants, payload]);
    }

    closeDialog();
  };

  const toggleBulkSelection = (value, selectedList, setter) => {
    if (selectedList.includes(value)) {
      setter(selectedList.filter((item) => item !== value));
      return;
    }

    setter([...selectedList, value]);
  };

  const handleGenerateVariants = () => {
    if (!selectedSizes.length || !selectedColors.length) {
      setGeneratorFeedback({
        severity: 'warning',
        text: 'Select at least one size and one color to generate combinations.',
      });
      return;
    }

    const existingKeys = new Set(
      variants.map((variant) => `${variant.size}|${variant.color}`.trim().toLowerCase()),
    );

    const generatedVariants = [];

    selectedSizes.forEach((size) => {
      selectedColors.forEach((color) => {
        const key = `${size}|${color}`.toLowerCase();
        if (existingKeys.has(key)) {
          return;
        }

        generatedVariants.push(
          createVariantPayload({
            size,
            color,
            sku: generateSku(styleCode, size, color),
          }),
        );
      });
    });

    if (!generatedVariants.length) {
      setGeneratorFeedback({
        severity: 'info',
        text: 'All selected combinations already exist in the variant list.',
      });
      return;
    }

    onChange([...variants, ...generatedVariants]);
    setGeneratorFeedback({
      severity: 'success',
      text: `Generated ${generatedVariants.length} new variants.`,
    });
  };

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Variant Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Add size-color combinations with SKU, pricing, and opening stock.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Chip label={`Variants: ${variants.length}`} color="primary" variant="outlined" />
            <Chip label={`Total Stock: ${totalStock}`} color="success" variant="outlined" />
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
          Bulk Variant Generator
        </Typography>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
              Select Sizes
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
              {normalizedSizeOptions.map((sizeOption) => (
                <Chip
                  key={sizeOption.value}
                  label={sizeOption.label}
                  clickable
                  color={selectedSizes.includes(sizeOption.value) ? 'primary' : 'default'}
                  variant={selectedSizes.includes(sizeOption.value) ? 'filled' : 'outlined'}
                  onClick={() => toggleBulkSelection(sizeOption.value, selectedSizes, setSelectedSizes)}
                  sx={{ mb: 1 }}
                />
              ))}
              {!normalizedSizeOptions.length && <Typography variant="caption" color="error">No sizes found in Master. Please add sizes in Setup first.</Typography>}
            </Stack>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
              Select Colors
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
              {COLOR_OPTIONS.map((color) => (
                <Chip
                  key={color}
                  label={color}
                  clickable
                  color={selectedColors.includes(color) ? 'primary' : 'default'}
                  variant={selectedColors.includes(color) ? 'filled' : 'outlined'}
                  onClick={() => toggleBulkSelection(color, selectedColors, setSelectedColors)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
          {!readOnly ? (
            <>
              <Button
                variant="contained"
                type="button"
                startIcon={<AutoFixHighIcon />}
                onClick={handleGenerateVariants}
              >
                Generate Combinations
              </Button>
              <Button 
                variant="outlined" 
                type="button"
                startIcon={<AddCircleOutlineIcon />} 
                onClick={openAddDialog}
              >
                Add Variant Manually
              </Button>
            </>
          ) : null}
        </Stack>

        {generatorFeedback && (
          <Alert severity={generatorFeedback.severity} sx={{ mt: 2 }}>
            {generatorFeedback.text}
          </Alert>
        )}
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        {variants.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Cost
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Sale Price
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    MRP
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Stock
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id} hover>
                    <TableCell>{getSizeLabel(variant.size)}</TableCell>
                    <TableCell>{variant.color}</TableCell>
                    <TableCell>{variant.sku}</TableCell>
                    <TableCell align="right">{variant.costPrice}</TableCell>
                    <TableCell align="right">{variant.salePrice}</TableCell>
                    <TableCell align="right">{variant.mrp}</TableCell>
                    <TableCell align="right">{variant.stock}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={variant.status}
                        color={variant.status === 'Active' ? 'success' : 'default'}
                        variant={variant.status === 'Active' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      {!readOnly ? (
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" color="primary" onClick={() => openEditDialog(variant)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteVariant(variant.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Read only
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              No variants added yet.
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Generate combinations or add variants manually to continue.
            </Typography>
            {!readOnly ? (
              <Button variant="contained" onClick={openAddDialog} startIcon={<AddCircleOutlineIcon />}>
                Add First Variant
              </Button>
            ) : null}
          </Box>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <Box>
          <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Controller
                  name="size"
                  control={control}
                  rules={{ required: 'Size is required.' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      size="small"
                      fullWidth
                      label="Size"
                      error={Boolean(errors.size)}
                      helperText={errors.size?.message || ' '}
                      SelectProps={{
                        renderValue: (selected) => getSizeLabel(selected),
                      }}
                    >
                      {normalizedSizeOptions.map((sizeOption) => (
                        <MenuItem key={sizeOption.value} value={sizeOption.value}>
                          {sizeOption.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="color"
                  control={control}
                  rules={{ required: 'Color is required.' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      size="small"
                      fullWidth
                      label="Color"
                      error={Boolean(errors.color)}
                      helperText={errors.color?.message || ' '}
                    >
                      {COLOR_OPTIONS.map((color) => (
                        <MenuItem key={color} value={color}>
                          {color}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={autoGenerateSku}
                    onChange={(event) => setAutoGenerateSku(event.target.checked)}
                  />
                }
                label="Auto-generate SKU from style code + size + color"
              />

              <Controller
                name="sku"
                control={control}
                rules={{ required: 'SKU is required.' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    size="small"
                    fullWidth
                    label="SKU (Master Code)"
                    placeholder="Ex: TSHIRT-S-BLUE"
                    disabled={autoGenerateSku}
                    error={Boolean(errors.sku)}
                    helperText={errors.sku?.message || 'Unique identifier for this variant. Note: Physical barcodes/stickers are generated post-purchase/GRN.'}
                  />
                )}
              />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Controller
                  name="costPrice"
                  control={control}
                  rules={{ required: 'Cost price is required.' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      size="small"
                      fullWidth
                      label="Cost Price"
                      error={Boolean(errors.costPrice)}
                      helperText={errors.costPrice?.message || ' '}
                    />
                  )}
                />

                <Controller
                  name="salePrice"
                  control={control}
                  rules={{ required: 'Sale price is required.' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      size="small"
                      fullWidth
                      label="Sale Price"
                      error={Boolean(errors.salePrice)}
                      helperText={errors.salePrice?.message || ' '}
                    />
                  )}
                />

                <Controller
                  name="stock"
                  control={control}
                  rules={{ required: 'Stock is required.' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      size="small"
                      fullWidth
                      label="Initial Stock"
                      error={Boolean(errors.stock)}
                      helperText={errors.stock?.message || ' '}
                    />
                  )}
                />
              </Stack>

              <Controller
                name="mrp"
                control={control}
                rules={{ required: 'MRP is required.' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    size="small"
                    fullWidth
                    label="MRP"
                    error={Boolean(errors.mrp)}
                    helperText={errors.mrp?.message || ' '}
                  />
                )}
              />

              <Controller
                name="status"
                control={control}
                rules={{ required: 'Status is required.' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    size="small"
                    fullWidth
                    label="Status"
                    error={Boolean(errors.status)}
                    helperText={errors.status?.message || ' '}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </TextField>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button 
              variant="contained" 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(handleVariantSave)();
              }}
            >
              {editingVariant ? 'Update Variant' : 'Add Variant'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}

export default VariantTable;
