/* *Change your font or character set if you cannot see the text below.*

介绍：
使用按键宏触发，按关闭背包/esc退出时自动关闭
意外退出背包时会自动重新打开附魔台
会等待附魔物品、青金石、经验的补充
会选择第3项附魔

(注:此脚本所在服务器有限制，有些附魔太多的附魔书会被阻拦，并退出界面，需要重新打开附魔台并选择其他选项附魔)
(正常服务器也能用，可以修改重新打开时候选择的附魔选项[下方])
*/
//============配置===============
//可以修改下面的延迟避免发包过多或延时过大操作失败
const Delay = 1 //交互延迟
const EnchantDelay = 1  //附魔台内延迟
const GrindDelay = 1    //砂轮内延迟

//可以修改下面的物品更改附魔对象 [ItemId]
const TargetItem = "minecraft:golden_boots"
const outputItem = "minecraft:golden_boots"
//打开附魔台的第1次附魔使用第n个选项 [0/1/2]
const FirstIndex = 0
const NeedOutput = false
const minLevel = 2

//其余附魔使用的选项[0/1/2]
const EnchantIndex = 0
//退出界面后的等待时间(需要检测按键松开所以不建议太小)
const QuitDelay = 1
//附魔台最远距离
const Distance = 5.0

const targetList = [
    "undefined"
]
//===============================

var scriptname = "enchant"
const reverse = !GlobalVars.getBoolean(scriptname)
GlobalVars.putBoolean(scriptname, reverse)
if(GlobalVars.getBoolean(scriptname)) { Chat.actionbar(`§7[§5${scriptname}§7] §aenabled`) }
else { Chat.actionbar(`§7[§5${scriptname}§7] §cdisabled`) }

const DIRCTIONS = ["down", "up", "north", "south", "west", "east"]

