import * as JimpType from 'jimp/types';
import { Buffer } from 'buffer'
import { DVBuffer } from '@/services/Utils'

interface VDP1IconConfig {
    width: number,
    height: number
}


function RGB8888To555Number(a: number, b: number, g: number, r: number) {
    if (a)
        return 0x8000 |
            ((b >> 3) << 10) |
            ((g >> 3) << 5) |
            ((r >> 3));
    else
        return 0
}


export default class IconsExporter {
    image?: JimpType

    async loadImage(url: string) {
        //const image = await Jimp.read("/workspaces/loader_yaul/assets/aurelie.png")
        const image: JimpType = await Jimp.read(url)

        this.image = image
    }


    async build() {
        const { image } = this;

        if (image) {
            const iconbuff = new DVBuffer()
            iconbuff.addUint8(image.bitmap.width)
            iconbuff.addUint8(image.bitmap.height)
            iconbuff.addUint8(image.bitmap.height / 16)
            iconbuff.addUint8(0)

            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                const color = RGB8888To555Number(
                    this.bitmap.data[idx + 3],
                    this.bitmap.data[idx + 2],
                    this.bitmap.data[idx + 1],
                    this.bitmap.data[idx + 0])

                iconbuff.addUint16(color)
            })
            return iconbuff.data()
        }

        return null

    }
}
