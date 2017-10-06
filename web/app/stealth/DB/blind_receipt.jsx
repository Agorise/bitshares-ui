class Blind_Receipt
{ 
    constructor(account_or_contact,receipt,value)
    {
        if(account_or_contact === null)
        {
            this.associated = "Unknown";
        }
        else
        {
            this.associated = account_or_contact;
        }
        this.receipt = receipt;
        this.value = value;
    }
}
export default Blind_Receipt;