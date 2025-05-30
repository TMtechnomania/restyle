const handleOpenSidePanel = async () => {
	await app.windows.getCurrent({ populate: true }, (window) => {
		app.sidePanel.open({ windowId: window.id });
	});
};

const handleCloseSidePanel = async () => {
	app.runtime.sendMessage({ action: "closeSidePanel" });
};