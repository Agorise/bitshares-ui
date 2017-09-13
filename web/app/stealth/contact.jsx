class Stealth_Contact
{
    constructor(label, publickey)
    {
        this.label = label;
        this.publickey = publickey;
    }
    validate_contact(label)
    {
        //todo
    }
    set_contact(label, publickey)
    {
        this.label = label;
        this.publickey = publickey;
    }
}
export default Stealth_Contact;