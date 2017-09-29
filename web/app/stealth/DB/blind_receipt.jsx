class Blind_Receipt
{ 
    constructor(account_or_contact,receipt)
    {
        if(account === null)
        {
            this.associated = "Unknown";
        }
        else
        {
            this.associated = account_or_contact;
        }
        this.receipt = receipt;
    }
}
export default Blind_Receipt;