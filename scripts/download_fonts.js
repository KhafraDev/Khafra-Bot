import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { request } from 'undici';
import { fileURLToPath } from 'url';

const fontDir = join(fileURLToPath(import.meta.url), '../../assets/Fonts')
const fonts = {
	'AppleColorEmoji.ttf': 'https://github.com/samuelngs/apple-emoji-linux/releases/download/ios-15.4/AppleColorEmoji.ttf',
	'Arial.ttf': 'https://raw.githubusercontent.com/someblu/Microsoft-Fonts/master/arial.ttf',
	'Gabriola.ttf': 'https://raw.githubusercontent.com/someblu/Microsoft-Fonts/master/Gabriola.ttf',
	'Impact.ttf': 'https://raw.githubusercontent.com/KhafraDev/Khafra-Bot/a7cbd1db105c06b690a2a23cac4a5effa3ceee2e/assets/Fonts/Impact.ttf',
	'Roboto.ttf': 'https://raw.githubusercontent.com/KhafraDev/Khafra-Bot/a7cbd1db105c06b690a2a23cac4a5effa3ceee2e/assets/Fonts/Roboto.ttf',
	'seguiemj.ttf': 'https://cdn.discordapp.com/attachments/503024525076725775/1018981525611630633/seguiemj.ttf'
}

if (!existsSync(fontDir)) {
	mkdirSync(fontDir)
}

const errors = []

for (const [fileName, url] of Object.entries(fonts)) {
	if (existsSync(join(fontDir, fileName))) {
		continue
	}

	console.log(`downloading ${fileName}...`)
	const { body, statusCode } = await request(url)

	if (statusCode !== 200) {
		errors.push(`unexpected status code while downloading ${fileName}: ${statusCode} (${await body.text()})`)
	}

	const buffer = Buffer.from(await body.arrayBuffer())
	console.log(`downloaded ${fileName}`)

	writeFileSync(join(fontDir, fileName), buffer)
}

if (errors.length === 0) {
	console.log('OK. done')
} else {
	console.log(...errors)
}