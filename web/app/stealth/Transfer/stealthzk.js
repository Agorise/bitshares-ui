/**@file
 *
 *  This is the BEGINNING of a JavaScript implementation of
 *  Zero-Knowledge primatives on the secp256k1 EC curve.  It is NOT
 *  hardened and should NOT be considered SECURE, nor even
 *  mathematically CORRECT.
 *
 *  For now, the ONLY purpose for this is for prototyping
 *  javascript-based UI wallets implementing blinded and/or stealth
 *  transactions.
 *
 *  This library is loosely based on
 *  https://github.com/bitshares/secp256k1-zkp.
 *
 *  To my knowledge, no native JavaScript implementation of
 *  secp256k1-zkp exists.  A notable cross-comiled lib (x-compiled
 *  from cpp to js using Emscripten) exists at
 *  https://github.com/eosio/eosjs-secp256k1.  I am uncertain as to
 *  the state of this project, however.
 *
 */
import BigInteger from 'bigi';
import {Point, getCurveByName} from 'ecurve';
const secp256k1 = getCurveByName('secp256k1');
import {encode, decode}from 'bs58';
import { hash } from "agorise-bitsharesjs/es/ecc";
import assert from "assert";

const {G, n} = secp256k1;

/**
 *  Defines the "alternate" generator point (G2) used in Pedersen
 *  Commitments.
 */
const secp256k1altgen = {
    "G2x": "50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0",
    "G2y": "31d3c6863973926e049e637cb1b5f40a36dac28af1766968c30c2313f3a38904"
}
const G2 = Point.fromAffine(secp256k1,
                            BigInteger(secp256k1altgen.G2x,16),
                            BigInteger(secp256k1altgen.G2y,16));

/**
 *  Defines the Stealth_ZK class.  Reminder: NOT SECURE or CERTIFIED
 *  CORRECT.  PROTOTYPE ONLY.
 */
class StealthZK {

    constructor() {}

    /**
     *  Pedersen commitment for blind TX on secp256k1 curve.
     *
     *  commit = blind * G + value * G2.
     *
     *  The commitment is 33 bytes, the blinding factor is 32
     *  bytes. Ammount is a number that should be an integer. (TODO
     *  assert checks on this).
     */
    static BlindCommit(blind_factor, amount) {
        /*console.log("Requesting commitment of", amount,
                    "with blind factor", blind_factor);
        */

        // The commitment is a curve point: C = G * j + G2 * k
        let commit_C = G.multiplyTwo(BigInteger.fromBuffer(blind_factor),
                                     G2, BigInteger.valueOf(amount));
        // Encode and return as 33-byte buffer in "compressed" format:
        return commit_C.getEncoded(true);
    }

    /**
     * Taking a guess here.  Really need to inspect and test edge cases.
     *
     * In particular, not sure how BigInteger handles negative values
     * when blinds_neg exceeds blinds_pos.
     */
    static BlindSum(blinds_pos, blinds_neg) {

        let verbose = false;
        let accumulator = BigInteger.ZERO;

        verbose && console.log("Blind Sum Accumulator:");

        for (let i = 0; i < blinds_pos.length; i++) {
            let blind = BigInteger.fromBuffer(blinds_pos[i]);
            accumulator = accumulator.add(blind);
            verbose && console.log("Accumul add: " + blind.toHex(32));
        }

        for (let i = 0; i < blinds_neg.length; i++) {
            let blind = BigInteger.fromBuffer(blinds_neg[i]);
            accumulator = accumulator.subtract(blind);
            verbose && console.log("Accumul sub: " + blind.toHex(32));
        }

        verbose && console.log("Accumulator: " + accumulator.toHex(32));
        accumulator = accumulator.mod(n);
        verbose && console.log("Accum mod n: " + accumulator.toHex(32));
        /***/ console.log(accumulator.toHex(32));
        return accumulator.toBuffer(32);

    }

    static BlindOverflow(blind_buf32) {
        let blind = BigInteger.fromBuffer(blind_buf32);
        let reduced = blind.mod(n);
        let overflow = (blind.equals(reduced)) ? false : true;
        return overflow;
    }

