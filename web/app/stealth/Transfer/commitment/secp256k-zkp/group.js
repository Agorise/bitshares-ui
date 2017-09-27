import {secp256k1_fe_t,secp256k1_fe_storage_t} from "field_5x52.js";

/* @secp256k1_ge_storage_t
 * USAGE:
 * let x = new secp256k1_ge_storage_t
 * x.Set(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) //Synonim of SECP256K1_GE_STORAGE_CONST from secp256k1-zkp
 */ 
class secp256k1_ge_storage_t
{
    constructor()
    {
        this.x = new secp256k1_fe_storage_t;
        this.y = new secp256k1_fe_storage_t;
    }
    Set = (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) => {
        this.x.Set(a, b, c, d, e, f, g, h);
        this.y.Set(i, j, k, l, m, n, o, p);
    }
}
/* @secp256k1_gej_t
 * Description: A group element of the secp256k1 curve, in jacobian coordinates.
 * USAGE:
 * let x = new secp256k1_gej_t
 * x.Set_Finite(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) // Synonim of SECP256K1_GEJ_CONST from secp256k1-zkp
 * x.Set_Infinite // Synonim of SECP256K1_GEJ_CONST_INFINITY from secp256k1-zkp
 * Shortcuts:
 * x.Set(params) = x.SetFinite(params)
 * x.Seti() = x.setInfinite()
 */ 
class secp256k1_gej_t
{
    constructor()
    {
        this.x = new secp256k1_fe_t;
        this.y = new secp256k1_fe_t;
        this.z = new secp256k1_fe_t;
        this.infinity = null;
    }
    Set_Finite = (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) => {
        this.x.Set(a,b,c,d,e,f,g,h); /* actual X: x/z^2 */
        this.y.Set(i,j,k,l,m,n,o,p); /* actual Y: y/z^3 */
        this.z.Set(0, 0, 0, 0, 0, 0, 0, 1);
        this.infinity = 0; /* whether this represents the point at infinity */
    }
    Set_Infinite = () => {
        this.x.Set(0, 0, 0, 0, 0, 0, 0, 0);
        this.y.Set(0, 0, 0, 0, 0, 0, 0, 0);
        this.z.Set(0, 0, 0, 0, 0, 0, 0, 0);
        this.infinity = 1;
    }
    //Name Shortcuts
    Set = this.Set_Finite;
    Seti = this.Set_Ininite;
}
/* @secp256k1_ge_t
 * Description: A group element of the secp256k1 curve, in affine coordinates.
 * let x = new secp256k1_ge_t;
 * x.SetFinite(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) Synonim of SECP256K1_GE_CONST from secp256k1-zkp
 * x.SetInfinite() Synonim of SECP256K1_GE_CONST_INFINITY from secp256k1-zkp
 * Shortcuts:
 * x.Set(params) = x.SetFinite(params)
 * x.Seti() = x.SetInfinite()
 */
class secp256k1_ge_t
{
    constructor()
    {
        this.x = new secp256k1_fe_t;
        this.y = new secp256k1_fe_t;
        this.infinity = null; /* whether this represents the point at infinity */
    }
    SetFinite = (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) => {
        this.x.Set(a, b, c, d, e, f, g, h);
        this.y.Set(h, i, j, k, l, m, n, o, p);
        this.infinity = 0;
    }
    SetInfinite = () => {
        this.x.Set(0, 0, 0, 0, 0, 0, 0, 0);
        this.y.Set(0, 0, 0, 0, 0, 0, 0, 0);
        this.infinity = 1;
    }
    Set = SetFinite;
    Seti = SetInfinite;
}
export default {secp256k1_ge_storage_t,secp256k1_ge_t,secp256k1_gej_t};