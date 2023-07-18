import { fenrirDefaultConfig, type FenrirConfig } from '@/models/screens'
import { defineStore } from 'pinia'
import { useStorage, type RemovableRef } from '@vueuse/core'
import ImageTiler from '@/services/VDP2Tiler'
import { THEME_ID, ThemeConfigToBuffer, ThemeExport } from '@/services/ExportFenrirThemeConfig'
import { BlobToBase64, DVBuffer, downloadBuffer, downloadFile } from '@/services/Utils'
import { fonts, FontBuilder } from '@/services/FontBuilder'
import IconsExporter from '@/services/Icons'


interface BackgroundState {
    paletteSize: number,
    tilesCount: number,
    imageW: number,
    imageH: number
}
export interface State {
    config: RemovableRef<FenrirConfig>,
    backgroundImage: RemovableRef<string>, /* base 64*/
    foregroundImage: RemovableRef<string>, /* base 64*/
    font: RemovableRef<typeof fonts[number]['name']>,
    foregroundStats: BackgroundState,
    backgroundStats: BackgroundState,
    icons: RemovableRef<string>, /* base 64*/
    backgroundImageUrl: string,
    foregroundImageUrl: string,
    iconsImageUrl: string,
}


const context: { fontCanvas?: HTMLCanvasElement, fontBuilder?: FontBuilder } = {
    fontCanvas: undefined,
    fontBuilder: undefined,
}

const b64serializer = {
    read: (v: string) => {
        // base 64 to blob
        //const b = atob(v)
        //return b
        console.log(v)
        return v
    },
    write: (b64: string) => {
        //return btoa(b64)
        console.log(b64)
        return b64
    }
}

