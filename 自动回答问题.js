const scriptname = "自动回答"
const reverse = !GlobalVars.getBoolean(scriptname);
GlobalVars.putBoolean(scriptname, reverse);
if (reverse) {
    Chat.log(Chat.createTextBuilder().append("[").withColor(0x7).append(scriptname).withColor(0x5).append("]").withColor(0x7).append(" 开启").withColor(0x2).build());
} else {
    Chat.log(Chat.createTextBuilder().append("[").withColor(0x7).append(scriptname).withColor(0x5).append("]").withColor(0x7).append(" 关闭").withColor(0x4).build());
    JsMacros.disableAllListeners("RecvMessage");
}

//======================================
const delay =1000 //设置回答延迟(毫秒) 默认1000毫秒
const _char ="问答"//前缀设置
//======================================

if (GlobalVars.getBoolean(scriptname)) {
    JsMacros.on("RecvMessage", JavaWrapper.methodToJava((msg) => {
        const text = msg.text.getString();
        if (text.startsWith(_char)) {
            if (text.includes("哪种食物不能直接吃")){
                Time.sleep(delay)
                Chat.say('B')
            }
            if (text.includes("末影珍珠与烈焰粉")){
                Time.sleep(delay)
                Chat.say("末影之眼")
            }
            if (text.includes("末影传送门最多")){
                Time.sleep(delay)
                Chat.say("12个")
            }
            //     if (text.includes("此处填问题")){
            //     Time.sleep(delay)
            //     Chat.say("此处填回答")
            // }
            //可无限扩展
            //...
        }
    }));
}