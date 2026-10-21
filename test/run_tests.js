const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { LuaFactory } = require('wasmoon');

async function runTests() {
    console.log("Setting up Lua VM via wasmoon...");
    const luaFactory = new LuaFactory();
    const lua = await luaFactory.createEngine();

    console.log("Mocking Fantasy Grounds environment globals...");
    await lua.doString(`
        OptionsManager = {}
        ChatManager = {}
        Comm = {}

        local options = {}
        local registeredOptions = {}
        local deliverCallbacks = {}

        function OptionsManager.registerOption2(sKey, bLocal, sGroup, sLabel, sType, tCustom)
            registeredOptions[sKey] = {
                bLocal = bLocal,
                sGroup = sGroup,
                sLabel = sLabel,
                sType = sType,
                tCustom = tCustom,
            }
            if tCustom and tCustom.default then
                options[sKey] = tCustom.default
            end
        end
        function OptionsManager.getOption(sKey)
            return options[sKey] or ""
        end
        function OptionsManager.setOption(sKey, sVal)
            options[sKey] = sVal
        end
        function OptionsManager.isOption(sKey, sVal)
            return options[sKey] == sVal
        end
        function OptionsManager.getRegisteredOption(sKey)
            return registeredOptions[sKey]
        end

        function ChatManager.registerDeliverMessageCallback(fn)
            table.insert(deliverCallbacks, fn)
        end
        function ChatManager.unregisterDeliverMessageCallback(fn)
            for i = #deliverCallbacks, 1, -1 do
                if deliverCallbacks[i] == fn then
                    table.remove(deliverCallbacks, i)
                end
            end
        end
        function ChatManager.getDeliverCallbackCount()
            return #deliverCallbacks
        end

        lastDeliveredMsg = nil
        lastAddedMsg = nil

        function originalDeliverChatMessage(msg)
            lastDeliveredMsg = msg
            return "delivered"
        end
        function originalAddChatMessage(msg)
            lastAddedMsg = msg
            return "added"
        end

        Comm.deliverChatMessage = originalDeliverChatMessage
        Comm.addChatMessage = originalAddChatMessage
    `);

    console.log("Loading scripts/replace_gm_icon.lua into VM...");
    const luaCodePath = path.join(__dirname, '../scripts/replace_gm_icon.lua');
    const luaCode = fs.readFileSync(luaCodePath, 'utf8');
    await lua.doString(luaCode);
    console.log("ReplaceGMIcon loaded successfully inside VM.\n");

    let testsPassed = 0;
    let testsFailed = 0;

    async function runAssert(fnName, expected, luaCodeToRun) {
        try {
            const result = await lua.doString(luaCodeToRun);
            assert.strictEqual(result, expected);
            console.log(`  ✓ PASS: ${fnName} -> got ${result}`);
            testsPassed++;
        } catch (err) {
            console.error(`  ✗ FAIL: ${fnName} -> expected ${expected}, got error or mismatch: ${err.message}`);
            testsFailed++;
        }
    }

    console.log("=== SUITE 1: Initialization & Option Registration ===");
    await lua.doString(`
        onInit()
        onTabletopInit()
    `);

    await runAssert("Option REPLACE_GM_ICON is registered as campaign option (bLocal = false)", false, "return OptionsManager.getRegisteredOption('REPLACE_GM_ICON').bLocal");
    await runAssert("Default option value is 'custom'", "custom", "return OptionsManager.getOption('REPLACE_GM_ICON')");
    await runAssert("Default getSelectedIcon() returns 'portrait_gm_token'", "portrait_gm_token", "return getSelectedIcon()");
    await runAssert("Deliver message callback registered", 1, "return ChatManager.getDeliverCallbackCount()");

    console.log("\n=== SUITE 2: Icon Mapping for All Bundled Options ===");
    await lua.doString("OptionsManager.setOption('REPLACE_GM_ICON', 'ampersand')");
    await runAssert("Option 'ampersand' maps to 'portrait_gm_token_ampersand'", "portrait_gm_token_ampersand", "return getSelectedIcon()");

    await lua.doString("OptionsManager.setOption('REPLACE_GM_ICON', 'adnd')");
    await runAssert("Option 'adnd' maps to 'portrait_gm_token_adnd'", "portrait_gm_token_adnd", "return getSelectedIcon()");

    await lua.doString("OptionsManager.setOption('REPLACE_GM_ICON', 'cartoon_dm')");
    await runAssert("Option 'cartoon_dm' maps to 'portrait_gm_token_cartoon_dm'", "portrait_gm_token_cartoon_dm", "return getSelectedIcon()");

    await lua.doString("OptionsManager.setOption('REPLACE_GM_ICON', 'gm_die')");
    await runAssert("Option 'gm_die' maps to 'portrait_gm_token_gm_die'", "portrait_gm_token_gm_die", "return getSelectedIcon()");

    await lua.doString("OptionsManager.setOption('REPLACE_GM_ICON', 'unknown_value')");
    await runAssert("Unknown option falls back to 'portrait_gm_token'", "portrait_gm_token", "return getSelectedIcon()");

    console.log("\n=== SUITE 3: FGU Mode (msg.assets Table Replacement) ===");
    await lua.doString(`
        OptionsManager.setOption('REPLACE_GM_ICON', 'adnd')
        fguMsg = {
            mode = "chat",
            sender = "GM",
            assets = {
                { type = "icon", name = "portrait_gm_token", w = 40, h = 40 }
            }
        }
        retVal = onDeliverMessage(fguMsg)
    `);
    await runAssert("onDeliverMessage returns false so CoreRPG continues processing", false, "return retVal");
    await runAssert("FGU msg.assets[1].name replaced with 'portrait_gm_token_adnd'", "portrait_gm_token_adnd", "return fguMsg.assets[1].name");

    await lua.doString(`
        fguWhisperMsg = {
            mode = "whisper",
            assets = {
                { type = "icon", name = "portrait_gm_token", w = 40, h = 40 },
                { type = "icon", name = "indicator_whisper" }
            }
        }
        Comm.addChatMessage(fguWhisperMsg)
    `);
    await runAssert("FGU whisper GM asset replaced via Comm.addChatMessage", "portrait_gm_token_adnd", "return lastAddedMsg.assets[1].name");
    await runAssert("FGU whisper indicator asset preserved", "indicator_whisper", "return lastAddedMsg.assets[2].name");

    await lua.doString(`
        fguNpcMsg = {
            mode = "chat",
            sender = "Goblin",
            assets = {
                { name = "tokens/goblin.png", w = 40, h = 40 }
            }
        }
        onDeliverMessage(fguNpcMsg)
    `);
    await runAssert("FGU NPC token asset is untouched", "tokens/goblin.png", "return fguNpcMsg.assets[1].name");

    console.log("\n=== SUITE 4: FGC & Legacy Mode (msg.icon String & Table Replacement) ===");
    await lua.doString(`
        OptionsManager.setOption('REPLACE_GM_ICON', 'cartoon_dm')
        fgcMsg = {
            mode = "chat",
            sender = "GM",
            icon = "portrait_gm_token"
        }
        Comm.deliverChatMessage(fgcMsg)
    `);
    await runAssert("FGC msg.icon string replaced via Comm.deliverChatMessage", "portrait_gm_token_cartoon_dm", "return lastDeliveredMsg.icon");

    await lua.doString(`
        OptionsManager.setOption('REPLACE_GM_ICON', 'gm_die')
        fgcWhisperMsg = {
            mode = "whisper",
            icon = { "indicator_whisper", "portrait_gm_token" }
        }
        Comm.addChatMessage(fgcWhisperMsg)
    `);
    await runAssert("FGC whisper indicator icon preserved", "indicator_whisper", "return lastAddedMsg.icon[1]");
    await runAssert("FGC whisper GM icon in table replaced", "portrait_gm_token_gm_die", "return lastAddedMsg.icon[2]");

    await lua.doString(`
        OptionsManager.setOption('REPLACE_GM_ICON', 'custom')
        customMsg = {
            mode = "chat",
            icon = "portrait_gm_token",
            assets = {
                { type = "icon", name = "portrait_gm_token", w = 40, h = 40 }
            }
        }
        onDeliverMessage(customMsg)
    `);
    await runAssert("Custom option keeps 'portrait_gm_token' string", "portrait_gm_token", "return customMsg.icon");
    await runAssert("Custom option keeps 'portrait_gm_token' asset", "portrait_gm_token", "return customMsg.assets[1].name");

    console.log("\n=== SUITE 5: Cleanup & Safety Checks ===");
    await lua.doString(`
        applyGMIcon(nil)
        applyGMIcon("not_a_table")
        onClose()
    `);
    await runAssert("Deliver message callback unregistered on close", 0, "return ChatManager.getDeliverCallbackCount()");
    await runAssert("Comm.deliverChatMessage restored on close", true, "return Comm.deliverChatMessage == originalDeliverChatMessage");
    await runAssert("Comm.addChatMessage restored on close", true, "return Comm.addChatMessage == originalAddChatMessage");

    console.log(`\nAll Test Suites Finished: ${testsPassed} passed, ${testsFailed} failed.`);

    if (testsFailed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error("Test execution failed: ", err);
    process.exit(1);
});
