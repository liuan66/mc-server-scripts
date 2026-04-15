// 按键触发
const scriptname = "监听title获取文本"
const reverse = !GlobalVars.getBoolean(scriptname);
GlobalVars.putBoolean(scriptname, reverse);
if (reverse) {
    Chat.log(Chat.createTextBuilder().append("[").withColor(0x7).append(scriptname).withColor(0x6).append("]").withColor(0x7).append(" Enabled").withColor(0x2).build());
} else {
    Chat.log(Chat.createTextBuilder().append("[").withColor(0x7).append(scriptname).withColor(0x6).append("]").withColor(0x7).append(" Disabled").withColor(0x4).build());
    JsMacros.disableAllListeners("Title");
}


if (GlobalVars.getBoolean(scriptname)) {
    JsMacros.on("Title", JavaWrapper.methodToJava((title) => {
        let msg = title.message.getString();
        Chat.log(msg)
        // 写你要做的
    }));
}