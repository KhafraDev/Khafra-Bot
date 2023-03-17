# Setting it up

The process to run this was pretty annoying, so hopefully it's better now! At least the data is unchanging so we don't need to worry about it once its been uploaded.

- Use code from [this old file](https://github.com/KhafraDev/Khafra-Bot/blob/69d70720525219cf3c943b9758bd438e3c2ebf15/src/lib/Migration/Bible.ts) to parse each line. You can't upload the entirety of the table because it's "too long", so you must either split it into multiple files, or use the console in the dashboard and manually insert it ~10k lines at a time.
- The file is hosted [here](https://archive.org/download/kjvdat.txt/kjvdat.txt.gz); you can use node's `zlib.unzipSync` to extract the content.
- Follow the steps in the [guide](https://developers.cloudflare.com/d1/get-started/).
