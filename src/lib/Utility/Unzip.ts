import { Buffer } from 'node:buffer'
import { inflateRawSync } from 'node:zlib'

/**
 * An extremely stripped down version of ADM-Zip that only unzips
 * @license https://github.com/cthackers/adm-zip/blob/master/LICENSE
 */

export const ZipFile = (inBuffer: Buffer): Buffer => {
    let i = inBuffer.length - 22, // END header size
	    max = Math.max(0, i - 0xffff), // 0xFFFF is the max zip file comment length
	    endStart = inBuffer.length,
	    endOffset = -1 // Start offset of the END header

    for (; i >= max; i--) {
        if (inBuffer.readUInt32LE(i) === 0x06054b50) {
            endOffset = i
            endStart = i + 22
            max = i - 20
        }
    }

    const index = inBuffer.slice(endOffset, endStart).readUint32LE(16)

    return ZipEntry(inBuffer, index)
}

const ZipEntry = (input: Buffer, index: number): Buffer => {
    const entryHeader = new EntryHeader()
    entryHeader.loadFromBinary(input.slice(index, index + 46))
    entryHeader.loadDataHeaderFromBinary(input)

    const compressedData = input.slice(entryHeader.realDataOffset, entryHeader.realDataOffset + entryHeader.compressedSize)
    const data = Buffer.alloc(entryHeader.size)

    inflateRawSync(compressedData).copy(data, 0)

    return data
}

class EntryHeader {
    compressedSize = 0
    size = 0
    offset = 0
    dataHeader: Record<string, number> = {}

    get realDataOffset (): number {
        return this.offset + 30 + this.dataHeader['fnameLen'] + this.dataHeader['extraLen']
    }

    loadDataHeaderFromBinary (input: Buffer): void {
        const data = input.slice(this.offset, this.offset + 30)

        this.dataHeader = {
            // uncompressed size
            size: data.readUInt32LE(22),
            // filename length
            fnameLen: data.readUInt16LE(26),
            // extra field length
            extraLen: data.readUInt16LE(28)
        } as const
    }

    loadFromBinary (data: Buffer): void {
        // compressed size
        this.compressedSize = data.readUInt32LE(20)
        // uncompressed size
        this.size = data.readUInt32LE(24)
        // LOC header offset
        this.offset = data.readUInt32LE(42)
    }
}
