# Replace GM Icon

Replace GM Icon v1.4, by Justin Freitas

Fantasy Grounds Classic & Unity (FGC/FGU) extension to replace the GM chat portrait icon.

### Compatibility
- Compatible with both **Fantasy Grounds Unity (FGU)** and **Fantasy Grounds Classic (FGC)**.
- Works with CoreRPG and all rulesets derived from it (5E, 2E, 3.5E, 4E, PFRPG, PFRPG2, OSE2, SavageWorlds, etc.).

### Selecting a Built-In Icon (In-Game Options)
1. Enable **Feature: Replace GM Icon** when loading your campaign.
2. In Fantasy Grounds, open **Options** and scroll to the **Replace GM Icon** section.
3. Cycle **GM Chat Icon** between any of the included icons:
   - **Custom** *(Default — uses `portrait_gm_token.png`)*
   - **Ampersand**
   - **AD&D**
   - **Cartoon DM**
   - **GM Die**

### Instructions for Using Your Own Custom Icon File
1. Go to your `Fantasy Grounds/extensions/` folder.
2. If you are using the packaged `Replace GM Icon.ext` file, rename it to `Replace GM Icon.zip`, extract it into a folder named `Replace GM Icon`, and **delete or move the original `.ext` / `.zip` file out of `extensions/`** so Fantasy Grounds loads the unpacked folder.
   * **Note:** Fantasy Grounds reads extensions directly from an unzipped folder, making swapping images much easier!
3. Inside the folder, go to `Replace GM Icon/graphics/portraits/` and replace `portrait_gm_token.png` with any 40px x 40px PNG image you want to use (transparent PNGs are supported).
4. Make sure the in-game **GM Chat Icon** option is set to **Custom** and restart or `/reload` Fantasy Grounds.

### Changelog

#### v1.4 — 10/21/26
- Added in-game **GM Chat Icon** campaign option under **Replace GM Icon** to switch between bundled icons (`Custom`, `Ampersand`, `AD&D`, `Cartoon DM`, `GM Die`) without unpacking the extension.
- Added automated `wasmoon` Lua unit test suite and updated GitHub Actions CI/CD workflow.
- Standardized XML formatting and documentation.

#### v1.3.1 — 9/14/26
- Set XML root version to 3.3 for universal compatibility across FGC (v3.3) and FGU.
- Added automated GitHub Actions build & release workflow.

#### v1.3 — 7/10/26
- Documentation updates and formatting.

#### v1.2 — 7/4/23
- Added 42px announcement icon and updated sample assets.