function main(){
    
    if(!GlobalVars.getBoolean(scriptname)) return
    const Close = JsMacros.on("Key", JavaWrapper.methodToJava(event => {
        if(event.key == "key.keyboard.escape" || event.key == KeyBind.getKeyBindings().get("key.inventory")){
            Close.off()
            GlobalVars.putBoolean(scriptname, false)
            Chat.actionbar(`§7[§5${scriptname}§7] §cdisabled`)
        }
    }))
    const EnchantTable = World.findBlocksMatching("minecraft:enchanting_table", 2).find(blockPos => {
        if(Player.getPlayer().distanceTo(blockPos) <= Distance){
            return blockPos
        }
    })

    const Grindstone = World.findBlocksMatching("minecraft:grindstone", 2).find(blockPos => {
        if(Player.getPlayer().distanceTo(blockPos) <= Distance){
            return blockPos
        }
    })

    const Output = World.getEntities(4, "minecraft:item_frame").filter(entity => {
        let nbt = parseNBT(entity.getNBT())
        return nbt?.Item?.id == "minecraft:book"
    }).map(entity => {
        let facing = parseNBT(entity.getNBT())?.Facing
        let pos = entity.getPos().toBlockPos().offset(DIRCTIONS[facing], -1)
        return {
            x: pos.getX(),
            y: pos.getY(),
            z: pos.getZ()
        }
    })

    const Input = World.getEntities(4, "minecraft:item_frame").filter(entity => {
        let nbt = parseNBT(entity.getNBT())
        return nbt?.Item?.id == "minecraft:lapis_lazuli"
    }).map(entity => {
        let facing = parseNBT(entity.getNBT())?.Facing
        let pos = entity.getPos().toBlockPos().offset(DIRCTIONS[facing], -1)
        return {
            x: pos.getX(),
            y: pos.getY(),
            z: pos.getZ()
        }
    })

    //Chat.log("输入:" + Input.map(pos => `${pos.x} ${pos.y} ${pos.z}`).join(", "))
    //Chat.log("输出:" + Output.map(pos => `${pos.x} ${pos.y} ${pos.z}`).join(", "))

    while(GlobalVars.getBoolean(scriptname)){
        let count = 0
        if(Player.openInventory().getType() != "Enchanting Table"){
            Client.waitTick(QuitDelay)
            if(!GlobalVars.getBoolean(scriptname)) break
            Player.getInteractionManager().interactBlock(EnchantTable.getX(), EnchantTable.getY(), EnchantTable.getZ(), "up", false)
            let time = 0
            while(Player.openInventory().getType() != "Enchanting Table" && GlobalVars.getBoolean(scriptname)){
                time ++
                Client.waitTick(Delay)
                if(time > 20) {
                    Chat.log("timeout for open Enchanting Table")
                    time = 0
                    Player.getInteractionManager().interactBlock(EnchantTable.getX(), EnchantTable.getY(), EnchantTable.getZ(), "up", false)
                }
            }
            let inv = Player.openInventory()
            while(Player.openInventory().getType() == "Enchanting Table" && GlobalVars.getBoolean(scriptname)){
                //附魔槽位是否可以附魔
                if(!inv.getItemToEnchant().isEnchantable() || inv.getItemToEnchant().isEnchanted()){
                    //不能附魔且有东西（产物）
                    if (!inv.getItemToEnchant().isEmpty()){
                        inv.quick(0)
                        Client.waitTick(EnchantDelay)
                    }
                    //放入待附魔物品
                    let slot = inv.findItem(TargetItem).filter(slot => {
                        return inv.getSlot(slot).isEnchantable() && !inv.getSlot(slot).isEnchanted()
                    })[0]
                    if (slot){
                        inv.quick(slot)
                        Client.waitTick(EnchantDelay)
                    }else{
                        break
                    }
                }
                //青金石是否足够
                if (inv.getLapis().getCount() < (count>0?EnchantIndex:FirstIndex) + 1) {
                    let lapis = inv.findItem("minecraft:lapis_lazuli").find(slot => { if( slot > 1 ) return slot })
                    if (lapis){
                        inv.quick(lapis)
                        Client.waitTick(EnchantDelay)
                        continue
                    } else { 
                        break
                    }
                }
                Client.waitTick(EnchantDelay)
                //可附魔
                if (inv.getItemToEnchant().isEnchantable() && !inv.getItemToEnchant().isEnchanted()){
                    //经验>minLevel级
                    if (Player.getPlayer().getXPLevel() < minLevel){
                        Client.waitTick(Delay)
                        continue
                    }
                    inv.doEnchant(count>0?EnchantIndex:FirstIndex)
                    count ++
                    Client.waitTick(EnchantDelay > 0 ? EnchantDelay:1)
                    //请不要修改，速度过快会导致一些不可修复的问题。具体见下方
                    //Caused by: java.lang.IllegalStateException: Accessing LegacyRandomSource from multiple threads
                }
            }

            if(!GlobalVars.getBoolean(scriptname)) break
            Player.getInteractionManager().interactBlock(Grindstone.getX(), Grindstone.getY(), Grindstone.getZ(), "up", false)
            time = 0
            while(Player.openInventory().getType() != "Grindstone" && GlobalVars.getBoolean(scriptname)){
                time ++
                Client.waitTick(Delay)
                if(time > 20) {
                    Chat.log("timeout for open Grindstone")
                    time = 0
                    Player.getInteractionManager().interactBlock(Grindstone.getX(), Grindstone.getY(), Grindstone.getZ(), "up", false)
                }
            }
            inv = Player.openInventory()
            let slots = inv.findItem(outputItem)
            while(Player.openInventory().getType() == "Grindstone" && GlobalVars.getBoolean(scriptname)){
                if (slots.length > 0){
                    let item = inv.getSlot(slots[0])
                    if (!hasTargetEnchant(item)){
                        inv.quick(slots[0])
                        Client.waitTick(GrindDelay)
                        inv.quick(2)
                        Client.waitTick(GrindDelay)
                    }
                    slots = slots.slice(1)
                } else {
                    break
                }
            }

            inv.close()
            while(Player.openInventory().getType() == "Grindstone" && GlobalVars.getBoolean(scriptname)){
                Client.waitTick(Delay)
            }

            let outputChests = [...Output]
            let placed = false

            while (outputChests.length > 0 && GlobalVars.getBoolean(scriptname)) {
                let chest = outputChests[0]

                Player.getInteractionManager().interactBlock(chest.x, chest.y, chest.z, "up", false)
                //Chat.log("点击了" + chest.x + " " + chest.y + " " + chest.z)
                let temp = 0
                while (Player.openInventory().getType() != "6 Row Chest" && GlobalVars.getBoolean(scriptname)){
                    Client.waitTick(Delay)
                    temp ++ 
                    if (temp > 10){
                        Chat.log("等待超时")
                        Player.getInteractionManager().interactBlock(chest.x, chest.y, chest.z, "up", false)
                        temp = 0
                    }
                }

                let inv = Player.openInventory()
                let InvSlots = inv.getSlots("main").concat(inv.getSlots("hotbar"))
                let slots = inv.findItem(outputItem)
                    .filter(slot => InvSlots.includes(slot))

                let chestFull = false

                while (slots.length > 0 && GlobalVars.getBoolean(scriptname)) {
                    let slot = slots.shift()
                    inv.quick(slot)
                    Client.waitTick(Delay)
                    if (!inv.getSlot(slot).isEmpty()){
                        chestFull = true
                        break
                    }
                }

                inv.close()
                while (Player.openInventory().getType() == "6 Row Chest" && GlobalVars.getBoolean(scriptname)){
                    Client.waitTick(Delay)
                }

                if (chestFull){
                    outputChests.shift()
                } else {
                    placed = true
                    break
                }
            }
            if(!GlobalVars.getBoolean(scriptname)) break
            if (!placed && NeedOutput){
                Chat.log("§5所有 Output 箱子已满，脚本终止")
                GlobalVars.putBoolean(scriptname, false)
                Chat.actionbar(`§7[§5${scriptname}§7] §4Output FULL`)
                return
            }

            if(!GlobalVars.getBoolean(scriptname)) break
            inv = Player.openInventory()
            let ItemCounts = inv.getItemCount()
            let needBook = ItemCounts.getOrDefault(TargetItem, 0) < 1
            let needLapis = ItemCounts.getOrDefault("minecraft:lapis_lazuli", 0) < 3

            if (needBook || needLapis){
                Input.find(pos => {
                    Player.getInteractionManager().interactBlock(pos.x, pos.y, pos.z, "up", false)
                    //Chat.log("点击了" + pos.x + " " + pos.y + " " + pos.z)
                    let temp = 0
                    while (Player.openInventory().getType() != "6 Row Chest" && GlobalVars.getBoolean(scriptname)){
                        Client.waitTick(Delay)
                        temp ++ 
                        if (temp > 10){
                            Chat.log("等待超时")
                            Player.getInteractionManager().interactBlock(pos.x, pos.y, pos.z, "up", false)
                            temp = 0
                        }
                    }

                    let inv = Player.openInventory()
                    let slots = inv.getSlots("container")

                    for (let slot of slots){
                        let item = inv.getSlot(slot)
                        if (!item) continue

                        if (needBook && item.getItemId() == TargetItem){
                            inv.quick(slot)
                            needBook = false
                        }

                        if (needLapis && item.getItemId() == "minecraft:lapis_lazuli"){
                            inv.quick(slot)
                            Client.waitTick(Delay)
                            inv.quick(slot)
                            needLapis = false
                        }

                        if (!needBook && !needLapis) break
                    }

                    inv.close()
                    while (Player.openInventory().getType() == "6 Row Chest" && GlobalVars.getBoolean(scriptname)){
                        Client.waitTick(Delay)
                    }
                    return false
                })
            }

        }
    }
}

