//(编码)全物品 排版统计工具脚本
//需要安装ClientCommands模组获取箱子(否则指令太长无法获取)
//使用按键触发启动脚本
/*
扫描位置配置
修改 ScanPos 数组来设置扫描的起始点和属性
*/
const ScanPos = [       //起始点              附着方块位置        层          颜色(侧)
    { startPos: pos(11111, 22222, 33333), faceOffset: "down", floor: 1 ,color: "orange" },
    { startPos: pos(11111, 22222, 33333), faceOffset: "south", floor: 2 ,color: "orange" },
    { startPos: pos(11111, 22222, 33333), faceOffset: "south", floor: 3 ,color: "orange" },
    { startPos: pos(11111, 22222, 33333), faceOffset: "south", floor: 4 ,color: "orange" },
    { startPos: pos(11111, 22222, 33333), faceOffset: "up", floor: 5 ,color: "orange" },
    { startPos: pos(11111, 22222, 33333), faceOffset: "down", floor: 1 ,color: "pink" },
    { startPos: pos(11111, 22222, 33333), faceOffset: "north", floor: 2 ,color: "pink" },
    { startPos: pos(11111, 22222, 33333), faceOffset: "north", floor: 3 ,color: "pink" },
    { startPos: pos(11111, 22222, 33333), faceOffset: "north", floor: 4 ,color: "pink" },
    { startPos: pos(11111, 22222, 33333), faceOffset: "up", floor: 5 ,color: "pink" }
]
//=========配置==============
const SEGMENT_LENGTH = 10 // 每段长度
const MAX_LENGTH = 90   //遍历终点
const SCAN_DIRT = "west"    //遍历方向
const DELAY = 5 //遍历时间间隔(ms) //只是为了好看，实际可以改成0

const FILLER_ID = "blue_stained_glass_pane"
const FILLER_NAME = "ENCODER" //不要有特殊字符 如 ' " \ 等 
/*
确保展示框、潜影盒等辅助元素正确放置
脚本会自动扫描配置的位置
识别展示框中的物品和潜影盒内容
将物品分类存储到内存中

扫描结束后会给玩家一个箱子，放下后会 ！清空背包！ 然后生成下一个，不可撤回所以尽量不要放错 （๑·ڡ<☆）ᕘ

每个分类生成左右两个箱子
*/
/*//============逻辑解释==============

在起始位置沿着指定方向进行遍历，结束条件为距离max格之外
判断如果当前位置的面朝方向有展示框
    如果是潜影盒，那么把潜影盒里的物品全部放入当前位置
    如果是一般物品，就直接放入列表
如果当前位置是非空(基岩占位)或者不是基底方块(建筑材料——平滑石英块&平滑石英楼梯)或者是前面有前缀方块的基底方块(把前一个分类物输入作为前置条件)
    进行物品id反查并放入列表
如果当前位置为空，检查面向方向是否有是否有附着方块直接填入

*///=================================


const scriptname = "全物品统计"
const reverse = !GlobalVars.getBoolean(scriptname)
GlobalVars.putBoolean(scriptname, reverse)

const BaseBlock = ["minecraft:smooth_quartz", "minecraft:smooth_quartz_stairs"]
const Prefix = ["minecraft:quartz_pillar", "minecraft:quartz_slab"]
const Empty = "minecraft:bedrock"

//=========结果存储==============
const Items = []
const Item2Pos = []
const Layers = {}
const MT = {}
const CT = {}
//============准备===============
const ItemStackHelper = Java.type("xyz.wagyourtail.jsmacros.client.api.helpers.inventory.ItemStackHelper")
const Draw3D = Hud.createDraw3D()
const Draw2D = Hud.createDraw2D()
const box = Draw3D.addBox(0, 0, 0, 1, 1, 1, rgb2int(255,255,255),255,rgb2int(255,255,255),255,true,false)
const traceLine = Draw3D.addTraceLine(0, 0, 0, rgb2int(255,255,255))
const Block2Item = new Map()
Client.getRegisteredItems().forEach(item => {
    if(item.isBlockItem() && item.getId().includes("minecraft"))
    Block2Item.set( item.getBlock().getId(), item.getId() )
})
Client.getRegisteredBlocks().forEach(block => {
    if( block.getTags().includes("minecraft:flower_pots") ){
        if( block.getId().includes("azalea") ){
            Block2Item.set( block.getId(), block.getId().replace("potted_", "").replace("_bush", "") )
        }else{
            Block2Item.set( block.getId(), block.getId().replace("potted_", "") )
        }
        
    }
})
const itemFrameMap = new Map()
World.getEntities("minecraft:item_frame").forEach(entity => {
    let pos = entity.getBlockPos()
    //let posKey = `${pos.getX()},${pos.getY()},${pos.getZ()}`
    let item = entity.getItem()
    itemFrameMap.set(pos2str(pos), item)
})
//==============主程序==============
//绘制
Draw3D.register().addBox(box)
Draw3D.register().addTraceLine(traceLine)