export const useThemeConfigStore = defineStore('theme', {
    state: (): State => {
        return {
            //================================================
            // Saved in local storage
            //================================================
            config: useStorage<FenrirConfig>('theme-config', fenrirDefaultConfig),
            backgroundImage: useStorage<string>('theme-background', '', undefined, {
                serializer: b64serializer
            }),
            foregroundImage: useStorage<string>('theme-foreground', '', undefined, {
                serializer: b64serializer
            }),
            font: useStorage<string>('theme-font', fonts[0].name),
            icons: useStorage<string>('theme-icons', '', undefined, {
                serializer: b64serializer
            }),
            //================================================
            // Not saved
            //================================================
            foregroundStats: {
                imageH: 0,
                imageW: 0,
                paletteSize: 0,
                tilesCount: 0
            },
            backgroundStats: {
                imageH: 0,
                imageW: 0,
                paletteSize: 0,
                tilesCount: 0
            },
            backgroundImageUrl: '',
            foregroundImageUrl: '',
            iconsImageUrl: ''
        }
    },
    getters: {
    },

    actions: {
        async init() {
            await this.loadBackground()
            await this.loadForeground()
            await this.loadDeviceIcons()

            const initBlob = {
                backgroundImage: 'backgroundImageUrl',
                foregroundImage: 'foregroundImageUrl',
                icons: 'iconsImageUrl',
            }

            Object.entries(initBlob).forEach(([blob, url]) => {
                // @ts-ignore
                const self: Record<string, string> = this;
                const ii = Uint8Array.from(atob(self[blob]), (c) => c.charCodeAt(0))
                self[url] = URL.createObjectURL(new Blob([ii]))
            })

        },

        //================================================
        async loadBackground() {
            const tiler = new ImageTiler()

            await tiler.loadImage(this.backgroundImage)

            this.backgroundStats = tiler.getStats()
        },
        async loadForeground() {
            const tiler = new ImageTiler()
            await tiler.loadImage(this.foregroundImage)

            this.foregroundStats = tiler.getStats()
        },
        async loadDeviceIcons() {
            const icons = new IconsExporter()
            if (this.iconsImageUrl) {
                await icons.loadImage(this.iconsImageUrl)

            }
        },

        //================================================
        async updateBackground(blob: Blob) {
            const b64 = await BlobToBase64(blob)
            if (b64) {
                this.backgroundImageUrl = URL.createObjectURL(blob)
                this.backgroundImage = b64
            }

            this.loadBackground()
        },
        async updateForeground(blob: Blob) {
            const b64 = await BlobToBase64(blob)
            if (b64) {
                this.foregroundImageUrl = URL.createObjectURL(blob)
                this.foregroundImage = b64
            }

            this.loadForeground()
        },
        async updateIcons(blob: Blob) {
            const b64 = await BlobToBase64(blob)
            if (b64) {
                this.iconsImageUrl = URL.createObjectURL(blob)
                this.icons = b64
            }
        },
        //================================================
        async initFonts(canvas: HTMLCanvasElement) {
            context.fontBuilder = new FontBuilder(canvas);
            context.fontCanvas = canvas

            await context.fontBuilder.loadAllFonts()

            context.fontBuilder.setFont(this.font)
            context.fontBuilder.drawCharInCanvas()
        },
        async updateFont(font: string) {
            this.font = font
        },
        //================================================
        updateGamelistFocusColors(c: any) {
            Object.assign(this.config.screens.gamelist.browser.focused_color, c)
        },
        updateGamelistItemColors(c: any) {
            Object.assign(this.config.screens.gamelist.browser.item_color, c)
        },
        updateAreaGamelistBrowser(c: any) {
            Object.assign(this.config.screens.gamelist.browser, c)
        },
        updateAreaGamelistCover(c: any) {
            Object.assign(this.config.screens.gamelist.cover, c)
        },
        updateAreaGamelistDeviceIcon(c: any) {
            Object.assign(this.config.screens.gamelist.deviceIcon, c)
        },


        //================================================
        exportTheme() {
            const toSave = [
                'theme-config',
                'theme-background',
                'theme-foreground',
                'theme-font',
                'theme-icons'
            ]

            const json: any = {}

            toSave.forEach(k => {
                // @ts-ignore
                json[k] = localStorage.getItem(k);
            })

            downloadFile(JSON.stringify(json), 'theme.json')
        },

        importTheme(content: string) {
            const state = JSON.parse(content)
            const toSave = {
                'theme-config': (d: string) => { 
                    Object.assign(this.config, JSON.parse(d))
                 },
                'theme-background': (d: string) => { this.backgroundImage = atob(d) },
                'theme-foreground': (d: string) => { this.foregroundImage = atob(d) },
                'theme-font': (d: string) => { this.font = d },
                'theme-icons': (d: string) => { this.icons = d },
            }
            console.log(state)

            Object.entries(toSave).forEach(([k, func]) => {
                func(state[k])
            })

            this.init()
        },


        //================================================
        async buildTheme() {
            const bgTiler = new ImageTiler()
            try {
                await bgTiler.loadImage(this.backgroundImage)
            } catch (e) {
                console.error(e, 'error with backgroundImage')
                throw e
            }

            const fgTiler = new ImageTiler()
            try {
                await fgTiler.loadImage(this.foregroundImage)
            } catch (e) {
                console.error(e, 'error with foregroundImage')
                throw e
            }

            const icons = new IconsExporter()
            try {
                await icons.loadImage(this.iconsImageUrl)

            } catch(e) {

                console.error(e, 'error with icons')
            }
            const iconBinaries = await icons.build()

            const vdpbg = await bgTiler.build()
            const vdpfg = await fgTiler.build()
            const th = ThemeConfigToBuffer(this.config)

            const expt = new ThemeExport()
            expt.addRessource(THEME_ID.VDP2_BG, vdpbg)
            expt.addRessource(THEME_ID.VDP2_FG, vdpfg)
            expt.addRessource(THEME_ID.THEME_CONFIG_V0, th)

            if (iconBinaries)
                expt.addRessource(THEME_ID.ICONS, iconBinaries)


            //
            if (context.fontBuilder) {
                context.fontBuilder.setFont(this.font)
                context.fontBuilder.drawCharInCanvas()

                const fontBuffer = context.fontBuilder.buildFont()
                expt.addRessource(THEME_ID.FONT, fontBuffer)
            }

            downloadBuffer(expt.build(), 'theme.bin')
        },


    }
})
