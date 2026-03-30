import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
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
  TablePagination,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Alert,
  Autocomplete,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { fetchPurchases } from '../purchase/purchaseSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';
import { addGrn } from './grnSlice';
import api from '../../services/api';

const toExportRows = (rows = []) =>
  rows.flatMap((row) =>
    (row.lineItems || []).map((line) => ({
      grn_number: row.grnNumber,
      grn_date: row.grnDate,
      po_number: row.poNumber,
      supplier_name: row.supplierName,
      warehouse: row.warehouse,
      invoice_number: row.invoiceNumber,
      invoice_date: row.invoiceDate,
      item_code: line.itemCode,
      item_name: line.itemName,
      size: line.size,
      ordered_qty: line.orderedQty,
      previously_received_qty: line.previouslyReceivedQty,
      received_qty: line.receivedQty,
      rejected_qty: line.rejectedQty,
      accepted_qty: line.acceptedQty,
      rate: line.rate,
      batch_no: line.batchNo,
      remarks: line.remarks,
      status: row.status,
      posted_by: row.postedBy,
      created_at: row.createdAt,
    })),
  );

function GRNPage() {
  return <GRNListPage />;
}

export default GRNPage;
