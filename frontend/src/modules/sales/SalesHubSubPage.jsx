import React from 'react';
import { useParams } from 'react-router-dom';
import ErpSubPagePlaceholder from '../../components/erp/ErpSubPagePlaceholder';
import { billingPlaceholderContent } from './billingNavConfig';

const SalesHubSubPage = () => {
    const { key } = useParams();
    const config = billingPlaceholderContent[key];

    return (
        <ErpSubPagePlaceholder 
            config={config} 
            backPath="/ho/sales" 
            backLabel="Sales & Billing" 
        />
    );
};

export default SalesHubSubPage;
