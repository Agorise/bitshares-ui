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

        let verbose = true;
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

}

export default StealthZK;
