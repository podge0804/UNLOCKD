# Third-party assets

- Item PNG textures: Minecraft Java 1.20.2, distributed by [PrismarineJS/minecraft-assets](https://github.com/PrismarineJS/minecraft-assets), pinned commit `67c9b138b00a6b67c29ba68dae74c41faef4889d` (data/1.20.2/items). Minecraft artwork belongs to Mojang/Microsoft; no ownership or open-source license for that artwork is claimed. Review the [Minecraft Usage Guidelines](https://www.minecraft.net/usage-guidelines) before commercial use. UNLOCKD is unofficial and not endorsed by Mojang or Microsoft.
- Vanilla UI/font textures in minecraft/: same pinned PrismarineJS commit above; data/1.8.8/gui/achievement/achievement_background.png (toast region x=96, y=202, 160×32); data/1.12/gui/toasts.png (first 160×32 region); data/1.12/font/ascii.png and unicode_page_04.png. These are Minecraft assets owned by Mojang/Microsoft, under the same usage caveat above.
- Press Start 2P by CodeMan38 (retained legacy asset, no longer used for Minecraft toast text): Google Fonts, SIL Open Font License 1.1. License in fonts/OFL.txt. Includes Cyrillic. A pixel-style substitute, not the proprietary Minecraft font.
- html2canvas 1.4.1 by Niklas von Hertzen: MIT, license in vendor/html2canvas-LICENSE.txt. Preserves the original project export approach, now self-hosted.

All runtime resources are local to avoid CDN availability, CORS and third-party font requests.
