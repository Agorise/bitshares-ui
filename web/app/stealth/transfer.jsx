class Stealth_Transfer
{
    constructor()
    {
        this.from = "";
        this.to = "";
    }
    To_Stealth()
    {
        //Todo
    }
    From_Stealth()
    {
        //Todo
    }
    S_2_S()
    {
        //Todo
    }
    strip_symbol(name)
    {
        if(name[0] == "@")
        {
            let result = "";
            for(let i=0;i<name.length();i++)
            {
                if(i=0)
                {
                    continue;
                }
                result += name[i];
            }
            return result;
        }
        else
        {
            throw new Error("Stealth/Transfer: Problem at stripping symbol, no symbol to strip or null value passed");
            return false;
        }
    }
    Transfer(from_name, to_name)
    {
        if(from_name[0] != "@" && to_name[0] == "@")
        {
            this.from = from_name;
            this.to = strip_symbol(to_name);
            To_Stealth();
        }
        else if(from_name[0] == "@" && to_name[0] != "@")
        {
            this.from = strip_symbol(from_name);
            this.to = to_name;
            From_Stealth();
        }
        else if(from_name[0] == "@" && to_name[0] == "@")
        {
            this.from = strip_symbol(from_name);
            this.to = strip_symbol(to_name);
            S_2_S();
        }
        else
        {
            if(from_name == null || to_name == null)
            {
                throw new Error("stealth/Transfer: Null value passed to stealth transfer");
            }
            else
            {
                throw new Error("stealth/Transfer: something went wrong, non-stealth values passed to stealth transfer");
            }
        }
    }
}
export default Stealth_Transfer;