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
import {jssha256} from "js-sha256" //testing
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
 *  (2a) Actually it turns out that if the proven range exceeds
 *  GRAPHENE_MAX_SHARE_SUPPLY (even if the value hidden is less) the network
 *  will reject the transaction.  So we want to use a max bit length of less
 *  than the MAX.  Log2(MAX_SUPPLY) is actually 49.829.  Allowing some headroom
 *  expansion from using the base-10 exponent feature, I set a bit length max of
 *  48 to avoid crossing the MAX_SUPPLY.
 *
 *  (3) We somewhat arbitrarily restrict the allowed base-10 exponent to 12.  We
 *  could support more, but it restricts the range that remains hidden to less
 *  than 14 bits, putting privacy at risk (and suggests a large honeypot).  In
 *  fact, even a value of 12 should be used extreme care.  (It may be advisable
 *  in practice to use a value of 6 or lower, bearing in mind the precision of
 *  the asset being hidden.)
 *
 */

const FPPIntBits = 48;      // Precision Integer bits in double-precision
                            // Floating Point values.
const FPPIntMax = 2**48-1;  // Maximim precisely-representable integer in the
                            // 52-bit mantissa of a double-precision float with
                            // implied leading bit.

const RPPrivacyTarget = 2**25-1;    // Ensure at least this many bits are hidden
                                    // by range proof.  (Can set this target to
                                    // less than FPPIntMax if we want to default
                                    // to faster/smaller range proofs at the
                                    // expense of some privacy.)

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
    static SignValue(value, blind, nonce /*, commitment*/) {

        let RP = new RangeProof(5);

        RP.SetValue(value);
        RP.commitment = StealthZK.BlindCommit(blind, value);

        /***/ console.log("Constructing range proof of " + RP.value +
                          " revealing " + RP.min_value +
                          " minimum amount and hiding " + RP.mantissabits +
                          " bits of precision.");
        /***/ console.log("Range to be proven: (min: " + RP.min_value +
                          ", (actual: " + RP.value + "), max: " +
                          ((2**RP.mantissabits-1)*RP.scale + RP.min_value) + ")");

        RP.ComputeRadix4Arrays();   // Gets us this.secidx and this.commitvals
        RP.GenRand(nonce, blind);   // Computes blinds, nonces, and fake signatures
        RP.BuildCommitsAndPubs();   // Radix-4 Commits and PubKey Rings
        RP.BorromeanSign();
        RP.Serialize();

        /***/ console.log("RP Object so far:", RP);

        // return a Uint8Array (or maybe higher level object. ByteBuffer?)
        // Signal failure with zero-length buffer?  Or exception?
        return RP.proof_serialized;

    }

    /**
     * Set proof value and and separate into encoded (hidden) and visible
     * minimum values based on desired base-10 exponent.
     *
     * Sets:  this.value
     *        this.scale
     *        this.mantissaval
     *        this.min_value
     *        this.mantissabits
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

        let max_bits = Math.floor(RPPrivacyTarget/this.scale).toString(2).length;
        let min_bits = this.mantissaval.toString(2).length; // Hokey way to get bit length
        this.mantissabits = Math.max(max_bits,min_bits);    // (But works for 32+ bits)
        assert(this.mantissabits > 0, "No mantissa bits");  // <- Should never happen
        assert(this.mantissabits <= FPPIntBits, "Mantissa too big");  //  ''

    }

    /**
     * Computes secidx and ringvalue arrays.  Assumes mantissaval, mantissabits,
     * and scale are already set.
     *
     * Sets:  this.nrings
     *        this.obbbits (bool)
     *        this.secidx[]
     *        this.commitvals[]
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
     *  Sets:  this.blinds[]
     *         this.sigs[][]
     *         this.knonces[]
     */
    GenRand(nonce, blindtarget) {

        this.rfc6979_initialize(nonce); // TEMP real one needs more seed data

        this.blinds = [];
        this.sigs = [];
        this.knonces = [];
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
            let sigset = [];
            let ringsize = ((i == this.nrings-1) && this.oddbits) ? 2 : 4;
            for (let j = 0; j < ringsize; j++) {
                let tmp = this.rfc6979_generate_blind32(true/*, msgbytes*/);
                                                    // (Must abort on overflows :TODO:)
                if (j == this.secidx[i]) {
                    this.knonces.push(tmp);
                    sigset.push(BigInteger.ZERO.toBuffer(32));
                } else {
                    sigset.push(tmp);
                }
            }
            this.sigs.push(sigset);
        }
        assert(this.nrings == this.knonces.length, "Failed to generate all k values.");
    }

    /**
     *
     * Sets:  this.ringcommits[]     (TODO: Maybe remove)
     *        this.rings[][] (As Point objects, not Buffers)
     */
    BuildCommitsAndPubs() {

        this.ringcommits = [];  // Not needed since rings[i][0] is ringcommits[i]
        this.rings = [];        //  ^^ TODO: remove

        /***/ console.log("Building ring commitments for range proof... (slow...)");

        for (let i = 0; i < this.nrings; i++) {
            // Ugh slow...
            let unitval = 4**i * this.scale;
            let commitval = unitval * this.secidx[i];
            let PointCommit = G.multiplyTwo(BigInteger.fromBuffer(this.blinds[i]),
                                            G2, BigInteger.valueOf(commitval));
            let ring = [PointCommit];
            let ringsize = ((i == this.nrings-1) && this.oddbits) ? 2 : 4;
            for (let j = 1; j < ringsize; j++) {
                let bigval = BigInteger.valueOf(-j*unitval);
                let PointJ = PointCommit.add(G2.multiply(bigval));
                //ring.push(PointJ.getEncoded(true));
                ring.push(PointJ);
            }
            let commit = PointCommit.getEncoded(true); // 33-byte encoded form
            this.ringcommits.push(commit);
            this.rings.push(ring);
        }
        /***/ console.log("Ring commitments done.");

    }

    /**
     * Computes the Borromean Ring Signature
     *
     * Sets:  this.borro_e0
     *
     * Modifies:  this.sigs[][]  (Specifically, computes the non-forged sig)
    */
    BorromeanSign() {

        /***/ console.log("Borromean Ring Signing... (slow...)");

        // Construct the "message" that we sign (binds us to the proof)
        this.ProofMessage();    // result stored in this.borro_m

        let K_fin_bufs = []     // Accumulate finial K's

        // Get finial K_ij's and e0:
        for (let i = 0; i < this.nrings; i++) {

            let Ki = G.multiply(BigInteger.fromBuffer(this.knonces[i]));
            // TODO: assert Ki finite
            let Kprev_buf = Ki.getEncoded(true);

            let ringsize = ((i == this.nrings-1) && this.oddbits) ? 2 : 4;
            for (let j = this.secidx[i]+1; j < ringsize; j++) {

                let e_ij = this.BorromeanHash(Kprev_buf, i, j);
                // TODO: assert finite nooverflow
                let Kij = G.multiplyTwo(BigInteger.fromBuffer(this.sigs[i][j]),
                                        this.rings[i][j], BigInteger.fromBuffer(e_ij));
                // TODO: assert finite
                Kprev_buf = Kij.getEncoded(true);

            }
            K_fin_bufs.push(Kprev_buf);

        }
        K_fin_bufs.push(this.borro_m);  // Also append proof message
        let e0_data = Buffer.concat(K_fin_bufs);
        this.borro_e0 = jssha256(e0_data);

        /***/ console.log("...Got e0 value.");

        // Now compute the non-forged signatures:
        for (let i = 0; i < this.nrings; i++) {

            let e_ij = this.BorromeanHash(this.borro_e0, i, 0);
            // TODO: assert finite nooverflow

            for (let j = 0; j < this.secidx[i]; j++) {

                let Kij = G.multiplyTwo(BigInteger.fromBuffer(this.sigs[i][j]),
                                        this.rings[i][j], BigInteger.fromBuffer(e_ij));
                // TODO: assert finite
                e_ij = this.BorromeanHash(Kij.getEncoded(true), i, j+1);
                // TODO: assert finite nooverflow

            }

            let sigi = BigInteger.fromBuffer(e_ij)
                        .multiply(BigInteger.fromBuffer(this.blinds[i]))
                        .mod(n);
            sigi = BigInteger.fromBuffer(this.knonces[i]).subtract(sigi).mod(n);
            // TODO: assert finite
            this.sigs[i][this.secidx[i]] = sigi.toBuffer(32);

        }
        /***/ console.log("Borromean signature complete.");
    }

    /**
     * The "message" that we sign is the sha256 hash of the commitment whose
     * range we are proving, the proof header which sets the parameters of the
     * ring commitments, and all but the last of the radix-4 ring commitments
     * (since the last is inferrable from the others and the value commit).
     *
     * Sets:  this.borro_m
     *        this.proof_header
     */
    ProofMessage() {

        let hdr0 = 256*(64 | this.exponent | (this.min_value ? 32 : 0));
        hdr0 += (this.mantissabits - 1);
        let hdr_str = hdr0.toString(16);
        if (this.min_value) {
            let minvalstr = this.min_value.toString(16);
            minvalstr = "0".repeat(16-minvalstr.length) + minvalstr;
            hdr_str += minvalstr;
        }
        this.proof_header = Buffer.from(hdr_str, "hex");  // Can use later for
                                                          // serialization
        let full_msg = Buffer.concat([this.commitment, this.proof_header,
                                      Buffer.concat(this.ringcommits.slice(0,-1))]);

        this.borro_m = jssha256(full_msg);
        return this.borro_m;

    }

    /**
     *  In:  Kprev (Buffer 33 bytes) - previous K in ring
     *       ridx  (integer numeric) - ring index
     *       eidx  (integer numeric) - e index of resulting e
     *
     *  Assumes:   this.borro_m (Buffer 32 bytes) - proof message
     *
     *  Returns:  e_ij suitable for K_ij = e_ij * P_ij + s_ij * G
     */
    BorromeanHash(Kprev, ridx, eidx) {

        // Assuming nrings <= 32 and rsize <= 4, safe to upconvert integer
        // indices from bytes as follows:
        let ridx_buf = Buffer.from([0, 0, 0, ridx]);
        let eidx_buf = Buffer.from([0, 0, 0, eidx]);
        let data = Buffer.concat([Kprev, this.borro_m, ridx_buf, eidx_buf]);
        return jssha256(data);

    }

    /**
     *
     */
    Serialize() {

        /***/ console.log("Serializing Range Proof...");

        let header_buf = this.proof_header; // pre-calced by ProofMessage()

        // Sign bytes
        let num_sign_bytes = Math.ceil((this.nrings-1) / 8);
        let sign_bytes = Array(num_sign_bytes).fill(0);
        for (let i = 0; i < this.nrings-1; i++) {
            let signbit = this.rings[i][0].y.isEven() ? 0 : 1;
            sign_bytes[i>>3] |= (signbit << (i&7));
        }
        let sign_buf = Buffer.from(sign_bytes);

        // Ring commits less sign byte:
        let commit_bufs32 = [];
        for (let i = 0; i < this.nrings-1; i++) {
            commit_bufs32.push(this.rings[i][0].getEncoded(true).slice(-32));
        }
        let commits_buf = Buffer.concat(commit_bufs32);

        let e0_buf = this.borro_e0;

        // Signatures:
        let sigarray = [];
        for (let i = 0; i < this.nrings; i++) {
            let ringsize = ((i == this.nrings-1) && this.oddbits) ? 2 : 4;
            for (let j = 0; j < ringsize; j++) {
                sigarray.push(this.sigs[i][j]);
            }
        }
        let sigs_buf = Buffer.concat(sigarray);

        this.proof_serialized
            = Buffer.concat([header_buf, sign_buf, commits_buf, e0_buf, sigs_buf]);

        /***/ console.log("Done. Range proof serialized to " +
                          this.proof_serialized.length + " bytes.");

        return this.proof_serialized;

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
     *
     * Added skeleton support for masking a message on top of the bits before
     * returning.  We should abort on overflow in that case.
     *
     * TODO: this message masking ability should actually be forked into a
     * differently named function, for clarity of use case.
     */
    rfc6979_generate_blind32(abort_on_invalid = false, maskmsg = null) {

        // VERY VERY VERY TEMP TODO FIX - seeding has not been done correctly
        // and if there needs to be extra state data it's not handled here yet

        let retval = null;
        let invalid = false;

        do {
            this.rfc6979state = jssha256(this.rfc6979state);
            retval = (maskmsg) ? this.rfc6979state /*TODO*/ : this.rfc6979state;
            invalid = StealthZK.BlindOverflowOrZero(retval);
            assert(!(invalid && abort_on_invalid), "Can't skip overflow with masked message");
        } while (invalid);
          // Tries again if overflow (exceedingly rare)

        return this.rfc6979state;

    }

}

export default StealthZK;
export {StealthZK, RangeProof};