    static BlindOverflowOrZero(blind_buf32) {
        let blind = BigInteger.fromBuffer(blind_buf32);
        let reduced = blind.mod(n);
        let overflow = (blind.equals(reduced)) ? false : true;
        let iszero = (blind.equals(BigInteger.ZERO));
        let retbool = overflow || iszero;
        /***/ if (retbool) console.log("Very Rare Event");
        return retbool;
    }

}


/**
 *  NOTES:
 *
 *  (1) We do not support an explicitly-set exposed minimum value. (Don't see
 *  any reason why the user would want one, for the purpose here.) But an
 *  exposed minimum value MAY result from use of a non-zero base-10 exponent.
 *  (User may wish for this to reduce the size of the proof, should a per_kbyte
 *  charge apply.  Such a charge does not, at present, apply, so far as I know.)
 *
 *  (2) We support a more constrained range of values that can be proven as
 *  compared to the CPP implementation, since we assume integer values are
 *  represented by Double-Precision Floats, which give 53 bits of precision
 *  rather than 64.  This also lowers the range of allowed base-10 exponents.
 *  53 bits is still big enough to represent GRAPHENE_MAX_SUPPLY so we *should*
 *  be OK in this regard.
 *
 *  (3) We somewhat arbitrarily restrict the allowed base-10 exponent to 12.  We
 *  could support more, but it restricts the range that remains hidden to less
 *  than 14 bits, putting privacy at risk (and suggests a large honeypot).  In
 *  fact, even a value of 12 should be used extreme care.  (It may be advisable
 *  in practice to use a value of 6 or lower, bearing in mind the precision of
 *  the asset being hidden.)
 *
 */

const FPPIntBits = 53;      // Precision Integer bits in double-precision
                            // Floating Point values.
const FPPIntMax = 2**53-1;  // Maximim precisely-representable integer in the
                            // 52-bit mantissa of a double-precision float with
                            // implied leading bit.

class RangeProof {

    /**
     * We construct with parameters about how we DO the range proof.
     *
     * (In our implementation, this is only the base-10 exponent, thus far, as
     * we let min_value and mantissabits be implicit.)
     */
    constructor(exponent = 0) {

        this.exponent = Math.floor(exponent);

        assert(this.exponent >= 0 && this.exponent <= 12);

        // Internal data:  (declaring here mainly to document)
        this.ringcommits = [];  // One for each 4-bits of mantissa
    }

    /**
     * User-facing SignValue() function lets user compute a range proof for a
     * given value commitment as simply proof = RangeProof.SignValue(...) using
     * default parameters and without having to instantiate a RangeProof object.
     * If user wants fine control over the parameters, e.g. to set the exponent
     * parameter, then they should do RP = new RangeProof(...); ... proof =
     * RP.Sign(); instead.
     *
     * @arg value - Total value to prove (inclusive of any "minimum value" to
     *              reveal). Numeric value type .lte. 52 bits.
     * @arg blind - Blind factor used in commitment
     * @arg nonce - Seed for deterministic RNG
     * @arg commitment - The commitment we are constructing a proof for (do we
     *                   actually need this?)
     */
    static SignValue(value, blind, nonce, commitment) {

        let RP = new RangeProof();

        RP.SetValue(value);
        RP.ComputeRadix4Arrays();   // Gets us this.secidx and this.commitvals
        RP.GenRand(nonce, blind);   // Computes blinds, nonces, and fake signatures
        //RP.EmbedMessage("");
        RP.BuildCommitsAndPubs();   // Radix-4 Commits and PubKey Rings
        //RP.BorromeanSign();

        /***/ console.log("RP Object so far:", RP);

        // return a Uint8Array (or maybe higher level object. ByteBuffer?)
        // Signal failure with zero-length buffer?  Or exception?
        //return RP.Serialize();

    }

    /**
     * Set proof value and and separate into encoded (hidden) and visible
     * minimum values based on desired base-10 exponent.
     */
    SetValue(value) {

        this.value = Math.floor(value); // Drop non-integer part
        assert(this.value >= 0, "Value to prove must be non-negative");
        assert(this.value <= FPPIntMax, "Value exceeds maximum provable");

        this.scale = 10**this.exponent;
        this.mantissaval = Math.floor(this.value / (this.scale));
        assert(this.mantissaval > 0, "Value cannot be represented with requested exponent");
                        /* (Well, it *can* be, but value would be revealed in min_value.) */

        this.min_value = this.value - (this.mantissaval * this.scale);

        let max_bits = Math.floor(FPPIntMax/this.scale).toString(2).length;
        let min_bits = this.mantissaval.toString(2).length; // Hokey way to get bit length
        this.mantissabits = Math.max(max_bits,min_bits);    // (But works for 32+ bits)
        assert(this.mantissabits > 0, "No mantissa bits");  // <- Should never happen
        assert(this.mantissabits <= FPPIntBits, "Mantissa too big");  //  ''

    }

