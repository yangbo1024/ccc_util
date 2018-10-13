
var
    NBBY = 8,
    MATCH_BITS = 6,
    MATCH_MIN = 3,
    MATCH_MAX = ((1 << MATCH_BITS) + (MATCH_MIN - 1)),
    OFFSET_MASK = ((1 << (16 - MATCH_BITS)) - 1),
    LEMPEL_SIZE = 256;


function compress(sstart, dstart) {
    var
        slen = 0,
        src = 0,
        dst = 0,
        cpy = 0,
        copymap = 0,
        copymask = 1 << (NBBY - 1),
        mlen = 0,
        offset = 0,
        hp = 0,
        lempel = new Int32Array(LEMPEL_SIZE),
        i = 0;

    // Initialize lempel array.
    for(i = 0; i < LEMPEL_SIZE; i++)
    {
        lempel[i] = -858993460;
    }

    slen = sstart.length;

    while (src < slen)
    {
        if ((copymask <<= 1) == (1 << NBBY)) {
            copymask = 1;
            copymap = dst;
            dstart[dst++] = 0;
        }

        if (src > slen - MATCH_MAX) {
            dstart[dst++] = sstart[src++];
            continue;
        }

        hp = ((sstart[src] + 13) ^
                (sstart[src + 1] - 13) ^
                sstart[src + 2]) &
                (LEMPEL_SIZE - 1);

        offset = (src - lempel[hp]) & OFFSET_MASK;
        lempel[hp] = src;
        cpy = src - offset;

        if (cpy >= 0 && cpy != src &&
            sstart[src] == sstart[cpy] &&
            sstart[src + 1] == sstart[cpy + 1] &&
            sstart[src + 2] == sstart[cpy + 2]) {
            dstart[copymap] |= copymask;
            for (mlen = MATCH_MIN; mlen < MATCH_MAX; mlen++)
                if (sstart[src + mlen] != sstart[cpy + mlen])
                    break;
            dstart[dst++] = ((mlen - MATCH_MIN) << (NBBY - MATCH_BITS)) |
                            (offset >> NBBY);
            dstart[dst++] = offset;
            src += mlen;
        } else {
            dstart[dst++] = sstart[src++];
        }
    }

    console.assert(sstart.length >= src);

    return dst;
}

function decompress(sstart, slen, dstart) {
    slen = slen | 0;
    var
        src = 0,
        dst = 0,
        cpy = 0,
        copymap = 0,
        copymask = 1 << (NBBY - 1 | 0),
        mlen = 0,
        offset = 0;

    //var avg_mlen = [];

    while (src < slen)
    {
        if ((copymask <<= 1) === (1 << NBBY))
        {
            copymask = 1;
            copymap = sstart[src];
            src = src + 1 | 0;
        }

        if (copymap & copymask)
        {
            mlen = (sstart[src] >> (NBBY - MATCH_BITS | 0)) + MATCH_MIN | 0;
            offset = ((sstart[src] << NBBY) | sstart[src + 1 | 0]) & OFFSET_MASK;
            src = src + 2 | 0;

            cpy = dst - offset | 0;
            {
                while (mlen > 4)
                {
                    dstart[dst] = dstart[cpy];
                    dst = dst + 1 | 0;
                    cpy = cpy + 1 | 0;

                    dstart[dst] = dstart[cpy];
                    dst = dst + 1 | 0;
                    cpy = cpy + 1 | 0;

                    dstart[dst] = dstart[cpy];
                    dst = dst + 1 | 0;
                    cpy = cpy + 1 | 0;

                    dstart[dst] = dstart[cpy];
                    dst = dst + 1 | 0;
                    cpy = cpy + 1 | 0;

                    mlen = mlen - 4 | 0;
                }

                while (mlen > 0)
                {
                    dstart[dst] = dstart[cpy];
                    dst = dst + 1 | 0;
                    cpy = cpy + 1 | 0;
                    mlen = mlen - 1 | 0;
                }
            }
        }
        else
        {
            dstart[dst] = sstart[src];
            dst = dst + 1 | 0;
            src = src + 1 | 0;
        }
    }
    return dst;
}

module.exports = {
    compress: compress,
    decompress: decompress,
};
