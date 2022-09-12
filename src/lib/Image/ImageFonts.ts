import { fonts } from '#khaf/utility/Constants/Path.js'
import { GlobalFonts } from '@napi-rs/canvas'

const used = {
    'Arial': fonts('Arial.ttf'),
    'Gabriola': fonts('Gabriola.ttf'),
    'Impact': fonts('Impact.ttf'),
    'Roboto': fonts('Roboto.ttf'),
    'Apple Color Emoji': fonts('AppleColorEmoji.ttf'),
    'Segoe UI Emoji': fonts('seguiemj.ttf')
} as const

for (const [name, path] of Object.entries(used)) {
    GlobalFonts.registerFromPath(path, name)
}