    /**
     * Computes secidx and ringvalue arrays.  Assumes mantissaval, mantissabits,
     * and scale are already set.
     */
    ComputeRadix4Arrays() {

        this.nrings = Math.ceil(this.mantissabits/2);
        this.oddbits = ((this.mantissabits % 2) === 1);

        this.secidx = [];
        this.commitvals = [];

        // Put the mantissa bits in a string and pad to correct length. We use
        // this to extract radix 4 base, rather than bit-shifting and masking,
        // because javascript doesn't define bitshifts for values > 32-bits.
        let bitstring = this.mantissaval.toString(2);
        bitstring = "0".repeat(this.nrings*2 - bitstring.length) + bitstring;
        assert(bitstring.length % 2 === 0);
        assert(bitstring.length === this.nrings*2);

        for (let i = 0; i < this.nrings; i++)  {
            let r4str = bitstring.slice(-2*(i+1)).slice(0,2);
            let r4bit = parseInt(r4str, 2);
            this.secidx.push(r4bit);
            let commitval = r4bit * 4**i * this.scale;
            this.commitvals.push(commitval);
        }

        ///***/ console.log("SecIdx", this.secidx);
        ///***/ console.log("CommitVals", this.commitvals);

    }

    BuildCommitsAndPubs() {

        this.ringcommits = [];

        /***/ console.log("Start commits...");
        for (let i = 0; i < this.nrings; i++) {
            let unitval = 4**i * this.scale;
            let commitval = unitval * this.secidx[i];
            let commit = StealthZK.BlindCommit(this.blinds[i], commitval);
            // Ugh slow...
            this.ringcommits.push(commit);
        }
        /***/ console.log("End commits...");

    }

    /**
     *  Generates "random" values for use as blinding factors for the ring
     *  commits and for the forged signatures.  Random values are determined
     *  HMAC with nonce as an initializer.  Nonce is a value knowable to both
     *  sender and receiver (but no one else) and allows the determistic random
     *  values to be XOR'ed with a message readable only by the recipient.
     *
     *  NOTE: TEMP: At present, we are not following correct rfc6979 to generate
     *  random values, thus message encoding is NOT happening. This is OK for
     *  NOW as at present this message feature is not used on the BitShares
     *  network.
     *
     */
    GenRand(nonce, blindtarget) {

        this.rfc6979_initialize(nonce); // TEMP real one needs more seed data

        this.blinds = [];
        this.sigs = [];
        let blind_accum = StealthZK.BlindSum([],[]);  // A zero sum

        for (let i = 0; i < this.nrings; i++) {
            if (i < this.nrings-1) {
                let tmp = this.rfc6979_generate_blind32();
                blind_accum = StealthZK.BlindSum([blind_accum, tmp],[]);
                this.blinds.push(tmp);
            } else {
                let tmp = StealthZK.BlindSum([blindtarget],[blind_accum]);
                this.blinds.push(tmp);
            }
        }

    }

    /**
     * Initialize state-space for rfc6979 deterministic RNG based on HMAC
     * sha256.
     *
     * NOTE: TODO: NOT handled correctly yet.
     *
     */
    rfc6979_initialize(nonce) {
        this.rfc6979state = nonce;  // VERY VERY VERY TEMP TODO FIX
    }

    /**
     * Returns a "randomly" generated 32-byte value suitable for use as a
     * blinding factor (meaning fits within the curve order; we iterate if
     * overflow or zero).
     */
    rfc6979_generate_blind32() {

        // VERY VERY VERY TEMP TODO FIX - seeding has not been done correctly
        // and if there needs to be extra state data it's not handled here yet

        do {
            this.rfc6979state = hash.sha256(this.rfc6979state);
        } while (StealthZK.BlindOverflowOrZero(this.rfc6979state));
          // Tries again if overflow (exceedingly rare)

        return this.rfc6979state;

    }

}

export default StealthZK;
export {StealthZK, RangeProof};
