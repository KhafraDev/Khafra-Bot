import { fonts } from '#khaf/utility/Constants/Path.js';
import { GlobalFonts } from '@napi-rs/canvas';

// https://github.com/someblu/Microsoft-Fonts/

const used = {
    'Arial': fonts('Arial.ttf'),
    'Gabriola': fonts('Gabriola.ttf'),
    'Impact': fonts('Impact.ttf'),
    'Roboto': fonts('Roboto.ttf')
} as const;

for (const [name, path] of Object.entries(used)) {
    GlobalFonts.registerFromPath(path, name);
}