class Stealth_Contact
{
    constructor(label, publickey)
    {
        this.label = label;
        this.publickey = publickey;
    }
    validate_contact()
    {
        if(publickey.length < 45 || publickey.length > 60)
        {
            return false;
        }
        return true;
    }
    set_contact(label, publickey)
    {
        this.label = label;
        this.publickey = publickey;
    }
}
export default Stealth_Contact;