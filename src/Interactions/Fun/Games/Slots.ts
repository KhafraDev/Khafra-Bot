import { ImageUtil } from '#khaf/image/ImageUtil.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import { chunkSafe } from '#khaf/utility/Array.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { templates } from '#khaf/utility/Constants/Path.js'
import { createCanvas, Image } from '@napi-rs/canvas'
import type { InteractionReplyOptions } from 'discord.js'
import type { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'

const Dims = {
    Width: 1280,
    Height: 720
} as const

let image: Image | undefined
let bar: Image | undefined

const possible = [
    '🍎', '🍇', '🍑',
    '🍓', '🍋', '🍒',
    '🍌', '🍊', '🍉',
    '🍎', '🍇', '🍑',
    '🍓', '🍋', '🍒',
    '🍌', '🍊', '🍉',
    'BAR', 'BARBAR', 'BARBARBAR'
]

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'games',
            name: 'slots'
        })
    }

    async handle (): Promise<InteractionReplyOptions> {
        const board = chunkSafe(Array.from(
            { length: 9 },
            () => possible[Math.floor(Math.random() * possible.length)]
        ), 3)

        const slots = await this.image(board)

        return {
            embeds: [
                Embed.json({
                    color: colors.ok,
                    image: { url: 'attachment://slots.png' }
                })
            ],
            files: [{
                attachment: slots,
                name: 'slots.png'
            }]
        }
    }

    async image (board: string[][]): Promise<Buffer> {
        const canvas = createCanvas(Dims.Width, Dims.Height)
        const ctx = canvas.getContext('2d')

        if (!image || !bar) {
            image = new Image()
            image.width = Dims.Width
            image.height = Dims.Height
            image.src = readFileSync(templates('slots-background.png'))

            bar = new Image()
            bar.src = readFileSync(templates('slots-bar.png'))
        }

        ctx.drawImage(image, 0, 0, Dims.Width, Dims.Height)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                if (board[i][j].includes('BAR')) {
                    ctx.font = '120px Arial'
                    const BAR = board[i][j].length / 3
                    const x = canvas.width / 1.5 + (j * 120) + (j * 40)
                    const y = i * 155 + 150

                    if (BAR === 3) {
                        ImageUtil.centerImage(ctx, bar, x, y - 35, 120, 30)
                        ImageUtil.centerImage(ctx, bar, x, y, 120, 30)
                        ImageUtil.centerImage(ctx, bar, x, y + 35, 120, 30)
                    } else if (BAR === 2) {
                        ImageUtil.centerImage(ctx, bar, x, y - 15, 120, 30)
                        ImageUtil.centerImage(ctx, bar, x, y + 15, 120, 30)
                    } else {
                        ImageUtil.centerImage(ctx, bar, x, y, 120, 30)
                    }
                } else {
                    ctx.font = '120px Apple Color Emoji'
                    ctx.fillText(
                        board[i][j],
                        canvas.width / 1.5 + (j * 120) + (j * 40),
                        150 + i * 150
                    )
                }
            }
        }

        ctx.fillStyle = '#231f20'
        ctx.font = '120px Gabriola'
        let won = false

        for (const [a, b, c] of board) {
            if (a === b && a === c) {
                ctx.fillText('You won!', 400, 315)
                won = true
                break
            } else if (
                a.includes('BAR') &&
                b.includes('BAR') &&
                c.includes('BAR')
            ) {
                ctx.fillText('You won!', 400, 315)
                won = true
                break
            }
        }

        if (!won) {
            ctx.fillText('You lost!', 400, 315)
        }

        return canvas.toBuffer('image/png')
    }
}