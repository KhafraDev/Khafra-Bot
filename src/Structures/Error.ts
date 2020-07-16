import { writeFile, existsSync } from 'fs';
import { join } from 'path';

class KhafraError extends Error {
    static ErrorDir = join(process.cwd(), 'Error');

    name: string;
    description: string;
    occurance?: string;

    constructor(
        name: string, 
        description: string, 
        occurance?: string
    ) {
        super(`[${name}]: "${description}" ${occurance ?? ''}`);
        this.name = name;
        this.description = description;
        this.occurance = occurance;

        this.write();
    }

    /**
     * Write error to file
     */
    write(): void {
        /**
         * @example 
         * 7-15-2020-1:29:56-PM.error
         */
        const fileName = new Date().toLocaleString().replace(/,\s|\s|\/|:/g, '-') + '.error';
        const filePath = join(KhafraError.ErrorDir, fileName);

        if(existsSync(filePath)) {
            throw new KhafraError(this.name, this.description, this.occurance);
        }

        writeFile(filePath, `[${this.name}]: "${this.description}" ${this.occurance ?? ''}`, () => {
            // non-blocking
            process.stdout.write(`Wrote file ${fileName} to ${filePath}!\n`);
            throw this;
        });
    }
}

export default KhafraError;