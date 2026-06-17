import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Controller, useForm } from 'react-hook-form';

const getDefaultValues = (fields, initialValues) =>
  fields.reduce((accumulator, field) => {
    accumulator[field.name] = initialValues?.[field.name] ?? field.defaultValue ?? '';
    return accumulator;
  }, {});

function MasterFormDialog({
  open,
  onClose,
  onSubmit,
  title,
  submitLabel,
  initialValues,
  fields,
}) {
  const [visiblePasswordFields, setVisiblePasswordFields] = useState({});

  const togglePasswordVisibility = (fieldName) => {
    setVisiblePasswordFields((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: getDefaultValues(fields, initialValues),
    mode: 'onBlur',
  });

  useEffect(() => {
    reset(getDefaultValues(fields, initialValues));
  }, [fields, initialValues, open, reset]);

  const submitHandler = (formValues) => {
    const normalizedValues = { ...formValues };

    fields.forEach((field) => {
      if (field.type === 'number' && normalizedValues[field.name] !== '') {
        normalizedValues[field.name] = Number(normalizedValues[field.name]);
      }
    });

    onSubmit(normalizedValues);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <Box component="form" onSubmit={handleSubmit(submitHandler)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {fields.map((field) => (
              <Grid key={field.name} item xs={12} sm={field.size || 6}>
                <Controller
                  name={field.name}
                  control={control}
                  rules={{
                    required: field.required ? `${field.label} is required.` : false,
                    pattern: field.pattern || (field.type === 'email' ? { value: /\S+@\S+\.\S+/, message: 'Enter a valid email.' } : undefined),
                    validate: field.validate,
                  }}
                  render={({ field: controlledField }) => (
                    <TextField
                      {...controlledField}
                      fullWidth
                      size="small"
                      label={field.label}
                      type={
                        field.type === 'select'
                          ? 'text'
                          : field.type === 'password' && visiblePasswordFields[field.name]
                            ? 'text'
                            : field.type || 'text'
                      }
                      multiline={Boolean(field.multiline)}
                      minRows={field.minRows || 1}
                      select={field.type === 'select'}
                      error={Boolean(errors[field.name])}
                      helperText={errors[field.name]?.message || field.helperText || ' '}
                      InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                      onChange={(event) => {
                        let value = field.type === 'email'
                          ? event.target.value.toLowerCase()
                          : event.target.value;
                        if (field.inputMode === 'digits') {
                          value = value.replace(/\D/g, '');
                        } else if (field.inputMode === 'alphanumeric') {
                          value = value.replace(/[^a-zA-Z0-9]/g, '');
                        }
                        controlledField.onChange(value);
                      }}
                      onFocus={(event) => {
                        if (field.type === 'number' && Number(controlledField.value) === 0) {
                          controlledField.onChange('');
                        }
                        field.onFocus?.(event);
                      }}
                      inputProps={{
                        ...(field.type === 'email' ? { style: { textTransform: 'lowercase' } } : {}),
                        ...(field.maxLength ? { maxLength: field.maxLength } : {}),
                        ...(field.inputProps || {}),
                      }}
                      InputProps={
                        field.type === 'password'
                          ? {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    size="small"
                                    edge="end"
                                    onClick={() => togglePasswordVisibility(field.name)}
                                    aria-label={visiblePasswordFields[field.name] ? 'Hide password' : 'Show password'}
                                  >
                                    {visiblePasswordFields[field.name] ? (
                                      <VisibilityOffIcon fontSize="small" />
                                    ) : (
                                      <VisibilityIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }
                          : field.InputProps
                      }
                      sx={field.sx}
                    >
                      {field.type === 'select' &&
                        field.options?.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                    </TextField>
                  )}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {submitLabel || 'Save'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default MasterFormDialog;
