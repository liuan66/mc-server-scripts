const scriptname = "炼药"
const reverse = !GlobalVars.getBoolean(scriptname)
GlobalVars.putBoolean(scriptname, reverse)
Chat.actionbar(GlobalVars.getBoolean(scriptname)?`§7[§5${scriptname}§7] §aenabled`:`§7[§5${scriptname}§7] §cdisabled`)

//=====config=====

    //重要
    const Cycle = true
    const LookAtBrewStanding = true
    const Ingredients = ["minecraft:nether_wart","minecraft:sugar","minecraft:glowstone_dust","minecraft:gunpowder"]//配方
    const Water = false//用玻璃瓶接水
    const Drop = true//直接丢出药水
    const Throw = false//直接抛出喷溅型/滞留型药水
    //*注：丢出的产物如果捡起来了还启用了投掷还是会投掷的
    const distance = 4.0//炼药台距离
    const delay = 1//操作延时&发包速度
    const Wait = 20//大循环间隔时间
    
    //不是那么重要
    const showBoxes = true
    const color = 6749952

    //不需要改
    const bottle = "minecraft:glass_bottle"
    const potion = "minecraft:potion"
    const splash_potion = "minecraft:splash_potion"
    const lingering_potion = "minecraft:lingering_potion"

    //不要改
    const fuel = "minecraft:blaze_powder"
    const fuelSlot = 4
    const ingredientsSlot = 3
    const potionSlots = [0,1,2]

//================

//主循环
while(Cycle && GlobalVars.getBoolean(scriptname)){
    main()
    Client.waitTick(Wait)
}

//主程序
function main(){
    Hud.clearDraw3Ds()

    const player = Player.getPlayer()
    const posList = findBlock("minecraft:brewing_stand", distance)
    let m = 0
    if(showBoxes) posList.forEach(pos=>{addBox(pos)})
    
    Ingredients.forEach((material, index) => {
        posList.forEach(pos=>{
            interactBlock(pos)
            if(index == 0){
                if(Water){
                    fillBottle(potionSlots.length - findPotion())
                }
                putPotion()
            }else{
                waitBrewing()
            }
            fill(material)
        })
    })

    posList.forEach(pos=>{
        interactBlock(pos)
        waitBrewing()
        processPotion()
    })

    Player.openInventory().close()
    waitScreen(false, "Brew")
    Hud.clearDraw3Ds()
}

function interactBlock(pos){
    if(LookAtBrewStanding){
        Player.getPlayer().lookAt(pos.getX()+0.5,pos.getY(),pos.getZ()+0.5)
        KeyBind.key("key.mouse.right", true)
        Client.waitTick(delay>0?delay:1)
        KeyBind.key("key.mouse.right", false)
    }else{
        Player.getInteractionManager().interactBlock(pos.getX(),pos.getY(),pos.getZ(), 0, false)
    }
    
    waitScreen(true, "Brew")
}

function waitScreen(open, name){
    while(GlobalVars.getBoolean(scriptname) && (open ^ Player.openInventory().getType().includes(name))){
        Client.waitTick(1)
    }
}

function putSingle(slot, target){
    let inv = Player.openInventory()
    if(slot != null){
        inv.click(slot, 0)
        Client.waitTick(delay)
        inv.click(target, 1)
        Client.waitTick(delay)
        inv.click(slot, 0)
        Client.waitTick(delay)
    }
}

function addBox(pos){
    Hud.createDraw3D().register().addBox(pos.getX()+0.375, pos.getY()+0.375, pos.getZ()+0.375, pos.getX()+0.625,pos.getY()+1.0, pos.getZ()+0.625, color, 255, color, 50, true, true)
}

function findBlock(block, distance){
    let posList = []
    World.findBlocksMatching("minecraft:brewing_stand", 8).forEach(pos=>{
        if(Player.getPlayer().distanceTo(pos) < distance){
            posList.push(pos)
        }
    })
    return posList
}

function findPotion(){
    return Player.openInventory().findItem(potion).length
}

function haveFreeSlot(n){
    return Player.openInventory().findItem("minecraft:air").length >= n
}

function fillBottle(count){
    if(haveFreeSlot(count)){
        for(let i = 0; i < count; i++){
            let inv = Player.openInventory()
            if(Player.getPlayer().getMainHand().getItemId() != bottle){
                inv.swapHotbar(inv.findItem(bottle)[0], inv.getSelectedHotbarSlotIndex())
            }
            Player.getPlayer().lookAt("down")
            Player.getInteractionManager().interactItem(false)
            Client.waitTick(delay>0?delay:1)
        }
    }
}

function putPotion(){
    let inv = Player.openInventory()
    let slots = inv.findItem(potion)
    for(let count = 0; count < Math.min(slots.length, potionSlots.length); count++){
        inv.quick(slots[count])
        Client.waitTick(delay)
    }
}

function fillMaterial(material){
    let inv = Player.openInventory()
    if(inv.getIngredient().getCount() == 0){
        let slot = inv.findItem(material)[0]
        putSingle(slot, ingredientsSlot)
    }
}

function fillFuel(){
    let inv = Player.openInventory()
    if(inv.getFuelCount() == 0){
        let slot = inv.findItem(fuel)[0]
        putSingle(slot, fuelSlot)
    }
}

function waitBrewing(){
    while(Player.openInventory().getIngredient().getCount() != 0){
        Client.waitTick(1)
    }
}

function fill(m){
    fillFuel()
    fillMaterial(m)
    Player.openInventory().close()
    waitScreen(false, "Brew")
}

function processPotion(){
    let inv = Player.openInventory()
    let player = Player.getInteractionManager()
    Player.getPlayer().lookAt("down")
    Client.waitTick(delay>0?delay:1)
    potionSlots.forEach(slot => {
        if(Drop){
            inv.dropSlot(slot)
            Client.waitTick(delay)
        }else{
            inv.quick(slot)
            Client.waitTick(delay)
        }

        if(Throw){
            inv = Player.openInventory()
            inv.findItem(splash_potion).concat(inv.findItem(lingering_potion)).forEach(slot => {
                inv.swapHotbar(slot, inv.getSelectedHotbarSlotIndex())
                player.interactItem(false, true)
                Client.waitTick(delay)
            })
        }
    })
    inv.close()
    waitScreen(false, "Brew")
}
