var scriptname = "MessageBlocker"
const reverse = !GlobalVars.getBoolean(scriptname)
GlobalVars.putBoolean(scriptname, reverse)

// 自定义过滤配置
const FILTER_CONFIG = {
    // 自定义关键词列表
    keywords: ["公告", "恭喜", "获得"]
}

function main(){
    if(!GlobalVars.getBoolean(scriptname)) return
    Chat.actionbar(`§7[§5${scriptname}§7] §aenabled`)
    function blacklist(event){
        let text = event.text
        let string = text.getString()
        let json = text.getJson()
        
        // 检查关键词
        return FILTER_CONFIG.keywords.some(keyword => 
            string.includes(keyword) || json.includes(keyword)
        )
    }
    const Logger = Chat.getLogger()
    const MessageListener = JsMacros.on("RecvMessage", true, JavaWrapper.methodToJava(event => {
            //Logger.info(`\n[Info] [RecvMessage] ${event.text.getJson()}`)
            //在日志里看信息格式
            if (blacklist(event)){
                event.cancel()
            }
    }))

    const Close = JsMacros.on("Key", JavaWrapper.methodToJava(event => {
		if(!GlobalVars.getBoolean(scriptname)){
			Chat.actionbar(`§7[§5${scriptname}§7] §cdisabled`)
            MessageListener.off()
			Close.off()
		}
	}))
}
main()