//扫描
ScanPos.forEach(pos => {
    scanRow(pos)
})
Hud.clearDraw3Ds()
Hud.clearDraw2Ds()

//反查物品位置
// Player.openInventory().getItems().forEach(item => {
//     const itemPos = Item2Pos.find(i => i.id === item.getItemId())
//     Chat.log(`${item.getName()}: color:${itemPos.color} F:${itemPos.floor} mt:${itemPos.mt} ct:${itemPos.ct} `)
// })

//获取单个
//getChest("orange", "CT", 9)

//批量获取
for(let i = 1; i <= ScanPos.length/2; i++){
    getChest("pink", "F", i)
}
for(let i = 1; i <= MAX_LENGTH/SEGMENT_LENGTH; i++){
    getChest("pink", "MT", i)
}
for(let i = 1; i <= SEGMENT_LENGTH; i++){
    getChest("pink", "CT", i)
}

for(let i = 1; i <= ScanPos.length/2; i++){
    getChest("orange", "F", i)
}
for(let i = 1; i <= MAX_LENGTH/SEGMENT_LENGTH; i++){
    getChest("orange", "MT", i)
}
for(let i = 1; i <= SEGMENT_LENGTH; i++){
    getChest("orange", "CT", i)
}



function runCommand(command){
    Chat.say(command)
    let wait = true
    const onClick = JsMacros.on("InteractBlock", JavaWrapper.methodToJava(event => {
        onClick.off()
        wait = false
    }))
    while(wait){
        Client.waitTick(1)
    }
    Player.openInventory().destroyAllItems()
    Client.waitTick(2)
}
function getChest(color, type, index){
    index -= 1
    let commands = []
    if(type == "F"){
        let layer = Layers[color][index]
        if(!layer) {
            Chat.log(Layers)
        }
        let splitIndex = layer.length <= 100 ? 50 : Math.ceil(layer.length / 2)
        commands = newChest([...layer.slice(0, Math.min(splitIndex, layer.length))].reverse(), `${color}_${index+1}_F_1`)
        runCommand(commands[0])
        runCommand(commands[1])
        commands = newChest([...layer.slice(Math.min(splitIndex, layer.length))].reverse(), `${color}_${index+1}_F_2`)
        runCommand(commands[0])
        runCommand(commands[1])
    }
    if(type == "CT"){
        commands = newChest([...CT[color][index]].reverse(), `${color}_${index+1}_CT`)
        runCommand(commands[0])
        runCommand(commands[1])
    }
    if(type == "MT"){
        commands = newChest([...MT[color][index]].reverse(), `${color}_${index+1}_MT`)
        runCommand(commands[0])
        runCommand(commands[1])
    }
}

function pos(x,y,z){
    return PositionCommon.createBlockPos(x,y,z)
}

function rgb2int(r, g, b) {
    return (r << 16) + (g << 8) + b;
}

function setColorPos(pos, color){
    const COLORS = {
        white: rgb2int(255, 255, 255),
        orange: rgb2int(255, 165, 0),
        magenta: rgb2int(255, 0, 255),
        light_blue: rgb2int(173, 216, 230),
        yellow: rgb2int(255, 255, 0),
        lime: rgb2int(0, 255, 0),
        pink: rgb2int(255, 192, 203),
        gray: rgb2int(128, 128, 128),
        light_gray: rgb2int(192, 192, 192),
        cyan: rgb2int(0, 255, 255),
        purple: rgb2int(128, 0, 128),
        blue: rgb2int(0, 0, 255),
        brown: rgb2int(165, 42, 42),
        dark_green: rgb2int(0, 100, 0),
        red: rgb2int(255, 0, 0),
        black: rgb2int(0, 0, 0)
    }
    box.setPosToBlock(pos)
    box.setFillColor(COLORS[color],255)
    traceLine.setPos(pos.toPos3D())
    traceLine.setColor(COLORS[color],255)
}
function addItem(id){
    Hud.clearDraw2Ds()
    let item = new ItemStackHelper(id, 1)
    Draw2D.register().addItem(Math.floor(Hud.getWindowWidth()/8)-10, Math.floor(Hud.getWindowHeight()/8)-24, item)
}
function scanRow(pos, dirt = SCAN_DIRT){
    let face = pos.faceOffset
    let CurrentPos = pos.startPos
    let block
    let prefix = ""
    let count = 0
    
    while(vaildPos(block = World.getBlock(CurrentPos), pos)){
        let checkPos = CurrentPos.offset(face)
        let item = itemFrameMap.get(pos2str(checkPos)) || null
        let checkBlock = World.getBlock(checkPos)
        let id = ""
        let components = ""
        setColorPos(CurrentPos, "white")
        if(item){//为展示框
            setColorPos(CurrentPos, "yellow")
            id = item.getItemId()
            if(id.includes("shulker_box")){
                setColorPos(CurrentPos, "purple")
                let insideItems = item.getNBT().get("minecraft:container").asListHelper()
                for(let i = 0; i < insideItems.length() - 1; i++){
                    let nbt = insideItems.get(i).get("item")
                    id = nbt.get("id").asString()
                    components = nbt.get("components")?.asString()
                    PushIn(id, count, pos, components)//填入
                }
                id = insideItems.get(insideItems.length() - 1).get("item").get("id").asString()
                components = insideItems.get(insideItems.length() - 1).get("item").get("components")?.asString()
            }
        }else if(block.getId() !== Empty && (!BaseBlock.includes(block.getId()) || Prefix[BaseBlock.indexOf(block.getId())] === prefix)){//如果有非空方块
            setColorPos(CurrentPos, "cyan")
            id = Block2Item.get(block.getId().replace("wall_", ""))//直接转换
        }else if(checkBlock.getId() !== "minecraft:air"){//为附着方块
            setColorPos(CurrentPos, "lime")
            id = Block2Item.get(checkBlock.getId().replace("wall_", ""))//直接转换
        }
        addItem(id)
        Time.sleep(DELAY)
        PushIn(id, count, pos, components)//填入
        prefix = block.getId()
        CurrentPos = CurrentPos.offset(dirt)
        count++
    }
}

