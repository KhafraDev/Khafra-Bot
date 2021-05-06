const decoder = new TextDecoder('utf-8');
const file = Deno.readFileSync('./.env');
const text = decoder.decode(file).split(/\r\n|\n/g);

for (const line of text) {
    const [k, ...v] = line.split('=');
    Deno.env.set(k, v.join('='));
}