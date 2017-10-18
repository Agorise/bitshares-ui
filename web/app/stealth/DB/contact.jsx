class Stealth_Contact
{
    constructor(label, publickey)
    {
        this.label = label;
        this.publickey = publickey;
    }
    validate_contact()
    {
        let valid_pubkey = false;
        let valid_label = false;
        if(typeof this.publickey === "string" && this.publickey.length > 40 && this.publickey.length < 60) { valid_pubkey = true;}
        if(typeof this.label === "string" && this.label.length > 0){valid_label = true;}
        if(valid_label && valid_pubkey)
        {
            return true;
        }
    }
    set_contact(label, publickey)
    {
        this.label = label;
        this.publickey = publickey;
    }
}
export default Stealth_Contact;