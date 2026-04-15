const scriptname = "highlight"
const reverse = !GlobalVars.getBoolean(scriptname)
GlobalVars.putBoolean(scriptname, reverse)
const ItemStackHelper = Java.type("xyz.wagyourtail.jsmacros.client.api.helpers.inventory.ItemStackHelper")

Chat.actionbar(`§7[§5${scriptname}§7] ${GlobalVars.getBoolean(scriptname)?`§aenabled`:`§cdisabled`}`)
function main(){
    if(!GlobalVars.getBoolean(scriptname)) {
        World.getEntities().forEach(e => {
            e.resetGlowing()
            e.resetGlowingColor()
        })
        return
    }
    let list = []
    list
    while(GlobalVars.getBoolean(scriptname)){
        const EntityList = World.getEntities()
        let e = World.getEntities()[0]
        EntityList.forEach(entity => {
            
            if(entity.getType() == "minecraft:item"){
                let nbt = parseNBT(entity.getNBT())
                if(!entity.isGlowing()) entity.setGlowing(true)
                if(nbt.Item?.id.includes("shulker_box")){
                    let slots = nbt.Item.components?.["minecraft:container"]
                    if(!slots) return
                    if(slots.some(slot => {
                        return slot.item.components?.["minecraft:custom_name"]
                    })){
                        entity.setGlowingColor(0xff0000)//有其他标签（如命名）的潜影盒掉落物 红色
                    }else{
                        let minMaxCount = 64
                        let firstId = slots[0].item.id
                        let sameId = true
                        let itemCount = 0
                        if(slots.every(slot => {
                            let id = slot.item.id
                            let item = new ItemStackHelper(id, 1)
                            let MaxCount = item.getMaxCount()
                            itemCount ++
                            if(minMaxCount > MaxCount) minMaxCount = MaxCount
                            if(id != firstId) sameId = false
                            return slot.item.count == MaxCount
                        })){
                            if(minMaxCount == 1){
                                entity.setGlowingColor(0xff0000)//不可堆叠纯盒 红色
                            }else if(!sameId){
                                entity.setGlowingColor(0xff55ff)//满杂盒 紫色
                            }else if(itemCount == 27){
                                entity.setGlowingColor(0xffaa00)//满纯盒 橙色
                            }else{
                                entity.setGlowingColor(0x00ff00)//不满纯盒 绿色
                            }
                        }else{
                            entity.setGlowingColor(0x00ff00)//不满杂盒 绿色
                        }
                    }
                }else{
                    if(nbt.Item?.components?.["minecraft:custom_name"]){
                        entity.setGlowingColor(0xff0000)//有其他标签（如命名）的掉落物 红色
                    }else{
                        entity.setGlowingColor(0x00ff00)//正常掉落物 绿色
                    }
                    
                }
                if(nbt.Item?.id.includes("hopper_minecart")){
                    entity.setGlowingColor(0xffff00)//漏斗矿车掉落物 黄色
                }
            }
            if(entity?.getType() == "minecraft:hopper_minecart"){
                if(!entity.isGlowing()) entity.setGlowing(true)
                entity.setGlowingColor(0x55ffff)//漏斗矿车 蓝色
            }
        })
        Client.waitTick(1)
    }
}
main()


/**
 * 解析NBT元素为JavaScript原生数据类型
 * @param {Object} nbtElement - NBT元素对象
 * @returns {*} - 解析后的JavaScript数据
 */
function parseNBT(nbtElement) {
    if(!nbtElement) return null
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