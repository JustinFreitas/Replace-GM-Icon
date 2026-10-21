--
-- Replace GM Icon Extension for Fantasy Grounds (FGC/FGU)
-- Justin Freitas
--

OPTION_KEY = "REPLACE_GM_ICON";
DEFAULT_ICON = "portrait_gm_token";

ICON_MAP = {
	custom = "portrait_gm_token",
	ampersand = "portrait_gm_token_ampersand",
	adnd = "portrait_gm_token_adnd",
	cartoon_dm = "portrait_gm_token_cartoon_dm",
	gm_die = "portrait_gm_token_gm_die",
};

local deliverChatMessage_Original;
local addChatMessage_Original;

function onInit()
	OptionsManager.registerOption2(
		OPTION_KEY,
		false,
		"option_header_replace_gm_icon",
		"option_label_REPLACE_GM_ICON",
		"option_entry_cycler",
		{
			labels = "option_val_gm_icon_ampersand|option_val_gm_icon_adnd|option_val_gm_icon_cartoon_dm|option_val_gm_icon_gm_die",
			values = "ampersand|adnd|cartoon_dm|gm_die",
			baselabel = "option_val_gm_icon_custom",
			baseval = "custom",
			default = "custom",
		}
	);
end

function onTabletopInit()
	if ChatManager and ChatManager.registerDeliverMessageCallback then
		ChatManager.registerDeliverMessageCallback(onDeliverMessage);
	end

	if Comm then
		if Comm.deliverChatMessage then
			deliverChatMessage_Original = Comm.deliverChatMessage;
			Comm.deliverChatMessage = onDeliverChatMessage;
		end
		if Comm.addChatMessage then
			addChatMessage_Original = Comm.addChatMessage;
			Comm.addChatMessage = onAddChatMessage;
		end
	end
end

function onClose()
	if ChatManager and ChatManager.unregisterDeliverMessageCallback then
		ChatManager.unregisterDeliverMessageCallback(onDeliverMessage);
	end

	if Comm then
		if deliverChatMessage_Original then
			Comm.deliverChatMessage = deliverChatMessage_Original;
		end
		if addChatMessage_Original then
			Comm.addChatMessage = addChatMessage_Original;
		end
	end
end

function getSelectedIcon()
	local sChoice = OptionsManager and OptionsManager.getOption and OptionsManager.getOption(OPTION_KEY) or "custom";
	return ICON_MAP[sChoice] or DEFAULT_ICON;
end

function applyGMIcon(msg)
	if type(msg) ~= "table" then
		return;
	end

	local sIcon = getSelectedIcon();
	if sIcon == DEFAULT_ICON then
		return;
	end

	if type(msg.icon) == "string" then
		if msg.icon == DEFAULT_ICON then
			msg.icon = sIcon;
		end
	elseif type(msg.icon) == "table" then
		for i, v in ipairs(msg.icon) do
			if v == DEFAULT_ICON then
				msg.icon[i] = sIcon;
			end
		end
	end

	if type(msg.assets) == "table" then
		for _, tAsset in ipairs(msg.assets) do
			if type(tAsset) == "table" and tAsset.name == DEFAULT_ICON then
				tAsset.name = sIcon;
			end
		end
	end
end

function onDeliverMessage(msg)
	applyGMIcon(msg);
	return false;
end

function onDeliverChatMessage(msg, ...)
	applyGMIcon(msg);
	if deliverChatMessage_Original then
		return deliverChatMessage_Original(msg, ...);
	end
end

function onAddChatMessage(msg, ...)
	applyGMIcon(msg);
	if addChatMessage_Original then
		return addChatMessage_Original(msg, ...);
	end
end
