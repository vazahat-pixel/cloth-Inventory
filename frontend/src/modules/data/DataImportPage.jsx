import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Typography, Upload, message, Alert, Select } from 'antd';
import { UploadOutlined, DatabaseOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import api from '../../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const DataImportPage = () => {
    const [fileList, setFileList] = useState([]);
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const res = await api.get('/warehouses');
                if (res.data?.success) {
                    setWarehouses(res.data.data.warehouses);
                }
            } catch (err) {
                console.error('Failed to fetch warehouses', err);
            }
        };
        fetchWarehouses();
    }, []);

    const processExcel = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length > 0) {
                    const keys = Object.keys(jsonData[0]);
                    const tableCols = keys.map(key => ({
                        title: key,
                        dataIndex: key,
                        key: key,
                    }));
                    setColumns(tableCols);
                    setPreviewData(jsonData);
                    message.success(`Loaded ${jsonData.length} rows for preview.`);
                } else {
                    message.warning('The selected Excel file is empty.');
                }
            } catch (err) {
                console.error(err);
                message.error('Failed to parse Excel file.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleUpload = async () => {
        if (previewData.length === 0) {
            return message.error('No data to import.');
        }

        setImporting(true);
        try {
            // Transform data if necessary. Assumes excel columns match API needs
            // Expected cols: name, category, brand, costPrice, salePrice, size, color, factoryStock
            const payload = {
                products: previewData.map(row => ({
                    name: row.Name || row.name,
                    category: row.Category || row.category,
                    brand: row.Brand || row.brand,
                    costPrice: parseFloat(row.CostPrice || row.costPrice || 0),
                    salePrice: parseFloat(row.SalePrice || row.salePrice || 0),
                    size: row.Size || row.size,
                    color: row.Color || row.color,
                    factoryStock: parseInt(row.Stock || row.stock || row.factoryStock || 0, 10),
                    sku: row.SKU || row.sku || null,
                    barcode: row.Barcode || row.barcode || null
                })),
                warehouseId: selectedWarehouseId
            };

            const res = await api.post('/products/bulk-import', payload);
            if (res.data?.success) {
                message.success(res.data.message || 'Import successful!');
                setPreviewData([]);
                setFileList([]);
                setColumns([]);
            }
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Bulk import failed');
        } finally {
            setImporting(false);
        }
    };

    const uploadProps = {
        onRemove: (file) => {
            setFileList([]);
            setPreviewData([]);
            setColumns([]);
        },
        beforeUpload: (file) => {
            const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
            if (!isExcel) {
                message.error('You can only upload Excel files!');
                return Upload.LIST_IGNORE;
            }
            setFileList([file]);
            processExcel(file);
            return false;
        },
        fileList,
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>
                    <DatabaseOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                    Data Import
                </Title>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Alert
                    message="Instructions"
                    description="Upload an Excel file to bulk import products. If 'Stock' column is provided and a Warehouse is selected, initial stock will be recorded automatically."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div style={{ flex: 1 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Select Target Warehouse (Optional, for initial stock):</Text>
                        <Select
                            placeholder="Select a Warehouse"
                            style={{ width: '100%', maxWidth: '300px' }}
                            value={selectedWarehouseId}
                            onChange={setSelectedWarehouseId}
                            allowClear
                        >
                            {warehouses.map(wh => (
                                <Option key={wh._id} value={wh._id}>{wh.name} ({wh.code})</Option>
                            ))}
                        </Select>
                    </div>

                    <div style={{ flex: 1 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Upload Excel File:</Text>
                        <Upload {...uploadProps} maxCount={1}>
                            <Button icon={<UploadOutlined />}>Select File</Button>
                        </Upload>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '62px' }}>
                        <Button
                            type="primary"
                            onClick={handleUpload}
                            disabled={previewData.length === 0}
                            loading={importing}
                        >
                            Start Import
                        </Button>
                    </div>
                </div>
            </Card>

            {previewData.length > 0 && (
                <Card title={`Data Preview (${previewData.length} rows)`}>
                    <Table
                        dataSource={previewData}
                        columns={columns}
                        size="small"
                        scroll={{ x: 'max-content', y: 400 }}
                        rowKey={(record, i) => i}
                        pagination={false}
                    />
                </Card>
            )}
        </div>
    );
};

export default DataImportPage;
