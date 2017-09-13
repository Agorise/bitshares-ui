class owner
{
    constructor(key_auths)
    {
        this.weight_treshold = 1;
        this.account_auths = [];
        this.key_auths = [key_auths];
        this.address_auths = [];
    }
}
class output
{
    constructor(commitment, range_proof , key_auths)
    {
        this.commitment = commitment;
        this.range_proof = range_proof;
        this.owner = new owner(key_auths);
    }
}
class fee
{
    constructor(ammount)
    {
        this.ammount = ammount;
        this.asset_id = "1.3.0";
    }
}
class cammount
{
    constructor(actual_ammount, asset_id)
    {
        this.ammount = ammount;
        this.asset_id = asset_id;
    }
}
class operation
{
    constructor(ammount,actual_ammount,from,blinding_factor,commitment,range_proof,key_auths)
    {
        this.fee = new fee(ammount);
        this.ammount = new cammount(actual_ammount,asset_id);
        this.from = from;
        this.blinding_factor = blinding_factor;
        this.outputs = [new output(commitment,range_proof,key_auths)];
    }
}
class obj
{
    constructor(refblocknum,refblockprefix,expiration,signatures,ammount,actual_ammount,from,blinding_factor,commitment,range_proof,key_auths)
    {
        this.ref_block_num = refblocknum;
        this.ref_block_prefix = refblockprefix;
        this.expiration = expiration;
        this.operations = [[39,new operation(ammount,actual_ammount,from,blinding_factor,commitment,range_proof,key_auths)]];
        this.extensions = [];
        this.signatures = signatures;
    }
}
class call_to_blind
{
    constructor(id,refblocknum,refblockprefix,expiration,signatures,ammount,actual_ammount,from,blinding_factor,commitment,range_proof,key_auths)
    {
        this.id = id;
        this.method = "call";
        this.params = [3,"broadcast_transaction",[new obj(refblocknum,refblockprefix,expiration,signatures,ammount,actual_ammount,from,blinding_factor,commitment,range_proof,key_auths)],];
    }
}
/*Example:
let commitment = "0306b760b2295925f0ea1cffc368bb9f3d689c17a4caabf0edaf5d5298ecedd459"; Pedersen Commit
let range_proof = "";
let key_auths = ["BTS55vqZ884ymzZKZUK4HfoopvXQxtudmj3oesroFV5k4bguxyUgV", 1];
let ammount = 1000000
let actual_ammount = 10100000 is 101 bts for ex.
let asset_id = "1.3.0" is BTS
let from = "1.2.20"
let blinding_factor = "703717ec36d9e4b83b7526cbf4dd089f65695ee00f012a8a767e1073d728b29c"
let refblocknum = 13059;
let refblockprefix = 245899329;
let expiration = "2017-09-06T15:11:15";
let signatures =["203593a04c979c9b30521808e94d88782030c5815ee4b63cd609a373dbc51996c50efbb87a46720003ebc68724881e8912b3908e15204bb8ae9817c2d6e1116960"];
let id = 13;
*/
export default call_to_blind;