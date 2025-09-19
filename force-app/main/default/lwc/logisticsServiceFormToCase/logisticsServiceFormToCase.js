import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class LogisticsServiceFormToCase extends LightningElement {
    @track requestorName = '';
    @track requestorEmail = '';
    @track ccEmailAddress = '';
    @track requestType = '';
    @track selectedSubRequestType = '';
    @track isModalOpen = false;
    @track isLoading = false;
    @track relatedRecordId;
    @track relatedRecordBool = false;
    @track willAttachFiles = '';

     requestTypes = [
        { label: 'Customer Order Requests', value: 'Customer_Order_Requests' },
        { label: 'Store Inventory Requests', value: 'Store_Inventory_Requests' },
        { label: 'DC/Warehouse & Quality Requests', value: 'DC_Warehouse_Quality_Requests' },
        { label: 'Final Mile & 3PL Hub Requests', value: 'Final_Mile_3PL_Hub_Requests' }
    ];

    allSubRequests = {
        Customer_Order_Requests: [
            { label: 'Return Transfer (RA) Request', value: 'Return Transfer (RA) Request' },
            { label: 'Remove from Manifest', value: 'Remove from Manifest' },
            { label: 'Borrow Request', value: 'Borrow Request' },
            { label: 'Order Invoice Request', value: 'Order Invoice Request' },
            { label: 'Order Invoiced in Error', value: 'Order Invoiced in Error' },
            { label: 'Invoice Direct Ship Return', value: 'Invoice Direct Ship Return' },
            { label: 'Small Parcel Mark Out', value: 'Small Parcel Mark Out' },
            { label: 'Change Ship Date', value: 'Change Ship Date' },
            { label: 'Order Correction', value: 'Order Correction' },
            { label: 'Validate Item Shipped', value: 'Validate Item Shipped' }
            //{label:'Request for COI', value:'Request for COI'}
        ],
        Store_Inventory_Requests: [
            { label: 'Status Change: Discounted Pricing Status (Twilight)', value: 'Status Change: Discounted Pricing Status (Twilight)' },
            { label: 'Physical Inventory, Cycle Count & Swatch Audit Adjustments', value: 'Physical Inventory, Cycle Count & Swatch Audit Adjustments' },
            { label: 'Store Reverse Transfer Request', value: 'Store Reverse Transfer Request' },
            { label: 'Status Change: AS-IS to Saleable', value: 'Status Change: AS-IS to Saleable' },
            {label:'Add or remove item(s) from a store inventory', value:'Add or remove item(s) from a store inventory'}
            
        ],
        DC_Warehouse_Quality_Requests: [
            { label: 'Employee Order CPU', value: 'Employee Order CPU' },
            { label: 'Status Change: Quality Hold', value: 'Status Change: Quality Hold' },
            { label: 'SKU Change Requests', value: 'SKU Change Requests' },
            { label: 'Batch Number Update Request', value: 'Batch Number Update Request' },
            { label: 'DC to DC', value: 'DC to DC' }
        ],
        Final_Mile_3PL_Hub_Requests: [
            { label: '215/EDI', value: '215_EDI' },
            { label: 'Validate Item Shipped', value: 'Validate Item Shipped' },
            {label: 'Redirect Request', value:'Redirect Request'}
        ]
    };

    get subRequestOptions() {
        return this.allSubRequests[this.requestType] || [];
    }

    get showSubRequestOptions() {
        return this.subRequestOptions.length > 0;
    }

    get showCustomerOrder() {
        return this.requestType === 'Customer_Order_Requests';
    }

  get showStoreInventory() {
    return this.requestType === 'Store_Inventory_Requests';
}

    get showDcWarehouse() {
        return this.requestType === 'DC_Warehouse_Quality_Requests';
    }

    get showFinalMile() {
        return this.requestType === 'Final_Mile_3PL_Hub_Requests';
    }

    
    handleInputChange(event) {
        const { name, value } = event.target;
        this[name] = value;
    }


    handleRequestTypeChange(event) {
    this.requestType = event.detail.value;
    this.selectedSubRequestType = '';
    console.log('Request Type:', this.requestType);
    console.log('showCustomerOrder:', this.showCustomerOrder);
    console.log('showStoreInventory:', this.showStoreInventory);
    console.log('showDcWarehouse:', this.showDcWarehouse);
    console.log('showFinalMile:', this.showFinalMile);
}

    handleSubRequestTypeChange(event) {
        this.selectedSubRequestType = event.detail.value;
    }
connectedCallback() {
    console.log('Parent component loaded');
}

renderedCallback() {
    console.log('Parent component rendered');
}

  handleCaseCreated(event) {
        const detail = event.detail;
        this.isLoading = false;

        if (detail.success) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Your case has been created successfully',
                message: 'Case ID: ' + detail.caseId,
                variant: 'success'
            }));

            if (detail.willAttachFiles === 'yes') {
                this.isModalOpen = true;
            } else {
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            }
        } else {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error creating case',
                message: detail.error,
                variant: 'error'
            }));
        }
    }
}