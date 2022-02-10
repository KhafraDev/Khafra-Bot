/* eslint-disable */
import { inflateRawSync } from 'zlib';
import { Buffer } from 'buffer';

/**
 * An extremely stripped down version of ADM-Zip that only unzips
 * @license https://github.com/cthackers/adm-zip/blob/master/LICENSE
 */

export const ZipFile = (inBuffer: Buffer) => {
    const mainHeader = MainHeader();
    const entryList = Array(1) as { getData: () => Buffer; header: Buffer; }[];
    
    let i = inBuffer.length - 22, // END header size
        max = Math.max(0, i - 0xffff), // 0xFFFF is the max zip file comment length
        endStart = inBuffer.length,
        endOffset = -1; // Start offset of the END header

    for (; i >= max; i--) {
        if (inBuffer.readUInt32LE(i) === 0x06054b50) {
            endOffset = i;
            endStart = i + 22;
            max = i - 20;
        }
    }

    mainHeader.loadFromBinary(inBuffer.slice(endOffset, endStart));
    let index = mainHeader.offset; // offset of first CEN header

    for (let i = 0; i < entryList.length; i++) {
        const entry = ZipEntry(inBuffer);
        entry.header = inBuffer.slice(index, (index += 46));
        
        entryList[i] = entry;
    }

    return entryList;
}

const ZipEntry = (input: Buffer) => {
    const _entryHeader = EntryHeader();
    
    return {
        getData: () => {
            _entryHeader.loadDataHeaderFromBinary(input);
            const compressedData = input.slice(_entryHeader.realDataOffset, _entryHeader.realDataOffset + _entryHeader.compressedSize);
            const data = Buffer.alloc(_entryHeader.size);
    
            inflateRawSync(compressedData).copy(data, 0);
    
            return data;
        },

        set header(data: Buffer) {
            _entryHeader.loadFromBinary(data);
        }
    }
}

const EntryHeader = () => {
    let _compressedSize = 0,
        _size = 0,
        _offset = 0,
        _dataHeader = {} as Record<string, number>;

    return {
        get compressedSize() { return _compressedSize; },
        get size() { return _size; },
        get offset() { return _offset; },
        get realDataOffset() { return _offset + 30 + _dataHeader['fnameLen']! + _dataHeader['extraLen']!; },

        loadDataHeaderFromBinary: (input: Buffer) => {
            const data = input.slice(_offset, _offset + 30);
  
            _dataHeader = {
                // uncompressed size
                size: data.readUInt32LE(22),
                // filename length
                fnameLen: data.readUInt16LE(26),
                // extra field length
                extraLen: data.readUInt16LE(28)
            };
        },

        loadFromBinary: (data: Buffer) => {
            // compressed size
            _compressedSize = data.readUInt32LE(20);
            // uncompressed size
            _size = data.readUInt32LE(24);
            // LOC header offset
            _offset = data.readUInt32LE(42);
        }
    }
}

const MainHeader = () => {
    let _offset = 0;

    return {
        get offset() { return _offset; },

        loadFromBinary: (data: Buffer) => {
            // offset of first CEN header
            _offset = data.readUInt32LE(16);
        }
    }
}
/* eslint-enable */