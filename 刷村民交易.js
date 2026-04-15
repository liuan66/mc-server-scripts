var $Main=Java.type("de.maxhenkel.easyvillagers.Main")
var $MessageCycleTrades=Java.type("de.maxhenkel.easyvillagers.net.MessageCycleTrades")
Chat.log("hw")
$Main.SIMPLE_CHANNEL.sendToServer(new $MessageCycleTrades());

/* *Change your font or character set if you cannot see the text below.*

介绍：
使用按键宏触发

(注:此脚本所在服务器有限制，有些附魔太多的附魔书会被阻拦，并退出界面，需要重新打开附魔台并选择其他选项附魔)
(正常服务器也能用，可以修改重新打开时候选择的附魔选项[下方])
*/
//============配置===============
//可以修改下面的延迟避免发包过多或延时过大操作失败
const Delay = 2
//可以修改下面的物品更改附魔对象 [ItemId]
const TargetItem = "minecraft:book"
//打开附魔台的第1次附魔使用第n个选项 [0/1/2]
const FirstIndex = 0

//其余附魔使用的选项[0/1/2]
const EnchantIndex = 2
//退出界面后的等待时间(需要检测按键松开所以不建议太小)
const QuitDelay = 20
//附魔台最远距离
const Distance = 5.0
//优先放入背包 [true/false]
const InventoryFirst = false
//===============================

var scriptname = "village"
var item_to_find=Utils.getClipboard()
Chat.log("start find trade:"+item_to_find)
const reverse = !GlobalVars.getBoolean(scriptname)
GlobalVars.putBoolean(scriptname, reverse)
if(GlobalVars.getBoolean(scriptname)) { Chat.actionbar(`§7[§5${scriptname}§7] §aenabled`) }
else { Chat.actionbar(`§7[§5${scriptname}§7] §cdisabled`) }

function main(){
    
    if(!GlobalVars.getBoolean(scriptname)) return
    const Close = JsMacros.on("Key", JavaWrapper.methodToJava(event => {
        if(event.key == "key.keyboard.escape" || event.key == KeyBind.getKeyBindings().get("key.inventory")){
            Close.off()
            GlobalVars.putBoolean(scriptname, false)
            Chat.actionbar(`§7[§5${scriptname}§7] §cdisabled`)
        }
    }))
    const Trader = World.findBlocksMatching("easy_villagers:trader", 2).find(blockPos => {
        if(Player.getPlayer().distanceTo(blockPos) <= Distance){
            return blockPos
        }
    })
    while(GlobalVars.getBoolean(scriptname)){
        let count = 0
        if(Player.openInventory().getType() != "Villager"){
            Client.waitTick(QuitDelay)
            if(!GlobalVars.getBoolean(scriptname)) break
            Player.getInteractionManager().interactBlock(Trader.getX(), Trader.getY(), Trader.getZ(), "up", false)
            while(Player.openInventory().getType() != "Villager"){
                Client.waitTick(Delay)
                Chat.log(Player.openInventory().getType())
            }
            let inv = Player.openInventory()
            while(Player.openInventory().getType() == "Villager" && GlobalVars.getBoolean(scriptname)){
                count++;
                $Main.SIMPLE_CHANNEL.sendToServer(new $MessageCycleTrades());
                Client.waitTick(Delay)
                for (let j = 0; j < inv.getTrades().length; j++) { // 遍历村民交易项 并判断是否为需要的交易项 完成交易
                    let item=inv.getTrades()[j].getOutput()
                    let str=item+item.getNBT()
                    if (str.indexOf(item_to_find)!=-1) { // 获取当前交易
                        Chat.log("find trade:"+str)
                        GlobalVars.putBoolean(scriptname, false)
                        break;
                    }
                }
            }
        }
    }
}
main()