function vaildPos(block, pos){
    return block.getBlockPos().distanceTo(pos.startPos) < MAX_LENGTH
}
function PushIn(id, count, pos, components){
    Items.push(id)
    Item2Pos.push({id: id, color: pos.color, floor: pos.floor, mt: Math.ceil(count / SEGMENT_LENGTH), ct: count % SEGMENT_LENGTH+1 })

    if( !Layers[pos.color] ) Layers[pos.color] = []
    if( !MT[pos.color] ) MT[pos.color] = []
    if( !CT[pos.color] ) CT[pos.color] = []

    if( !Layers[pos.color][pos.floor - 1] ) Layers[pos.color][pos.floor - 1] = []
    if( !MT[pos.color][Math.floor(count / SEGMENT_LENGTH)] ) MT[pos.color][Math.floor(count / SEGMENT_LENGTH)] = []
    if( !CT[pos.color][count % SEGMENT_LENGTH] ) CT[pos.color][count % SEGMENT_LENGTH] = []

    Layers[pos.color][pos.floor - 1].push({id: id, components: components})
    MT[pos.color][Math.floor(count / SEGMENT_LENGTH)].push({id: id, components: components})
    CT[pos.color][count % SEGMENT_LENGTH].push({id: id, components: components})
}
function pos2str(pos){
    return `${pos.getX()},${pos.getY()},${pos.getZ()}`
}
function newChest(items, name){
    let totalCount = 247
    let filledCount = []
    let filledItems = []
    let commands = [`/cgive chest[custom_name="${name}_left",container=[`, `/cgive chest[custom_name="${name}_right",container=[`]
    items.forEach(({id, components}, index) => {
        if(id) {
            let item = newItem(id)
            let maxCount = item.getMaxCount()
            if(maxCount == 16) {
                filledCount[index] = 16
                totalCount -= 8
            }else{
                filledCount[index] = 2
                totalCount -= 2
            }
            filledItems.push({id: id, components: components})
        }else{
            filledCount[index] = 2
            totalCount -= 2
            filledItems.push({id: "placeholder", components: ""})
        }
    })
    
    for(let i = items.length; i < 54; i++){
        filledItems.push({id: "placeholder", components: ""})
        filledCount[i] = 2
        totalCount -= 2
    }
    let index = 53
    while(totalCount >= 0){
        if(filledCount[index] == 16){
            filledCount[index] = 2
            let count = Math.min(Math.floor(totalCount/8), 14)
            totalCount -= count * 8
        }else{
            let count = Math.min(totalCount, 62)
            filledCount[index] += count
            totalCount -= count
        }
        index--
        if(index < 0) {
            break
        }
    }
    
    filledItems.forEach(({id, components}, index) => {
        let chestIndex = Math.floor(index/27)
        let slot = Math.floor(index%27)
        
        if(id == "placeholder"){
            if(filledCount[index] == 64){
                commands[chestIndex] += `{item:{id:"shears",count:1b},slot:${slot}b},`
            }else{
                commands[chestIndex] += `{item:{id:"${FILLER_ID}",count:${filledCount[index]}b,components:{"custom_name":'"${FILLER_NAME}"'}},slot:${slot}b},`
            }
            
        }else{
            commands[chestIndex] += `{item:{id:"${id.replace("minecraft:","")}",count:${filledCount[index]}b`
            if(components) commands[chestIndex] += `,components:${components}`
            commands[chestIndex] += `},slot:${slot}b},`
        }
    })
    commands[0] += "]]"
    commands[1] += "]]"
    //Utils.copyToClipboard(commands[0] + "\n" +commands[1])
    return commands
}
function newItem(id){
    return new ItemStackHelper(id, 2)
}
