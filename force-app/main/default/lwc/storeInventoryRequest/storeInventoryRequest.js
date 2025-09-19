import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createCase from '@salesforce/apex/GuestCaseController.createCase';
import getStoreName from '@salesforce/apex/GuestCaseController.getStoreName';

export default class StoreInventoryRequest extends LightningElement {
      // Public properties from parent
      @api requestorName;
      @api requestorEmail;
      @api ccEmailAddress;
      @api requestType;
      @api subRequestType;
  
      // Form fields
      @track orderNumber = '';
      @track hubLocation = '';
      @track hubLocationId = '';
      @track additionalNotes = '';
      @track customerName = '';
      @track sku = '';
      @track quantity = '';
      @track reversePickupDate = '';
      @track skuDescription = '';
      @track reasonForSRTR = '';
      @track other = '';
      @track selectedValue = '';
      @track otherValue = '';
      @track willAttachFiles = '';
      @track numberOfSKUs = '';
      @track skuFields = [];
      @track haveYouVerified ='';
      @track sameDayReverseRequest='';
      @track approval='';
      @track swatchAuditDate='';
      @track skuCollection='';
      @track skuQuantity='';
  
      // UI state
      @track isModalOpen = false;
      @track isLoading = false;
      @track relatedRecordId;
      @track relatedRecordBool = false;
  
      fileAttachmentOptions = [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' }
      ];

      get SRTRTwilight(){
        return[
            {label:'Yes',value:'Yes'}
        ];
      }
          
      get srtrReasons() {
          return [
              {label:'Studio', value:'Studio'},
              {label:'Damage for disposal at hub', value:'Damage for disposal at hub'},
              {label:'Damage not for disposal', value:'Damage not for disposal'},
              {label:'Duplicate', value:'Duplicate'},
              {label:'Mislabeled', value:'Mislabeled'},
              {label:'Incomplete kit', value:'Incomplete kit'},
              {label:'Within 90 days of store opening', value:'Within 90 days of store opening'},
              {label:'Renovation', value:'Renovation'},
              {label:'Corporate approved', value:'Corporate approved'},
              {label:'Other', value:'Other'}
          ];
      }

      
    skuNumberOptions = [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5', value: '5' },
        { label: '6', value: '6' },
        { label: '7', value: '7' },
        { label: '8', value: '8' },
        { label: '9', value: '9' },
        { label: '10', value: '10' },
        { label: '11', value: '11' },
        { label: '12', value: '12' },
        { label: '13', value: '13' },
        { label: '14', value: '14' },
        { label: '15', value: '15' },
        { label: '16', value: '16' },
        { label: '17', value: '17' },
        { label: '18', value: '18' },
        { label: '19', value: '19' },
        { label: '20', value: '20' },
        { label: '21', value: '21' },
        { label: '22', value: '22' },
        { label: '23', value: '23' },
        { label: '24', value: '24' },
        { label: '25', value: '25' }]

        handleSkuNumberChange(event) {
            this.numberOfSKUs = event.target.value;
            this.skuFields = [];
            for (let i = 0; i < this.numberOfSKUs; i++) {
                this.skuFields.push({ 
                    index: i, 
                    sku: '', 
                    quantity: '', 
                    skuDescription: '',
                    reasonSRTR: '', 
                    showOtherInput: false, 
                    otherValue: '' 
                });
            }
        }

    handleSkuChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const value = event.target.value;
        this.skuFields = this.skuFields.map((item, i) => 
            i === index ? {...item, sku: value} : item
        );
    }
    
    handleQuantityChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const value = event.target.value;
        this.skuFields = this.skuFields.map((item, i) => 
            i === index ? {...item, quantity: value} : item
        );
    }
    
    handleSkuDescriptionChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const value = event.target.value;
        this.skuFields = this.skuFields.map((item, i) => 
            i === index ? {...item, skuDescription: value} : item
        );
    }

    handleReasonChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const selectedValue = event.detail.value;
        console.log('Reason changed - Index:', index, 'Value:', selectedValue);
        
        this.skuFields = this.skuFields.map((item, i) => {
            if (i === index) {
                const updatedItem = {
                    ...item,
                    reasonSRTR: selectedValue,
                    showOtherInput: (selectedValue === 'Other'),
                    otherValue: selectedValue === 'Other' ? item.otherValue : ''
                };
                console.log('Updated item:', updatedItem);
                return updatedItem;
            }
            return item;
        });
        
        console.log('All SKU fields:', JSON.parse(JSON.stringify(this.skuFields)));
    }

    handleOtherInputChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const value = event.target.value;
        
        this.skuFields = this.skuFields.map((item, i) => 
            i === index ? {...item, otherValue: value} : item
        );
    }
  
      // Computed getters for template rendering
      get showBanner() {
          return this.subRequestType && this.subRequestType !=='Store Reverse Transfer Request';
      }

      get showButton(){
        return this.subRequestType;
      }
  
      get showBannerForSRTR(){
        return this.subRequestType ==='Store Reverse Transfer Request';
      }
      get showTwilight() {
          return this.subRequestType === 'Status Change: Discounted Pricing Status (Twilight)';
      }
  
      get showPhysicalInv() {
          return this.subRequestType === 'Physical Inventory, Cycle Count & Swatch Audit Adjustments';
      }
  
      get showStoreReverse() {
          return this.subRequestType === 'Store Reverse Transfer Request';
      }
  
      get showASIS() {
          return this.subRequestType === 'Status Change: AS-IS to Saleable';
      }
  
      get showAddOrRemove() {
          return this.subRequestType === 'Add or remove item(s) from a store inventory';
      }
  
      handleInputChange(event) {
          const { name, value } = event.target;
          this[name] = value;
      }
  
      async handleHubLocationChange(event) {
          const selectedRecord = event.detail;
          console.log('Record selected:', JSON.stringify(selectedRecord));
          
          if (selectedRecord && selectedRecord.recordId) {
              this.hubLocationId = selectedRecord.recordId;
              
              try {
                  const storeName = await getStoreName({ storeId: this.hubLocationId });
                  this.hubLocation = storeName;
                  console.log('Hub Location Name:', this.hubLocation);
              } catch (error) {
                  console.error('Error getting store name:', error);
                  this.hubLocation = 'Unknown Store';
              }
          } else {
              this.hubLocationId = '';
              this.hubLocation = '';
          }
      }
  
      handleRadioChange(event) {
          this.selectedValue = event.detail.value;
          this.showOtherInput = (this.selectedValue === 'Other');
          if (!this.showOtherInput) {
              this.otherValue = '';
          }
      }
  
      handleOtherInputChange(event) {
          this.otherValue = event.detail.value;
      }
  
      handleFileAttachmentChange(event) {
          this.willAttachFiles = event.detail.value;
      }
  
      handleCreateCase() {
          this.isLoading = true;
         
          const skuData = this.skuFields.map((item, index) => ({
            sku: item.sku,
            quantity: item.quantity,
            skuDescription: item.skuDescription,
            reasonSRTR: item.reasonSRTR === 'Other' ? item.otherValue : item.reasonSRTR,
            lineNumber: index + 1
        }));
    
          const caseDetails = {
              requestorName: this.requestorName,
              requestorEmail: this.requestorEmail,
              ccEmailAddress: this.ccEmailAddress,
              requestTypes: this.requestType,
              subRequestType: this.subRequestType,
              orderNumber: this.orderNumber,
              customerName: this.customerName,
              hubLocation: this.hubLocation,
              additionalNotes: this.additionalNotes,
              sku: this.sku,
              skuCollection:this.skuCollection,
              skuQuantity: this.skuQuantity, 
              quantity: this.quantity,
              willAttachFiles: this.willAttachFiles,
              other: this.other,
              reasonForSRTR: this.reasonForSRTR,
              skuDescription: this.skuDescription,
              reversePickupDate: this.reversePickupDate,
              swatchAuditDate:this.swatchAuditDate,
              numberOfSKUs: this.numberOfSKUs,
              haveYouVerified:this.haveYouVerified,
              sameDayReverseRequest:this.sameDayReverseRequest,
              approval:this.approval,
              skuData: JSON.stringify(skuData), // Send as JSON string
              // Include individual fields for backward compatibility
              sku: this.skuFields.length > 0 ? this.skuFields[0].sku : '',
              quantity: this.skuFields.length > 0 ? this.skuFields[0].quantity : '',
              skuDescription: this.skuFields.length > 0 ? this.skuFields[0].skuDescription : '',
              reasonForSRTR: this.skuFields.length > 0 ? 
              (this.skuFields[0].reasonSRTR === 'Other' ? this.skuFields[0].otherValue : this.skuFields[0].reasonSRTR) 
              : ''
  
          };
  
          createCase({ caseDetails: caseDetails })
              .then(result => {
                  this.isLoading = false;
                  this.relatedRecordId = result;
                  this.relatedRecordBool = true;
                  
                  this.dispatchEvent(new ShowToastEvent({
                      title: 'Your case has been created successfully',
                      message: 'Case ID: ' + result,
                      variant: 'success'
                  }));
                  
                  if (this.willAttachFiles === 'yes') {
                      this.isModalOpen = true;
                  } else {
                      setTimeout(() => {
                          window.location.reload();
                      }, 3000);
                  }
              })
              .catch(error => {
                  this.isLoading = false;
                  this.dispatchEvent(new ShowToastEvent({
                      title: 'Error creating case',
                      message: error.body.message,
                      variant: 'error'
                  }));
              });
      }
  
      closeModal() {
          this.isModalOpen = false;
      }
  
      handleUploadFinished(event) {
          const uploadedFiles = event.detail.files;
          this.dispatchEvent(new ShowToastEvent({
              title: 'Attachments have been successfully linked to the current case record.',
              message: `${uploadedFiles.length} file(s) uploaded successfully!`,
              variant: 'success'
          }));
          this.isModalOpen = false;
          setTimeout(() => {
              window.location.reload();
          }, 3000);
      }
}