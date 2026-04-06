import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import ErpSubPagePlaceholder from '../../components/erp/ErpSubPagePlaceholder';
import { dataImportPlaceholderContent } from './dataImportNavConfig';
import api from '../../services/api';
import { Alert, Snackbar, CircularProgress, Backdrop } from '@mui/material';

const DataHubSubPage = () => {
    const { key } = useParams();
    const config = dataImportPlaceholderContent[key];
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ show: false, text: '', type: 'info' });

    const handleAction = async (handler) => {
        setLoading(true);
        try {
            if (handler === 'exportItems') {
                const res = await api.get('/import/export-items', { responseType: 'blob' });
                downloadBlob(res.data, 'item_master_export.csv');
                showInfo('Item Master exported successfully.');
            } else if (handler === 'exportPurchases') {
                const res = await api.get('/import/export-purchase', { responseType: 'blob' });
                downloadBlob(res.data, 'purchase_export.txt');
                showInfo('Purchase records exported as TEXT.');
            } else if (handler === 'exportTransfers') {
                const res = await api.get('/import/export-transfers', { responseType: 'blob' });
                downloadBlob(res.data, 'stock_transfer_export.txt');
                showInfo('Stock Transfer logs exported successfully.');
            } else if (handler.startsWith('import')) {
                // For imports, trigger a file picker
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.txt,.csv';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const endpoint = handler === 'importItemsText' ? '/import/items-text' : '/import/purchase-text';
                    const res = await api.post(endpoint, formData);
                    showSuccess(res.data?.message || 'Import successful.');
                };
                input.click();
            }
        } catch (error) {
            console.error('Data Hub Error:', error);
            showError(error.response?.data?.message || 'Operation failed. Please check backend connectivity.');
        } finally {
            setLoading(false);
        }
    };

    const downloadBlob = (blob, filename) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    };

    const showInfo = (text) => setMessage({ show: true, text, type: 'info' });
    const showSuccess = (text) => setMessage({ show: true, text, type: 'success' });
    const showError = (text) => setMessage({ show: true, text, type: 'error' });

    return (
        <>
            <ErpSubPagePlaceholder 
                config={config} 
                backPath="/ho/data-import" 
                backLabel="Data Hub" 
                onAction={handleAction}
            />

            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <Snackbar 
                open={message.show} 
                autoHideDuration={6000} 
                onClose={() => setMessage({ ...message, show: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={message.type} variant="filled" sx={{ width: '100%' }}>
                    {message.text}
                </Alert>
            </Snackbar>
        </>
    );
};

export default DataHubSubPage;