/**
 * 解析NBT元素为JavaScript原生数据类型
 * @param {Object} NBTElementHelper - NBT元素对象
 * @returns {*} - 解析后的JavaScript数据
 */
function parseNBT(nbtElement) {
    if (!nbtElement) return null
    // 检查null值
    if (nbtElement.isNull()) {
        return null;
    }
    
    // 解析数字类型
    if (nbtElement.isNumber()) {
        return nbtElement.asNumberHelper().asNumber();
    }
    
    // 解析字符串类型
    if (nbtElement.isString()) {
        return nbtElement.asString();
    }
    
    // 解析列表类型
    if (nbtElement.isList()) {
        const list = nbtElement.asListHelper();
        const result = [];
        
        for (let i = 0; i < list.length(); i++) {
            const element = list.get(i);
            result.push(parseNBT(element));
        }
        
        return result;
    }
    
    // 解析复合类型 (Compound)
    if (nbtElement.isCompound()) {
        const compound = nbtElement.asCompoundHelper();
        const result = {};
        const keys = compound.getKeys();
        
        for (const key of keys) {
            const element = compound.get(key);
            result[key] = parseNBT(element);
        }
        
        return result;
    }
    
    // 对于未知类型，尝试返回原始值
    return nbtElement;
}


function hasTargetEnchant(item) {
    if (!item || item.getItemId() === "minecraft:air") return false;

    const nbtData = item.getNBT()?.toString()
    if (!nbtData) return false
    return targetList.find(target => nbtData.includes(target))
}

function isEnchantable(item) {
    let nbt = item.getNBT().toString()
    
}

main()